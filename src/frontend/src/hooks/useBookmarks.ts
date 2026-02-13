import { useEffect, useState } from 'react';

const BOOKMARKS_KEY = 'globalfm_bookmarks';
const BOOKMARKS_CHANGE_EVENT = 'bookmarks-changed';

// Get bookmarks from localStorage
function getBookmarks(): string[] {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save bookmarks to localStorage
function saveBookmarks(bookmarks: string[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGE_EVENT, { detail: bookmarks }));
  } catch {
    // Ignore localStorage errors
  }
}

// Hook for managing bookmarks
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>(() => getBookmarks());

  // Subscribe to bookmark changes
  useEffect(() => {
    const handleBookmarksChange = (event: Event) => {
      const customEvent = event as CustomEvent<string[]>;
      setBookmarks(customEvent.detail);
    };

    window.addEventListener(BOOKMARKS_CHANGE_EVENT, handleBookmarksChange);

    return () => {
      window.removeEventListener(BOOKMARKS_CHANGE_EVENT, handleBookmarksChange);
    };
  }, []);

  const toggleBookmark = (stationId: string): boolean => {
    const current = getBookmarks();
    const isBookmarked = current.includes(stationId);
    
    if (isBookmarked) {
      const updated = current.filter(id => id !== stationId);
      saveBookmarks(updated);
      return false;
    } else {
      const updated = [...current, stationId];
      saveBookmarks(updated);
      return true;
    }
  };

  const isBookmarked = (stationId: string): boolean => {
    return bookmarks.includes(stationId);
  };

  return {
    bookmarks,
    toggleBookmark,
    isBookmarked,
  };
}
