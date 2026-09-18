import { useState, useEffect, useRef, useCallback } from 'react';
import { photosAPI } from '../services/api';

/**
 * Polls the photo processing status for an event.
 * Automatically stops polling when processing is complete.
 */
const useProcessingStatus = (eventId, enabled = true) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await photosAPI.getProcessingStatus(eventId);
      const data = res.data;
      setStatus(data);

      // Stop polling when done
      if (
        data.processingStatus === 'completed' ||
        data.processingStatus === 'partial' ||
        data.processingStatus === 'failed' ||
        data.processingStatus === 'idle'
      ) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [eventId]);

  useEffect(() => {
    if (!enabled || !eventId) return;

    setLoading(true);
    fetch().finally(() => setLoading(false));

    intervalRef.current = setInterval(fetch, 3000); // Poll every 3s

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [eventId, enabled, fetch]);

  return { status, loading, refetch: fetch };
};

export default useProcessingStatus;
