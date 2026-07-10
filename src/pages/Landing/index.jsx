import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation('landing');

  // index.html só carrega o title/description em português (renderizado
  // estaticamente pelo Vite) — og:/twitter: ficam como estão de propósito,
  // pois crawlers de redes sociais não executam JS pra ler a versão traduzida.
  useEffect(() => {
    document.title = t('meta.title');

    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute('content', t('meta.description'));
    }
  }, [t, i18n.language]);

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

