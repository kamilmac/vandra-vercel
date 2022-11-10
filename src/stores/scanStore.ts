import create from 'zustand';
import {
  applyChartParams,
  fetchScanOutput,
  prepareScanEvent,
} from './scan/scan';

const START_SCAN_URL = '/daemon/start_scan';

export const useScanStore = create((set, get) => ({
  scanId:     null,
  scanOutput: null,
  error:      null,
  status:     'idle',
  startScan:  async (scanAction) => {
    const ageGroup = scanAction === 'kids' ? 'kids' : 'adults';
    const gender = ageGroup === 'adults' ? scanAction : null;
    const scanEvent = prepareScanEvent({ ageGroup, gender });
    set({ status: 'scanning', error: null });
    try {
      const response = await fetch(START_SCAN_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(scanEvent),
      });
      const json = await response.json();
      get().fetchExistingScan(json.external_id);
    } catch (error) {
      set({ status: 'error', error });
    }
  },
  fetchExistingScan: async (scanId) => {
    set({ status: 'fetching', error: null });
    try {
      const scanOutput = await fetchScanOutput(scanId);
      set({ scanId, status: 'success', scanOutput });
    } catch (error) {
      set({ status: 'error', error });
    }
  },
  applyNewChartParams: async (chartLocale, gender, ageGroup) => {
    try {
      const { measurements, sizingData, scanClass } = get().scanOutput;
      const newSizes = await applyChartParams(measurements, sizingData, scanClass, chartLocale, gender, ageGroup);
      set({ scanOutput: { ...get().scanOutput, ...newSizes } });
    } catch (error) {
      set({ status: 'error', error });
    }
  },
  initStore: () => {
    set({
      scanId:     null,
      scanOutput: null,
      error:      null,
      status:     'idle',
    });
  },
}));
