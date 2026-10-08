# Language Exchange — Arquitetura Técnica

Este documento é para quem vai mexer no código. Ele assume que você já leu [PRODUTO.md](./PRODUTO.md) para entender o que a plataforma faz — aqui é sobre **como** ela é construída e **por quê**.

Este documento (assim como o CLAUDE.md na raiz do repo) foi escrito com apoio de IA a partir da leitura do código real em setembro de 2026. Se algo aqui parecer desatualizado no futuro, o código sempre vence — trate este documento como um mapa, não como a fonte de verdade absoluta.

---

## 1. Visão geral da stack e por quê

- **React 19 + Vite** — front-end, sem framework CSS (CSS puro por componente/página).
- **react-router-dom v7** — roteamento, definido como lista flat em `src/App.jsx` (sem arquivo de configuração de rotas separado — `src/routes/index.jsx` existe mas está vazio e não é usado).
- **Supabase** — Postgres + Auth + Storage + Edge Functions, como **backend único**. Não existe um servidor próprio (Node/Express/etc.) rodando em algum lugar — o front-end conversa direto com o Supabase.
- **`lucide-react`** (ícones), **`sweetalert2`** (diálogos/alertas), **`react-globe.gl`** (o globo 3D da landing page), **`react-easy-crop`** (recorte de foto de perfil), **`react-markdown`** (renderiza a política de privacidade em Markdown), **`i18next`/`react-i18next`/`i18next-browser-languagedetector`** (internacionalização), **`@vercel/analytics`** (analytics da Vercel).

### Por que Supabase como backend único

Para um projeto mantido por uma única pessoa não-desenvolvedora profissional, manter um backend próprio (servidor, deploy, escalonamento, patches de segurança) é um custo de manutenção alto. O Supabase entrega banco de dados, autenticação, armazenamento de arquivos e um jeito de rodar código server-side (Edge Functions) sem precisar administrar servidor nenhum — o trade-off é ficar mais dependente das convenções e limitações da plataforma (por exemplo, a lógica de segurança de "quem pode ver o quê" precisa morar em regras de banco — RLS, ver seção 5 — em vez de em código de um servidor próprio).

### Por que não há uma state library (Redux, Zustand, etc.) nem Context para autenticação

Cada página/hook que precisa saber quem é o usuário logado chama `supabase.auth.getUser()` e busca a própria linha da tabela `profiles` diretamente, em vez de ler de um estado global compartilhado. Isso significa mais chamadas repetidas ao Supabase do que o estritamente necessário, mas evita a complexidade de sincronizar um estado global — numa aplicação deste tamanho, sem múltiplas partes da tela precisando reagir simultaneamente a mudanças de usuário, o ganho de uma state library não compensaria a complexidade extra. O único cache que existe (`src/hooks/useCache.js`) é uma otimização pontual para reduzir consultas repetidas ao trocar de página, não uma arquitetura de estado global — ver seção 6.

### Por que não há uma camada de serviço/API formal

A maioria das páginas e hooks chama `supabase.from(...)` diretamente, sem passar por um repositório ou camada de abstração. As únicas exceções são `src/services/supabaseClient.js` (o cliente Supabase singleton) e `src/services/matchService.js` (a lógica de cálculo de compatibilidade) e `src/services/badgeService.js` (lógica de badges). Para um projeto deste porte, introduzir uma camada de abstração adicional multiplicaria arquivos sem eliminar complexidade real — o Supabase já *é* a camada de acesso a dados. Se o projeto crescer bastante (mais telas reutilizando as mesmas consultas complexas), pode valer revisitar essa decisão.

### PWA (Progressive Web App)

O app é instalável e funciona parcialmente offline, via `vite-plugin-pwa` (que gera um Service Worker usando Workbox por baixo dos panos). A estratégia de cache é deliberada, não automática:

- **Chamadas ao Supabase → nunca cacheadas** (`NetworkOnly`). Dados dinâmicos (perfis, sessões, conexões) sempre vêm da rede; nunca mostra dado desatualizado como se fosse atual.
- **Navegação/HTML → `NetworkFirst` com fallback offline.** Tenta buscar a versão mais nova da página; se não houver rede, mostra a última versão em cache (com uma tela de fallback).
- **Assets com hash no nome (JS/CSS gerados pelo build) → `CacheFirst`.** Como o nome do arquivo muda a cada build (o hash é diferente), é seguro servir do cache sem risco de mostrar uma versão velha — um arquivo com hash novo é, por definição, um arquivo diferente.

O registro do Service Worker é manual (não automático), e há um componente próprio (`UpdatePrompt.jsx`) que detecta quando existe uma versão mais nova do app publicada e pergunta ao usuário (via SweetAlert2) se ele quer atualizar.

---

## 2. Como rodar o projeto do zero

### Pré-requisitos

- Node.js instalado (versão compatível com Vite/React 19 — use uma versão LTS recente).
- Uma conta e projeto no Supabase (para rodar contra um banco próprio, ou credenciais de um projeto Supabase existente).

### Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```
VITE_SUPABASE_URL=<url do seu projeto Supabase>
VITE_SUPABASE_ANON_KEY=<chave anônima/pública do projeto>
```

O cliente Supabase (`src/services/supabaseClient.js`) **lança um erro assim que o app carrega** se qualquer uma dessas variáveis estiver faltando — então um `.env` ausente ou incompleto quebra o app inteiro imediatamente, o que é intencional (falhar rápido e visivelmente, em vez de deixar o app rodar parcialmente quebrado).

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento do Vite |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Serve o build de produção localmente, para conferir antes de publicar |
| `npm run lint` | Roda o ESLint (config em `eslint.config.js`) |
| `npm run test:e2e` | Roda os testes end-to-end com Playwright |

### Rodando os testes E2E

Os testes E2E (`tests/e2e/`) precisam de credenciais reais de login contra um projeto Supabase de verdade (não são mockados). Passos:

1. Copie `.env.test.example` para `.env.test` e preencha `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD`.
2. **Essa conta precisa ser uma conta de teste dedicada, já aprovada (`is_approved = true`) — nunca uma conta de usuário real.** O `.env.test.example` já reforça isso em comentário.
3. Rode `E2E_TEST_DATA_SETUP.sql` (na raiz do repo) contra o banco de teste — ele prepara os dados que os testes esperam encontrar: preenche idiomas da conta de teste principal, cria/configura uma segunda conta fixa "E2E Test Partner" (com `hub = 'E2E-TEST'`) e já cria uma conexão aceita entre as duas.

Contas com `hub = 'E2E-TEST'` são filtradas/escondidas em várias consultas de produção (busca de parceiros, mural de badges, painel Admin) para que dados de teste nunca apareçam misturados com usuários reais — exceto para o e-mail da desenvolvedora do projeto, que continua vendo essas contas no Admin para poder depurar os testes.

### Edge Functions

As Edge Functions (`supabase/functions/`, runtime Deno) **não fazem parte do build do Vite** — são deployadas separadamente via Supabase CLI, direto para o projeto Supabase. A função `send-email` precisa do secret `RESEND_API_KEY` configurado no projeto Supabase (não no `.env` do front-end) para conseguir enviar e-mails via Resend.

---

## 3. Fluxo de trabalho / convenções de contribuição

- **Nunca commitar direto na `main`**, nem para ajustes pequenos de UI, a menos que combinado o contrário. O fluxo padrão é: **branch de feature → teste manual → merge para `main`**.
- **Mudanças que tocam o banco de dados** (alteração de schema, política de RLS, função `SECURITY DEFINER`) **ou Edge Functions** devem ser propostas como plano e discutidas antes de serem executadas. Não existe uma suíte de testes automatizados cobrindo o banco além dos E2E do Playwright (que cobrem só alguns fluxos de UI, não o schema/RLS em si) — então mudanças de banco são as mais difíceis de reverter com segurança, e merecem mais cautela que uma mudança de front-end.
- Ajustes visuais/CSS são feitos direto no código, sem verificação automatizada por screenshot — se uma mudança visual precisar de confirmação, o caminho é perguntar/mostrar antes de aplicar, não instalar ferramentas de automação de navegador para tirar prints. (Playwright é usado *só* para testes E2E funcionais — login, cadastro, recuperação de senha etc. — não para conferir visual.)

---

## 4. Estrutura de pastas

```
src/
  pages/<Feature>/       Uma pasta por rota/funcionalidade — componente JSX + CSS próprio
  components/common/     Widgets reutilizáveis (modais, selects, PersonAvatar)
  components/layout/     DashboardLayout — casca (sidebar + header) de toda página autenticada
  hooks/                 Hooks de acesso a dados (usePartners, useSessions, etc.) — ver seção 5/6
  services/              supabaseClient.js, matchService.js, badgeService.js
  constants/             Dados estáticos (países, idiomas, interesses, badges)
  utils/                 securityUtils.js (validação/rate-limit client-side), countryFlag.js, imageResize.js
  i18n/                  Configuração i18next + arquivos de tradução por idioma/namespace
  legal/                 Política de privacidade em Markdown, por idioma

supabase/
  functions/             Edge Functions (Deno) — deployadas separadamente
  migrations/            Migrations SQL tracked (histórico parcial — ver seção 5)

<raiz do repo>
  *.sql                  Scripts SQL aplicados manualmente via SQL Editor do Supabase, documentados
                          depois (não fazem parte do histórico de migrations tracked)
tests/e2e/                Testes Playwright
```

**`src/components/common/PersonAvatar.jsx`** merece nota especial: é o único lugar onde a foto de uma pessoa deve ser renderizada em todo o app (mostra `photo_url` se existir, ou um avatar gerado deterministicamente a partir do ID do usuário, caso contrário). Toda tela que mostra avatar (grade de parceiros, cabeçalho, tabela de admin, editor de perfil, listas de conexões) passa por esse componente — uma mudança futura de estilo de avatar toca um arquivo só, não seis.

---

## 5. Modelo de dados

**Nota importante antes de começar:** boa parte do schema deste projeto **não tem migration versionada** — várias tabelas (incluindo a própria `profiles`, a mais central de todas) foram criadas manualmente pelo SQL Editor do Supabase, sem nenhum script correspondente salvo no repositório. Isso não é bagunça ou descuido atual: é o histórico real do projeto, que começou antes de existir uma pasta `supabase/migrations/` com disciplina de versionamento. A pasta `supabase/migrations/` existe e é usada desde julho de 2026 (começando pela migration que fechou uma brecha de segurança em `profiles`) — mudanças de schema/RLS novas devem ir lá, não como mais um `.sql` solto na raiz. O schema de `profiles` abaixo foi **inferido a partir do código** que a referencia (hooks, RLS policies, migrations que alteram colunas dela), não copiado de um script de criação — porque esse script nunca existiu no repo.

### `profiles`

Tabela central, referenciada por quase tudo. Colunas conhecidas (inferidas): `id` (ligada a `auth.users`), `full_name`, `hub`, `description`, `country`, `speaks`, `learns`, `interests` (todas essas três como strings separadas por vírgula, não arrays — ver seção 9), `photo_url`, `is_approved` (bool), `is_admin` (bool), `preferred_language` (`pt`/`en`/`es`, default `en` — adicionada em 2026-07-14 para os e-mails transacionais saberem em que idioma escrever; o default é inglês, não português, por decisão de produto explícita registrada na migration). As colunas `email`/`phone` existiram nesta tabela no passado e foram removidas (ver `profile_contacts` abaixo).

RLS de `profiles` hoje: SELECT liberado para o dono da linha, para admins, ou para qualquer perfil com `is_approved = true` (antes de 2026-07-10, era liberado para qualquer um, aprovado ou não — brecha fechada na migration `enforce_approval_gate_rls`). UPDATE é restrito por coluna: usuários autenticados só podem alterar as colunas "normais" de perfil (`full_name, country, description, speaks, learns, interests, photo_url, updated_at`) — não podem, via API direta, alterar `is_admin` ou `is_approved` de si mesmos (isso era possível antes de 2026-07-04, uma brecha de escalonamento de privilégio já corrigida). Aprovar um usuário ou torná-lo admin exige uma função `SECURITY DEFINER` própria, chamável só por quem já é admin.

### `sessions`

Registro de uma sessão de prática. Colunas: `id`, `user_id` (→ `auth.users`, quem registrou), `partner_id` (→ `profiles`, com quem praticou), `date`, `duration` (minutos, default 60), `languages`, `status`, `notes`, `session_photo_url`, `created_at`, `updated_at`.

`status` começou como um campo sem uso real e foi reaproveitado depois (migration `sessions_public_visibility`) com o vocabulário: `privada` (default) → `pendente_aprovacao` (pedido de tornar pública, aguardando o parceiro) → `publica`. RLS de SELECT: dono da sessão, o parceiro dela, ou qualquer um se `status = 'publica'`. A transição `pendente_aprovacao → publica/privada` não é feita por UPDATE direto (o parceiro não tem permissão de UPDATE na linha inteira via RLS) — é feita pela função `SECURITY DEFINER` `approve_public_session(session_id, decision)`, que só permite a alteração se quem está chamando for de fato o `partner_id` daquela sessão e ela estiver `pendente_aprovacao`.

### `connection_requests`

Pedido de conexão entre dois perfis. Colunas: `sender_id`, `receiver_id` (ambos → `profiles`), `status` (`pendente`/`aceito`/`rejeitado`). RLS de INSERT exige que **tanto quem envia quanto quem recebe** estejam com `is_approved = true` (fechado junto da brecha de `profiles` em 2026-07-10 — antes, um usuário não aprovado conseguia mandar pedido para alguém aprovado). Políticas de DELETE (cancelar pedido enviado, ou rejeitar recebido) foram adicionadas depois da criação da tabela — sem elas, um DELETE bloqueado por RLS "funcionava" sem erro na tela mas não apagava a linha de verdade (ver nota sobre isso na seção 9, é um padrão recorrente no projeto).

### `profile_contacts`

Guarda `email` e `phone` **separados** de `profiles`. Motivo: `profiles` precisa ter SELECT público (para a busca/grade de parceiros funcionar), e ter e-mail/telefone direto nela vazaria esse contato para qualquer chamada de API, mesmo sem conexão aceita. RLS de SELECT: o dono da linha, um admin, ou alguém com uma `connection_requests` de status `aceito` envolvendo os dois (checado nas duas direções). Também tem `weforum_link` (adicionado depois, ajuda o admin a confirmar legitimidade do cadastro).

### `session_reactions` + view `session_reaction_counts`

Curtidas em sessões públicas. `session_reactions` tem `session_id`, `user_id` (aqui ligada direto a `profiles`, não a `auth.users` — de propósito, para permitir que o PostgREST monte automaticamente o "join" embutido nas consultas), com `UNIQUE(session_id, user_id)` garantindo que cada pessoa só curte uma vez por sessão. Leitura pública; INSERT/DELETE só da própria curtida. A view `session_reaction_counts` só soma essas curtidas por sessão, para não precisar contar na aplicação.

### Views de badges

`badge_polyglot_holders` (conta idiomas distintos praticados em sessões públicas próprias) e `badge_photo_memory_holders` (quem tem ao menos uma sessão pública com foto) alimentam os dois badges ativos hoje (ver PRODUTO.md, seção 5).

Existe também uma migration (`20260722090000_add_badge_wave2_views.sql`) com views para 4 badges futuros (contagem de sessões, horas praticadas, "parceiro fiel", "quebra-gelo") — está marcada no próprio arquivo como **"PROPOSTA — NÃO APLICAR sem revisão"** e, confirmado com a dona do projeto, **ainda não foi aplicada ao banco**. Trate como rascunho, não como schema existente, até que alguém decida aplicá-la (e, nesse momento, também escrever a lógica correspondente em `badgeService.js`, que hoje não usa nada dessas views).

### RLS explicado do zero

**RLS (Row Level Security)** é um recurso do Postgres que permite dizer, para cada tabela, quais *linhas* um usuário pode ver/alterar — não só "essa pessoa pode acessar essa tabela", mas "essa pessoa só pode ver as linhas que atendem a essa condição". Sem RLS, qualquer chamada autenticada à API do Supabase enxergaria a tabela inteira, do jeito que ela é — o que seria um problema sério, já que o front-end fala direto com o banco (sem um servidor no meio filtrando o que cada um pode ver). RLS é, então, a **verdadeira camada de segurança** deste projeto — não o código React, que só decide o que *mostrar*, não o que o banco *permite*.

Um comportamento do Postgres/PostgREST que aparece várias vezes no código deste projeto e que vale entender bem: **quando uma operação (`UPDATE`/`DELETE`) é bloqueada por RLS porque a linha não é visível/permitida para quem chamou, o Supabase não retorna um erro** — ele retorna sucesso, só que com **zero linhas afetadas**. Ou seja, `error` fica vazio, mas nada mudou de fato no banco. Por isso, em vários pontos sensíveis do código (cancelar/rejeitar conexão, decidir sessão pública, upload+insert de foto de sessão), depois de um `.update()`/`.delete()` o código pede de volta as linhas afetadas via `.select()` e confere se o array veio vazio — só checar `error` não é suficiente para saber se a operação realmente aconteceu.

### Funções `SECURITY DEFINER`

São funções do Postgres que rodam com o privilégio de quem *criou* a função, não de quem a *chama* — usadas quando é preciso fazer algo que a RLS normal não permitiria para o usuário comum, mas de forma controlada (a própria função checa manualmente se quem chamou tem permissão para aquela ação específica):

- **`approve_profile(target_id)`** — só quem é admin (checado dentro da função) pode chamar; marca `is_approved = true`.
- **`approve_public_session(session_id, decision)`** — só o `partner_id` daquela sessão específica pode chamar, e só se ela estiver `pendente_aprovacao`; muda o `status` para `publica` ou de volta para `privada`.
- **`is_admin()`** — função auxiliar usada dentro de outras políticas de RLS, para checar se quem está fazendo a consulta é admin sem cair em recursão (uma política de RLS em `profiles` que precisasse consultar `profiles` de novo para checar `is_admin` entraria em loop).

---

## 6. Fluxos não-óbvios, passo a passo

### Solicitação de conexão: do envio ao contato visível

1. Usuário A manda solicitação (`connection_requests`, `status = pendente`, `sender_id = A`, `receiver_id = B`) — mas só se ambos estiverem aprovados (RLS de INSERT).
2. Isso dispara a Edge Function `notify-connection-request`, que confirma (usando o JWT de quem chamou, respeitando RLS normal) que quem chamou é de fato o `sender_id` e que o pedido está `pendente` — uma dupla checagem de posse antes de fazer qualquer coisa privilegiada. Só depois disso ela usa a chave de serviço (que ignora RLS) para ler o e-mail de B em `profile_contacts` (que a RLS normal bloquearia nesse momento, já que ainda não há conexão aceita) e envia o e-mail de aviso via `send-email`.
3. **Caso especial:** se B já tinha mandado uma solicitação para A antes (pedido cruzado), o sistema não cria uma segunda linha — trata como aceite mútuo automático na linha já existente.
4. B decide aceitar ou rejeitar. Se aceitar, `status = aceito`. A partir daqui, a RLS de `profile_contacts` libera o SELECT do contato de cada um para o outro (checando as duas direções).
5. Se A quiser cancelar o pedido, ou B quiser rejeitar, é um DELETE — garantido pelas políticas de DELETE específicas de cada papel (sender cancela o que enviou, receiver rejeita o que recebeu).

### Tornar uma sessão pública

1. Sessão já existe como `privada`. O dono pede aprovação — status muda para `pendente_aprovacao`, e um e-mail (`session_public_request`) avisa o parceiro (best-effort: se o e-mail falhar, a mudança de status não é desfeita).
2. O parceiro vê o pedido em "pendências" (`usePendingApprovals`) e decide, chamando a RPC `approve_public_session` — não um UPDATE direto (a RLS não deixaria o parceiro atualizar a linha inteira).
3. Um segundo e-mail (`session_public_decision`) avisa quem pediu qual foi a decisão.
4. Se aprovada, a sessão passa a ser lida por `usePublicSessions` e aparece no feed — sujeita ao cache de 5 minutos (ver abaixo).

### Cache de 5 minutos (`src/hooks/useCache.js`)

**Por quê existe:** antes dessa otimização, tanto a busca de parceiros (`usePartners`) quanto o feed público (`usePublicSessions`) refaziam a consulta completa — trazendo, entre outras coisas, o `photo_url` de *todo mundo* — toda vez que a página montava, inclusive só de navegar para outra aba do app e voltar. Isso gerava consumo desnecessário de "Cached Egress" no Supabase (tráfego de saída do banco/storage, que tem custo). O cache resolve isso guardando o resultado da última busca em memória (não em `localStorage`, então some ao fechar a aba) por até 5 minutos.

**O que cobre:** a lista de parceiros com match calculado, e a lista de sessões públicas do feed.

**O que fica de fora, de propósito:** curtidas (`useSessionReactions`) não usam esse cache, porque "o que eu já curti" depende de quem está logado no momento — cachear isso arriscaria mostrar o estado de curtida errado se a conta trocasse na mesma aba.

**Cuidado ao mexer nisso:** o cache de parceiros guarda o match já calculado **contra o usuário logado no momento da busca**. Isso significa que `clearListCaches()` precisa ser chamado em **todo** ponto de logout do app (hoje: logout pela sidebar do `DashboardLayout`, logout forçado no `Login.jsx` quando a conta ainda não foi aprovada, logout forçado logo após o cadastro em `SignUp.jsx`) — senão, uma segunda conta usada na mesma aba dentro da janela de 5 minutos poderia ver, por um instante, dados de match calculados para a conta anterior. Se adicionar um novo ponto de logout no futuro, lembrar de chamar essa função ali também.

### Upload e compressão de foto de perfil

`EditProfile.jsx` deixa a pessoa recortar a foto (`react-easy-crop`), depois redimensiona/comprime no próprio navegador via `<canvas>` (limite de 500px na maior dimensão, qualidade JPEG 0.85 — constantes `AVATAR_MAX_DIMENSION`/`AVATAR_JPEG_QUALITY`, em `src/utils/imageResize.js`), confere se o resultado ficou abaixo de 400KB (`AVATAR_MAX_COMPRESSED_SIZE`) — se o blob vier vazio ou grande demais mesmo comprimido, mostra um erro amigável em vez de subir um arquivo problemático — e só então sobe para o bucket `profile-photos`.

**Por que isso existe:** antes dessa pipeline, fotos de perfil podiam chegar a 3024×3024px, vários MB cada. Como o avatar de cada pessoa é buscado em várias telas diferentes (grade de parceiros, feed da comunidade, tabela do admin etc.), isso gerou um pico de Cached Egress no Supabase em julho de 2026 — a compressão no cliente, antes do upload, resolveu na origem.

### Upload e compressão de foto de sessão, com limpeza de órfão

`useAddSession.js` comprime a foto de prova da sessão do mesmo jeito conceitual (1600px, qualidade 0.8), **exceto GIFs**, que sobem sem compressão (só respeitando um limite máximo de tamanho, `MAX_PHOTO_SIZE`) para não perder a animação — comprimir GIF de verdade exigiria uma biblioteca própria para isso, que ainda não foi implementada (gap conhecido).

A função `uploadSessionPhoto` retorna tanto a URL pública quanto o `path` do arquivo no Storage. Isso importa porque, se o `INSERT` da sessão falhar **depois** da foto já ter subido (erro explícito, ou bloqueio silencioso de RLS — checado via `data?.length`, o mesmo padrão de "sucesso com zero linhas" explicado na seção 5), o código usa esse `path` para apagar a foto recém-subida do Storage antes de propagar o erro — evitando deixar um arquivo órfão sem sessão associada. Isso só previne órfãos *novos*; os que já existiam antes dessa correção não foram limpos (ver gap conhecido em PRODUTO.md).

---

## 7. Matching (`src/services/matchService.js`)

`calculateMatch(currentUser, profile)` normaliza as strings `speaks`/`learns` (separa por vírgula, tira espaços, deixa minúsculo) e soma:

- +50% se o outro perfil fala algo que o usuário logado quer aprender;
- +50% se o outro perfil quer aprender algo que o usuário logado fala;
- +5% se os dois têm o mesmo `hub`;
- limitado a 100% no total.

O resultado numérico vira uma faixa de texto: ≥95% "Match Perfeito", ≥70% "Alta", ≥40% "Média", abaixo disso "Baixa". **Nível de proficiência (iniciante/intermediário/fluente) não entra na conta** — só o nome do idioma importa para o cálculo.

**Duplicação conhecida:** essa mesma lógica está reimplementada, de forma inline, dentro de `usePartners.js` (o hook que de fato monta a grade de Buscar Parceiros). A função `getMatches()`, também em `matchService.js`, parece não ter nenhum consumidor hoje — se for confirmado que não é usada em lugar nenhum, ela é candidata a remoção, ou a virar a única fonte de verdade (com `usePartners` passando a chamá-la em vez de duplicar a lógica). **Se você mudar o algoritmo de match, lembre de atualizar os dois lugares** até essa duplicação ser resolvida.

---

## 8. Edge Functions

Todas em Deno, com headers de CORS configurados manualmente (sem framework tipo Express por trás).

### `send-email`

Sender genérico de e-mail transacional via API do Resend. Suporta 5 templates: `approval`, `connection_request`, `user_deleted`, `session_public_request`, `session_public_decision` — cada um com texto em pt/en/es (resolvido pelo `preferred_language` do destinatário, com fallback para inglês). Usa um layout de e-mail compartilhado com a paleta visual da marca.

**Importante:** essa função não valida por si só *quem* pode pedir o envio de qual e-mail para quem — qualquer chamada com um `template` e um `to` válidos é aceita. A responsabilidade de só disparar e-mail quando faz sentido (ex: só notificar sobre uma conexão que realmente existe) fica com quem chama essa função (as outras Edge Functions, ou o client autenticado nos fluxos mais simples como aprovação/decisão de sessão).

### `notify-connection-request`

Existe separada da `send-email` porque precisa **ler dados sob RLS que uma função genérica não teria acesso** — ela confirma a posse do pedido de conexão usando o JWT de quem chamou (respeitando RLS normal), e só então usa a chave de serviço para ler o e-mail do destinatário em `profile_contacts` (que RLS bloquearia nesse momento, já que a conexão ainda não foi aceita). Disparada pelo front-end logo depois do `INSERT` de uma nova solicitação de conexão.

### `admin-delete-user`

Exclusão de conta via chave de serviço, chamada pelo painel Admin (com confirmação explícita na UI). Passos, na ordem:
1. Confirma que quem chamou é admin (`profiles.is_admin = true`) e bloqueia auto-exclusão.
2. Envia o e-mail `user_deleted` **antes** de apagar qualquer coisa — porque o e-mail e o idioma preferido da pessoa deixam de existir depois do passo seguinte.
3. Apaga a linha de `profiles` primeiro.
4. Só depois chama `auth.admin.deleteUser()` — que aí sim cascateia a remoção de `sessions`, `connection_requests` e `profile_contacts` (todas ligadas, direta ou indiretamente, a `auth.users.id`).

**Por que essa ordem:** não existe `ON DELETE CASCADE` de `auth.users` para `profiles` (porque `profiles` nunca teve uma migration formal de criação — ver seção 5), então apagar só `auth.users` deixaria uma linha de `profiles` órfã para trás. A função trata explicitamente o cenário "perfil já apagado, mas o usuário de auth não" como um estado inconsistente que exigiria intervenção manual, caso o passo 4 falhe depois do passo 3 ter dado certo.

---

## 9. Convenções de código

- **i18n obrigatório.** Textos visíveis ao usuário não devem ser hardcoded em português no JSX — vão como chave de tradução nos três idiomas (`pt`/`en`/`es`), no namespace apropriado (`common`, `landing`, `auth`, `dashboard`, `profile`, `partners`, `constants`). Componentes usam `useTranslation("namespace")`.
- **Comentários em português, identificadores em inglês.** Nomes de variável/função seguem inglês; comentários explicativos no código são em português.
- **Padrão `try/catch/finally`** para chamadas assíncronas ao Supabase, com estado `loading`/`error` e `console.error` no catch — não há um error boundary global capturando erros não tratados.
- **Divisores de seção** (`// =========================` / `// LABEL` / `// =========================`) organizam blocos lógicos dentro de hooks/services/components maiores (busca de dados, formatação, handlers). Seguir esse padrão ao adicionar blocos grandes em arquivos parecidos.
- **`speaks`/`learns`/`interests` são strings separadas por vírgula**, não arrays nem tabelas relacionadas — parseadas onde forem usadas com `.split(",").map(s => s.trim())`.
- **Cada página/componente importa seu próprio CSS** (`import "./thing.css"`); não há CSS-in-JS nem token de design compartilhado além de `src/index.css`/`src/App.css`.
- **Padrão "confirmar depois de escrever":** em operações sensíveis de `.update()`/`.delete()`, sempre re-buscar a(s) linha(s) afetada(s) via `.select()` e checar se o array não veio vazio, em vez de confiar só na ausência de `error` — ver explicação de RLS na seção 5.

---

## 10. Dívida técnica e decisões pendentes

Lista única, consolidando tudo já sinalizado como gap/pendência (no CLAUDE.md e encontrado na leitura do código):

- **Sem notificação de "match mútuo"** quando duas pessoas se conectam direto sem pedido prévio de uma para a outra.
- **Feed da Comunidade não invalida o cache na hora** quando uma sessão pública é aprovada — só atualiza quando o cache de 5 minutos expira ou a página recarrega.
- **Sem compressão de GIF** em fotos de sessão (sobe sem compressão, só limitado por tamanho máximo).
- **Fotos órfãs antigas** em `session-proofs`, de antes da correção que limpa órfãos automaticamente — não foram removidas manualmente ainda.
- **`getMatches()` em `matchService.js` parece código não utilizado** — `usePartners.js` reimplementa a mesma lógica inline em vez de chamá-la. Candidato a remoção ou consolidação.
- **Checagem de admin duplicada e não centralizada.** `DashboardLayout` e `Admin.jsx` cada um reimplementa sua própria checagem de `is_admin`/`is_approved`, sem um hook/guard compartilhado (ex.: `useRequireAdmin`). Funciona hoje porque só existe uma tela protegida por admin, mas não escala bem se mais telas precisarem do mesmo gate.
- **Proteção de rota é só client-side.** Não existe guard de rota no `react-router`; cada página autenticada (via `DashboardLayout`) ou a rota `/admin` checam permissão dentro do próprio componente, depois de montado (checagem assíncrona, roda depois do primeiro render). A segurança real dos dados vem da RLS do banco, não do roteamento — mas vale ter isso em mente ao adicionar novas rotas sensíveis.
- **`src/routes/index.jsx` existe mas está vazio** e não é usado — candidato a remoção, ou a efetivamente virar a definição de rotas no futuro.
- **Migrations duplicando SQL da raiz.** As migrations tracked de 2026-07-04/07-09 (`add_profile_contacts_table`, `add_connection_requests_delete_policies`, `sessions_public_visibility`) espelham exatamente arquivos `.sql` soltos na raiz do repo, aplicados antes de existir a pasta `migrations/`. Não é duplicação acidental — é a mesma mudança documentada duas vezes por causa de quando cada convenção passou a existir. Novas mudanças de schema/RLS devem ir só em `migrations/`, sem repetir na raiz.
- **`Cache-Control` de Storage não customizado.** Nem `profile-photos` nem `session-proofs` passam uma opção `cacheControl` explícita no upload — usam o padrão do Supabase Storage (1h). Poderia valer um `max-age` mais longo, já que os paths são estáveis e trocas de foto de perfil já fazem cache-busting via `?t=` na URL — não implementado ainda.
- **Badges "wave 2"** (Praticante, Dedicação, Parceiro Fiel, Quebra-Gelo) — views propostas em migration não aplicada, sem lógica em `badgeService.js`. Ver PRODUTO.md seção 5.
- **`user_id` da desenvolvedora hardcoded** em `Admin.jsx` (controla a visibilidade de contas de teste `E2E-TEST` para além dos admins comuns) — até outubro de 2026 era o e-mail pessoal dela; trocado por `user_id` quando o repositório se tornou público, para não deixar um e-mail pessoal em texto puro no código-fonte (ver seção 13). Continua não sendo configurável via env/banco, é uma constante fixa no código.
- **Schema de `profiles` sem migration de criação versionada** — documentado por inferência (ver seção 5). Se algum dia for feita uma migration de "captura do estado atual" (baseline), ela fecharia essa lacuna.

---

## 11. Testes automatizados

Os testes E2E (Playwright, `tests/e2e/`) cobrem hoje:

- **login** — credenciais válidas levam ao dashboard; inválidas mostram erro sem redirecionar.
- **signup** — cadastro válido mostra modal de sucesso; sem aceitar termos, botão fica bloqueado; senha e confirmação diferentes geram erro.
- **recovery** — pedir link de recuperação com e-mail válido confirma; sem e-mail dá erro; senha/confirmação diferentes na tela de redefinição dão erro.
- **connections** — grade de parceiros sugeridos carrega pelo menos um card; enviar solicitação muda o status para "Pendente".
- **sessions** — registrar sessão válida faz ela aparecer na lista; tentar submeter sem selecionar parceiro dá erro e não salva.

**Não têm cobertura E2E hoje:** Comunidade (feed público, curtidas, badges), Admin (aprovação/exclusão de usuário), o fluxo completo de sessão pública (pedido → aprovação do parceiro), edição de perfil, upload de fotos. Ao adicionar/alterar essas áreas, vale considerar se compensa escrever um teste novo, já que não há uma rede de segurança automatizada cobrindo-as ainda.

Dados de teste seguem a convenção `hub = 'E2E-TEST'`, filtrada das consultas de produção (ver seção 2).

---

## 12. Perguntas frequentes de quem está chegando

**Por que o `user_id` da desenvolvedora está fixo no código, em vez de vir de uma configuração?**
Porque hoje só existe uma pessoa administrando o projeto, e essa regra específica (mostrar contas de teste E2E só para ela, além dos admins normais) é uma conveniência de depuração, não uma feature de produto. Até outubro de 2026 essa comparação era feita pelo e-mail dela; foi trocada por `user_id` quando o repositório passou a ser público (ver seção 13), para não expor um e-mail pessoal em texto puro no código-fonte — um `user_id` sozinho não identifica a pessoa pra quem olha o repo de fora. Se o time de admins crescer, vale revisitar tornar isso configurável — mas hoje não compensou o esforço.

**Por que não tem testes de unidade, só E2E?**
O projeto prioriza testar comportamento visível de usuário (login funciona, cadastro funciona) sobre testar funções isoladas. Combinado com o fato de que a maior parte da lógica de negócio real mora em RLS/funções do banco (não em funções JS puras fáceis de testar isoladamente), os testes E2E acabaram cobrindo mais valor por esforço do que testes unitários cobririam. Isso é uma lacuna real (ver seção 11), não uma escolha definitiva — só não foi priorizada ainda.

**Por que várias tabelas não têm migration de criação, só as mudanças recentes?**
Histórico do projeto: ele começou sem uma pasta `migrations/` versionada, com schema criado e alterado manualmente pelo SQL Editor do Supabase. A disciplina de migration tracked começou em julho de 2026. Isso é dívida técnica histórica e intencionalmente aceita, não descuido atual — ver a nota no início da seção 5.

**Por que a proteção de `/admin` e de páginas autenticadas é só no componente React, não no roteador?**
Porque a segurança de dados real já vem da RLS do banco — mesmo que alguém burlasse a checagem do React e visse a estrutura da tela de admin por um instante, as consultas ao banco continuariam bloqueadas para quem não é admin de verdade. Um guard de rota centralizado melhoraria a experiência (evitaria o "flash" de conteúdo antes do redirect), mas não é uma brecha de segurança de dados — é uma pendência de polimento, listada na seção 10.

**Por que `speaks`/`learns`/`interests` são strings com vírgula em vez de tabelas relacionadas?**
Decisão de simplicidade para o tamanho atual do projeto — evita joins e tabelas extras para um dado que, na prática, é sempre lido/escrito inteiro de uma vez (a lista completa de idiomas de uma pessoa), nunca item por item. Se no futuro for preciso, por exemplo, buscar "todos que falam francês" de forma eficiente em escala, essa modelagem passaria a doer e viraria candidata a migrar para uma tabela relacionada.

---

## 13. Contas, propriedade e acesso

Em outubro de 2026 o projeto passou por uma migração de contas: o repositório saiu da conta pessoal da desenvolvedora e foi transferido para a organização do hub no GitHub, e o repositório se tornou **público**. Antes disso, todo o histórico do Git foi auditado em busca de segredos commitados por acidente — nenhum foi encontrado (a única chave que já apareceu em texto puro em commits antigos é a `VITE_SUPABASE_ANON_KEY`, que é pública por natureza e foi desenhada pelo Supabase para poder ficar exposta no front-end).

| Serviço | Onde mora hoje | Quem é dono (Owner/Admin) | Papel da desenvolvedora | Se outra pessoa assumir no futuro |
|---|---|---|---|---|
| **GitHub** | Organização `Global-Shapers-Floripa`, repositório público `Language_exchange` | Hub e desenvolvedora são ambos Owners da organização | Owner | Pedir para ser adicionado como membro/Owner da organização pelo hub |
| **Supabase** | Organização "Global Shapers Floripa" (plano Free) | Conta do hub (`globalshapersflorianopolis@gmail.com`) é Owner | Developer — de propósito, ver abaixo | Hub adiciona a pessoa como Developer (ou outro papel) na organização Supabase |
| **Resend** | Mesmo time/conta de sempre, domínio e remetente inalterados | Conta original do time, com a conta do hub adicionada como Admin | — (acesso via o time) | Pedir para ser adicionado ao time no Resend |
| **Vercel** | Conta pessoal da desenvolvedora (plano Hobby), conectada ao repositório da organização no GitHub | Desenvolvedora | Owner da conta pessoal | Ver explicação abaixo — não é uma simples troca de permissão |
| **Domínio** `globalshapersflorianopolis.com.br` | Registro.br | Hub | — | Acesso ao painel do registro.br pertence ao hub |

### Por que o Supabase está como "Developer", não "Owner"

No plano Free do Supabase, o limite de 2 projetos gratuitos por conta é contado para quem tem papel de **Owner ou Admin** na organização — não para quem só tem papel de Developer. Se a desenvolvedora fosse Owner/Admin na organização do hub, este projeto passaria a ocupar uma das 2 vagas gratuitas da conta pessoal dela, mesmo o projeto sendo do hub. Como Developer, ela continua com acesso total ao necessário para o dia a dia (schema, SQL Editor, Edge Functions, logs), sem o projeto "contar" contra o limite da conta dela.

### Por que a Vercel continua na conta pessoal da desenvolvedora

Isso não é um detalhe esquecido — é uma limitação real do plano Hobby da Vercel: ele não publica repositórios **privados** de uma organização do GitHub, e também exige que o autor do commit que está sendo implantado seja o próprio dono da conta Vercel. Isso cria uma dependência de mão dupla: o motivo do repositório ter virado público foi justamente permitir que a Vercel (na conta pessoal) continuasse publicando a partir do repositório da organização.

Se no futuro outra pessoa assumir o deploy, as opções são:
1. Essa pessoa importa o repositório público (já é público, então isso funciona no plano Hobby dela) na própria conta Vercel e cadastra `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` lá — o projeto passa a viver na conta dela.
2. O hub assina o plano Vercel Pro, que permite deploy a partir de um repositório de organização sem a restrição de autoria de commit — nesse caso o projeto Vercel passaria a viver numa conta/time do próprio hub.

### Secrets do GitHub Actions

O workflow de keepalive (`.github/workflows/supabase-keepalive.yml`) depende de dois secrets configurados em Settings → Secrets and variables → Actions do repositório: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Eles precisam existir lá independentemente de quem é Owner da organização — a transferência do repositório não os copia automaticamente caso o repositório precise ser recriado do zero (transferência normal preserva os secrets).
