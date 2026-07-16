import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabaseClient';
import { compressImageFile } from '../utils/imageResize';
import { MAX_PHOTO_SIZE } from '../constants/languages';

// Fotos de celular sem tratamento facilmente passam de vários MB — reduzimos
// pro maior lado caber em 1600px antes do upload. A validação de tamanho
// (MAX_PHOTO_SIZE) roda AQUI, depois de comprimir, não na seleção do arquivo
// em AddSessionModal.jsx — senão barra a foto antes dela ter chance de ser
// reduzida, que era exatamente o bug (foto de celular >5MB nunca chegava a
// ser comprimida, só rejeitada na entrada).
const SESSION_PHOTO_MAX_DIMENSION = 1600;
const SESSION_PHOTO_JPEG_QUALITY = 0.8;

export const useAddSession = () => {
  const { t } = useTranslation('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadSessionPhoto = async (file, userId) => {
    try {
      // GIF perde a animação se passar pelo canvas — pula a compressão e
      // envia o arquivo original só com a validação de tamanho já existente
      // (aplicada na seleção, em AddSessionModal.jsx, pois aqui não há
      // redução nenhuma pra tentar antes).
      const isGif = file.type === 'image/gif';
      const compressedBlob = isGif
        ? null
        : await compressImageFile(file, {
            maxDimension: SESSION_PHOTO_MAX_DIMENSION,
            quality: SESSION_PHOTO_JPEG_QUALITY,
          });
      const fileToUpload = compressedBlob || file;
      const ext = isGif ? file.name.split('.').pop() : 'jpg';

      // Segurança extra: com maxDimension 1600 e quality 0.8 é raro o
      // resultado ainda passar de MAX_PHOTO_SIZE, mas se acontecer (ex: foto
      // com muito ruído/detalhe que não comprime bem), rejeita aqui em vez
      // de deixar subir um arquivo grande demais mesmo já reduzido.
      if (!isGif && fileToUpload.size > MAX_PHOTO_SIZE) {
        throw new Error(
          t('sessions.addModal.errors.fileSize', {
            mb: Math.round(MAX_PHOTO_SIZE / 1024 / 1024),
          }),
        );
      }

      // Criar nome único para a foto
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileName = `session_${userId}_${timestamp}_${randomString}.${ext}`;

      // Fazer upload para o Supabase Storage
      const path = `sessions/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('session-proofs')
        .upload(path, fileToUpload, {
          contentType: isGif ? file.type : 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('session-proofs')
        .getPublicUrl(path);

      // path também é devolvido para permitir limpeza (storage.remove) caso
      // o insert da sessão falhe depois do upload — ver addSession abaixo.
      return { publicUrl, path };
    } catch (err) {
      console.error('Erro ao fazer upload de foto:', err);
      throw err;
    }
  };

  const addSession = async (sessionData) => {
    try {
      setLoading(true);
      setError(null);

      // Pega o usuário logado
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Fazer upload da foto se existir
      let photoUrl = null;
      let photoPath = null;
      if (sessionData.sessionPhoto) {
        try {
          const uploaded = await uploadSessionPhoto(sessionData.sessionPhoto, user.id);
          photoUrl = uploaded.publicUrl;
          photoPath = uploaded.path;
        } catch (uploadErr) {
          throw new Error(`Erro ao enviar foto: ${uploadErr.message}`);
        }
      }

      // Converter array de idiomas para string
      const languagesString = Array.isArray(sessionData.languages)
        ? sessionData.languages.join(', ')
        : sessionData.languages;

      // Se "Tornar esta sessão pública" foi marcado, a sessão já nasce
      // aguardando aprovação do parceiro em vez de privada (default da
      // coluna, ver SESSIONS_PUBLIC_VISIBILITY.sql).
      const status = sessionData.makePublic ? 'pendente_aprovacao' : 'privada';

      // Insere a nova sessão
      const { data: insertedRows, error: insertError } = await supabase
        .from('sessions')
        .insert([
          {
            user_id: user.id,
            partner_id: sessionData.partner_id,
            date: sessionData.date,
            duration: sessionData.duration,
            languages: languagesString,
            notes: sessionData.notes,
            session_photo_url: photoUrl,
            status,
          },
        ])
        .select();

      // !insertedRows?.length cobre o caso de RLS bloquear o insert em
      // silêncio (sem popular insertError, ver CONNECTION_REQUESTS_POLICIES.sql
      // pro mesmo padrão em outro fluxo) — sem essa checagem, a sessão não
      // seria criada mas o código seguiria como se tivesse dado certo.
      if (insertError || !insertedRows?.length) {
        // A sessão não foi criada, mas a foto já subiu pro Storage no passo
        // anterior — sem essa limpeza, o arquivo fica órfão pra sempre (nada
        // no banco referencia ele). Falha na limpeza não deve mascarar o erro
        // original do insert, só é logada.
        if (photoPath) {
          const { error: removeError } = await supabase.storage
            .from('session-proofs')
            .remove([photoPath]);

          if (removeError) {
            console.error('Erro ao limpar foto órfã após falha no insert:', removeError);
          }
        }

        throw insertError || new Error(t('sessions.addModal.errors.saveFailed'));
      }

      // E-mail de pedido de aprovação é best-effort: a sessão já foi criada
      // com sucesso, então uma falha aqui não deve virar erro pro usuário —
      // mesmo padrão de requestPublicApproval em useSessions.js, usado
      // quando o pedido é feito depois em vez de na criação.
      if (sessionData.makePublic) {
        const [{ data: ownProfile }, { data: partnerProfile }, { data: partnerContact }] =
          await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', user.id).single(),
            supabase.from('profiles').select('full_name, preferred_language').eq('id', sessionData.partner_id).single(),
            supabase.from('profile_contacts').select('email').eq('user_id', sessionData.partner_id).single(),
          ]);

        if (partnerContact?.email) {
          const { error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              template: 'session_public_request',
              to: partnerContact.email,
              lang: partnerProfile?.preferred_language,
              data: {
                recipientName: partnerProfile?.full_name || '',
                senderName: ownProfile?.full_name || '',
                appUrl: `${window.location.origin}/sessions`,
              },
            },
          });

          if (emailError) {
            console.error('Erro ao enviar e-mail de pedido de sessão pública:', emailError);
          }
        }
      }

      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Erro ao adicionar sessão:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  return { addSession, loading, error };
};
