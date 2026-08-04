import { useEffect, useState } from 'react';

/** 입력값이 delay(ms) 동안 잠잠해진 뒤에야 바뀌는 값을 돌려준다. 검색 입력에 사용. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
