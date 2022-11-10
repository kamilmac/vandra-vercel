import { css, keyframes } from 'emotion';
import * as React from 'react';

import { Button } from '@components/elements/button';
import { Input } from '@components/elements/input';
import { OnboardingAnimation } from '@components/elements/onboarding_animation';
import { SimpleSpinner, Spinner } from '@components/elements/spinner';
import { BasicViewDataContext } from '@components/providers/basic_view_data_provider';
import { ThreeCanvas } from '@components/three/three_canvas';
import { getDeviceSpecs } from '@tools/device_specs';
import { navigateTo } from '@tools/helpers';
import { startScan } from '@tools/start_scan';

import { OnBoarding3DUserInterface } from './onBoardingThreeView';
import { ScanButtons } from './scan_buttons';

const styles = {
  onboardingContainer: css`
    opacity: 1;
    z-index: 101;
    position: absolute;
    width: 390px;
    height: 650px;
    right: 0;
    overflow: hidden;
    padding: 10px;
    margin-top: 59px;
    margin-right: 17px;
    box-shadow: 0 1px 49px -9px #d1cdcd;
    border-radius: 10px;
    background: white;
    flex-direction: column;
    text-align: center;
  `,
  onboardingContainer2: css`
    opacity: 0;
    z-index: 100;
    position: absolute;
    width: 390px;
    height: 650px;
    right: 0;
    overflow: hidden;
    padding: 10px;
    margin-top: 59px;
    margin-right: 17px;
    box-shadow: 0 1px 49px -9px #d1cdcd;
    border-radius: 10px;
    background: white;
    display: flex;
    flex-direction: column;
    text-align: center;
  `,
  onboardingAnimation: css`
    transform: scale(0.72,0.72);
    margin-top: 50px;
    margin-bottom: -50px;
    margin-left: -25px;
    flex: 6;
  `,
  canvasContainer: css`
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  `,
  inputLabel: css`
    flex: 1;
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: -0.0px;
    font-weight: 600;
    color: #333;
    margin-top: 170px;
  `,
  emailInput: css`
    flex: 2;
  `,
  submitButton: css`
    flex: 2;
    margin: 0 auto;
    width: 92px;
  `,
  skipButton: css`
    flex: 2;
  `,
  ppLink: css`
    flex: 1;
    text-align: right;
    color: #999;
    font-weight: 800;
    text-transform: uppercase;
    font-size: 13px;
    margin-bottom: -11px;
    margin-right: 9px;
    position: absolute;
    bottom: 23px;
    right: 4px;
  `,
};

const rotatetIn = keyframes`
  0% {
    transform: perspective(800px) rotateX(0deg);
  }

  99% {
    transform: rotateX(180deg);
    opacity: 0;
  }

  100% {
    z-index: 100;
    transform: rotateX(180deg);
    opacity: 0;
  }
`;

const rotatetIn2 = keyframes`
  0% {
    transform: perspective(800px) rotateX(-180deg);
  }

  99% {
    transform: rotateX(0deg);
    opacity: 1;
  }

  100% {
    z-index: 101;
    transform: rotateX(0deg);
    opacity: 1;
  }
`;

type OnboardingStep = 'signup' | 'scan';

const OnboardingProfile: React.FC<{
  profile: {
    email: string;
    name: string;
  };
  onUpdate: (id: 'email' | 'name', value: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}> = (props) => {
  return (
    <>
      <div
        className={ styles.inputLabel }
      >
        Send my scan to:
      </div>
      <div
        className={ styles.emailInput }
      >
        <Input
          placeholder={ 'Name' }
          type="text"
          value={ props.profile.name }
          onChange={ value => props.onUpdate('name', value) }
          error={ null }
          errorMessage={ null }
          lightBackground
        />
        <Input
          placeholder={ 'Email' }
          type="email"
          value={ props.profile.email }
          onChange={ value => props.onUpdate('email', value) }
          error={ null }
          errorMessage={ null }
          lightBackground
        />
      </div>
      <div
        className={ styles.submitButton }
      >
        <Button
          main
          oneLine
          onClick={ () => props.onSubmit() }
        >
          SUBMIT
        </Button>
      </div>
      <div
        className={ styles.skipButton }
        onClick={ () => props.onSkip() }
      >
        SKIP
      </div>
      <div
        className={ styles.ppLink }
      >
        Privacy Policy
      </div>
    </>
  );
};

export const Onboarding: React.FC<any> = (props) => {
  const UIRef = React.useRef<OnBoarding3DUserInterface>(null);
  const basicViewData = React.useContext(BasicViewDataContext);

  const [feetLoaded, setFeetLoaded]  = React.useState<boolean>(false);
  const [activeStep, setActiveStep]  = React.useState<OnboardingStep>('signup');
  const [email, setEmail]       = React.useState<string>('');
  const [name, setName]        = React.useState<string>('');
  const [scanning, setScanning]    = React.useState<boolean>(false);
  const [scanAction, setScanAction]  = React.useState<ScanAction>('scan_male');
  const [buttonState, setButtonState] = React.useState<ButtonState>('idle');

  React.useEffect(() => {
    const UI = new OnBoarding3DUserInterface(
      'detailed',   // 'default'
      null,
      false,
      getDeviceSpecs(),
      true,
    );
    UI.renderPlaceholder().then(() => setFeetLoaded(true));
    UIRef.current = UI;
    return () => {
      UI.dispose();
    };
  }, []);

  const scanInitiated = React.useCallback((scanAction: ScanAction) => {
    setScanAction(scanAction);
    setScanning(true);
    setButtonState('preparing');
    const onSuccess = (response) => {
      setScanning(false);
      setButtonState('idle');
      navigateTo(`results/${response.external_id}/`);
    };
    const onError = () => {
      setScanning(false);
      setButtonState('idle');
    };
    startScan(
      'scan_male',
      basicViewData,
      null,
      null,
      onSuccess,
      onError,
    );
  }, [basicViewData]);

  const onProfileSubmit = React.useCallback(() => {
    sessionStorage.setItem('customer-name', name);
    sessionStorage.setItem('customer-email', email);
    setActiveStep('scan');
  }, [name, email]);

  const onProfileUpdate = React.useCallback((id: 'email' | 'name', value: string) => {
    if (id === 'email') {
      setEmail(value);
    }
    if (id === 'name') {
      setName(value);
    }
  }, []);

  return (
    <div>
      <div
        style={{
          opacity:  scanning ? 0.7 : 1,
          overflow: 'visible',
        }}
      >
        <ThreeCanvas
          hide3d={ false }
          feetLoading={ !feetLoaded }
          onClick={ () => null }
        />
      </div>
      {
        scanning ?
          <div
            style={{
              position: 'absolute',
              left:     253,
              top:      272,
            }}
          >
            <SimpleSpinner
              color={ 'white-bg' }
            />
          </div> : null
      }
      <div
        className={ styles.onboardingContainer }
        style={ activeStep === 'scan' ? {
          animation:         `${rotatetIn} 0.4s ease`,
          animationFillMode: 'forwards',
        } : null }
      >
        <OnboardingProfile
          profile={{ email, name }}
          onUpdate={ onProfileUpdate }
          onSubmit={ onProfileSubmit }
          onSkip={ () => setActiveStep('scan') }
        />
      </div>

      <div
        className={ styles.onboardingContainer2 }
        style={ activeStep === 'scan' ? {
          animation:         `${rotatetIn2} 0.4s ease`,
          animationFillMode: 'forwards',
        } : null }
      >
        <div
          className={ styles.onboardingAnimation }
        >
          <OnboardingAnimation
            lightBackground
            medium
          />
        </div>
        <div>
          <ScanButtons
            button_state={ buttonState }
            button_style={ 'three' }
            active_action={ scanAction }
            start_scan_event={ scanInitiated }
          />
        </div>
        <div
          className={ styles.ppLink }
        >
          Privacy Policy
        </div>
      </div>

    </div>
  );
};
