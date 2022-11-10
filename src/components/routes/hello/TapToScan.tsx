import { css } from 'emotion';
import * as React from 'react';
import { useProductsStore } from '/src/stores/productsStore';
import { useScanStore } from '/src/stores/scanStore';

const styles = {
  roundButton: css`
    width: 200px;
    height: 200px;
    background-color: grey;
    border: none;
    border-radius: 50%;
    color: white;
    padding: 20px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 24px;
    font-weight: 700;
    margin: 4px 2px;
    text-transform: uppercase;
  `,
};

const TapToScan: React.FC<{}> = () => {
  const { filters } = useProductsStore.getState() as { filters };
  const gender = filters.genderAge;

  const startScan = useScanStore(store => store.startScan);

  return (
    <div style={{
      display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
    }}
    >
      <button className={ styles.roundButton } onClick={ () => startScan(gender) }>Tap to scan</button>
    </div>
  );
};

export default TapToScan;
