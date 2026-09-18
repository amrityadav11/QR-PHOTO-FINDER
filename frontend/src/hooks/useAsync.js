import { useState, useCallback } from 'react';

/**
 * Generic async operation hook with loading / error / data state.
 * Usage:
 *   const { execute, loading, data, error } = useAsync(myApiCall);
 *   const result = await execute(arg1, arg2);
 */
const useAsync = (asyncFn, immediate = false) => {
  const [loading, setLoading] = useState(immediate);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        setData(result);
        return result;
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || 'Something went wrong';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setData(null);
    setError(null);
  }, []);

  return { execute, loading, data, error, reset, setData };
};

export default useAsync;
