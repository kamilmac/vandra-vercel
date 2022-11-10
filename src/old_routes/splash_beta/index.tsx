import { css, cx } from 'emotion';
import * as React from 'react';

import { Onboarding } from './onboarding';

const styles = {
  wrapper: css`
    background: white;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  `,
};

export const SplashBeta: React.FC<{}> = () => {
  return (
    <div className={ cx('splash', styles.wrapper) }>
      <Onboarding />
    </div>
  );
};
