import { FitZoneClassifications, InsoleFitClassifications } from '@data/shoes';

interface ClickConfig {
  show_left_foot: boolean;
  show_right_foot: boolean;
  camera_view_name: CameraViewName;
  three_ruler_type: MeasurementId;
  colormode?: ColorMode;
}

export type ResultsViewEvent = {
  type: 'update_active_view';
  payload: 'footwear' | 'measurement';
} | {
  type: 'set_active_measurement';
  payload: {
    id: MeasurementId;
    clickConfig: ClickConfig;
    measurementNotes?: string;
  };
} | {
  type: 'update_fit_zones';
  payload: {
    fitZoneClassifications: FitZoneClassifications | InsoleFitClassifications;
  };
} | {
  type: `${'open' | 'close'}_footwear_filters`;
} | {
  type: `${'open' | 'close'}_backdrop`;
} | {
  type: 'restart_signup';
  payload: {
    url_prefix: string;
  };
};
