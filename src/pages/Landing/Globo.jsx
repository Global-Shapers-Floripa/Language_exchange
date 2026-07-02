import React, { useRef, useEffect, useState } from "react";
import Globe from "react-globe.gl";
import "./Globo.css"; 

const HeroGlobe = () => {
  const globeEl = useRef();
  
  // Estado que controla o tamanho dinâmico do globo
  const [globeSize, setGlobeSize] = useState(500);
  
  const flags = [
    { code: 'br' }, { code: 'us' }, { code: 'it' }, { code: 'kr' }, { code: 'de' },
    { code: 'in' }, { code: 'se' }, { code: 'jp' }, { code: 'es' }, { code: 'fr' },
    { code: 'cn' }, { code: 'gb' }, { code: 'ar' }, { code: 'mx' }, { code: 'ca' },
    { code: 'au' }, { code: 'za' }, { code: 'ru' }, { code: 'tr' }, { code: 'sa' },
    { code: 'pt' }, { code: 'nl' }, { code: 'ch' }, { code: 'no' }, { code: 'dk' }
  ];

  // Identifica o tamanho da tela em tempo real e muda o tamanho do globo
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setGlobeSize(280); // Tamanho ideal pro mobile
      } else if (window.innerWidth <= 1024) {
        setGlobeSize(400); // Tamanho ideal pro tablet
      } else {
        setGlobeSize(500); // Tamanho normal do desktop
      }
    };

    handleResize(); // Roda assim que a tela abre
    window.addEventListener("resize", handleResize); // Fica monitorando se a tela mudar
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // A distância das bandeiras agora se calcula sozinha: Raio do globo + 15px de distância
  const orbitRadius = (globeSize / 2) + -35;

  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.8;
      controls.enableZoom = false; 
      globeEl.current.pointOfView({ altitude: 2.2 });
    }
  }, []);

  return (
    <div className="hero-globe-wrapper">
      
      {/* O CINTURÃO CONTÍNUO */}
      <div className="flags-continuous-belt">
        {flags.map((item, index) => {
          const angle = (360 / flags.length) * index;
          return (
            <div
              key={index}
              className="belt-flag-positioner"
              style={{ transform: `rotate(${angle}deg) translateY(-${orbitRadius}px)` }}
            >
              <img
                src={`https://flagcdn.com/w80/${item.code}.png`}
                alt={`Bandeira ${item.code}`}
                className="belt-flag-img"
                loading="lazy"
              />
            </div>
          );
        })}
      </div>

      {/* O GLOBO 3D RECEBENDO O TAMANHO DINÂMICO */}
      <div className="globe-container" style={{ width: globeSize, height: globeSize }}>
        <Globe
          ref={globeEl}
          width={globeSize} 
          height={globeSize} 
          backgroundColor="rgba(0,0,0,0)" 
          showAtmosphere={true}
          atmosphereColor="#8fb0c9" 
          atmosphereAltitude={0.15}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg" 
        />
      </div>

    </div>
  );
};

export default HeroGlobe;