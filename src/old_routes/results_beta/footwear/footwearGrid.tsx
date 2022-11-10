import { css } from 'emotion';
import * as _ from 'lodash';
import * as React from 'react';

import { ExtendedProductData } from '@data/shoes';

import { ResultsViewEvent } from '../types';

import { ProductCard } from './productCard';
import { FootwearViewEvent } from '.';

const GRID_GAP = 12;
const NUMBER_OF_COLUMNS = 3;
const PRODUCT_CARD_SIZE = { width: 160, height: 200 };

const styles = {
  grid: css`
    display: grid;
    grid-auto-rows: ${ PRODUCT_CARD_SIZE.height }px;
    grid-template-columns: repeat(${ NUMBER_OF_COLUMNS }, 1fr);
    grid-gap: ${ GRID_GAP }px;
    overflow-y: scroll;
    margin-right: 14px;
    height: 100%;
    padding: 12px 12px 0 12px;
  `,
  productCard: css`
    width: 259px;
    height: 178px;
    background: white;
    place-self: center;
    border-radius: 8px;
    box-shadow: 0 1px 13px 1px #D1CDCD;
  `,
};

interface Props {
  products: ExtendedProductData[];
  activeProductIndex: Exclude<number, null>;
  footwearViewEventDispatch: React.Dispatch<FootwearViewEvent>;
  resultsViewEventDispatch: React.Dispatch<ResultsViewEvent>;
  externalId: string;
}

export const FootwearGrid: React.FC<Props> = (props) => {
  const gridRef = React.useRef<HTMLDivElement>(null);
  const scrollCheckInterval = React.useRef<ReturnType<typeof setInterval>>(null);
  const [isExpandedCardAlignedWithSelection, setIsExpandedCardAlignedWithSelection] = React.useState<boolean>(false);
  let activeProductScrollPosition = 0;

  const hasProductActive = React.useMemo(
    () => !! props.activeProductIndex ||
      (typeof(props.activeProductIndex) === 'number' && props.activeProductIndex === 0),
    [props.activeProductIndex],
  );

  React.useEffect(() => () => clearInterval(scrollCheckInterval.current), []);

  React.useEffect(
    () => {
      if (props.activeProductIndex >= 0 && props.products) {
        scrollTo(props.activeProductIndex * (PRODUCT_CARD_SIZE.height + GRID_GAP));
        clearInterval(scrollCheckInterval.current);
        setIsExpandedCardAlignedWithSelection(true);
        setTimeout(() => {
          activeProductScrollPosition = gridRef.current.scrollTop;
        }, 500);
        scrollCheckInterval.current = setInterval(() => {
          const sp = gridRef.current.scrollTop;
          if (sp > activeProductScrollPosition + 100 || sp < activeProductScrollPosition - 100) {
            setIsExpandedCardAlignedWithSelection(false);
          } else {
            setIsExpandedCardAlignedWithSelection(true);
          }
        }, 500);
      }
    },
    [props.activeProductIndex, props.products],
  );

  const toggleProductCard = React.useCallback(
    _.debounce((
      product: ExtendedProductData,
      index: number,
      expanded: boolean,
    ) => {
      props.footwearViewEventDispatch({
        type:    'on_click_product_card',
        payload: {
          value: product,
          index,
        },
      });
    }, 500, { leading: true, trailing: false }),
    [props.products],
  );

  const scrollTo = React.useCallback(
    _.debounce((scrollTop: number) => {
      gridRef.current?.scrollTo({
        top:      scrollTop,
        behavior: 'smooth',
      });
    }, 100),
    [],
  );

  return (
    <div
      className={ styles.grid }
      ref={ gridRef }
    >
      {
        props.products?.map((product, i) => {
          const expanded = props.activeProductIndex === i;
          return (
            <ProductCard
              key={ i }
              externalId={ props.externalId }
              dimension={ PRODUCT_CARD_SIZE }
              footwearViewEventDispatch={ props.footwearViewEventDispatch }
              resultsViewEventDispatch={ props.resultsViewEventDispatch }
              product={ product }
              expanded={ expanded }
              isAnyCardExpanded={ hasProductActive }
              isExpandedCardAlignedWithSelection={ isExpandedCardAlignedWithSelection }
              gridPosition={
                hasProductActive ? {
                  row:    i,
                  column: NUMBER_OF_COLUMNS - 1,
                } : {
                  row:    Math.floor(i / NUMBER_OF_COLUMNS),
                  column: i % NUMBER_OF_COLUMNS,
                }
              }
              gridGap={ GRID_GAP }
              onToggle={ () => toggleProductCard(product, i, expanded) }
            />
          );
        })
      }
      { // In order to have white space when scrolling to bottom.
        Array(3).fill(null).map((v, i) => (
          <div
            key={ i }
            style={{
              height:          PRODUCT_CARD_SIZE.height,
              gridRowStart:    hasProductActive ? props.products?.length + 1 + i : 'auto',
              gridColumnStart: i + 1,
            }}
          />
        ))
      }
    </div>
  );
};
