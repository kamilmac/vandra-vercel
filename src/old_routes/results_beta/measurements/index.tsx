import { css, keyframes } from 'emotion';
import * as _ from 'lodash';
import * as React from 'react';

import { BoxRuler } from './boxRuler';
import { DUMMY_MEASUREMENTS } from './dummyData';

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

const styles = {
  measurements: css`
    position: absolute;
    width: 290px;
    height: 100%;
    top: 0;
    right: 0;
    display: grid;
    grid-template-columns: 1fr;
    grid-auto-rows: 194px;
    overflow-y: scroll;
    margin-right: 14px;
    padding-top: 95px;
    padding-left: 15px;
  `,
  measurementCard: css`
    height: 178px;
    background: white;
    place-self: center;
    border-radius: 8px;
    box-shadow: 0 1px 13px 1px #D1CDCD;
    overflow: hidden;
    animation: ${rotatetIn} 0.3s ease;
    animation-fill-mode: forwards;
    opacity: 0;
  `,
  measurementTitle: css`
    width: 100%;
    text-align: center;
    height: 25px;
    line-height: 25px;
    text-transform: uppercase;
    font-size: 18px;
    margin-top: 12px;
    font-family: 'lato-regular';
  `,
  measurementSubtitle: css`
    width: 100%;
    text-align: center;
    height: 20px;
    line-height: 20px;
    text-transform: uppercase;
    font-size: 12px;
    font-family: 'Gotham-Medium';
    opacity: 0.4;
  `,
};

export const Measurements: React.FC<any> = (props) => {
  return (
    <div
      className={ styles.measurements }
    >
      { DUMMY_MEASUREMENTS.map((m, i) => (
        <div
          key={ i }
          onClick={ () => {
            props.resultsViewEventDispatch({
              type:    'set_active_measurement',
              payload: {
                id:               m.id,
                clickConfig:      m['clickConfig'],
                measurementNotes: m.measurementNotes,
              },
            });
            props.resultsViewEventDispatch({
              type: 'open_backdrop',
            });
          } }
          style={{
            // opacity: props.activeMeasurement === m.id || props.activeMeasurement === 'none' ? 1 : 0.7,
            filter: props.activeMeasurement === m.id || props.activeMeasurement === 'none' ?
              'grayscale(0%)' : 'grayscale(70%)',
            transform:  props.activeMeasurement === m.id ? 'scale(1.05, 1.05)' : 'scale(1, 1)',
            transition: 'transform 0.2s, filter 0.2s',
          }}
        >
          <MeasurementCard
            active={ m.id === props.activeMeasurement }
            index={ i }
            title={ m.title }
            subTitle={ m.subTitle }
            values={ m.values }
            activeValue={ m.active }
            leftDeviation={ m.leftDeviation }
            rightDeviation={ m.rightDeviation }
          />
        </div>
      )) }
    </div>
  );
};

const MeasurementCard: React.FC<any> = (props) => {
  const CARD_WIDTH = 259;
  return (
    <div
      className={ styles.measurementCard }
      style={{
        width:          CARD_WIDTH,
        animationDelay: `${props.index * 0.05}s`,
      }}
    >
      <div
        className={ styles.measurementTitle }
      >
        { props.title }
      </div>
      <div
        className={ styles.measurementSubtitle }
      >
        { props.subTitle }
      </div>
      <BoxRuler
        values={ props.values }
        activeValue={ props.activeValue }
        leftDeviation={ props.leftDeviation }
        rightDeviation={ props.rightDeviation }
        cardWidth={ CARD_WIDTH }
      />
    </div>
  );
};

export { DUMMY_MEASUREMENTS };
export {
  getMeasurementIndex,
  getNextMeasurement,
  getPrevMeasurement,
} from './dummyData';
