import { keyframes } from 'emotion';
import * as _ from 'lodash';
import * as React from 'react';
import styled from 'react-emotion';

import { Tag } from '@components/elements/tag';
import { CloseIcon } from '@components/icons';
import { normalizeGenderAge } from '@data/gender_age';
import { ExtendedProductData } from '@data/shoes';

import { FootwearViewEvent } from '.';

type FootwearFilterFunction = (product: ExtendedProductData) => boolean;
type FootwearFilters = Record<string, FootwearFilterFunction>;

interface Props {
  products: ExtendedProductData[];
  visible?: boolean;
  position?: { top?: number; left?: number; right?: number; bottom?: number };
  filters: FootwearFilters;
  onClose: () => void;
  footwearViewEventDispatch: React.Dispatch<FootwearViewEvent>;
}

const scaleIn = keyframes`
  from {
    transform: scale(0,0);
    opacity 0.1;
  }

  to {
    transform: scale(1,1);
    opacity 1;
  }
`;

const StyledFilters = styled('div')<Partial<Props>>`
  width: 420px;
  height: 560px;
  background: white;
  box-shadow: 0 1px 13px 1px rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  position: absolute;
  ${ props => Object.entries(props.position).map(([k, offset]) => offset && `${k}: ${offset}px;`).join(' ') }
  animation: ${scaleIn} 0.3s ease;
  transform-origin: 90% 0%;
  overflow: visible;
  z-index: 4;
  > div {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 36px 12px 48px 12px;
    overflow-y: scroll;
  }
  &::before {
    content: "";
    border-width: 31px;
    border-style: solid;
    border-color: transparent transparent white transparent;
    position: absolute;
    top: -44px;
    right: 12px;
  }
`;

const FilterSection = styled('div')`
  margin: 12px 0 12px 24px;
  h3 {
    margin: 12px 0 24px 0;
    font-size: 14px;
    font-weight: bold;
  }
`;

const StyledFilterClearButton = styled('button')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  position: absolute;
  right: 18px;
  bottom: 20px;
  background: transparent;
  font-size: 12px;
  svg {
    fill: #000;
    stroke: #000;
    width: 13px;
    margin-right: 12px;
    margin-top: 2px;
  }
  cursor: pointer;
  &:active {
    opacity: 0.6;
  }
`;

const StyledFilterApplyButton = styled('button')`
  background: #000;
  padding: 12px 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  position: absolute;
  left: 24px;
  bottom: 20px;
  font-weight: bold;
  &:active {
    opacity: 0.6;
  }
`;

const TagsFilter: React.FC<{
  type: 'genderAge' | 'category';
  title: string;
  options: { value: string; label?: string }[];
  tagsActiveState: Record<string, boolean>;
  onToggle: (value: string) => void;
}> = (props) => {
  return (
    <FilterSection>
      <h3>{ props.title }</h3>
      <div>
        {
          props.options?.map(option => (
            <Tag
              key={ option.value }
              title={ option.label || option.value }
              selected={ !!props.tagsActiveState[option.value] }
              onClick={ () => props.onToggle(option.value) }
              style={{ boxShadow: '0 1px 13px 1px rgba(0, 0, 0, 0.1)', border: 'none' }}
            />
          ))
        }
      </div>
    </FilterSection>
  );
};

const FiltersClearButton: React.FC<{
  onClick: () => void;
}> = (props) => {
  return (
    <StyledFilterClearButton onClick={ () => props.onClick() }>
      <div>
        <CloseIcon />
      </div>
      <div>CLEAR ALL</div>
    </StyledFilterClearButton>
  );
};

const FiltersApplyButton: React.FC<{
  onClick: () => void;
}> = (props) => {
  return (
    <StyledFilterApplyButton
      onClick={ () => props.onClick() }
    >
      APPLY CHANGES
    </StyledFilterApplyButton>
  );
};

export const FootwearFilters: React.FC<Props> = (props) => {
  const [genderAgeFilterState, setGenderAgeFilterState] = React.useState<Record<string, boolean>>({});
  const [categoryFilterState, setCategoryFilterState] = React.useState<Record<string, boolean>>({});

  const applyFilters = React.useCallback(() => {
    props.footwearViewEventDispatch({
      type:    'update_filters',
      payload: {
        genderAge:      getGenderAgeFilter(genderAgeFilterState),
        categoryFilter: getCategoryFilter(categoryFilterState),
      },
    });
    props.onClose();
  }, [genderAgeFilterState, categoryFilterState]);

  const clearFilters = React.useCallback(() => {
    setGenderAgeFilterState({});
    setCategoryFilterState({});
  }, []);

  const getGenderAgeFilter = React.useCallback((genderAgeFilterState: Record<string, boolean>) => {
    const genderAgeFilter = (product: ExtendedProductData): boolean => {
      if (product.gender === 'unisex') {
        return true;
      }
      if (!Object.values(genderAgeFilterState)?.some(v => !!v)) {
        return true;
      }
      const productGenderAge = normalizeGenderAge(product.gender, product.age_group);
      return !!genderAgeFilterState[productGenderAge];
    };
    return genderAgeFilter;
  }, []);

  const getCategoryFilter = React.useCallback((categoryFilterState: Record<string, boolean>) => {
    const categoryFilter = (product: ExtendedProductData): boolean => {
      if (Object.keys(categoryFilterState)?.length === 0) {
        return true;
      }
      return product.categories.some(category => !!categoryFilterState[category]);
    };
    return categoryFilter;
  }, []);

  const genderAgesOptions = React.useMemo(() => ([
    { value: 'male', label: 'men' },
    { value: 'female', label: 'women' },
    { value: 'kids', label: 'child' },
  ]), []);
  const categoriesOptions = React.useMemo(() => {
    if (props.products) {
      return _.uniq(_.flatten(props.products.map(product => product.categories || [])))
        .map(v => ({ value: v, label: v }));
    }
    return [];
  }, [props.products]);

  if (!props.visible) {
    return null;
  }
  return (
    <StyledFilters position={ props.position }>
      <div>
        <TagsFilter
          type="genderAge"
          title="GENDER"
          options={ genderAgesOptions }
          onToggle={ value =>
            setGenderAgeFilterState({ ...genderAgeFilterState, [value]: !genderAgeFilterState[value] }) }
          tagsActiveState={ genderAgeFilterState }
        />
        <TagsFilter
          type="category"
          title="FEATURES"
          options={ categoriesOptions }
          onToggle={ value =>
            setCategoryFilterState({ ...categoryFilterState, [value]: !categoryFilterState[value] }) }
          tagsActiveState={ categoryFilterState }
        />
        <FiltersApplyButton onClick={ applyFilters } />
        <FiltersClearButton onClick={ clearFilters } />
      </div>
    </StyledFilters>
  );
};
