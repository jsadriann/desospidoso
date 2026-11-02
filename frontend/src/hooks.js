import { useCallback, useEffect, useRef, useState } from 'react';

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

/** true se as animações devem ficar desligadas: "reduzir movimento" no aparelho ou em Perfil > Preferências. */
export const prefersReducedMotion = () => (
  typeof window !== 'undefined' && (
    document.documentElement.dataset.motion === 'reduce'
    || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  )
);

/** Número que "conta" até o valor (resumo da lista de pacientes). */
export function useCountUp(value, duration = 700) {
  const [shown, setShown] = useState(prefersReducedMotion() ? value : 0);
  const from = useRef(shown);
  useEffect(() => {
    if (prefersReducedMotion()) { setShown(value); return undefined; }
    const start = performance.now();
    const initial = from.current;
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const n = Math.round(initial + (value - initial) * eased);
      from.current = n;
      setShown(n);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return shown;
}

/**
 * Mostra os elementos com a classe "reveal" quando eles entram na tela ao rolar.
 * Retorna uma ref para o contêiner.
 */
export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const items = ref.current?.querySelectorAll('.reveal') || [];
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      items.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}
