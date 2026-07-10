import { useState } from 'react';
import { supabase } from '../services/supabaseClient';

export const useAddSession = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadSessionPhoto = async (file, userId) => {
    try {
      // Criar nome único para a foto
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split('.').pop();
      const fileName = `session_${userId}_${timestamp}_${randomString}.${ext}`;
      
      // Fazer upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('session-proofs')
        .upload(`sessions/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('session-proofs')
        .getPublicUrl(`sessions/${fileName}`);

      return publicUrl;
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
      if (sessionData.sessionPhoto) {
        try {
          photoUrl = await uploadSessionPhoto(sessionData.sessionPhoto, user.id);
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
      const { error: insertError } = await supabase
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

      if (insertError) throw insertError;

      // E-mail de pedido de aprovação é best-effort: a sessão já foi criada
      // com sucesso, então uma falha aqui não deve virar erro pro usuário —
      // mesmo padrão de requestPublicApproval em useSessions.js, usado
      // quando o pedido é feito depois em vez de na criação.
      if (sessionData.makePublic) {
        const [{ data: ownProfile }, { data: partnerProfile }, { data: partnerContact }] =
          await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', user.id).single(),
            supabase.from('profiles').select('full_name').eq('id', sessionData.partner_id).single(),
            supabase.from('profile_contacts').select('email').eq('user_id', sessionData.partner_id).single(),
          ]);

        if (partnerContact?.email) {
          const { error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              template: 'session_public_request',
              to: partnerContact.email,
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
