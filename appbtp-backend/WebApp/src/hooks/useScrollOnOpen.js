import { useEffect } from 'react';

// useScrollOnOpen: scrolls the given ref into view (or window top) when isOpen becomes true
export default function useScrollOnOpen(isOpen, ref, options = { behavior: 'smooth', block: 'start', inline: 'nearest' }) {
  useEffect(() => {
    if (!isOpen) return;
    try {
      const el = ref && ref.current ? ref.current : null;
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView(options);
      } else if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: options.behavior });
      }
    } catch (err) {
      // swallow any errors silently
      // console.warn('useScrollOnOpen failed', err);
    }
  }, [isOpen, ref, options.behavior, options.block, options.inline]);
}
