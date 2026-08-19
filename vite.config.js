import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Registro manual (via virtual:pwa-register/react no main.jsx) em vez de
      // injeção automática, pra controlar o momento do update e mostrar um
      // aviso ao usuário (ver UpdatePrompt.jsx) em vez de trocar de versão em
      // silêncio.
      injectRegister: false,
      registerType: 'prompt',
      manifest: false, // manifest.json já existe em public/ e é servido como está
      workbox: {
        // Desliga o fallback de navegação automático do Workbox: por padrão
        // ele registra uma rota que serve index.html direto do precache pra
        // QUALQUER navegação, e essa rota entra ANTES das runtimeCaching
        // abaixo — ou seja, ignoraria silenciosamente o NetworkFirst e serviria
        // HTML velho mesmo com rede disponível. A regra de navigate abaixo já
        // cobre o caso offline (cai pro cache 'html-shell' quando a rede falha).
        navigateFallback: null,
        runtimeCaching: [
          {
            // Nunca cachear chamadas ao Supabase (API REST, Auth, Storage,
            // Edge Functions) — são todas autenticadas/dinâmicas; cachear
            // arriscaria servir dado de um usuário pra outro no mesmo
            // dispositivo.
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkOnly',
          },
          {
            // Navegação (index.html): sempre tenta rede primeiro, com timeout
            // curto — nunca serve HTML velho enquanto a rede estiver disponível.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-shell',
              networkTimeoutSeconds: 3,
            },
          },
          {
            // Assets com hash no nome (JS/CSS/imagens do build): o conteúdo de
            // um hash específico nunca muda, então cache-first é seguro.
            urlPattern: ({ request }) =>
              ['script', 'style', 'image', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'hashed-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
