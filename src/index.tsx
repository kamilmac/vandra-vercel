import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { Layout } from '@components/layout';
import { useProductsStore } from '@stores/productsStore';
import { useScanStore } from '@stores/scanStore';
import { useViewStore } from '@stores/viewStore';

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
      { /* <RouterProvider router={router} /> */ }
      <Layout />
    </React.StrictMode>,
  );
