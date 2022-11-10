import * as React from 'react';
import { useScanStore } from '../stores/scanStore';
import { useViewStore } from '../stores/viewStore';
import { Home } from './routes/home';

// Kamil: currently mess - working on it
export const Layout = () => {
  const navState = useViewStore(store => store.navState);

  return (
    <div>
      {
        (() => {
          switch (navState.id) {
            case 'home':
              return (

                <Home />
              );
            default:
              return (
                <div>Layout</div>
              );
          }
        })()
      }
    </div>

  );
};
