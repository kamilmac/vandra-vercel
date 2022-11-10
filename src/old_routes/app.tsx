import * as _ from 'lodash';
import * as React from 'react';
import * as initReactFastclick from 'react-fastclick';
import { Route, Switch } from 'react-router';

import {
  BasicViewData,
  BasicViewDataContext,
} from '@components/providers/basic_view_data_provider';
import {
  initializeAnalytics,
  sendAnalyticsEventNewUserSession,
} from '@tools/analytics';
import {
  isInWebAppiOS,
} from '@tools/helpers';
import * as Zendesk from '@tools/zendesk_support';

import { ResultsBeta } from './routes/results_beta';
import { SplashBeta } from './routes/splash_beta';

!isInWebAppiOS() && initReactFastclick();

const withLangLocale = (url: string) => [
  `/:lang/:locale${url}`,
  `/:lang${url}`,
  url,
];

const getRouteComponents = (basicViewData: BasicViewData) => {
  return {
    '/results/:external_id': () => (
      typeof ResultsBeta !== 'undefined' ? (
        <ResultsBeta
          basicViewData={ basicViewData }
        />
      ) : null
    ),
    '/': () => (
      <SplashBeta />
    ),
  };
};

const App: React.FunctionComponent = () => {
  const basicViewData = React.useContext(BasicViewDataContext);
  const [mixpanelResolved, setMixpanelResolved] = React.useState(false);

  React.useEffect(
    () => {
      Zendesk.initZendesk();
    },
    [],
  );

  React.useEffect(
    () => {
      basicViewData.ready &&
      initializeAnalytics()
        .then(() => setMixpanelResolved(true))
        .then(sendAnalyticsEventNewUserSession)
        .catch((error) => {
          console.error('Mixpanel initialisation failed. ', error);
          setMixpanelResolved(true);
        });
    },
    [basicViewData.ready],
  );

  if (!mixpanelResolved) { return null; }

  return (
    <>
      <Switch>
        {
          Object.entries(getRouteComponents(basicViewData))
            .map(route =>
              <Route
                key={ route[0] }
                exact
                path={ withLangLocale(route[0]) }
                component={ route[1] }
              />,
            )
        }
      </Switch>
    </>
  );
};

export default App;
