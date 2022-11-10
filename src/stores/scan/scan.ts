import { config } from '@services/config';

// TODO(Hanyue): refactor camelcase
/* eslint-disable camelcase */
export const prepareScanEvent = (scanInput) => {
  const scanEvent = {
    event:      'start_scan',
    annotation: {
      chart_locale: config.chartLocale,
      chart_name:   config.chartName,
      language:     config.language,
      ui_chart_url: config.uiName,
      age_group:    scanInput.ageGroup,
      gender:       scanInput.gender,
    },
    full_scan:  true,
    led_colors: config.scannerLedColors,
  };
  return scanEvent;
};

export const fetchScanOutput = async (scanId: string) => {
  const [
    measurements,
    measurementDescriptions,
    scanClass,
    sizingData,
  ] = await Promise.all([
    getMeasurements(scanId),
    getMeasurementDescriptions(scanId),
    getScanClass(scanId),
    getSizingData(scanId),
  ]);
  const sizes = await applyChartParams(measurements, sizingData, scanClass);
  return {
    measurements,
    measurementDescriptions,
    scanClass,
    sizingData,
    ...sizes,
  };
};

export const applyChartParams = async (
  measurements,
  sizingData,
  scanClass,
  chartLocale?,
  gender?,
  ageGroup?,
) => {
  const populationName = getPopulationName(gender || sizingData.user_input.gender);
  const [
    sizes,
    compareToPopulation,
  ] = await Promise.all([
    getSizes(
      measurements,
      chartLocale || config.chartLocale,
      config.chartName,
      gender || sizingData.user_input.gender || null,
      ageGroup || sizingData.user_input.age_group || null,
    ),
    getCompareToPopulation(
      populationName,
      measurements,
      scanClass,
    ),
  ]);
  const relativeSizes = getRelativeSizes(compareToPopulation);
  return {
    sizes,
    populationName,
    compareToPopulation,
    relativeSizes,
  };
};

const getMeasurements = async (scanId) => {
  const response = await fetch(`/uploads/${scanId}/measurements.json`);
  const json = await response.json();
  return json.measurements;
};

const getMeasurementDescriptions = async (scanId) => {
  const response = await fetch(`/uploads/${scanId}/measurement_descriptions.json`);
  const json = await response.json();
  return json.descriptions;
};

const getScanClass = async (scanId) => {
  const response = await fetch(`/scan_class/${scanId}`);
  const scanClass = await response.text();
  return scanClass;
};

const getSizingData = async (scanId) => {
  const response = await fetch(`/sizing_data/${scanId}`);
  const sizingData = await response.json();
  return sizingData;
};

const getSizes = async (measurements, chartLocale, chartName, gender, ageGroup) => {
  const parameters = {
    measurement:    JSON.stringify(measurements),
    size_specifier: JSON.stringify({ chartLocale, gender, ageGroup }),
  };
  const response = await fetch(encodeQuery(`/lookup/${chartName}/`, parameters));
  const json = await response.json();
  return {
    shoeSize:  json.length,
    shoeWidth: json.width,
  };
};

const getPopulationName = (gender) => {
  let populationName = 'unisex';
  if (gender === 'men') { populationName = 'male'; }
  if (gender === 'women') { populationName = 'female'; }
  return populationName;
};

const getCompareToPopulation = async (population_name, measurements, scan_class) => {
  const response = await fetch(
    '/compare_to_population/',
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        population_name,
        measurements,
        scan_class,
      }),
    },
  );
  return response.json();
};

const getRelativeSizes = (data) => {
  const labels_short_medium_long: string[] = [
    'lang_short',
    'lang_medium',
    'lang_long',
  ];
  const labels_narrow_medium_wide: string[] = [
    'lang_narrow',
    'lang_medium',
    'lang_wide',
  ];
  const labels_low_medium_high: string[] = [
    'lang_low',
    'lang_medium',
    'lang_high',
  ];
  const labels_small_medium_large: string[] = [
    'lang_small',
    'lang_medium',
    'lang_large',
  ];
  const valueFromPopulation = (percentage: number) => (percentage / 100 * 3 - 0.5);
  const indexFromPopulation = (percentage: number) => {
    if (percentage >= 2 / 3 * 100) { return 2; }
    if (percentage >= 1 / 3 * 100) { return 1; }
    return 0;
  };
  const sizeFromPopulation = (percentage: number, labels: string[]): SingleSizeMeasurement => {
    const index = indexFromPopulation(percentage);
    const value = valueFromPopulation(percentage);
    const label = labels[index];
    return { index, value, label };
  };
  const labelsFromType = {
    ankle_wrap:       labels_short_medium_long,
    arch_height:      labels_low_medium_high,
    ball_girth:       labels_small_medium_large,
    forefoot_height:  labels_low_medium_high,
    heel_width:       labels_narrow_medium_wide,
    instep_girth:     labels_small_medium_large,
    instep_height:    labels_low_medium_high,
    length:           labels_short_medium_long,
    short_heel_girth: labels_small_medium_large,
    width:            labels_narrow_medium_wide,
  };
  return {
    relative_ankle_wrap: {
      left:   sizeFromPopulation(data.left.ankle_wrap, labelsFromType.ankle_wrap),
      right:  sizeFromPopulation(data.right.ankle_wrap, labelsFromType.ankle_wrap),
      labels: labelsFromType.ankle_wrap,
    },
    relative_arch_height: {
      left:   sizeFromPopulation(data.left.arch_height, labelsFromType.arch_height),
      right:  sizeFromPopulation(data.right.arch_height, labelsFromType.arch_height),
      labels: labelsFromType.arch_height,
    },
    relative_ball_girth: {
      left:   sizeFromPopulation(data.left.ball_girth, labelsFromType.ball_girth),
      right:  sizeFromPopulation(data.right.ball_girth, labelsFromType.ball_girth),
      labels: labelsFromType.ball_girth,
    },
    relative_forefoot_height: {
      left:   sizeFromPopulation(data.left.forefoot_height, labelsFromType.forefoot_height),
      right:  sizeFromPopulation(data.right.forefoot_height, labelsFromType.forefoot_height),
      labels: labelsFromType.forefoot_height,
    },
    relative_heel_width: {
      left:   sizeFromPopulation(data.left.heel_width, labelsFromType.heel_width),
      right:  sizeFromPopulation(data.right.heel_width, labelsFromType.heel_width),
      labels: labelsFromType.heel_width,
    },
    relative_instep_girth: {
      left:   sizeFromPopulation(data.left.instep_girth, labelsFromType.instep_girth),
      right:  sizeFromPopulation(data.right.instep_girth, labelsFromType.instep_girth),
      labels: labelsFromType.instep_girth,
    },
    relative_instep_height: {
      left:   sizeFromPopulation(data.left.instep_height, labelsFromType.instep_height),
      right:  sizeFromPopulation(data.right.instep_height, labelsFromType.instep_height),
      labels: labelsFromType.instep_height,
    },
    relative_length: {
      left:   sizeFromPopulation(data.left.length, labelsFromType.length),
      right:  sizeFromPopulation(data.right.length, labelsFromType.length),
      labels: labelsFromType.length,
    },
    relative_short_heel_girth: {
      left:   sizeFromPopulation(data.left.short_heel_girth, labelsFromType.short_heel_girth),
      right:  sizeFromPopulation(data.right.short_heel_girth, labelsFromType.short_heel_girth),
      labels: labelsFromType.short_heel_girth,
    },
    relative_width: {
      left:   sizeFromPopulation(data.left.width, labelsFromType.width),
      right:  sizeFromPopulation(data.right.width, labelsFromType.width),
      labels: labelsFromType.width,
    },
  };
};
