import { css } from 'emotion';
import * as React from 'react';

import { Button } from '@components/elements/button';

type FeetFeatureInfoPointsCanvasPositions =
  { [K in 'left' | 'right']: { [K in string]: { x: number; y: number }; }};

interface Props {
  feetFeatureNotes: string;
  feetFeatureInfoPointsCanvasPositions: FeetFeatureInfoPointsCanvasPositions;
  measurementType: string;
  visibility: { left: boolean; right: boolean };
  onNext: () => void;
  onPrevious: () => void;
  currentIndex: number;
  totalMeasurements: number;
  onFinish: () => void;
}

const CARD_LINE_LENGTH = 79;
const CARD_Y_OFFSET = -64;

const styles = {
  feetInfoCard: css`
    background: white;
    box-shadow: 0 1px 13px 1px #D1CDCD;
    border-radius: 6px;
    padding: 24px;
    color: black;
    width: 400px;
    min-height: 150px;
    z-index: 42;
  `,
  infoCardActions: css`
    display: flex;
    flex-wrap: nowarp;
    align-items: center;
    justify-content: space-between;
  `,
  infoCardButtons: css`
    display: flex;
    flex-wrap: nowarp;
    align-items: center;
    margin-right: 4px;
  `,
  infoCardProgressBar: css`
    display: flex;
    flex-wrap: nowarp;
    align-items: center;
    span {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 50%;
      width: 7px;
      height: 7px;
      margin-right: 5px;
      &.active {
        background: #1CB5D1;
      }
    }
  `,
  infoCardBackButton: css`
    color: black;
    padding: 8px 12px;
    margin-right: 8px;
  `,
  feetInfoCardLine: css`
    width: ${CARD_LINE_LENGTH}px;
    height: 0px;
    border-top: 1px dashed rgba(0, 0, 0, 0.4);
    z-index: 42;
  `,
};

const FeetInfoProgressBar: React.FC<{
  currentIndex: number;
  length: number;
}> = (props) => {
  return (
    <div className={ styles.infoCardProgressBar }>
      {
        Array(props.length).fill(null).map((v, index) => (
          <span
            key={ index }
            className={ index === props.currentIndex ? 'active' : '' }
          />
        ))
      }
    </div>
  );
};

const FeetInfoCard: React.FC<{
  feetFeatureNotes: string;
  position: { x: number; y: number };
  onNext: () => void;
  onPrevious: () => void;
  onFinish: () => void;
  currentIndex: number;
  totalMeasurements: number;
}> = (props) => {
  return (
    <div>
      <div
        className={ styles.feetInfoCardLine }
        style={{
          position: 'absolute',
          top:      props.position?.y,
          left:     props.position?.x,
        }}
      />
      <div
        className={ styles.feetInfoCard }
        style={{
          position: 'absolute',
          top:      (props.position?.y || 0) + CARD_Y_OFFSET,
          left:     (props.position?.x || 0) + CARD_LINE_LENGTH,
        }}
      >
        <p>
          { props.feetFeatureNotes }
        </p>
        <div className={ styles.infoCardActions }>
          <FeetInfoProgressBar
            currentIndex={ props.currentIndex }
            length={ props.totalMeasurements }
          />
          <div className={ styles.infoCardButtons }>
            {
              props.currentIndex > 0 && (
                <div
                  className={ styles.infoCardBackButton }
                  onClick={ props.onPrevious }
                >
                  BACK
                </div>
              )
            }
            <Button
              onClick={
                props.currentIndex < props.totalMeasurements - 1 ?
                  props.onNext : props.onFinish
              }
            >
              {
                props.currentIndex === props.totalMeasurements - 1 ?
                  'GO TO RECOMMENDATION' :
                  'NEXT'
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FeetFeatureInfoCard: React.FC<Props> = (props) => {
  if (!props.feetFeatureInfoPointsCanvasPositions) {
    return null;
  }
  return (
    <div>
      {
        ['left', 'right'].map(side => props.visibility && props.visibility[side] && (
          <FeetInfoCard
            key={ side }
            onNext={ props.onNext }
            onPrevious={ props.onPrevious }
            feetFeatureNotes={ props.feetFeatureNotes }
            position={ props.feetFeatureInfoPointsCanvasPositions[side][props.measurementType] || {} }
            currentIndex={ props.currentIndex }
            totalMeasurements={ props.totalMeasurements }
            onFinish={ props.onFinish }
          />
        ))
      }
    </div>
  );
};
