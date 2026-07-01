import React from 'react';
import HeroSection from './HeroSection';
import StepsSection from './StepsSection';
import AboutSection from './Sobre-projeto';
import Faixa from './Faixa';
import Resources from './ResourcesSection';
import Duvidas from './DuvidasSugestoes';
import FAQ from './FAQ';
import Footer from './Footer';

import './styles.css';

const Landing = () => {
  return (
    <div className="landing-page">
      <HeroSection />
      <Faixa />
      <AboutSection />
      <StepsSection />
      <Resources />
      <Faixa />
      <FAQ />
      <Faixa />
      <Duvidas />
      <Footer />
    </div>
  );
};

export default Landing;

