import * as React from 'react';
import SelectGenderAge from './hello/SelectGenderAge';
import TapToScan from './hello/TapToScan';

export const Home = () => {
  const [step, setStep] = React.useState(1);

  const nextStep = () => {
    setStep(step + 1);
  };

  return (
    <div>
      {
        (() => {
          switch (step) {
            case 1:
              return (
                <SelectGenderAge nextStep={ nextStep } />
              );
            case 2:
              return (
                <TapToScan />
              );
            default:
              return null;
          }
        })()
      }
    </div>
  );
};
