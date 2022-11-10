import { withTheme } from 'emotion-theming';
import * as React from 'react';

import { Animation } from '@components/elements/animation';
import { SimpleSpinner } from '@components/elements/spinner';

const FeetSpinner = () => (
  <div className="fill_container flex_center">
    <SimpleSpinner color="gray" description={ null }/>
  </div>
);

interface Props {
  hide3d: boolean;
  feetLoading: boolean;
  onClick: () => void;
  className?: string;
  theme?: UiTheme;
}

const ThreeCanvasBase: React.FC<Props> = (props) => {
  return (
    <div className={ props.className }>
      { /* This element is needed to set the initial color of the wireframe */ }
      <div id="default-wireframe-color"/>
      <div id="default-meshlines-color"/>
      <div
        id="ground-pattern-color"
        style={{
          width:      0,
          height:     0,
          visibility: 'hidden',
          background: props.theme.feetScanView.groundPatternColor,
        }}
      />
      <div id="measurement-visualization-line-color"/>

      { props.feetLoading ? <FeetSpinner /> : null }

      <Animation.Fade hideContent={ props.hide3d || props.feetLoading }>
        <div
          id="canvas"
          data-test="canvas"
          className="fill_container"
          onClick={ props.onClick }
        />
      </Animation.Fade>
    </div>
  );
};

export const ThreeCanvas = withTheme<Props, UiTheme>(ThreeCanvasBase);
