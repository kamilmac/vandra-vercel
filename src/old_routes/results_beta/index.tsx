import { css, keyframes } from 'emotion';
import * as _ from 'lodash';
import * as React from 'react';

import { BackDrop } from '@components/elements/backdrop';
import { BasicViewData } from '@components/providers/basic_view_data_provider';
import { getResultsViewData, ResultsViewData } from '@data/view_data';
import { navigateTo } from '@tools/helpers';

import { FeetScanVisualization } from './feetScanVisualization';
import { Footwear } from './footwear';
import {
  FilterIcon,
  HeartIcon,
  HomeIcon,
  RescanIcon,
  SearchIcon,
} from './icons';
import { Measurements } from './measurements';
import { Tabs } from './tabs';
import { ResultsViewEvent } from './types';

const subHeaderEntry = keyframes`
  from {
    opacity 0;
    transform: translateY(-12px);
  }

  to {
    opacity 1;
    transform: translateY(0px);
  }
`;

const styles = {
  container: css`
    background: #F6F6F6;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    position: absolute;s
    font-family: 'lato-regular';
    overflow: hidden;
  `,
  header: css`
    height: 80px;
    background: white;
    display: flex;
    padding-top: 15px;
    border-bottom: 2px solid #F0F0F0;
    position: relative;
    z-index: 2;
  `,
  footwearSubHeader: css`
    height: 55px;
    width: 100%;
    position: absolute;
    z-index: 1;
    background: #fff;
    box-shadow: 0 1px 13px 1px #d1cdcd;
    animation: ${subHeaderEntry} 0.35s ease;
    animation-fill-mode: forwards;
  `,
  headerHome: css`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 20px;
  `,
  headerTabs: css`
    flex: 1;
    display: flex;
    align-items: center;
  `,
  rescanSection: css`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 18px;
  `,
  content: css`
    height: 100%;
  `,
  icon: css`
    height: 20px;
    width: 20px;
    margin: 15px;
  `,
  iconLarge: css`
    height: 27px;
    width: 27px;
    margin: 10px;
  `,
  headerAction: css`
    display: inline-flex;
    align-items: center;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 18px;
    font-size: 12px;
    margin-right: 18px;
    right: 0;
  `,
};

interface State {
  activeView: 'footwear' | 'measurement';
  activeMeasurement: string;
  backdropOn?: boolean;
  threeViewState: {
    showLeftFoot?: boolean;
    showRightFoot?: boolean;
    cameraViewName?: string;
    threeRulerType?: MeasurementId;
    colormode?: string;
    fitZones?: object;
    measurementNotes?: string;
  };
  footwearViewState: {
    showFilters: boolean;
  };
}

const resultsViewEventReducer = (
  state: State,
  action: ResultsViewEvent,
): State => {
  // console.log('Results view event dispatch', action);
  switch (action.type) {
    case 'update_active_view':
      return {
        ...state,
        activeView:     action.payload,
        threeViewState: {
          colormode:      'default',
          fitZones:       null,
          threeRulerType: null,
          cameraViewName: 'initial_beta',
          showLeftFoot:   true,
          showRightFoot:  true,
        },
      };
    case 'set_active_measurement':
      return {
        ...state,
        activeMeasurement: action.payload.id === state.activeMeasurement ? 'none' : action.payload.id,
        threeViewState:    {
          ...state.threeViewState,
          ...action.payload.clickConfig,
          colormode:        'measurement',
          measurementNotes: action.payload.measurementNotes,
        },
      };
    case 'update_fit_zones':
      return {
        ...state,
        threeViewState: {
          colormode: 'fit_zones',
          fitZones:  action.payload.fitZoneClassifications,
        },
      };
    case 'open_footwear_filters':
      return {
        ...state,
        footwearViewState: {
          showFilters: true,
        },
      };
    case 'close_footwear_filters':
      return {
        ...state,
        footwearViewState: {
          showFilters: false,
        },
      };
    case 'restart_signup':
      sessionStorage.removeItem('customer-name');
      sessionStorage.removeItem('customer-email');
      navigateTo(action.payload.url_prefix);
      return state;
    case 'open_backdrop':
      return {
        ...state,
        backdropOn: true,
      };
    case 'close_backdrop':
      return {
        ...state,
        backdropOn: false,
      };
    default:
      return state;
  }
};

const Header: React.FC<{
  activeView: State['activeView'];
  viewData: BasicViewData;
  resultsViewEventDispatch: React.Dispatch<ResultsViewEvent>;
}> = (props) => {
  return (
    <div
      className={ styles.header }
    >
      <div
        className={ styles.headerHome }
      >
        <div
          className={ styles.icon }
          onClick={ () => props.resultsViewEventDispatch({
            type:    'restart_signup',
            payload: {
              url_prefix: props.viewData.url_prefix,
            },
          }) }
        >
          <HomeIcon />
        </div>
        <div
          style={{
            fontSize: 12,
          }}
        >
          <div
            style={{
              fontWeight:    600,
              letterSpacing: 0.4,
            }}
          >
            { sessionStorage.getItem('customer-name') }
          </div>
          <div
            style={{
              opacity: 0.7,
            }}
          >
            { sessionStorage.getItem('customer-email') }
          </div>
        </div>
      </div>
      <div
        className={ styles.headerTabs }
      >
        <Tabs
          activeView={ props.activeView }
          onTabSwitch={
            tab => props.resultsViewEventDispatch({
              type:    'update_active_view',
              payload: tab,
            })
          }
        />
      </div>

      <div
        className={ styles.rescanSection }
        onClick={ () => navigateTo(props.viewData.url_prefix) }
      >
        <span
          style={{
            marginLeft: 8,
            fontSize:   12,
          }}
        >
          RESCAN
        </span>
        <div
          className={ styles.icon }
        >
          <RescanIcon />
        </div>
      </div>
    </div>
  );
};

const SubHeader: React.FC<{
  footwearViewState: State['footwearViewState'];
  activeView: 'footwear' | 'measurement';
  resultsViewEventDispatch: React.Dispatch<ResultsViewEvent>;
}> = (props) => {
  return (
    <div
      className={ styles.footwearSubHeader }
    >
      <div
        className={ styles.headerAction }
      >
        <div
          className={ styles.icon }
          onClick={ () => {
            const openOrClose = props.footwearViewState.showFilters ? 'close' : 'open';
            props.resultsViewEventDispatch({
              type: `${openOrClose}_footwear_filters`,
            } as ResultsViewEvent);
            props.resultsViewEventDispatch({
              type: openOrClose === 'open' ? 'open_backdrop' : 'close_backdrop',
            });
          } }
        >
          <FilterIcon />
        </div>
        <div
          className={ styles.icon }
        >
          <SearchIcon />
        </div>
        <div
          className={ styles.icon }
        >
          <HeartIcon />
        </div>
      </div>
    </div>
  );
};

export const ResultsBeta: React.FC<{
  basicViewData: BasicViewData;
}> = (props) => {
  const [state, resultsViewEventDispatch] = React.useReducer(
    resultsViewEventReducer,
    {
      activeView:        'footwear',
      activeMeasurement: 'none',
      threeViewState:    {
        colormode: 'default',
        fitZones:  null,
      },
      footwearViewState: {
        showFilters: false,
      },
    },
  );
  const [resultsViewData, setResultsViewData] = React.useState<ResultsViewData>(null);
  const [isInteractingWith3dFeetScan, setIsInteractingWith3dFeetScan] = React.useState<boolean>(false);

  React.useEffect(() => {
    getResultsViewData(props.basicViewData)
      .then((view_data) => {
        console.log('settings results view data', view_data);
        setResultsViewData(view_data);
      });
  }, []);

  return (
    <div
      className={ styles.container }
    >
      <BackDrop
        zIndex={ 3 }
        background="rgba(0, 0, 0, 0.2)"
        isOpen={ state.backdropOn }
        onClick={ () => resultsViewEventDispatch({ type: 'close_footwear_filters' }) }
      />

      <Header
        viewData={ props.basicViewData }
        activeView={ state.activeView }
        resultsViewEventDispatch={ resultsViewEventDispatch }
      />

      {
        state.activeView === 'footwear' &&
        <SubHeader
          footwearViewState={ state.footwearViewState }
          activeView={ state.activeView }
          resultsViewEventDispatch={ resultsViewEventDispatch }
        />
      }

      {
        resultsViewData &&
        <div
          className={ styles.content }
        >
          <FeetScanVisualization
            showLeftFoot={ state.threeViewState.showLeftFoot || true }
            showRightFoot={ state.threeViewState.showRightFoot || true }
            threeRulerType={ state.threeViewState.threeRulerType }
            cameraViewName={ state.threeViewState.cameraViewName }
            colormode={ state.threeViewState.colormode }
            measurementNotes={ state.threeViewState.measurementNotes }
            fitZoneClassifications={ state.threeViewState.fitZones }
            minimize={ false } // TODO(Hanyue): use "zoomScale"
            measurementDescriptions={ resultsViewData.measurement_descriptions }
            externalId={ resultsViewData.external_id }
            resultsViewEventDispatch={ resultsViewEventDispatch }
            onTouchStart={ () => setIsInteractingWith3dFeetScan(true) }
            onTouchEnd={ () => setIsInteractingWith3dFeetScan(false) }
          />
          {
            state.activeView === 'measurement' &&
            <Measurements
              isInteractingWith3dFeetScan={ isInteractingWith3dFeetScan }
              activeMeasurement={ state.activeMeasurement }
              resultsViewEventDispatch={ resultsViewEventDispatch }
            />
          }
          {
            state.activeView === 'footwear' &&
            <Footwear
              scanData={{
                externalId:     resultsViewData?.external_id,
                dataAnnotation: resultsViewData?.data_annotation,
                chartName:      props.basicViewData.chart_name,
                chartLocale:    props.basicViewData.chart_locale,
              }}
              showFilters={ state.footwearViewState.showFilters }
              resultsViewEventDispatch={ resultsViewEventDispatch }
            />
          }
        </div>
      }
    </div>
  );
};
