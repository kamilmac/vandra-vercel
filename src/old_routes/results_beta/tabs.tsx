import { css } from 'emotion';
import * as React from 'react';

const styles = {
  tabs: css`
    display: flex;
    width: 280px;
    margin: auto;
    border: 1px solid #1CB5D1;
    border-radius: 4px;
    height: 32px;
    overflow: hidden;
    position: relative;
  `,
  tab: css`
    flex: 1;
    position: relative;
    text-align: center;
    line-height: 32px;
    font-size: 12px;
    color: #1CB5D1;
  `,
  highlight: css`
    transition: left 0.3s;
    transition-timing-function: ease-out;
  `,
};

export const Tabs: React.FC<any> = (props) => {
  return (
    <div
      className={ styles.tabs }
    >
      <div
        className={ styles.highlight }
        style={{
          background: '#1CB5D1',
          height:     32,
          width:      140,
          position:   'absolute',
          left:       props.activeView === 'footwear' ? 140 : 0,
        }}
      />
      <div
        className={ styles.tab }
        style={ props.activeView === 'measurement' ? {
          color: '#fff',
        } : {} }
        onClick={ () => props.onTabSwitch('measurement') }
      >
        MEASUREMENT
      </div>
      <div
        className={ styles.tab }
        style={ props.activeView === 'footwear' ? {
          color: '#fff',
        } : {} }
        onClick={ () => props.onTabSwitch('footwear') }
      >
        FOOTWEAR
      </div>
    </div>
  );
};
