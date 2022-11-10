import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { Layout } from '/src/components/layout';
import { useProductsStore } from '/src/stores/productsStore';
import { useScanStore } from '/src/stores/scanStore';
import { useViewStore } from '/src/stores/viewStore';

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  window.store = {
    scan:     useScanStore.getState,
    view:     useViewStore.getState,
    products: useProductsStore.getState,
  };
}

createRoot(document.getElementById('app'))
  .render(
    <React.StrictMode>
      <Layout />
    </React.StrictMode>,
  );
