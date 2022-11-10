import { css } from 'emotion';
import * as React from 'react';

const styles = {
  ruler: css`
    margin-top: 50px;
    position: relative;
  `,
  rulerBox: css`
    background: #1CB5D1;
    color: #fff;
    text-transform: uppercase;
    line-height: 35px;
    text-align: center;
    display: inline-block;
  `,
};

export const BoxRuler: React.FC<any> = (props) => {
  const railWidth = 1000;
  const boxMargin = 1 / props.values.length * 6;
  const boxMarginSum = boxMargin * props.values.length * 2;
  const boxWidth = props.values.length > 3 ? 50 : 80;
  const fullBoxWidth = boxWidth * props.values.length + boxMarginSum;
  const fontSize = props.values.length > 3 ? 20 : 12;
  const fontWeight = props.values.length > 3 ? 'normal' : 'bold';

  // const activeIndex = props.values.indexOf(props.activeValue);

  return (
    <div
      className={ styles.ruler }
      style={{
        width: railWidth,
        left:  (props.cardWidth - fullBoxWidth) / 2,
      }}
    >
      {
        props.values.map((v, i) => (
          <div
            key={ i }
            style={{
              fontSize,
              fontWeight,
              marginLeft:  boxMargin,
              marginRight: boxMargin,
              width:       boxWidth,
              opacity:     v === props.activeValue ? 1 : 0.4,
            }}
            className={ styles.rulerBox }
          >
            { v }
            { v === props.activeValue &&
              <Indicator
                right
                deviation={ props.rightDeviation * boxWidth + boxWidth / 2 }
              />
            }
            { v === props.activeValue &&
              <Indicator
                left
                deviation={ props.leftDeviation * boxWidth + boxWidth / 2 }
              />
            }
          </div>
        ))
      }
    </div>
  );
};

const Indicator: React.FC<any> = (props) => {
  const fontSize = 10;
  return (
    <div
      style={{
        fontSize,
        position:   'absolute',
        color:      '#1CB5D1',
        marginTop:  props.right ? -8 : -60,
        marginLeft: (-fontSize / 2) + props.deviation,
      }}
    >
      { props.right ? '▲' : '▼' }
      <div
        style={{
          color:      'black',
          marginTop:  props.right ? -23 : -47,
          fontFamily: 'lato-bold',
          fontSize:   8,
        }}
      >
        { props.right ? 'RIGHT' : 'LEFT' }
      </div>
    </div>
  );
};
