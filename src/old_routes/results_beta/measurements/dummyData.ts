import { clickConfigFromDataSource } from '@components/widgets/widget_helpers';

export const DUMMY_MEASUREMENTS = [
  {
    id:               'length',
    title:            'heel to toe length',
    subTitle:         'New Balance US',
    values:           ['10', '10.5', '11', '11.5', '12.0', '12.5'],
    active:           '10.5',
    leftDeviation:    -1,
    rightDeviation:   0,
    // eslint-disable-next-line max-len
    measurementNotes: 'Your feet might differ in size. So be sure to try the shoes on your bigger foot.',
  },
  {
    id:               'width',
    title:            'ball width',
    subTitle:         '',
    values:           ['B', 'C', 'D', 'E', '2', '3'],
    active:           'D',
    leftDeviation:    -0.2,
    rightDeviation:   -0.1,
    // eslint-disable-next-line max-len
    measurementNotes: 'Some shoes come in different width sizes. Check for the correct width when you try on shoes.',
  },
  {
    id:               'instep_height',
    title:            'instep height',
    subTitle:         'relative to population',
    values:           ['low', 'neutral', 'high'],
    active:           'neutral',
    leftDeviation:    -0.1,
    rightDeviation:   0.1,
    // eslint-disable-next-line max-len
    measurementNotes: 'Feet vary on height, that\'s why a lot of shoes have laces or elastic bands. Get shoes that fit your foot height.',
  },
  {
    id:               'heel_width',
    title:            'heel width',
    subTitle:         'relative to population',
    values:           ['narrow', 'medium', 'wide'],
    active:           'medium',
    leftDeviation:    0,
    rightDeviation:   -0.2,
    // eslint-disable-next-line max-len
    measurementNotes: 'Be mindful of how shoes fit around the heel. Some are wider others narrower and padded. Look for your best match.',
  },
];

DUMMY_MEASUREMENTS.forEach((measurement) => {
  const clickConfig = clickConfigFromDataSource(measurement.id as any);
  measurement['clickConfig'] = {
    showLeftFoot:   clickConfig?.show_left_foot,
    showRightFoot:  clickConfig?.show_right_foot,
    cameraViewName: clickConfig?.camera_view_name,
    threeRulerType: clickConfig?.three_ruler_type,
  };
});

export const getMeasurementIndex = (measurementId: string): number =>
  DUMMY_MEASUREMENTS.map(m => m.id).indexOf(measurementId);

export const getNextMeasurement = (measurementId: string) => {
  const currentIndex = getMeasurementIndex(measurementId);
  if (currentIndex < 0) {
    return null;
  }
  const nextIndex = (currentIndex < (DUMMY_MEASUREMENTS.length - 1)) ? currentIndex + 1 : 0;
  return DUMMY_MEASUREMENTS[nextIndex];
};

export const getPrevMeasurement = (measurementId: string) => {
  const currentIndex = getMeasurementIndex(measurementId);
  if (currentIndex < 0) {
    return null;
  }
  const prevIndex = currentIndex === 0 ? DUMMY_MEASUREMENTS.length - 1 : 0;
  return DUMMY_MEASUREMENTS[prevIndex];
};
