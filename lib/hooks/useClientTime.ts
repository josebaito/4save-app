'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to get current time on client-side only
 * Prevents hydration mismatches by returning null on server
 */
export function useClientTime() {
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  return currentTime;
}

/**
 * Custom hook to calculate time ago from a timestamp
 * Prevents hydration mismatches by returning empty string on server
 */
export function useTimeAgo(timestamp: string) {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    setCurrentTime(Date.now());
    
    const updateTimeAgo = () => {
      const now = Date.now();
      setCurrentTime(now);
      const minutes = Math.round((now - new Date(timestamp).getTime()) / 60000);
      setTimeAgo(`${minutes}min`);
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp]);

  return timeAgo;
}
