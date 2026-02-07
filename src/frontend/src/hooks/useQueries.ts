import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useEffect, useRef } from 'react';

// Radio station interface
export interface RadioStation {
    stationuuid: string;
    name: string;
    url: string;
    url_resolved: string;
    homepage: string;
    favicon: string;
    country: string;
    countrycode: string;
    state: string;
    language: string;
    votes: number;
    codec: string;
    bitrate: number;
    clickcount: number;
    clicktrend: number;
    geo_lat: number | null;
    geo_long: number | null;
}

// Multi-layer caching configuration optimized for GPRS
const CACHE_KEY = 'globalfm_global_cache_v6';
const CACHE_TIMESTAMP_KEY = 'globalfm_global_timestamp_v6';
const CACHE_DURATION = 1000 * 60 * 45; // 45 minutes
const INDEXEDDB_NAME = 'GlobalFMCache';
const INDEXEDDB_VERSION = 6;
const STORE_NAME = 'globalStations';

// Memory cache for instant access
let memoryCache: RadioStation[] | null = null;
let memoryCacheTimestamp: number = 0;

// Lazy loading state
let currentOffset = 0;
let isLoadingBatch = false;
let allStationsLoaded = false;
let lazyLoadedStations: RadioStation[] = [];
let consecutiveEmptyBatches = 0;

// Christian stations state
let christianStationsFetched = false;
let christianStationsCache: RadioStation[] = [];

// Export function to clear all caches
export function clearAllCaches(): void {
    memoryCache = null;
    memoryCacheTimestamp = 0;
    currentOffset = 0;
    isLoadingBatch = false;
    allStationsLoaded = false;
    lazyLoadedStations = [];
    consecutiveEmptyBatches = 0;
    christianStationsFetched = false;
    christianStationsCache = [];
    
    try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (e) {
        console.error('Failed to clear localStorage:', e);
    }
    
    try {
        const deleteRequest = indexedDB.deleteDatabase(INDEXEDDB_NAME);
        deleteRequest.onsuccess = () => console.log('IndexedDB cleared');
        deleteRequest.onerror = () => console.error('Failed to clear IndexedDB');
    } catch (e) {
        console.error('Failed to clear IndexedDB:', e);
    }
}

// IndexedDB helper functions
async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(INDEXEDDB_NAME, INDEXEDDB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

async function getFromIndexedDB(): Promise<RadioStation[] | null> {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('stations');
            
            request.onsuccess = () => {
                const data = request.result;
                if (data && data.timestamp && Date.now() - data.timestamp < CACHE_DURATION) {
                    resolve(data.stations);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
}

async function saveToIndexedDB(stations: RadioStation[]): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({ stations, timestamp: Date.now() }, 'stations');
            
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });
    } catch {
        // Silently fail
    }
}

// Improved coordinate validation
function hasValidCoordinates(station: RadioStation): boolean {
    if (station.geo_lat === null || station.geo_long === null) {
        return false;
    }

    const lat = station.geo_lat;
    const lng = station.geo_long;

    if (isNaN(lat) || isNaN(lng)) {
        return false;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return false;
    }

    if (lat === 0 && lng === 0) {
        return false;
    }

    return true;
}

// Deterministic deduplication
function deduplicateByCoordinates(stations: RadioStation[]): RadioStation[] {
    const sortedStations = [...stations].sort((a, b) => 
        a.stationuuid.localeCompare(b.stationuuid)
    );
    
    const coordMap = new Map<string, RadioStation>();
    
    for (const station of sortedStations) {
        const coordKey = `${station.geo_lat!.toFixed(3)},${station.geo_long!.toFixed(3)}`;
        
        const existing = coordMap.get(coordKey);
        if (!existing) {
            coordMap.set(coordKey, station);
        } else {
            const existingScore = existing.votes * 2 + existing.clickcount + existing.bitrate / 10;
            const newScore = station.votes * 2 + station.clickcount + station.bitrate / 10;
            
            if (newScore > existingScore || 
                (newScore === existingScore && station.stationuuid < existing.stationuuid)) {
                coordMap.set(coordKey, station);
            }
        }
    }
    
    return Array.from(coordMap.values());
}

// Deduplicate by stationuuid (for merging different sources)
function deduplicateByUUID(stations: RadioStation[]): RadioStation[] {
    const uuidMap = new Map<string, RadioStation>();
    
    for (const station of stations) {
        if (!uuidMap.has(station.stationuuid)) {
            uuidMap.set(station.stationuuid, station);
        }
    }
    
    return Array.from(uuidMap.values());
}

// Process stations with validation
function processStations(allStations: RadioStation[]): RadioStation[] {
    const validStations = allStations.filter((station: RadioStation) => {
        if (!hasValidCoordinates(station)) {
            return false;
        }

        // Prefer url_resolved, fallback to url
        const streamUrl = station.url_resolved || station.url;
        if (!streamUrl || streamUrl.length === 0) {
            return false;
        }

        if (!station.country || station.country.length === 0) {
            return false;
        }

        if (station.bitrate > 0 && station.bitrate < 24) {
            return false;
        }

        return true;
    });

    const deduplicatedStations = deduplicateByCoordinates(validStations);

    deduplicatedStations.sort((a, b) => {
        const scoreA = a.votes * 2 + a.clickcount + a.bitrate / 10;
        const scoreB = b.votes * 2 + b.clickcount + b.bitrate / 10;
        
        if (scoreA === scoreB) {
            return a.stationuuid.localeCompare(b.stationuuid);
        }
        
        return scoreB - scoreA;
    });

    return deduplicatedStations;
}

// LocalStorage cache management
function getCachedStations(): RadioStation[] | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        
        if (!cached || !timestamp) return null;
        
        const age = Date.now() - parseInt(timestamp, 10);
        if (age > CACHE_DURATION) {
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
            return null;
        }
        
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
        }
        return null;
    } catch (error) {
        return null;
    }
}

function setCachedStations(stations: RadioStation[]): void {
    try {
        const serialized = JSON.stringify(stations);
        localStorage.setItem(CACHE_KEY, serialized);
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
        try {
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
            localStorage.setItem(CACHE_KEY, JSON.stringify(stations));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch {
            // Silently fail
        }
    }
}

// Fetch single batch from API - GPRS optimized with correct API parameters
async function fetchBatchFromAPI(offset: number, limit: number = 200): Promise<RadioStation[]> {
    const servers = [
        'https://de1.api.radio-browser.info',
        'https://at1.api.radio-browser.info',
        'https://nl1.api.radio-browser.info',
    ];

    for (const server of servers) {
        try {
            // Use correct Radio Browser API parameters: hidebroken, order, reverse, limit, offset
            const response = await fetch(
                `${server}/json/stations?limit=${limit}&offset=${offset}&order=votes&reverse=true&hidebroken=true`,
                {
                    headers: {
                        'User-Agent': 'GlobalFM/1.0',
                        'Accept': 'application/json',
                    },
                    signal: AbortSignal.timeout(15000), // 15 second timeout
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const batch: RadioStation[] = await response.json();
            
            if (!Array.isArray(batch)) {
                throw new Error('Invalid response format');
            }

            return batch;
        } catch (error) {
            console.warn(`⚠️ Failed to fetch batch from ${server}:`, error);
            continue;
        }
    }

    console.error('❌ Failed to fetch batch from all servers');
    return [];
}

// Fetch Christian radio stations (Hindi/English) with server failover
async function fetchChristianStations(): Promise<RadioStation[]> {
    if (christianStationsFetched && christianStationsCache.length > 0) {
        console.log(`⚡ Using cached Christian stations (${christianStationsCache.length} stations)`);
        return christianStationsCache;
    }

    const servers = [
        'https://de1.api.radio-browser.info',
        'https://at1.api.radio-browser.info',
        'https://nl1.api.radio-browser.info',
    ];

    for (const server of servers) {
        try {
            console.log(`🙏 Fetching Christian stations from ${server}...`);
            
            const response = await fetch(
                `${server}/json/stations/bytag/christian`,
                {
                    headers: {
                        'User-Agent': 'GlobalFM/1.0',
                        'Accept': 'application/json',
                    },
                    signal: AbortSignal.timeout(15000), // 15 second timeout
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: RadioStation[] = await response.json();
            
            if (!Array.isArray(data)) {
                throw new Error('Invalid response format');
            }

            // Filter for Hindi & English languages (case-insensitive)
            const filteredStations = data.filter(station => {
                const lang = station.language.toLowerCase();
                return lang.includes('hindi') || lang.includes('english');
            });

            console.log(`✅ Fetched ${filteredStations.length} Christian stations (Hindi/English) from ${data.length} total`);
            
            // Cache the result
            christianStationsFetched = true;
            christianStationsCache = filteredStations;
            
            return filteredStations;
        } catch (error) {
            console.warn(`⚠️ Failed to fetch Christian stations from ${server}:`, error);
            continue;
        }
    }

    console.error('❌ Failed to fetch Christian stations from all servers');
    return [];
}

// Merge Christian stations with global stations
function mergeStations(globalStations: RadioStation[], christianStations: RadioStation[]): RadioStation[] {
    // Combine both arrays
    const combined = [...globalStations, ...christianStations];
    
    // Deduplicate by stationuuid to avoid duplicates
    const deduplicated = deduplicateByUUID(combined);
    
    console.log(`🔀 Merged stations: ${globalStations.length} global + ${christianStations.length} Christian = ${deduplicated.length} unique stations`);
    
    return deduplicated;
}

// Lazy load next batch in background
async function loadNextBatch(queryClient: any): Promise<void> {
    if (isLoadingBatch || allStationsLoaded) {
        return;
    }

    isLoadingBatch = true;
    console.log(`📦 Loading batch at offset ${currentOffset}...`);

    try {
        const batch = await fetchBatchFromAPI(currentOffset, 200);
        
        if (batch.length === 0) {
            consecutiveEmptyBatches++;
            console.log(`⚠️ Empty batch received (${consecutiveEmptyBatches} consecutive)`);
            
            // Stop after 3 consecutive empty batches
            if (consecutiveEmptyBatches >= 3) {
                console.log(`✅ All global stations loaded (total: ${lazyLoadedStations.length})`);
                allStationsLoaded = true;
                
                // Now fetch Christian stations and merge
                try {
                    const christianStations = await fetchChristianStations();
                    const mergedStations = mergeStations(lazyLoadedStations, christianStations);
                    const processedStations = processStations(mergedStations);
                    
                    // Update all caches with merged data
                    memoryCache = processedStations;
                    memoryCacheTimestamp = Date.now();
                    queryClient.setQueryData(['globalRadioStations'], processedStations);
                    setCachedStations(processedStations);
                    await saveToIndexedDB(processedStations);
                    
                    console.log(`✅ Final merged station count: ${processedStations.length}`);
                } catch (error) {
                    console.error('❌ Failed to fetch/merge Christian stations:', error);
                }
                
                isLoadingBatch = false;
                return;
            }
            
            // Try next offset
            currentOffset += 200;
            isLoadingBatch = false;
            return;
        }

        // Reset consecutive empty counter on successful batch
        consecutiveEmptyBatches = 0;

        // Filter for valid stations with coordinates
        const validBatch = batch.filter(station => 
            hasValidCoordinates(station) && 
            (station.url_resolved || station.url)
        );

        console.log(`✅ Loaded ${validBatch.length} valid stations from batch (offset: ${currentOffset}, total: ${lazyLoadedStations.length + validBatch.length})`);

        // Add to lazy loaded stations
        lazyLoadedStations.push(...validBatch);
        currentOffset += 200;

        // Process and deduplicate all loaded stations so far
        const processedStations = processStations(lazyLoadedStations);
        
        // Update memory cache
        memoryCache = processedStations;
        memoryCacheTimestamp = Date.now();

        // Update React Query cache
        queryClient.setQueryData(['globalRadioStations'], processedStations);

        // Save to caches periodically (every 1000 stations)
        if (currentOffset % 1000 === 0) {
            setCachedStations(processedStations);
            await saveToIndexedDB(processedStations);
            console.log(`💾 Saved ${processedStations.length} stations to cache`);
        }
    } catch (error) {
        console.error('❌ Failed to load batch:', error);
    } finally {
        isLoadingBatch = false;
    }
}

// Main hook for fetching global radio stations with lazy loading
export function useRadioStations() {
    const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const queryClient = useQueryClient();

    const query = useQuery<RadioStation[]>({
        queryKey: ['globalRadioStations'],
        queryFn: async () => {
            try {
                // Layer 1: Memory cache (instant)
                if (memoryCache && Date.now() - memoryCacheTimestamp < CACHE_DURATION) {
                    console.log(`⚡ Using memory cache (${memoryCache.length} stations)`);
                    return memoryCache;
                }

                // Layer 2: IndexedDB cache
                const indexedDBCache = await getFromIndexedDB();
                if (indexedDBCache && indexedDBCache.length > 0) {
                    console.log(`⚡ Using IndexedDB cache (${indexedDBCache.length} stations)`);
                    memoryCache = indexedDBCache;
                    memoryCacheTimestamp = Date.now();
                    return indexedDBCache;
                }

                // Layer 3: LocalStorage cache
                const localStorageCache = getCachedStations();
                if (localStorageCache && localStorageCache.length > 0) {
                    console.log(`⚡ Using localStorage cache (${localStorageCache.length} stations)`);
                    memoryCache = localStorageCache;
                    memoryCacheTimestamp = Date.now();
                    
                    await saveToIndexedDB(localStorageCache);
                    return localStorageCache;
                }

                // Layer 4: Fetch first batch from API
                console.log('⚡ No cache found, fetching first batch from API...');
                
                // Reset lazy loading state
                currentOffset = 0;
                isLoadingBatch = false;
                allStationsLoaded = false;
                lazyLoadedStations = [];
                consecutiveEmptyBatches = 0;
                christianStationsFetched = false;
                christianStationsCache = [];

                const firstBatch = await fetchBatchFromAPI(0, 200);
                
                if (firstBatch.length === 0) {
                    console.error('❌ Failed to fetch first batch');
                    return [];
                }

                // Filter for valid stations with coordinates
                const validStations = firstBatch.filter(station => 
                    hasValidCoordinates(station) && 
                    (station.url_resolved || station.url)
                );

                console.log(`✅ Loaded ${validStations.length} valid stations from first batch`);

                lazyLoadedStations = validStations;
                currentOffset = 200;

                const processedStations = processStations(validStations);
                
                // Save to caches
                setCachedStations(processedStations);
                await saveToIndexedDB(processedStations);
                memoryCache = processedStations;
                memoryCacheTimestamp = Date.now();
                
                return processedStations;
                
            } catch (error) {
                console.error('❌ Failed to fetch stations:', error);
                if (memoryCache) return memoryCache;
                const indexedDBCache = await getFromIndexedDB();
                if (indexedDBCache) return indexedDBCache;
                const localStorageCache = getCachedStations();
                if (localStorageCache) return localStorageCache;
                return [];
            }
        },
        staleTime: CACHE_DURATION,
        gcTime: CACHE_DURATION * 2,
        retry: 2,
        retryDelay: 2000,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        placeholderData: () => {
            if (memoryCache) return memoryCache;
            const cached = getCachedStations();
            return cached && cached.length > 0 ? cached : [];
        },
    });

    // Set up continuous lazy loading every 3 seconds
    useEffect(() => {
        if (!query.data || query.data.length === 0) {
            return;
        }

        // Start lazy loading after initial data is loaded
        const startLazyLoading = () => {
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
            }

            console.log(`🚀 Starting lazy loading from offset ${currentOffset}`);

            loadingIntervalRef.current = setInterval(() => {
                if (!allStationsLoaded && !isLoadingBatch) {
                    loadNextBatch(queryClient);
                } else if (allStationsLoaded && loadingIntervalRef.current) {
                    clearInterval(loadingIntervalRef.current);
                    loadingIntervalRef.current = null;
                    console.log(`✅ Lazy loading complete - ${lazyLoadedStations.length} total stations loaded`);
                    
                    // Final save to cache (already done in loadNextBatch when allStationsLoaded is set)
                }
            }, 3000); // Load next batch every 3 seconds
        };

        // Start lazy loading after a short delay
        const timeoutId = setTimeout(startLazyLoading, 1000);

        return () => {
            clearTimeout(timeoutId);
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
                loadingIntervalRef.current = null;
            }
        };
    }, [query.data, queryClient]);

    return query;
}

// Fetch user statistics
export function useStatsSummary() {
    const { actor, isFetching } = useActor();

    return useQuery({
        queryKey: ['statsSummary'],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
            return actor.getAllStatsSummary();
        },
        enabled: !!actor && !isFetching,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
    });
}

// Get caller user profile
export function useGetCallerUserProfile() {
    const { actor, isFetching: actorFetching } = useActor();

    const query = useQuery({
        queryKey: ['currentUserProfile'],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
            return actor.getCallerUserProfile();
        },
        enabled: !!actor && !actorFetching,
        retry: false,
    });

    return {
        ...query,
        isLoading: actorFetching || query.isLoading,
        isFetched: !!actor && query.isFetched,
    };
}
