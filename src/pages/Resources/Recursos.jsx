import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Book, MessageCircle, Globe, Calendar, UserCheck, ExternalLink, X } from 'lucide-react';
import './recursos.css';

const Resources = () => {
  // Estado para controlar qual recurso está aberto no modal. null = fechado.
  const [selectedResource, setSelectedResource] = useState(null);

  const resourceList = [
    {
      title: "Guia de Boas Práticas",
      desc: "Como se comportar na primeira sessão e garantir um match saudável.",
      icon: <Book size={24} className="icon-blue" />,
      content: (
        <div className="modal-body-content">
          <h4>1. Respeito e Empatia</h4>
          <p>Lembre-se de que ambos estão vulneráveis aprendendo um novo idioma. Tenha paciência com os erros do seu parceiro e encoraje-o sempre.</p>
          
          <h4>2. Divisão de Tempo Justa (Regra dos 50/50)</h4>
          <p>Se a sessão dura 60 minutos, dedique exatos 30 minutos para cada idioma. Use um cronômetro se necessário para garantir que nenhum dos lados saia prejudicado.</p>
          
          <h4>3. Acordo de Correções</h4>
          <p>Logo nos primeiros minutos, pergunte: <em>"Como você prefere ser corrigido?"</em>. Algumas pessoas gostam de ser interrompidas na hora, outras preferem que você anote os erros e fale no final da frase.</p>
          
          <h4>4. Ambiente e Preparação</h4>
          <p>Procure um lugar silencioso, teste seu microfone antes e evite fazer outras atividades paralelas (como olhar o celular) durante a conversa.</p>
        </div>
      )
    },
    {
      title: "Quebra-gelos (Ice Breakers)",
      desc: "Mais de 50 perguntas para nunca deixar o assunto morrer.",
      icon: <MessageCircle size={24} className="icon-purple" />,
      content: (
        <div className="modal-body-content">
          <p>Deu aquele silêncio constrangedor? Use essas perguntas para reviver a conversa!</p>
          
          <h4>Viagens & Cultura</h4>
          <ul>
            <li>Se você pudesse se teletransportar para qualquer lugar do mundo agora, para onde iria?</li>
            <li>Qual é a comida mais "estranha" ou única do seu país que eu deveria provar?</li>
            <li>Existe algum feriado ou tradição na sua cultura que as pessoas de fora não conhecem?</li>
          </ul>

          <h4>Entretenimento & Lazer</h4>
          <ul>
            <li>Qual foi a última série ou filme que você assistiu em maratona?</li>
            <li>Qual livro ou filme mudou sua forma de ver o mundo?</li>
            <li>Se você tivesse que ouvir apenas um estilo musical para o resto da vida, qual seria?</li>
          </ul>

          <h4>Perguntas Incomuns</h4>
          <ul>
            <li>Se você pudesse ter qualquer superpoder, mas só pudesse usá-lo uma vez por mês, qual escolheria?</li>
            <li>Qual é um talento inútil que você tem e se orgulha?</li>
          </ul>
        </div>
      )
    },
    {
      title: "Toolkit de Tradução",
      desc: "Ferramentas recomendadas para usar durante a conversa.",
      icon: <Globe size={24} className="icon-green" />,
      content: (
        <div className="modal-body-content">
          <h4>1. DeepL Translator</h4>
          <p>Muitas vezes superior ao Google Tradutor para pegar as nuances e o tom correto da língua. Excelente para frases complexas.</p>
          
          <h4>2. Reverso Context</h4>
          <p>Perfeito para quando você sabe a palavra, mas não sabe como usá-la em uma frase. Ele mostra exemplos de traduções de documentos e legendas reais.</p>
          
          <h4>3. WordReference</h4>
          <p>O melhor dicionário de fórum online. Excelente para descobrir gírias, phrasal verbs e expressões idiomáticas que não têm tradução literal.</p>
          
          <h4>4. Ferramentas de Pronúncia (YouGlish)</h4>
          <p>Se você tem dúvida de como pronunciar algo, digite no YouGlish e ele buscará milhares de vídeos no YouTube com pessoas nativas falando aquela exata palavra no contexto.</p>
        </div>
      )
    },
    {
      title: "Agendamento Eficaz",
      desc: "Como lidar com diferentes fusos horários globalmente.",
      icon: <Calendar size={24} className="icon-orange" />,
      content: (
        <div className="modal-body-content">
          <h4>O Desafio do Fuso Horário</h4>
          <p>Agendar conversas com pessoas do outro lado do mundo exige organização. Use estas estratégias:</p>
          
          <h4>1. Use Ferramentas Visuais (World Time Buddy)</h4>
          <p>O <strong>World Time Buddy</strong> é um site gratuito onde você coloca a sua cidade e a cidade do seu parceiro. Ele cria uma tabela cruzada mostrando instantaneamente onde os horários de vocês coincidem (por exemplo, sua noite pode ser a manhã dele).</p>
          
          <h4>2. Envie Convites de Calendário</h4>
          <p>Sempre use o Google Calendar (ou similar) para criar o evento. O próprio Google fará a conversão do fuso horário automaticamente para os dois usuários e enviará um lembrete.</p>
          
          <h4>3. Padrão de Comunicação</h4>
          <p>Ao sugerir um horário no chat, especifique sempre o fuso ou a cidade para evitar confusões: <em>"Podemos falar às 14h (Horário de Brasília)?"</em> ou use o padrão UTC.</p>
        </div>
      )
    },
    {
      title: "Feedback e Evolução",
      desc: "Como dar feedback construtivo ao seu parceiro.",
      icon: <UserCheck size={24} className="icon-pink" />,
      content: (
        <div className="modal-body-content">
          <h4>A Técnica do Sanduíche</h4>
          <p>A melhor forma de corrigir alguém sem desmotivar é ensanduichar a correção entre dois elogios positivos:</p>
          <ul>
            <li><strong>Elogio (Pão):</strong> <em>"Seu vocabulário sobre esse assunto está muito bom!"</em></li>
            <li><strong>Correção (Recheio):</strong> <em>"Só notei um detalhe na conjugação deste verbo no passado, o certo seria..."</em></li>
            <li><strong>Elogio (Pão):</strong> <em>"Mas no geral, consegui te entender perfeitamente, sua pronúncia está ótima."</em></li>
          </ul>

          <h4>Foque nos Erros que Bloqueiam a Comunicação</h4>
          <p>Não tente corrigir todos os pequenos erros gramaticais. Foque em corrigir erros de pronúncia ou vocabulário que causem mal-entendidos reais ou alterem o sentido da frase.</p>
          
          <h4>Comemore Pequenas Vitórias</h4>
          <p>Lembre seu parceiro do quanto ele evoluiu desde a primeira sessão. Isso cria um laço de confiança gigantesco.</p>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="resources-header">
        <h2>Recursos & Guia</h2>
      </div>

      <div className="resources-grid">
        {resourceList.map((item, index) => (
          <div className="resource-card" key={index}>
            <div className="resource-icon-wrapper">
              {item.icon}
            <h3>{item.title}</h3>
            </div>
            <p>{item.desc}</p>
            {/* Trocado <a> por <button> para fins de acessibilidade e semântica */}
            <button 
              className="resource-link" 
              onClick={() => setSelectedResource(item)}
            >
              Acessar agora <ExternalLink size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* MODAL OVERLAY */}
      {selectedResource && (
        <div className="modal-overlay" onClick={() => setSelectedResource(null)}>
          {/* Para o clique no modal não fechar a tela (pois para no overlay) */}
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            <button className="modal-close" onClick={() => setSelectedResource(null)}>
              <X size={24} color="#64748b" />
            </button>

            <div className="modal-header">
              <div className="modal-icon-wrapper">
                {selectedResource.icon}
              </div>
              <h3>{selectedResource.title}</h3>
            </div>

            <div className="modal-body">
              {selectedResource.content}
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Resources;