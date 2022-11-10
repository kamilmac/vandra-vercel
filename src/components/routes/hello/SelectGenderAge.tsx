import { css } from 'emotion';
import * as React from 'react';
import { useProductsStore } from '@stores/productsStore';

const styles = {
  container: css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: '#E5E5E5';
    width: 100vw;
    height: 100vh;
  `,
  title: css`
    font-size: 52px;
    margin-bottom: 20px;
  `,
  subTitle: css`
    font-size: 32px;
    margin-bottom: 30px;
  `,
  bold: css`
    font-weight: bold;
  `,
  buttonContainer: css`
    display: flex;
    justify-content: space-between;
    margin: 0 auto;
    width: 612px;
  `,
  button: css`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    border: 1px solid black;
    width: 280px;
    height: 80px;
    cursor: pointer;
    border-radius: 16px;
    padding-bottom: 50px;
  `,
  buttonTitle: css`
    font-size: 20px;
    line-height: 24px;
    padding-top: 48px;
    font-weight: 700;
  `,
};

interface ButtonDescription {
  title: string;
  action: string;
}

interface SelectGenderAgeProps {
  nextStep: () => void;
}

const SelectGenderAge: React.FC<SelectGenderAgeProps> = ({ nextStep }) => {
  const buttons: ButtonDescription[] = [
    {
      title:  "Women's",
      action: 'women',
    },
    {
      title:  "Men's",
      action: 'men',
    },
  ];

  return (
    <div className={ styles.container }>
      <div className={ styles.title }>Hello</div>
      <div className={ styles.subTitle }>
        What
        <span className={ styles.bold }> kind of shoes </span>
        are you looking for?
      </div>
      <div className={ styles.buttonContainer }>
        { buttons.map((d, i) => (
          <div
            className={ styles.button }
            key={ i }
            onClick={ () => {
              useProductsStore.setState({ filters: { genderAge: d.action } });
              nextStep();
            } }
          >
            <div className={ styles.buttonTitle }>
              { d.title }
            </div>
          </div>
        )) }
      </div>
    </div>
  );
};

export default SelectGenderAge;
