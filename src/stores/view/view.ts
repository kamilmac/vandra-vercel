import { config } from '/src/services/config';

const SCAN_ROUTE_PREFIX = 'scan_';

export const getStateFromUrl = () => {
  const [main, sub] = window.location.pathname.split('/').filter(a => a !== '').slice(-2);
  const sanitized = [main, sub].map(p => p || '');

  // eslint-disable-next-line no-restricted-syntax
  for (const r in config.routes) {
    if (String(config.routes[r](sub)) === String(sanitized)) {
      return {
        id:     r,
        scanId: r.startsWith(SCAN_ROUTE_PREFIX) ? sub : null,
        url:    sanitized,
      };
    }
  }

  const fallbackRoute = {
    id:     config.fallbackRoute,
    scanId: null,
    url:    config.routes[config.fallbackRoute](),
  };

  window.history.pushState(null, '', `${window.location.origin}/${fallbackRoute.url.join('/')}`);
  return fallbackRoute;
};

export const createNav = (navStateSetter, routes) => {
  const decoratedRoutes = {};
  // eslint-disable-next-line no-restricted-syntax,guard-for-in
  for (const r in routes) {
    decoratedRoutes[r] = (scanId) => {
      const state = {
        id:  r,
        scanId,
        url: routes[r](scanId),
      };
      const [main, sub] = state.url;
      window.history.pushState(null, '', `${window.location.origin}/${main}/${sub}`);
      navStateSetter(state);
    };
  }
  return decoratedRoutes;
};
