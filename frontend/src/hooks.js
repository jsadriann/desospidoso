import { useCallback, useEffect, useState } from 'react';

/** Valor com atraso (para a busca não chamar a API a cada tecla). */
export function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Carrega dados assíncronos: { data, error, loading, reload }. */
export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fn, deps);
  const reload = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    load()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }));
    return () => { alive = false; };
  }, [load]);
  useEffect(() => reload(), [reload]);
  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data })) };
}
