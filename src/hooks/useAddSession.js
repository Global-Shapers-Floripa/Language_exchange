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
        .from('session-photos')
        .upload(`sessions/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('session-photos')
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
            status: sessionData.status || 'pendente',
            notes: sessionData.notes,
            session_photo_url: photoUrl,
          },
        ])
        .select();

      if (insertError) throw insertError;

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
