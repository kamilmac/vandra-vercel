import * as React from 'react';
import styled, { keyframes } from 'react-emotion';

import { animations } from '@components/elements/animation/animations';
import { CloseIcon } from '@components/icons';
import { ExtendedProductData, getFitZoneClassificationsFromBackendData, normalizeShoeWidthLabel, WidthSizeVariant } from '@data/shoes';
import { getSizeRecommendation, SizeRecommendationData, SizeRecommendationResponse } from '@data/size_recommendation';
import { translate } from '@data/translate';

import { ResultsViewEvent } from '../types';

import { FootwearViewEvent } from '.';

interface Props {
  externalId: string;
  footwearViewEventDispatch: React.Dispatch<FootwearViewEvent>;
  resultsViewEventDispatch: React.Dispatch<ResultsViewEvent>;
  product: ExtendedProductData;
  dimension: { width: number; height: number };
  gridGap?: number;
  gridPosition: { row: number; column: number };
  expanded: boolean;
  onToggle: () => void;
  isExpandedCardAlignedWithSelection: boolean;
  isAnyCardExpanded: boolean;
}

type SizeRecommendation = SizeRecommendationResponse & { mostRecommendedIndex: number };

const rotatetIn = keyframes`
  from {
    transform: perspective(800px) rotateX(-35deg);
    opacity 0.1;
  }

  to {
    transform: rotateX(0deg);
    opacity 1;
  }
`;

const StyledProductCard = styled('div')<Partial<Props>>`${ props => props.expanded ?
  `
  grid-column: 1 / 3;
  grid-row: ${ props.gridPosition.row + 1 } / ${ props.gridPosition.row + 4 };
  place-self: stretch;
  margin-left: 12px;
  padding: 32px 24px;
  width: calc(100% - 12px);
  height: 100%;
  position: absolute;
  &::after {
    content: "";
    opacity: ${ props.isExpandedCardAlignedWithSelection ? 1 : 0};
    position: absolute;
    top: 15%;
    right: -20px;
    margin-top: -6px;
    border-width: 10px;
    border-style: solid;
    border-color: transparent transparent transparent white;
  }
` : `
  grid-column-start: ${ props.gridPosition.column + 1 };
  grid-row-start: ${ props.gridPosition.row + 1 };
  background: white;
  place-self: flex-end;
  padding: 18px 16px;
  animation: ${rotatetIn} 0.3s ease;
  animation-fill-mode: forwards;
  opacity: 0;
  animation-delay: ${
  Math.min((props.gridPosition.row * 3 + props.gridPosition.column) * 0.05, 2) }s;
`
}
  border-radius: 8px;
  box-shadow: 0 1px 13px 1px #D1CDCD;
  background: white;
  transition: height 0.15s ease-out;
  h3 {
    text-transform: uppercase;
    margin: 12px 0 12px 0;
    font-size: 12px;
    font-weight: bold;
  }
`;

const ProductBrandLogo = styled('div')<{ src: string }>`
  width: 128px;
  height: 18px;
  background-image: ${ props => props.src ? `url("${props.src}")` : 'initial' };
  background-position: left center;
  background-repeat: no-repeat;
  background-size: contain;
`;

const ProductImage = styled('div')<{ src: string; placeholder: string; large?: boolean }>`
  width: 100%;
  height: ${ props => props.large ? 240 : 160 }px;
  background-image: ${ props => `url("${props.src || props.placeholder}")` };
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain ;
  transform: translate(0, ${ props => props.large ? -40 : -28 }px);
  position: relative;
  margin-bottom: ${ props => props.large ? -70 : -42 }px;
`;

const ProductTitle = styled('div')<{ large?: boolean }>`
  font-size: ${ props => props.large ? '18px' : '12px' };
  font-weight: bold;
  color: black;
  text-transform: uppercase;
`;

const ProductCategory = styled('div')<{ large?: boolean }>`
  font-size: ${ props => props.large ? '14px' : '10px' };
  margin-top: ${ props => props.large ? '12px' : '8px' };
  color: rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
`;

const ColorSelectGroup = styled('div')`
  margin-top: 12px;
  margin-bottom: 24px;
  display: flex;
  span {
    display: block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 10px;
    margin-left: 2px;
  }
  span.active::after {
    content: '';
    width: 24px;
    height: 24px;
    transform: translate(-4px, -4px);
    display: inline-block;
    border-radius: 50%;
    border: 1px solid black;
    box-sizing: border-box;
  }
`;

const LengthLikelihoodBar = styled('div')<{ length_likelihood: number }>`
  width: ${ props => props.length_likelihood * 200 }px;
  height: 8px;
  border-radius: 4px;
  &:nth-child(2) {
    background: #1CB5D1;
  }
  background: rgba(0, 0, 0, 0.2);
  margin: 8px 0 8px 0;
  animation: ${ animations.scaleHorizontallyIn } 0.6s ease-in-out;
  transform-origin: center left;

  label {
    color: black;
    font-size: 12px;
    line-height: 12px;
    height: 12px;
    position: relative;
    left: ${ props => props.length_likelihood * 200 + 12 }px;
    top: -6px;
    overflow: visible;
    white-space: nowrap;
  }
  label:nth-child(2) {
    margin-left: 8px;
    color: rgba(0, 0, 0, 0.3);
    font-size: 10px;
  }
`;

const InventoryTable = styled('div')`
  display: flex;
  flex-wrap: wrap;
  animation: ${ animations.fadeIn } 0.3s ease-in;
  .inventory-row {
    width: 100%;
    display: flex;
    border: 1px solid #1CB5D1;
    margin-top: -1px;
    > div:not(:first-child) {
      width: 48px;
      min-width: 48px;
      height: 30px;
      line-height: 30px;
      text-align: center;
    }
    .inventory-row-width {
      background: #1CB5D1;
      color: white;
      width: 28px;
      height: 30px;
      line-height: 30px;
      text-align: center;
    }
  }
`;

const InventoryTableCell = styled('div')<{
  active?: boolean;
}>`
  background: ${ props => props.active ? 'rgba(0, 0, 0, 0.1)' : 'transparent' };
`;

const RecommendedTag = styled('div')`
  transform: translate(-25%, -50px);
  width: 88px;
  height: 20px;
  position: relative;
  background-color: black;
  color: #fff;
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
  border-radius: 2px;
  font-size: 9px;
  line-height: 20px;
  border-radius: 4px;
  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -4px;
    border-width: 4px;
    border-style: solid;
    border-color: black transparent transparent transparent;
  }
`;

const ColorSelect: React.FC<{
  colors: string[];
  selectedIndex: number;
  onSelectColor: (index: number) => void;
}> = (props) => {
  return (
    <ColorSelectGroup>
      {
        props.colors.map((color, i) => (
          <span
            key={ i }
            className={ i === props.selectedIndex ? 'active' : '' }
            style={{ backgroundColor: color }}
            onClick={ () => props.onSelectColor(i) }
          />
        ))
      }
    </ColorSelectGroup>
  );
};

const FitPreferenceRecommendation: React.FC<{
  recommendation: SizeRecommendation;
}> = ({ recommendation }) => {
  const sizes = React.useMemo(
    () => recommendation ? [
      recommendation.mostRecommendedIndex > 0 ?
        recommendation.sizes[recommendation.mostRecommendedIndex - 1] : null,
      recommendation.sizes[recommendation.mostRecommendedIndex],
      recommendation.mostRecommendedIndex < recommendation.sizes.length - 1 ?
        recommendation.sizes[recommendation.mostRecommendedIndex + 1] : null,
    ] : [],
    [recommendation],
  );

  return (
    <div>
      <h3>FIT PREFERENCE</h3>
      <div>
        {
          sizes.map((size, i) => size && (
            <LengthLikelihoodBar
              key={ i }
              length_likelihood={ Number(size.length_likelihood) }
            >
              <label>
                {
                  (i === 0 && 'smaller') ||
                  (i === 1 && `${size.length_label} ${normalizeShoeWidthLabel(size.width_label)}`) ||
                  (i === 2 && 'larger')
                }
              </label>
              <label>
                { (Number(size.length_likelihood) * 100).toFixed(1) }%
              </label>
            </LengthLikelihoodBar>
          ))
        }
        {
          !recommendation && <div>Recommendation unavailable</div>
        }
      </div>
    </div>
  );
};

const Inventory: React.FC<{
  recommended: SizeRecommendationData;
  sizeVariants: WidthSizeVariant[];
  selectedSize: { width_label: string; length_label: string };
  setSelectedSize: (size: { width_label: string; length_label: string }) => void;
}> = (props) => {
  const filterLengthVariants = React.useCallback(
    (lengthVariants: WidthSizeVariant['length_sizes']): WidthSizeVariant['length_sizes'] => {
      let indexOfRecommended = -1;
      lengthVariants.forEach((variant, i) => {
        if (variant.length_size < props.recommended?.length_size) {
          // In case the recommended size is among the inventory size range
          // but the exact size is not available
          indexOfRecommended = i + 0.5;
        } else if (variant.length_size === props.recommended?.length_size) {
          indexOfRecommended = i;
        }
      });
      if (indexOfRecommended < 2) {
        return lengthVariants.filter((v, i) => i < 5);
      }
      if (indexOfRecommended > lengthVariants.length - 3) {
        return lengthVariants.filter((v, i) => i >= lengthVariants.length - 5);
      }
      return lengthVariants.filter((v, i) => Math.abs(i - indexOfRecommended) <= 2);
    },
    [props.recommended, props.sizeVariants],
  );
  return (
    <div style={{ marginTop: 32 }}>
      <h3>INVENTORY</h3>
      <InventoryTable>
        {
          props.recommended && props.sizeVariants?.map(widthVariant => (
            <div className="inventory-row" key={ widthVariant.width_label }>
              <div className="inventory-row-width">
                { widthVariant.width_label }
              </div>
              { filterLengthVariants(widthVariant.length_sizes)?.map((lengthVariant) => {
                const recommended =
                  widthVariant.width_label === props.recommended.width_label &&
                  lengthVariant.length_label === props.recommended.length_label;
                const selected =
                  widthVariant.width_label === props.selectedSize?.width_label &&
                  lengthVariant.length_label === props.selectedSize?.length_label;
                return (
                  <InventoryTableCell
                    className={ recommended ? 'recommended' : null }
                    active={ selected }
                    key={ lengthVariant.length_label }
                    onClick={ () =>
                      props.setSelectedSize(selected ? null : {
                        width_label:  widthVariant.width_label,
                        length_label: lengthVariant.length_label,
                      },
                      ) }
                  >
                    { lengthVariant.length_label }
                    { recommended &&
                      <RecommendedTag>{ translate('lang_recommended') }</RecommendedTag>
                    }
                  </InventoryTableCell>
                );
              }) }
            </div>
          ))
        }
      </InventoryTable>
    </div>
  );
};

const ExpandedProductCard: React.FC<Props> = (props) => {
  const [recommendation, setRecommendation] = React.useState<SizeRecommendation>(null);
  const [selectedColorIndex, setSelectedColorIndex] = React.useState<number>(0);
  const [selectedSize, setSelectedSize] = React.useState<{
    width_label: string;
    length_label: string;
  }>(null);

  React.useEffect(
    () => {
      if (props.externalId && props.product) {
        const query_constraints = {
          external_id:  props.externalId,
          gender:       props.product.gender,
          gender_age:   props.product.gender_age,
          age_group:    props.product.age_group,
          brand:        props.product.brand.name,
          shoe_style:   props.product.name,
          width_label:  props.product.best_width,
          product_type: props.product.product_type,
        };
        getSizeRecommendation(query_constraints)
          .then((recommendation) => {
            // TODO(Hanyue): fit threshold handling
            const filteredRecommendation = recommendation.sizes.filter(
              size => props.product.color_size_variants.some(
                colorVariant => colorVariant.size_variants.some(
                  sizeVariant => sizeVariant.length_sizes.some(
                    lengthSize => size.length_label === lengthSize.length_label,
                  ))));
            const { sizes, mostRecommendedIndex } = getRecommendationSizes(
              filteredRecommendation,
              props.product.best_width,
            );
            setRecommendation({ ...recommendation, sizes, mostRecommendedIndex });
          }).catch((error) => {
            console.error(`Failed getting recommendation: ${error}`);
          });
      }
    },
    [props.externalId, props.product],
  );

  React.useEffect(
    () => {
      if (selectedSize && recommendation) {
        const selected: SizeRecommendationData = recommendation.sizes.find(
          size =>
            size.length_label === selectedSize.length_label &&
            size.width_label === selectedSize.width_label);
        if (selected) {
          const fitZoneClassifications = getFitZoneClassificationsFromBackendData(selected.fit_zones);
          props.resultsViewEventDispatch({
            type:    'update_fit_zones',
            payload: {
              fitZoneClassifications,
            },
          });
          return;
        }
      }
      props.resultsViewEventDispatch({
        type:    'update_fit_zones',
        payload: {
          fitZoneClassifications: props.product.fit,
        },
      });
    },
    [selectedSize, recommendation],
  );

  // sorted sizes with recommended Index.
  const getRecommendationSizes = React.useCallback(
    (
      recommendation: SizeRecommendationData[],
      bestWidth: string,
    ): {
      sizes: SizeRecommendationData[];
      mostRecommendedIndex: number;
    } => {
      const sizes = recommendation
        .filter(size => size.width_label === bestWidth)
        .sort((a, b) => a.length_size - b.length_size);
      let maxLengthLikelihood = sizes[0]?.length_likelihood;
      let recommendedIndex = 0;
      for (let i = 0; i < sizes.length; i += 1) {
        if (sizes[i].length_likelihood > maxLengthLikelihood) {
          maxLengthLikelihood = sizes[i].length_likelihood;
          recommendedIndex = i;
        }
      }
      return {
        sizes,
        mostRecommendedIndex: recommendedIndex,
      };
    },
    [],
  );

  const { width, height } = props.dimension;
  return (
    <StyledProductCard
      isExpandedCardAlignedWithSelection={ props.isExpandedCardAlignedWithSelection }
      expanded
      gridPosition={ props.gridPosition }
      style={{ width, height }}
    >
      <div
        onClick={ props.onToggle }
        style={{
          position: 'absolute',
          top:      7,
          right:    0,
          padding:  20,
          zIndex:   1,
        }}
      >
        <CloseIcon
          color="#333"
          thin
        />
      </div>
      <ProductBrandLogo
        src={ props.product.brand.color_image }
        className="brand-logo"
      />
      <ProductImage
        src={ props.product.color_size_variants[selectedColorIndex]?.fullsize_image }
        placeholder="/build/images/shoe_placeholder.svg"
        large
      />
      <ProductTitle large>{ props.product.name }</ProductTitle>
      <ProductCategory large>{ props.product.category }</ProductCategory>
      <ColorSelect
        colors={
          props.product.color_size_variants.map(
            colorVariant => colorVariant.top_colors?.length ? colorVariant.top_colors[0] : null) }
        selectedIndex={ selectedColorIndex || 0 }
        onSelectColor={ index => setSelectedColorIndex(index) }
      />
      <FitPreferenceRecommendation
        recommendation={ recommendation }
      />
      <Inventory
        sizeVariants={ props.product?.color_size_variants[selectedColorIndex].size_variants }
        recommended={ recommendation?.sizes[recommendation.mostRecommendedIndex] }
        selectedSize={ selectedSize }
        setSelectedSize={ setSelectedSize }
      />
    </StyledProductCard>
  );
};

const ProductCardMinimized: React.FC<Props> = (props) => {
  const { width, height } = props.dimension;
  const [isHighlighted, setIsHighlighted] = React.useState(false);

  React.useEffect(() => {
    if (props.expanded && !isHighlighted) {
      setIsHighlighted(true);
    }
    if (!props.expanded && isHighlighted) {
      setTimeout(() => {
        setIsHighlighted(false);
      }, props.isAnyCardExpanded ? 0 : 1500);
    }
  }, [props.expanded, props.isAnyCardExpanded]);

  return (
    <StyledProductCard
      expanded={ false }
      gridPosition={ props.gridPosition }
      style={{
        width,
        height,
        border: isHighlighted ? '#1CB5D1 2px solid' : 'none',
      }}
      onClick={ props.onToggle }
    >
      <ProductBrandLogo
        src={ props.product.brand.color_image }
        className="brand-logo"
      />
      <ProductImage
        src={ props.product.color_size_variants[0]?.fullsize_image }
        placeholder="/build/images/shoe_placeholder.svg"
      />
      <ProductTitle>
        { props.product.name }
      </ProductTitle>
      <ProductCategory>
        { props.product.category }
      </ProductCategory>
    </StyledProductCard>
  );
};

export const ProductCard: React.FC<Props> = (props) => {
  return (
    <>
      <ProductCardMinimized { ...props }/>
      { props.expanded &&
        <ExpandedProductCard
          { ...props }
          dimension={{
            width:  props.dimension.width * 2,
            height: 600,
            // height: (props.dimension.height + props.gridGap || 12) * 3 - props.gridGap || 12,
          }}
        />
      }
    </>
  );
};
