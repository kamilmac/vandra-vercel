import create from 'zustand';
import { getAvailableProducts } from './products/products';
import { useScanStore } from './scanStore';

export const useProductsStore = create((set, get) => ({
  products:         [],
  filteredProducts: [],
  filters:          [
    {
      name:  'removeAshpaltCategory',
      props: {
        enabled: true,
      },
    },
    {
      name:  'genderAge',
      props: {
        value: null,
      },
    },
  ],
  status:        'idle',
  error:         null,
  fetchProducts: async () => {
    set({ status: 'fetching', error: null });
    try {
      const scanOutput = useScanStore.getState().scanOutput;
      const scanId = useScanStore.getState().scanId;
      const products = await getAvailableProducts(scanId, scanOutput.populationName, 'adults');
      set({
        products,
        filteredProducts: applyFilters(get().filters, products),
        status:           'success',
      });
    } catch (error) {
      set({ status: 'error', error });
    }
  },
  updateFilter: (name, newProps) => {
    const filters = get().filters;
    const index = filters.findIndex(f => f.name === name);
    if (index === -1) { return; }
    filters[index].props = {
      ...filters[index].props,
      ...newProps,
    };
    set({
      filters,
      filteredProducts: applyFilters(filters, get().products),
    });
  },
}));

const applyFilters = (filters, products) => {
  let filteredProducts = products;
  filters.forEach((filter) => {
    filteredProducts = filterFunctions[filter.name](filter.props, filteredProducts);
  });
  return filteredProducts;
};

const filterFunctions = {
  removeAshpaltCategory: (props, products) => {
    if (!props.enabled) { return products; }
    return products.filter(p => p.category !== 'asphalt');
  },
};
