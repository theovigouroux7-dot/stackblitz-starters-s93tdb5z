// Contrats et plaques enregistrés dans Supabase : visibles depuis tous les appareils.
import { supabase } from './supabase';

const LETTRES = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function nouveauCode() {
  const nombres = crypto.getRandomValues(new Uint32Array(6));
  return Array.from(nombres, (n) => LETTRES[n % LETTRES.length]).join('');
}

function verifier(error) {
  if (error) throw new Error(error.message);
}

export function lienPlaque(code) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  return `${base.replace(/\/$/, '')}/p/${code}`;
}

export async function getContrats() {
  const { data, error } = await supabase
    .from('contrats')
    .select('*, plaques(code)')
    .order('created_at', { ascending: false });
  verifier(error);
  return data;
}

export async function ajouterContrat(contrat) {
  const { error } = await supabase.from('contrats').upsert(contrat);
  verifier(error);
}

export async function supprimerContrat(numero) {
  const { error } = await supabase
    .from('contrats')
    .delete()
    .eq('numero', numero);
  verifier(error);
}

export async function creerPlaque(numero) {
  const code = nouveauCode();
  const { error } = await supabase
    .from('plaques')
    .insert({ code, contrat_numero: numero });
  verifier(error);
  return code;
}

export async function getContratDePlaque(code) {
  const { data, error } = await supabase
    .from('plaques')
    .select('contrats(*)')
    .eq('code', code)
    .maybeSingle();
  verifier(error);
  return data ? data.contrats : null;
}

export async function associer(code, numero) {
  const { error } = await supabase
    .from('plaques')
    .upsert({ code, contrat_numero: numero });
  verifier(error);
}

export async function dissocier(code) {
  const { error } = await supabase
    .from('plaques')
    .update({ contrat_numero: null })
    .eq('code', code);
  verifier(error);
}

export const contact = {
  telephone: '0600000000',
  email: 'sav@locandgo.fr',
};
