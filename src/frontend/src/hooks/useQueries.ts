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
    tags?: string;
}

// Multi-layer caching configuration optimized for GPRS
const CACHE_KEY = 'globalfm_global_cache_v7';
const CACHE_TIMESTAMP_KEY = 'globalfm_global_timestamp_v7';
const CACHE_DURATION = 1000 * 60 * 45; // 45 minutes
const INDEXEDDB_NAME = 'GlobalFMCache';
const INDEXEDDB_VERSION = 7;
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

// Hindi Christian stations state
let hindiChristianStationsFetched = false;
let hindiChristianStationsCache: RadioStation[] = [];

// Export function to clear all caches
export function clearAllCaches(): void {
    memoryCache = null;
    memoryCacheTimestamp = 0;
    currentOffset = 0;
    isLoadingBatch = false;
    allStationsLoaded = false;
    lazyLoadedStations = [];
    consecutiveEmptyBatches = 0;
    hindiChristianStationsFetched = false;
    hindiChristianStationsCache = [];
    
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

// Heuristic to identify Christian stations
function isChristianStation(station: RadioStation): boolean {
    const searchText = `${station.name} ${station.language} ${station.homepage} ${station.tags || ''}`.toLowerCase();
    
    const christianKeywords = [
        'christian', 'christ', 'jesus', 'bible', 'gospel', 'church',
        'catholic', 'protestant', 'evangelical', 'baptist', 'methodist',
        'pentecostal', 'worship', 'praise', 'ministry', 'faith',
        'cross', 'holy', 'blessed', 'prayer', 'scripture'
    ];
    
    return christianKeywords.some(keyword => searchText.includes(keyword));
}

// Prioritize Christian stations first
function prioritizeChristianStations(stations: RadioStation[]): RadioStation[] {
    const christianStations: RadioStation[] = [];
    const otherStations: RadioStation[] = [];
    
    for (const station of stations) {
        if (isChristianStation(station)) {
            christianStations.push(station);
        } else {
            otherStations.push(station);
        }
    }
    
    console.log(`✝️ Christian stations: ${christianStations.length}, Other stations: ${otherStations.length}`);
    
    // Return Christian stations first, then others
    return [...christianStations, ...otherStations];
}

// Process stations with validation and Christian-first ordering
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

    // Sort by quality score
    deduplicatedStations.sort((a, b) => {
        const scoreA = a.votes * 2 + a.clickcount + a.bitrate / 10;
        const scoreB = b.votes * 2 + b.clickcount + b.bitrate / 10;
        
        if (scoreA === scoreB) {
            return a.stationuuid.localeCompare(b.stationuuid);
        }
        
        return scoreB - scoreA;
    });

    // Apply Christian-first ordering
    const prioritizedStations = prioritizeChristianStations(deduplicatedStations);

    return prioritizedStations;
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

// Fetch Hindi Christian radio stations with server failover
async function fetchHindiChristianStations(): Promise<RadioStation[]> {
    if (hindiChristianStationsFetched && hindiChristianStationsCache.length > 0) {
        console.log(`⚡ Using cached Hindi Christian stations (${hindiChristianStationsCache.length} stations)`);
        return hindiChristianStationsCache;
    }

    const servers = [
        'https://de1.api.radio-browser.info',
        'https://at1.api.radio-browser.info',
        'https://nl1.api.radio-browser.info',
    ];

    const allHindiChristianStations: RadioStation[] = [];

    // Fetch from multiple endpoints to get comprehensive results
    const searchQueries = [
        'bytag/christian',
        'bylanguage/hindi',
        'byname/christian',
        'byname/hindi christian',
        'byname/jesus',
        'byname/bible'
    ];

    for (const server of servers) {
        try {
            console.log(`🙏 Fetching Hindi Christian stations from ${server}...`);
            
            for (const query of searchQueries) {
                try {
                    const response = await fetch(
                        `${server}/json/stations/${query}`,
                        {
                            headers: {
                                'User-Agent': 'GlobalFM/1.0',
                                'Accept': 'application/json',
                            },
                            signal: AbortSignal.timeout(15000),
                        }
                    );

                    if (response.ok) {
                        const data: RadioStation[] = await response.json();
                        if (Array.isArray(data)) {
                            allHindiChristianStations.push(...data);
                        }
                    }
                } catch (error) {
                    // Continue with next query
                    continue;
                }
            }

            // If we got results, break out of server loop
            if (allHindiChristianStations.length > 0) {
                break;
            }
        } catch (error) {
            console.warn(`⚠️ Failed to fetch Hindi Christian stations from ${server}:`, error);
            continue;
        }
    }

    // Deduplicate by UUID
    const uniqueStations = deduplicateByUUID(allHindiChristianStations);

    // Filter for Hindi Christian stations (Hindi language OR Christian keywords)
    const filteredStations = uniqueStations.filter(station => {
        const lang = station.language.toLowerCase();
        const isHindi = lang.includes('hindi');
        const isChristian = isChristianStation(station);
        
        // Include if it's Hindi Christian, or just Christian with good quality
        return (isHindi && isChristian) || (isChristian && station.votes > 10);
    });

    console.log(`✅ Fetched ${filteredStations.length} Hindi Christian stations from ${allHindiChristianStations.length} total results`);
    
    // Cache the result
    hindiChristianStationsFetched = true;
    hindiChristianStationsCache = filteredStations;
    
    return filteredStations;
}

// Merge Hindi Christian stations with global stations
function mergeStations(globalStations: RadioStation[], hindiChristianStations: RadioStation[]): RadioStation[] {
    // Combine both arrays
    const combined = [...globalStations, ...hindiChristianStations];
    
    // Deduplicate by stationuuid to avoid duplicates
    const deduplicated = deduplicateByUUID(combined);
    
    console.log(`🔀 Merged stations: ${globalStations.length} global + ${hindiChristianStations.length} Hindi Christian = ${deduplicated.length} unique stations`);
    
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
                
                // Now fetch Hindi Christian stations and merge
                try {
                    const hindiChristianStations = await fetchHindiChristianStations();
                    const mergedStations = mergeStations(lazyLoadedStations, hindiChristianStations);
                    const processedStations = processStations(mergedStations);
                    
                    // Update all caches with merged data
                    memoryCache = processedStations;
                    memoryCacheTimestamp = Date.now();
                    queryClient.setQueryData(['globalRadioStations'], processedStations);
                    setCachedStations(processedStations);
                    await saveToIndexedDB(processedStations);
                    
                    console.log(`✅ Final merged station count: ${processedStations.length} (Christian stations prioritized first)`);
                } catch (error) {
                    console.error('❌ Failed to fetch/merge Hindi Christian stations:', error);
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
            console.log(`💾 Saved ${processedStations.length} stations to cache (Christian stations prioritized)`);
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
                    console.log(`⚡ Using memory cache (${memoryCache.length} stations, Christian-first ordering)`);
                    return memoryCache;
                }

                // Layer 2: IndexedDB cache
                const indexedDBCache = await getFromIndexedDB();
                if (indexedDBCache && indexedDBCache.length > 0) {
                    console.log(`⚡ Using IndexedDB cache (${indexedDBCache.length} stations, Christian-first ordering)`);
                    memoryCache = indexedDBCache;
                    memoryCacheTimestamp = Date.now();
                    return indexedDBCache;
                }

                // Layer 3: LocalStorage cache
                const localStorageCache = getCachedStations();
                if (localStorageCache && localStorageCache.length > 0) {
                    console.log(`⚡ Using localStorage cache (${localStorageCache.length} stations, Christian-first ordering)`);
                    memoryCache = localStorageCache;
                    memoryCacheTimestamp = Date.now();
                    
                    await saveToIndexedDB(localStorageCache);
                    return localStorageCache;
                }

                // Layer 4: Fetch first batch from API
                console.log('🌍 Fetching initial batch from Radio Browser API...');
                const firstBatch = await fetchBatchFromAPI(0, 200);
                
                if (firstBatch.length === 0) {
                    throw new Error('Failed to fetch initial batch');
                }

                // Fetch Hindi Christian stations in parallel
                console.log('🙏 Fetching Hindi Christian stations...');
                const hindiChristianStations = await fetchHindiChristianStations();
                
                // Merge with first batch
                const mergedStations = mergeStations(firstBatch, hindiChristianStations);
                const processedStations = processStations(mergedStations);
                
                console.log(`✅ Initial load: ${processedStations.length} stations (Christian stations prioritized first)`);

                // Initialize lazy loading state
                lazyLoadedStations = [...firstBatch];
                currentOffset = 200;
                allStationsLoaded = false;
                consecutiveEmptyBatches = 0;

                // Update all caches
                memoryCache = processedStations;
                memoryCacheTimestamp = Date.now();
                setCachedStations(processedStations);
                await saveToIndexedDB(processedStations);

                return processedStations;
            } catch (error) {
                console.error('❌ Failed to fetch radio stations:', error);
                throw error;
            }
        },
        staleTime: CACHE_DURATION,
        gcTime: CACHE_DURATION * 2,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 2,
    });

    // Background lazy loading
    useEffect(() => {
        if (query.data && query.data.length > 0 && !allStationsLoaded) {
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
            }

            loadingIntervalRef.current = setInterval(() => {
                if (!isLoadingBatch && !allStationsLoaded) {
                    loadNextBatch(queryClient);
                }
            }, 2000);

            return () => {
                if (loadingIntervalRef.current) {
                    clearInterval(loadingIntervalRef.current);
                }
            };
        }
    }, [query.data, queryClient]);

    return query;
}
