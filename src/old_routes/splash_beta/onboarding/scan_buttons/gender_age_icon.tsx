import * as React from 'react';

import { ThemeStyled } from '@components/theme_styled';
import { translate } from '@data/translate';
import { isFastTesting } from '@tools/helpers';

interface Props {
  invert?: boolean;
  iconKey: 'male' | 'female' | 'child';
  selected?: boolean;
}

const Wrapper = ThemeStyled('div')<{
  invert?: boolean;
  selected?: boolean;
}>`
  .icon_gender {
    fill: ${ props =>
      props.invert ? (
        props.selected ?
          'white' : 'rgba(255, 255, 255, 0.5)'
      ) : (
        props.selected ?
          props.theme.button.primaryColor.background : 'rgba(0,0,0,0.2)'
      )};
    width: 60px;
  }
  p {
    margin-top: 10px;
    text-transform: uppercase;
    color: ${ props =>
    props.invert ? (
      props.selected ?
        'white' : 'rgba(255, 255, 255, 0.5)'
    ) : (
      props.selected ?
        props.theme.button.primaryColor.background : 'rgba(0,0,0,0.2)'
    )
};
  }
  transition: ${ isFastTesting() ? 'none' : 'all 0.2s ease-in-out' };
`;

export const GenderAgeIcon: React.FC<Props> = (props) => {
  switch (props.iconKey) {
    case 'male':
      return (
        <Wrapper selected={ props.selected } invert={ props.invert }>
          <IconMan />
          <p> { translate('lang_men') } </p>
        </Wrapper>
      );
    case 'female':
      return (
        <Wrapper selected={ props.selected } invert={ props.invert }>
          <IconWoman />
          <p> { translate('lang_women') } </p>
        </Wrapper>
      );
    case 'child':
      return (
        <Wrapper selected={ props.selected } invert={ props.invert }>
          <IconChildren />
          <p> { translate('lang_children') } </p>
        </Wrapper>
      );
    default:
      throw new Error(`Invalid iconKey: ${props.iconKey}`);
  }
};

/* eslint-disable max-len*/
const IconMan = () => (
  <svg width="60px" height="60px" viewBox="0 0 60 60">
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g className="icon_gender">
        <g id="man" transform="translate(21.000000, 8.000000)">
          <path d="M8.31521739,7.4766147 C10.3544255,7.48663697 12.0075699,5.81291759 12.0075699,3.73830735 C12.0075699,1.67371938 10.3544255,0 8.31521739,0 C6.27600932,0 4.62286491,1.67371938 4.62286491,3.73830735 C4.62286491,5.80289532 6.27600932,7.4766147 8.31521739,7.4766147 Z" id="Shape" />
          <path d="M12.0174689,8.31848552 L8.31521739,8.31848552 L4.61296584,8.31848552 C1.82142857,8.31848552 0,10.8040089 0,13.169265 L0,24.5545657 C0,26.7594655 3.06871118,26.7594655 3.06871118,24.5545657 L3.06871118,14.0311804 L3.66265528,14.0311804 L3.66265528,42.6547884 C3.66265528,45.701559 7.82026398,45.6013363 7.91925466,42.6547884 L7.91925466,26.1581292 L8.61218944,26.1581292 L8.71118012,26.1581292 L8.71118012,42.6648107 C8.87946429,45.7917595 12.9677795,45.4910913 12.9677795,42.6547884 L12.9677795,14.0311804 L13.4627329,14.0311804 L13.4627329,24.5545657 C13.4627329,26.7594655 16.6304348,26.7594655 16.6304348,24.5545657 L16.6304348,13.169265 C16.6304348,10.8140312 14.7991071,8.31848552 12.0174689,8.31848552 Z" id="Shape" />
        </g>
      </g>
    </g>
  </svg>
);

const IconWoman = () => (
  <svg width="60px" height="60px" viewBox="0 0 60 60">
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g className="icon_gender">
        <g id="woman" transform="translate(19.000000, 8.000000)">
          <path d="M3.10103627,11.76 L0.102007772,22.19 C-0.540641192,24.47 2.21356865,25.36 2.88681995,23.22 L5.56962435,13.6 L6.32448187,13.6 L1.71373057,30.5 L6.01845855,30.5 L6.01845855,43.2 C6.01845855,45.5 9.28270725,45.5 9.28270725,43.2 L9.28270725,30.5 L10.302785,30.5 L10.302785,43.2 C10.302785,45.5 13.4650259,45.5 13.4650259,43.2 L13.4650259,30.5 L17.8921632,30.5 L13.1794041,13.6 L14.0362694,13.6 L16.7190738,23.22 C17.3821244,25.41 20.1159326,24.47 19.503886,22.2 L16.5048575,11.76 C16.0968264,10.58 14.6483161,8.5 12.2205311,8.4 L7.39556347,8.4 C4.88617228,8.5 3.44786269,10.56 3.10103627,11.76 Z" id="Shape" />
          <path d="M13.5262306,3.82 C13.5262306,1.76 11.8533031,0.09 9.79274611,0.09 C7.73218912,0.09 6.05926166,1.76 6.05926166,3.82 C6.05926166,5.88 7.73218912,7.55 9.79274611,7.55 C11.8533031,7.55 13.5262306,5.88 13.5262306,3.82 Z" id="Shape" />
        </g>
      </g>
    </g>
  </svg>
);

const IconChildren = () => (
  <svg width="60px" height="60px" viewBox="0 0 60 60">
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g className="icon_gender">
        <g id="children" transform="translate(15.500000, 24.000000)">
          <path d="M6.30886076,18.2234568 L5.74177215,18.2234568 L5.74177215,18.545679 L5.74177215,27.5679012 C5.74177215,28.3555556 5.10379747,28.8925926 4.21772152,28.8925926 C3.43797468,28.8925926 2.83544304,28.4271605 2.8,27.782716 L2.8,27.4604938 L2.8,11.6358025 L2.8,11.2777778 L2.37468354,11.2777778 L2.37468354,11.6 L2.37468354,17.2925926 C2.37468354,17.937037 1.7721519,18.3308642 1.0278481,18.1876543 C0.567088608,18.0802469 0.248101266,17.7580247 0.248101266,17.2925926 L0.248101266,13.6765432 L0.248101266,10.7765432 C0.248101266,9.45185185 1.55949367,7.94814815 3.57974684,8.01975309 C5.21012658,8.05555556 6.87594937,8.01975309 8.50632911,8.01975309 C10.278481,8.01975309 11.7670886,9.20123457 11.7670886,10.7049383 L11.7670886,17.2567901 C11.7670886,17.8296296 11.3063291,18.2592593 10.6683544,18.2234568 C10.0303797,18.2234568 9.60506329,17.8296296 9.60506329,17.2567901 L9.60506329,11.6358025 L9.60506329,11.3135802 C9.49873418,11.3135802 9.39240506,11.3135802 9.25063291,11.2777778 L9.25063291,11.6716049 L9.25063291,27.6395062 C9.25063291,28.5703704 8.25822785,29.1432099 7.26582278,28.8567901 C6.66329114,28.6777778 6.30886076,28.2123457 6.30886076,27.6037037 L6.30886076,22.4481481 L6.30886076,18.545679 C6.30886076,18.4382716 6.30886076,18.3308642 6.30886076,18.2234568 Z" id="Shape" />
          <path d="M9.46329114,3.72345679 C9.4278481,5.62098765 7.93924051,7.08888889 6.06075949,7.08888889 C4.21772152,7.05308642 2.72911392,5.51358025 2.76455696,3.65185185 C2.8,1.75432099 4.28860759,0.286419753 6.23797468,0.322222222 C8.04556962,0.358024691 9.49873418,1.89753086 9.46329114,3.72345679 Z" id="Shape" />
          <path d="M23.9594937,10.991358 L23.3924051,10.991358 C24.4556962,14.2135802 25.4835443,17.4 26.5468354,20.6222222 L23.5696203,20.6222222 L23.5696203,20.9444444 L23.5696203,27.7469136 C23.5696203,27.8901235 23.5696203,28.0691358 23.4987342,28.2123457 C23.321519,28.6777778 22.8962025,28.8925926 22.364557,28.8209877 C21.9037975,28.7851852 21.5139241,28.4271605 21.478481,27.9975309 L21.478481,27.6395062 L21.478481,20.908642 L21.478481,20.5864198 L20.8050633,20.5864198 L20.8050633,20.908642 L20.8050633,27.782716 C20.8050633,28.3197531 20.4506329,28.7135802 19.9544304,28.7851852 C19.2101266,28.8925926 18.643038,28.4987654 18.643038,27.854321 L18.643038,25.491358 L18.643038,20.908642 L18.643038,20.5864198 L15.7367089,20.5864198 C16.764557,17.3641975 17.7924051,14.1419753 18.8202532,10.9555556 C18.3594937,10.8839506 18.3594937,10.8839506 18.2177215,11.2419753 C17.6506329,12.9246914 17.1189873,14.6074074 16.5518987,16.2901235 C16.4101266,16.6839506 16.1974684,17.0419753 15.6658228,17.0777778 C14.921519,17.1493827 14.3898734,16.5765432 14.6025316,15.8962963 C14.956962,14.8222222 15.3113924,13.7481481 15.6658228,12.6740741 C15.9848101,11.7432099 16.3037975,10.8481481 16.5873418,9.91728395 C16.9063291,8.95061728 18.1113924,7.87654321 19.7417722,7.94814815 C20.6278481,7.98395062 21.5493671,7.98395062 22.435443,7.94814815 C24.0658228,7.87654321 25.2708861,8.95061728 25.6253165,9.88148148 C26.3341772,11.8864198 26.9721519,13.891358 27.6455696,15.8962963 C27.8227848,16.4333333 27.5746835,16.8987654 27.078481,17.0777778 C26.5822785,17.2567901 26.0151899,17.0419753 25.8025316,16.5407407 C25.5898734,16.0395062 25.4481013,15.5740741 25.3063291,15.0728395 C24.8455696,13.7481481 24.4202532,12.3876543 23.9594937,10.991358 Z" id="Shape" />
          <path d="M24.1721519,3.68765432 C24.1721519,5.51358025 22.6481013,7.08888889 20.8759494,7.08888889 C19.1037975,7.08888889 17.5797468,5.51358025 17.5797468,3.68765432 C17.5797468,1.8617284 19.0683544,0.322222222 20.8405063,0.286419753 C22.6481013,0.286419753 24.1721519,1.82592593 24.1721519,3.68765432 Z" id="Shape" />
        </g>
      </g>
    </g>
  </svg>
);
/* eslint-enable max-len*/