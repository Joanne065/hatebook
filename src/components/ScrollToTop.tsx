import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (window.location.hash === '#comments') return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
