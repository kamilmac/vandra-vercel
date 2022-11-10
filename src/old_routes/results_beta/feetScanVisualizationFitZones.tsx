import * as _ from 'lodash';
import * as React from 'react';
import styled, { keyframes } from 'react-emotion';

const FIT_ZONE_INFO_CARD_SIZE = { width: 120, height: 60 };
const FIT_ZONE_INFO_CARD_LINE_LENGTH = {
  toe: 60, ball: 50, instep: 90, heel: 70,
};

const animations = {
  fadeScaleIn: keyframes`
    0% { opacity: 0; scale(1, 0.2); };
  `,
};

const getCardAnimation = (fitZone: FitZone): string => {
  const translateProperty = `translate(
    ${ -FIT_ZONE_INFO_CARD_SIZE.width * 0.5 }px,
    ${ -FIT_ZONE_INFO_CARD_LINE_LENGTH[fitZone] - FIT_ZONE_INFO_CARD_SIZE.height }px )`;
  const cardScaleIn = keyframes`
    0% {
      transform: ${ translateProperty } scale(0.7, 0.7);
      opacity: 0;
    }
    100% {
      transform: ${ translateProperty };
    }
  `;
  return `${cardScaleIn} 0.4s ease-in-out`;
};

const FitZoneInfoCardWrapper = styled('div')<{ canvasX: number; canvasY: number }>`
  transform: ${ props => `translate(${ props.canvasX }px, ${ props.canvasY }px)` };
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
`;

const FitZoneInfoCard = styled('div')<{ fitZone: FitZone }>`
  width: ${ FIT_ZONE_INFO_CARD_SIZE.width }px;
  height: ${ FIT_ZONE_INFO_CARD_SIZE.height }px;
  background: white;
  box-shadow: 0 1px 13px 1px #D1CDCD;
  border-radius: 6px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  p:nth-child(1) {
    font-size: 12px;
  }
  p:nth-child(2) {
    font-size: 16px;
    font-weight: bold;
  }
  transform: ${ props => `translate(
    ${ -FIT_ZONE_INFO_CARD_SIZE.width * 0.5 }px,
    ${ -FIT_ZONE_INFO_CARD_LINE_LENGTH[props.fitZone] - FIT_ZONE_INFO_CARD_SIZE.height }px )` };
`;

const FitZoneInfoCardLine = styled('div')<{ fitZone: FitZone }>`
  width: 0px;
  height: ${ props => FIT_ZONE_INFO_CARD_LINE_LENGTH[props.fitZone] }px;
  border-left: 1px dashed rgba(0, 0, 0, 0.4);
  transform: ${ props => `translate(
    0px,
    ${ -FIT_ZONE_INFO_CARD_LINE_LENGTH[props.fitZone] - FIT_ZONE_INFO_CARD_SIZE.height }px )` };
`;

type FitZone = 'toe' | 'ball' | 'instep' | 'heel';
type FitClassification = 'tight' | 'snug' | 'great' | 'roomy' | 'loose' | 'unknown';
export type FitZoneInfoPointsCanvasPositions =
  { [K in 'left' | 'right']: { [K in FitZone]: { x: number; y: number } } };

interface Props {
  fitZoneInfoPointsCanvasPositions: FitZoneInfoPointsCanvasPositions;
  fitZoneClassifications: Record<FitZone, FitClassification>;
  visibility: { left: boolean; right: boolean };
}

const FitZoneDescriptionCard: React.FC<{
  position: { x: number; y: number };
  fitZone: FitZone;
  description: string;
}> = (props) => {
  const [animation, setAnimation] = React.useState<boolean>(true);
  React.useEffect(
    _.debounce(() => {
      if (props.position) {
        setAnimation(true);
        setTimeout(() => setAnimation(false), 600);
      }
    }, 600, { leading: true, trailing: false }),
    [props.position],
  );

  if (!props.position) {
    return null;
  }

  return (
    <FitZoneInfoCardWrapper canvasX={ props.position?.x } canvasY={ props.position?.y }>
      <FitZoneInfoCard
        fitZone={ props.fitZone }
        style={ animation ? { animation: getCardAnimation(props.fitZone) } : {} }
      >
        <p>{ props.fitZone }</p>
        <p>{ props.description }</p>
      </FitZoneInfoCard>
      <FitZoneInfoCardLine
        fitZone={ props.fitZone }
        style={ animation ? { animation: `${ animations.fadeScaleIn } 0.4s ease-in-out` } : {} }
      />
    </FitZoneInfoCardWrapper>
  );
};

export const FeetScanVisualizationFitZones: React.FC<Props> = (props) => {
  if (!props.fitZoneInfoPointsCanvasPositions || !props.fitZoneClassifications) { return null; }
  return (
    <div className="feet-scan-visualization-fit-zones" onClick={ e => e.preventDefault() }>
      {
        ['left', 'right'].map(footSide => !props.visibility[footSide] ? null : (
          <div key={ footSide }>
            {
              Object.keys(props.fitZoneInfoPointsCanvasPositions[footSide])?.map((fitZone, i) => (
                <FitZoneDescriptionCard
                  key={ i }
                  position={ props.fitZoneInfoPointsCanvasPositions[footSide][fitZone] }
                  fitZone={ fitZone as FitZone }
                  description={ props.fitZoneClassifications[fitZone] }
                />
              ))
            }
          </div>
        ))
      }
    </div>
  );
};
