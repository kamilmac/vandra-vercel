import { css } from 'emotion';
import * as _ from 'lodash';
import * as React from 'react';

import { getReconstructionBlob } from '@data/reconstruction_blob';
import { measurementTypeFromId } from '@data/sizes';
import { getDeviceSpecs } from '@tools/device_specs';

import { FeetFeatureInfoCard } from './feetFeatureInfoCard';
import { FeetScan3DUserInterface } from './feetScanViewScene';
import { FeetScanVisualizationFitZones, FitZoneInfoPointsCanvasPositions } from './feetScanVisualizationFitZones';
import { DUMMY_MEASUREMENTS, getMeasurementIndex, getNextMeasurement, getPrevMeasurement } from './measurements';

const styles = {
  canvasContainer: css`
    height: calc(100vh - 85px);
    width: 120vw;
    position: absolute;
    left: -35%;
    overflow: visible;
  `,
  canvas: css`
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    overflow: visible;
  `,
};

export const FeetScanVisualization: React.FC<any> = (props) => {
  const UIRef = React.useRef<FeetScan3DUserInterface>(null);
  const [feetLoaded, setFeetLoaded] = React.useState<boolean>(false);
  const [feetAnchorsCanvasPositions, setFeetAnchorsCanvasPositions] =
    React.useState<FitZoneInfoPointsCanvasPositions>(null);

  React.useEffect(() => {
    const UI = new FeetScan3DUserInterface(
      'detailed',   // 'default'
      props.measurementDescriptions,
      false,
      getDeviceSpecs(),
      true,
    );
    UIRef.current = UI;
    getReconstructionBlob(props.externalId, 'mesh_lines_left.json')
      .then(() => {
        UI.renderFeet(props.externalId, () => {});
        setFeetLoaded(true);
        props.resultsViewEventDispatch({ type: 'on_three_ui_ready', payload: null });
      });
    return () => {
      UI.dispose();
    };
  }, []);

  React.useEffect(
    () => {
      if (feetLoaded) {
        const UI = UIRef.current;
        const colorModeUpdated = UI.getColorMode() !== props.colormode;
        if (props.colormode === 'fit_zones' && props.fitZoneClassifications) {
          UI.showFitZones(
            props.fitZoneClassifications,
            onOrbitControlsChange,
          );
        }
        if ((colorModeUpdated && props.colormode !== 'fit_zones') || !props.fitZoneClassifications) {
          UI.removeFitZones();
        }
      }
    },
    [props.colormode, props.fitZoneClassifications],
  );

  React.useEffect(
    () => {
      if (feetLoaded) {
        if (props.cameraViewName) {
          const UI = UIRef.current;
          UI.animateViewTo(props.cameraViewName);
        }
      }
    },
    [props.cameraViewName],
  );

  React.useEffect(
    () => {
      if (feetLoaded) {
        const UI = UIRef.current;
        if (props.threeRulerType) {
          UI.removeDescriptionsInMesh();
          UI.showDescriptionInMesh(props.threeRulerType, props.measurementNotes, onOrbitControlsChange);
        } else {
          UI.removeDescriptionsInMesh();
        }
      }
    },
    [props.threeRulerType],
  );

  const onOrbitControlsChange = React.useCallback((positions: FitZoneInfoPointsCanvasPositions) => {
    const UI = UIRef.current;
    if (UI) {
      setFeetAnchorsCanvasPositions(positions);
    }
  }, []);

  return (
    <div>
      { /* This element is needed to set the initial color of the wireframe */ }
      <div id="default-wireframe-color"/>
      <div id="default-meshlines-color"/>
      <div
        id="ground-pattern-color"
        style={{
          width:      0,
          height:     0,
          visibility: 'hidden',
          background: 'rgba(0, 153, 179, 0.4)',
        }}
      />
      <div id="measurement-visualization-line-color"/>
      <CanvasOverlay
        data={{
          mode:                   props.colormode,
          feetAnchorsCanvasPositions,
          fitZoneClassifications: props.fitZoneClassifications,
          measurementNotes:       props.measurementNotes,
          measurementId:          props.threeRulerType,
        }}
        onTouchStart={ props.onTouchStart }
        onTouchEnd={ props.onTouchEnd }
        resultsViewEventDispatch={ props.resultsViewEventDispatch }
      >
        <div
          className={ styles.canvas }
          id="canvas"
          data-test="canvas"
          onClick={ e => e.preventDefault() }
        />
      </CanvasOverlay>
    </div>
  );
};

const CanvasOverlay: React.FC<React.PropsWithChildren<{
  data: {
    mode: 'fit_zones' | 'measurement';
    feetAnchorsCanvasPositions: any;
    fitZoneClassifications?: any;
    measurementNotes?: string;
    measurementId?: MeasurementId;
  };
  onTouchStart: () => void;
  onTouchEnd: () => void;
  resultsViewEventDispatch: any;
  style?: React.CSSProperties;
}>> = props => (
  <div
    className={ styles.canvasContainer }
    style={ props.style }
    onTouchStart={ props.onTouchStart }
    onTouchEnd={ props.onTouchEnd }
    onClick={ e => e.preventDefault() }
  >
    { props.children }
    {
      props.data?.mode === 'fit_zones' &&
      <FeetScanVisualizationFitZones
        fitZoneInfoPointsCanvasPositions={ props.data.feetAnchorsCanvasPositions }
        fitZoneClassifications={ props.data.fitZoneClassifications }
        visibility={{ left: true, right: false }}
      />
    }
    {
      props.data?.mode === 'measurement' &&
      <FeetFeatureInfoCard
        feetFeatureInfoPointsCanvasPositions={ props.data.feetAnchorsCanvasPositions }
        feetFeatureNotes={ props.data.measurementNotes }
        visibility={{ left: true, right: false }}
        measurementType={ measurementTypeFromId(props.data.measurementId) }
        currentIndex={ getMeasurementIndex(props.data.measurementId) }
        totalMeasurements={ DUMMY_MEASUREMENTS.length }
        onNext={ () => {
          const measurement = getNextMeasurement(props.data.measurementId);
          props.resultsViewEventDispatch({
            type:    'set_active_measurement',
            payload: {
              id:               measurement.id,
              clickConfig:      measurement['clickConfig'],
              measurementNotes: measurement.measurementNotes,
            },
          });
        } }
        onPrevious={ () => {
          const measurement = getPrevMeasurement(props.data.measurementId);
          props.resultsViewEventDispatch({
            type:    'set_active_measurement',
            payload: {
              id:               measurement.id,
              clickConfig:      measurement['clickConfig'],
              measurementNotes: measurement.measurementNotes,
            },
          });
        } }
        onFinish={ () => {
          props.resultsViewEventDispatch({
            type:    'update_active_view',
            payload: 'footwear',
          });
          props.resultsViewEventDispatch({
            type: 'close_backdrop',
          });
        } }
      />
    }
  </div>
);
