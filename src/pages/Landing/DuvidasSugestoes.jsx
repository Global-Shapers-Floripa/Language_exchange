import React from "react";
import { Mail, MessageSquare, Send, Instagram, Linkedin } from "lucide-react";
import Swal from 'sweetalert2'; // Opcional: para um pop-up bonito
import "./duvidas-sugestoes.css";

const ContactSection = () => {

  const handleSubmit = async (event) => {
    event.preventDefault(); // Impede o redirecionamento para a página do Formspree
    const form = event.target;
    const data = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/xjgjenyo", {
        method: "POST",
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // Pop-up de sucesso
        Swal.fire({
          title: 'Enviado!',
          text: 'Sua mensagem foi entregue com sucesso.',
          icon: 'success',
          confirmButtonColor: '#1d4ed8'
        });

        form.reset(); // Limpa os campos do formulário
      } else {
        throw new Error();
      }
    } catch {
      Swal.fire({
        title: 'Erro!',
        text: 'Houve um problema ao enviar sua mensagem.',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    }
  };

  return (
    <section className="contact-section" id="contato">
      <div className="contact-container">
        <div className="contact-info">
          <h2 className="contact-title">
            <MessageSquare size={32} color="#34baf8" /> Entre em contato
          </h2>
          <p className="contact-description">
            Tem alguma dúvida sobre o Language Exchange ou quer saber mais sobre
            o Global Shapers? Mande uma mensagem!
          </p>

          <div className="info-items">
            <div className="info-item">
              <div className="info-icon"><Mail size={20} /></div>
              <div>
                <h4>E-mail</h4>
                <p>shapersfloripa@gmail.com</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon"><Instagram size={20} /></div>
              <div>
                <h4>Instagram</h4>
                <a href="https://instagram.com/globalshapersfloripa" target="_blank" rel="noopener noreferrer" className="info-link">
                  @globalshapersfloripa
                </a>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon"><Linkedin size={20} /></div>
              <div>
                <h4>LinkedIn</h4>
                <a href="https://linkedin.com/company/globalshapersfloripa" target="_blank" rel="noopener noreferrer" className="info-link">
                  Global Shapers Florianópolis
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-container">
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Nome</label>
              <input type="text" id="name" name="name" placeholder="Seu nome completo" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <input type="email" id="email" name="email" placeholder="seu@email.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="hub">Seu Hub</label>
                <input type="text" id="hub" name="hub" placeholder="Ex: Florianópolis Hub" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="message">Mensagem</label>
              <textarea id="message" name="message" rows="5" placeholder="Como podemos ajudar?" required></textarea>
            </div>

            <button type="submit" className="submit-button">
              Enviar Mensagem
              <Send size={18} style={{ marginLeft: "8px" }} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;