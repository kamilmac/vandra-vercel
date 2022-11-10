import * as React from 'react';

import { SplashButtonsConfig } from '@ui_configs/types';

import { ButtonDescription, ScanButtonsMulti } from './scan_buttons_multi';

export const ScanButtons: React.FC<{
  invert?: boolean;
  active_action: ScanAction;
  button_style: SplashButtonsConfig;
  button_state: ButtonState;
  start_scan_event: (action: ScanAction) => void;
}> = ({
  active_action,
  button_style,
  button_state,
  start_scan_event,
}) => {
  if (button_style === 'two') {
    const buttons: ButtonDescription[] = [
      {
        title:  'lang_scan_for_women',
        action: 'scan_female',
      },
      {
        title:  'lang_scan_for_men',
        action: 'scan_male',
      },
    ];
    return (
      <ScanButtonsMulti
        icons={ !!buttons[0].icon }
        buttons={ buttons }
        button_state={ button_state }
        start_scan_event={ start_scan_event }
        active_action={ active_action }
      />
    );
  }
  if (button_style === 'three') {
    const buttons: ButtonDescription[] = [
      {
        icon:   'icon_woman',
        title:  'lang_women',
        action: 'scan_female',
      },
      {
        icon:   'icon_man',
        title:  'lang_men',
        action: 'scan_male',
      },
      {
        icon:   'icon_children',
        title:  'lang_children',
        action: 'scan_children',
      },
    ];
    return (
      <ScanButtonsMulti
        icons={ !!buttons[0].icon }
        buttons={ buttons }
        button_state={ button_state }
        start_scan_event={ start_scan_event }
        active_action={ active_action }
      />
    );
  }
  if (button_style === 'player_goalie') {
    const buttons: ButtonDescription[] = [
      {
        title:  'lang_scan_for_player',
        action: 'scan_player',
      },
      {
        title:  'lang_scan_for_goalie',
        action: 'scan_goalie',
      },
    ];
    return (
      <ScanButtonsMulti
        icons={ !!buttons[0].icon }
        buttons={ buttons }
        button_state={ button_state }
        start_scan_event={ start_scan_event }
        active_action={ active_action }
      />
    );
  }
  const _exhaustiveCheck: never = button_style; // eslint-disable-line no-underscore-dangle,  @typescript-eslint/naming-convention, max-len
};
