import { useState, useEffect, useCallback } from 'react';
import { eventsAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchEvents = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventsAPI.getAll(params);
      setEvents(res.data.data || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load events';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const deleteEvent = useCallback(async (id) => {
    try {
      await eventsAPI.delete(id);
      setEvents((prev) => prev.filter((e) => e._id !== id));
      toast.success('Event deleted successfully');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
      return false;
    }
  }, []);

  return { events, loading, error, pagination, refetch: fetchEvents, deleteEvent };
};

export const useEvent = (id) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await eventsAPI.getById(id);
      setEvent(res.data.event);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, loading, error, refetch: fetchEvent, setEvent };
};
