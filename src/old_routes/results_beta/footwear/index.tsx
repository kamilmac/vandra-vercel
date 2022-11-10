import { css } from 'emotion';
import * as React from 'react';

import { extendProductData } from '@components/footwear_view/browser';
import { ExtendedProductData, getAvailableShoes } from '@data/shoes';

import { ResultsViewEvent } from '../types';

import { FootwearFilters } from './footwearFilters';
import { FootwearGrid } from './footwearGrid';

const styles = {
  footwearGridWrapper: css`
    position: absolute;
    height: calc(100% - 80px - 55px);
    top: 135px;
    right: 0;
  `,
  zeroResultMessage: css`
    color: rgba(0, 0, 0, 0.3);
    margin: 200px 60px 0 0;
    width: 320px;
    text-align: center;
    white-space: pre-wrap;
  `,
};
interface Props {
  scanData: {
    externalId: string;
    dataAnnotation: DataAnnotation;
    chartLocale: string;
    chartName: string;
  };
  showFilters: boolean;
  resultsViewEventDispatch: React.Dispatch<ResultsViewEvent>;
}

interface State {
  loading: boolean;
  products: ExtendedProductData[];
  activeProduct: { value: ExtendedProductData; index: number };
  footwearFilters: Record<string, (product: ExtendedProductData) => boolean>;
}

export type FootwearViewEvent = {
  type: 'set_loading';
  payload: boolean;
} | {
  type: 'set_products';
  payload: ExtendedProductData[];
} | {
  type: 'on_click_product_card';
  payload: { index: number; value: ExtendedProductData };
} | {
  type: 'update_filters';
  payload: Record<string, (product: ExtendedProductData) => boolean>;
};

const footwearStateReducer = (state: State, action: FootwearViewEvent): State => {
  // console.log('Footwear view event dispatch', action);
  switch (action.type) {
    case 'set_loading':
      return {
        ...state,
        loading: action.payload,
      };
    case 'set_products':
      return {
        ...state,
        products: action.payload,
      };
    case 'on_click_product_card':
      return {
        ...state,
        activeProduct: state.activeProduct?.index === action.payload?.index ? null : action.payload,
      };
    case 'update_filters':
      return {
        ...state,
        footwearFilters: {
          ...state.footwearFilters,
          ...action.payload,
        },
        activeProduct: null,
      };
    default:
      return state;
  }
};

export const Footwear: React.FC<Props> = (props) => {
  const mounted = React.useRef<boolean>(null);
  const [state, footwearViewEventDispatch] = React.useReducer(
    footwearStateReducer,
    {
      loading:         true,
      products:        null,
      activeProduct:   null,
      footwearFilters: {},
    },
  );

  React.useEffect(
    () => {
      if (!mounted.current) {
        mounted.current = true;
      }
      footwearViewEventDispatch({ type: 'set_loading', payload: true });
      getAvailableShoes(
        props.scanData.externalId,
        props.scanData.dataAnnotation.gender,
        props.scanData.dataAnnotation.age_group,
        props.scanData.chartLocale,
        props.scanData.chartName,
      ).then((response) => {
        const products = response.shoe_styles?.map(product => extendProductData(product));
        footwearViewEventDispatch({ type: 'set_products', payload: products });
        footwearViewEventDispatch({ type: 'set_loading', payload: false });
      }).catch((error) => {
        console.error(error);
        footwearViewEventDispatch({ type: 'set_loading', payload: false });
      });
    },
    [],
  );

  React.useEffect(() => {
    if (mounted.current) {
      props.resultsViewEventDispatch({
        type:    'update_fit_zones',
        payload: {
          fitZoneClassifications: state.activeProduct?.value?.fit,
        },
      });
    }
  }, [state.activeProduct]);

  const filteredProducts = React.useMemo(
    (): ExtendedProductData[] => {
      if (state.products && state.footwearFilters) {
        const filters = Object.values(state.footwearFilters);
        if (!filters.length) {
          return state.products;
        }
        return state.products.filter(product => !filters.some(filter => filter && !filter(product)));
      }
    },
    [state.products, state.footwearFilters],
  );

  const getZeroResultsMessage = React.useCallback(
    (): string => {
      if (state.loading && !state.products) { return ''; }
      return (
        !state.products?.length &&
          'Cannot find suitable products for you in this store.' ||
        !filteredProducts?.length &&
          'Your search returned no results. \nPlease expand your search or clear the filters.' || ''
      );
    },
    [state.products, state.loading, state.footwearFilters],
  );

  return (
    <div id="shoes">
      <div className={ styles.footwearGridWrapper }>
        {
          filteredProducts?.length ? (
            <FootwearGrid
              externalId={ props.scanData.externalId }
              products={ filteredProducts || [] }
              activeProductIndex={ state.activeProduct?.index }
              footwearViewEventDispatch={ footwearViewEventDispatch }
              resultsViewEventDispatch={ props.resultsViewEventDispatch }
            />
          ) : (
            <div className={ styles.zeroResultMessage }>
              { getZeroResultsMessage() }
            </div>
          )
        }
      </div>

      <FootwearFilters
        filters={ state.footwearFilters }
        products={ state.products || [] }
        position={{ top: 150, right: 100 }}
        visible={ props.showFilters }
        footwearViewEventDispatch={ footwearViewEventDispatch }
        onClose={ () => props.resultsViewEventDispatch({ type: 'close_footwear_filters' }) }
      />
    </div>
  );
};
