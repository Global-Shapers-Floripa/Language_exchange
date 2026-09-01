# Language Exchange — Visão de Produto

Este documento explica **o que** a plataforma faz e **para quem**, sem entrar em detalhes de código. Se você vai mexer no código, veja também [ARQUITETURA.md](./ARQUITETURA.md).

---

## 0. Glossário rápido

Alguns termos aparecem várias vezes neste documento sem explicação — aqui está o significado de cada um, de forma direta:

- **Global Shapers** — uma iniciativa do Fórum Econômico Mundial que organiza "hubs" (grupos locais) de jovens líderes ao redor do mundo, cada hub ligado a uma cidade. O Language Exchange nasceu dentro do hub de Florianópolis.
- **Hub** — o grupo local de Global Shapers ao qual uma pessoa pertence (ex: "Florianópolis", "Lisboa", "Buenos Aires"). No perfil de cada usuário, o campo "hub" registra a qual hub do Global Shapers essa pessoa pertence — é usado tanto para mostrar de onde a pessoa é dentro da rede quanto, hoje, como um pequeno bônus no cálculo de compatibilidade (ver seção 3).
- **WeForum** — a rede social interna dos Global Shapers (não é uma rede pública tipo Instagram). O link do perfil WeForum, pedido no cadastro, ajuda o admin a confirmar que quem está se cadastrando é de fato um membro reconhecido da comunidade antes de aprovar a conta.
- **Match / compatibilidade** — a porcentagem calculada entre dois perfis com base nos idiomas que um fala e o outro quer aprender (e vice-versa). Não é uma medida de "quão bem vocês vão se dar", só de sobreposição de idiomas.
- **Sessão de prática** — um registro de que duas pessoas praticaram idiomas juntas (data, duração, idiomas praticados, uma nota opcional e, opcionalmente, uma foto como prova).
- **Sessão pública** — uma sessão de prática que, com a concordância das duas pessoas envolvidas, passa a aparecer no feed da Comunidade para todo mundo ver.
- **Badge** (conquista) — um selo visual que aparece no perfil de alguém no mural da Comunidade, ganho automaticamente ao atingir algum critério (ex: praticar em vários idiomas diferentes). Não dá nenhum benefício funcional — é só reconhecimento social.
- **Nomes dos badges ativos hoje**:
  - **Poliglota** — para quem já registrou sessões públicas em vários idiomas diferentes (tem níveis, quanto mais idiomas, mais alto o nível).
  - **Photo Memory** — para quem já registrou pelo menos uma sessão pública com foto.
  (Os demais nomes de badge que aparecem no mural — Praticante, Dedicação, Parceiro Fiel, Quebra-Gelo — ainda não têm lógica nenhuma por trás; veja a seção 5.)

---

## 1. O que é o Language Exchange

O Language Exchange é uma plataforma web para **conectar pessoas que querem praticar idiomas em conjunto** — cada uma ensina o idioma que fala e aprende o idioma que a outra fala. Não é uma escola de idiomas nem tem professores: é uma ferramenta de "match" entre pessoas com interesses linguísticos complementares, mais um jeito de registrar e mostrar essas trocas de prática.

### O problema que resolve

Dentro da comunidade de Global Shapers Florianópolis, várias pessoas queriam praticar idiomas (inglês, espanhol, francês etc.) trocando aulas informais umas com as outras, mas não havia um jeito organizado de:
- saber quem mais na comunidade fala o idioma que você quer aprender e quer aprender o idioma que você fala;
- entrar em contato com essa pessoa sem expor o e-mail/telefone de todo mundo publicamente;
- ter um registro simples das sessões de prática já feitas, e mostrar isso pra comunidade como incentivo.

### Para quem é

A plataforma é fechada — não é cadastro aberto para qualquer pessoa da internet. É pensada para **membros da comunidade Global Shapers Florianópolis** (ver glossário acima). Por isso, todo cadastro passa por **aprovação manual de um admin** antes da pessoa conseguir usar o app de verdade: isso funciona como uma checagem informal de "essa pessoa é realmente parte da comunidade?", já que não existe nenhuma verificação automática (tipo confirmação por domínio de e-mail corporativo) que garanta isso sozinha.

---

## 2. Papéis de usuário

### Usuário comum (aprovado)

Depois de aprovado, um usuário pode:
- editar seu perfil (idiomas que fala/aprende, país, hub, foto, interesses);
- ver a lista de parceiros sugeridos, ordenada por compatibilidade;
- enviar e receber solicitações de conexão;
- ver o contato (e-mail/telefone) de quem aceitou se conectar com ele;
- registrar sessões de prática, com ou sem foto;
- pedir para tornar uma sessão pública (sujeito à aprovação da outra pessoa envolvida);
- ver e curtir sessões públicas de outras pessoas no feed da Comunidade;
- ver o mural de badges da comunidade;
- ver estatísticas próprias no Dashboard (países com quem já praticou, tempo total, etc.).

### Admin

Um admin tem tudo que um usuário comum tem, mais acesso ao **Painel Admin** (`/admin`), de onde pode:
- ver a lista de contas pendentes de aprovação e aprová-las;
- ver todos os usuários cadastrados;
- excluir uma conta de usuário (ação irreversível, com confirmação explícita na tela);
- (indiretamente, fora do painel) decidir manualmente pedidos de sessão pública nunca é uma função de admin — essa decisão é sempre de quem participou da sessão como parceiro, não do admin.

**Como alguém vira admin hoje:** não existe nenhuma tela para "promover" um usuário a admin dentro do app. É uma coluna (`is_admin`) na tabela de perfis no banco de dados, alterada manualmente por quem já tem acesso ao banco (hoje, só a desenvolvedora do projeto). Se no futuro mais de uma pessoa precisar desse papel, essa promoção continua sendo uma operação de banco, não de interface — vale ter isso em mente para quem for dar suporte.

---

## 3. Jornada do usuário, passo a passo

**1. Cadastro (SignUp).**
A pessoa preenche um formulário (nome, e-mail, senha, hub, idiomas que fala/aprende, etc.) e aceita os termos. A conta é criada, mas fica marcada como **não aprovada**. Curiosidade técnica sem impacto pro usuário: tecnicamente a "sessão" de login já fica ativa por um instante no navegador assim que a conta é criada, mas o sistema desloga a pessoa imediatamente em seguida — então, na prática, ela não consegue entrar em nada antes de ser aprovada.

**2. Aguardando aprovação.**
Se a pessoa tentar fazer login antes de ser aprovada, ela é levada para uma tela de "aguardando aprovação" (e não consegue ver nada do app). Quando um admin aprova a conta, um e-mail automático avisa a pessoa.

**3. Login e primeiro acesso.**
Depois de aprovado, o login normal leva direto ao Dashboard (a página inicial autenticada, com um resumo de atividade: quantas sessões, quantos países diferentes, etc. — ainda meio vazio no início, claro).

**4. Montar o perfil.**
A pessoa preenche/edita seu perfil: idiomas que fala e idiomas que quer aprender, país, foto, uma breve descrição, interesses. Isso é o que alimenta o cálculo de match — sem preencher "idiomas que falo" e "idiomas que quero aprender", a pessoa não aparece bem posicionada (ou não aparece de forma útil) na busca de parceiros de ninguém.

**5. Buscar parceiros e entender o "% de match".**
Na página de Buscar Parceiros, a pessoa vê uma lista de outros usuários aprovados, ordenada por uma porcentagem de compatibilidade. Essa porcentagem soma, basicamente: se a outra pessoa fala algo que você quer aprender, e se ela quer aprender algo que você fala — cada uma dessas condições vale metade da nota — mais um pequeno bônus se vocês são do mesmo hub. Não considera nível de proficiência (alguém "iniciante" em inglês conta igual a alguém "fluente" para efeito de match).

**6. Enviar e aceitar conexão.**
A pessoa manda uma solicitação de conexão a alguém da lista. Se a outra pessoa também já tinha mandado uma solicitação (coincidência de interesse mútuo), o sistema já trata como aceito automaticamente, sem precisar de uma segunda ação. Caso contrário, a outra pessoa vê o pedido chegando e decide aceitar ou recusar.
- **Se aceito:** as duas passam a ver o e-mail/telefone uma da outra — antes disso, o contato fica escondido, mesmo que os perfis sejam públicos e visíveis.
- **Se recusado:** o pedido simplesmente desaparece da lista de pendências de quem enviou; não há uma notificação explícita de "seu pedido foi recusado" além de sumir da lista — quem enviou só percebe que não está mais pendente.

**7. Registrar uma sessão de prática.**
Depois de conectada com alguém, a pessoa pode registrar que praticou com aquele parceiro: data, duração, idiomas praticados, uma nota, e opcionalmente uma foto como prova. A sessão nasce **privada** — só quem registrou e o parceiro dela conseguem vê-la.

**8. Tornar a sessão pública.**
Quem registrou pode pedir para tornar aquela sessão pública. Isso não acontece na hora: um e-mail avisa o parceiro, que precisa aprovar o pedido explicitamente (ele é quem decide, não quem registrou a sessão). Só depois dessa aprovação a sessão passa a aparecer no feed da Comunidade. Se o parceiro recusar, a sessão continua privada — um e-mail avisa quem pediu sobre a decisão, seja ela qual for.

**9. Feed da Comunidade.**
Sessões públicas aparecem para todo mundo aprovado, com opção de curtir (❤️). Junto do feed, existe um mural de badges/conquistas, mostrando quem já atingiu certos marcos (ver seção 5).

### O que o usuário vê quando algo dá errado

Vale saber isso ao dar suporte, para diferenciar comportamento esperado de bug real:

- **Perfil incompleto (sem idiomas preenchidos):** a pessoa não trava em lugar nenhum, mas aparece mal posicionada (ou com match zerado/pouco útil) na lista de parceiros de todo mundo — não há um aviso explícito tipo "complete seu perfil para aparecer melhor".
- **Solicitação de conexão recusada:** quem enviou não recebe nenhuma notificação de recusa; o pedido só some da lista de "Enviadas" dele. Isso é esperado, não é bug.
- **Pedido de sessão pública recusado:** ao contrário da conexão, aqui *existe* um e-mail avisando quem pediu que foi recusado.
- **Tentativa de login sem estar aprovado ainda:** a pessoa é redirecionada para a tela de "aguardando aprovação" e deslogada — não é um erro de senha, é o comportamento esperado até um admin aprovar a conta.
- **Tentar acessar `/admin` sem ser admin:** a pessoa é redirecionada para fora, silenciosamente (sem mensagem de "acesso negado" explícita).
- **Sessão registrada não aparece no feed da Comunidade na hora, mesmo já aprovada:** pode ser só o cache de 5 minutos do feed ainda não ter expirado — não é necessariamente bug (ver gap conhecido na seção 6).

---

## 4. Funcionalidades hoje

- **Dashboard** — resumo de atividade: total de sessões, tempo praticado, quantos países diferentes já praticou com parceiros de lá, e um mapa/lista de bandeiras representando esse progresso.
- **Busca de parceiros e matching** — lista ordenada por compatibilidade de idiomas.
- **Conexões e privacidade de contato** — contato só visível depois de conexão aceita.
- **Sessões de prática** — privadas por padrão, com opção de foto.
- **Sessões públicas** — sujeitas a aprovação mútua, aparecem no feed.
- **Comunidade** — feed público de sessões, curtidas, mural de badges.
- **Perfil e foto** — edição com recorte/compressão de imagem antes de salvar.
- **Painel Admin** — aprovação de contas, exclusão de usuário.
- **Idiomas da interface** — a plataforma inteira (não o conteúdo dos perfis, mas os textos da interface) está disponível em português, inglês e espanhol, com troca em tempo real.
- **App instalável (PWA)** — o Language Exchange pode ser "instalado" no celular ou computador como se fosse um app nativo (ícone na tela inicial, abre em janela própria sem barra de navegador). Também funciona parcialmente offline: se a internet cair, a pessoa ainda consegue ver páginas já visitadas antes (o conteúdo dinâmico, tipo dados vindos do banco, não funciona offline — só a "casca" visual do app). Quando sai uma atualização nova do site, aparece um aviso perguntando se a pessoa quer atualizar o app instalado.

---

## 5. Sistema de badges — o que está ativo vs. planejado

Hoje, apenas **dois badges têm lógica funcionando de verdade**:

- **Poliglota** — ganho por praticar sessões públicas em vários idiomas diferentes; tem níveis (quanto mais idiomas diferentes, mais alto o nível do badge).
- **Photo Memory** — ganho por ter pelo menos uma sessão pública registrada com foto.

Os outros nomes de badge que já aparecem visualmente no mural da Comunidade — **Praticante**, **Dedicação**, **Parceiro Fiel**, **Quebra-Gelo** — **ainda não têm nenhuma lógica de avaliação implementada**. Existe até um rascunho de consulta ao banco para eles (uma migration marcada explicitamente como "proposta, não aplicar sem revisão", ainda não executada no banco), mas nada no código hoje calcula ou concede esses badges — eles ficam como "backlog" visual, não como feature funcionando. Se alguém perguntar por que aparecem no design mas ninguém nunca ganha, essa é a resposta.

---

## 6. Gaps conhecidos / o que falta

Estas são limitações conhecidas e intencionalmente deixadas de lado por ora (não são bugs escondidos):

- **Sem notificação de "match mútuo".** Se duas pessoas se conectam diretamente sem que uma tenha mandado pedido pra outra antes (ou seja, quando o sistema faz o auto-aceite por coincidência), ninguém recebe e-mail avisando. Só a interface, na próxima vez que a pessoa entrar, mostra a conexão já feita.
- **Feed da Comunidade não atualiza instantaneamente.** Depois que uma sessão pública é aprovada, ela pode demorar até 5 minutos para aparecer no feed de quem já tinha carregado a página antes, por causa de um cache (ver detalhes técnicos em ARQUITETURA.md). Recarregar a página resolve na hora.
- **Fotos em GIF nas sessões não são comprimidas.** Todas as outras fotos são comprimidas automaticamente antes de subir; GIFs sobem do tamanho original (para não perder a animação), respeitando só um limite máximo de tamanho de arquivo.
- **Fotos antigas órfãs.** Antes de uma correção aplicada, algumas fotos de sessão ficaram "penduradas" no armazenamento sem sessão associada (por falhas no meio do processo de salvar). Essas fotos antigas não foram limpas manualmente ainda — não afeta o funcionamento do app, só ocupa espaço de armazenamento.
- **Badges "wave 2" (Praticante, Dedicação, Parceiro Fiel, Quebra-Gelo)** — ver seção 5.

---

## 7. Cuidado para não confundir: nomes parecidos

- **`/partners` (Buscar Parceiros)** é sobre **parceiros de idioma** — a grade de pessoas com quem você pode praticar, ordenada por compatibilidade.
- **`/project-partners` (Parceiros do Projeto)** é uma página completamente diferente — sobre **apoiadores/parceiros institucionais do próprio projeto Language Exchange** (organizações, patrocinadores), não tem nada a ver com prática de idiomas.

Os nomes são parecidos de propósito só porque ambos usam a palavra "parceiro" em português, mas são conceitos e públicos totalmente diferentes.
