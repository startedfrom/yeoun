import { useEffect, useState } from 'react';

/** 입력·검색 등 짧은 지연 후에만 하위 로직이 반응하도록 값을 지연시킵니다. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
