import { css } from 'emotion';
import * as React from 'react';

import { Animation } from '@components/elements/animation';
import { Button } from '@components/elements/button';
import { ButtonRow } from '@components/elements/button/button_row';
import { translate } from '@data/translate';
import { getDescription } from '@tools/event_analysis';
import { isFastTesting } from '@tools/helpers';

/**
 * Scan buttons component with three icons and three buttons.
 */

const styles = {
  buttonsWrapper: css`
    display: flex;
    width: 100%;
    align-items: baseline;
    justify-content: space-evenly;
  `,
};

export interface ButtonDescription {
  action: ScanAction;
  icon?: string;
  title: TranslatableString;
}

interface Props {
  active_action: ScanAction;
  icons: boolean;
  buttons: ButtonDescription[];
  button_state: ButtonState;
  start_scan_event: (action: ScanAction) => void;
}

export const ScanButtonsMulti: React.FC<Props> = props => (
  <div
    style={{
      marginTop: -170,
    }}
  >
    <div>
      { translate('lang_start_scanning_for') }
    </div>
    <div
      className={ styles.buttonsWrapper }
    >
      { props.buttons.map((d, i) => (
        <Button
          main
          dataTest={ `btn_start_scan_${i}` }
          key={ i.toString() }
          disabled={
            (props.button_state === 'preparing' ||
            props.button_state === 'busy' ||
            props.button_state === 'disabled')
          }
          status={
            props.active_action === d.action &&
            (props.button_state === 'preparing' || props.button_state === 'busy') ?
              'loading' : 'normal'
          }
          statusMessage={
            d.action === props.active_action ?
              getDescription('scan', props.button_state) : null
          }
          name={ d.action }
          onClick={ () =>
            (
              isFastTesting() ||
              props.button_state !== 'disabled'
            ) &&
            props.start_scan_event(d.action)
          }
        >
          { translate(d.title) }
        </Button>
      )) }
    </div>
  </div>
);
