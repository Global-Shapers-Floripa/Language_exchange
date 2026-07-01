import React from 'react';
import HeroSection from './HeroSection';
import StepsSection from './StepsSection';
import AboutSection from './Sobre-projeto';
import Faixa from './Faixa';
import Plataforma from './plataforma-site';
import Resources from './ResourcesSection';
import Duvidas from './DuvidasSugestoes';
import FAQ from './FAQ';
import CTA from './Cta';
import Footer from './Footer';

import './styles.css';

const Landing = () => {
  return (
    <div className="landing-page">
      <HeroSection />
      <Faixa />
      <AboutSection />
      <StepsSection />
      <Plataforma />
      <Resources />
      <Faixa />
      <FAQ />
      <Faixa />
      <Duvidas />
      <CTA />
      <Faixa />
      <Footer />
    </div>
  );
};

export default Landing;

