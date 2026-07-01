import React from 'react';
import './Faixa.css';

const Faixa = () => {
  const items = [
    { code: 'br', text: 'OLÁ' },
    { code: 'us', text: 'HELLO' },
    { code: 'it', text: 'CIAO' },
    { code: 'kr', text: '안녕' },
    { code: 'de', text: 'HALLO' },
    { code: 'in', text: 'नमस्ते' },
    { code: 'se', text: 'HEJ' },
    { code: 'jp', text: 'こんにちは' },
    { code: 'es', text: 'HOLA' },
    { code: 'fr', text: 'BONJOUR' },
  ];

  const repeatedItems = [...items, ...items, ...items];

  return (
    <div className="flag-strip-container">
      <div className="flag-track">
        {repeatedItems.map((item, index) => (
          <React.Fragment key={index}>
            <div className="flag-item">
              <img
                src={`https://flagcdn.com/w80/${item.code}.png`}
                width="28"
                alt={`Bandeira ${item.code}`}
                className="country-flag"
                loading="lazy"
              />
              <span className="greeting-text">{item.text}</span>
            </div>
            <span className="separator-dot"></span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Faixa;