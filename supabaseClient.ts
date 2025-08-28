// @ts-nocheck
// Supabase je načteno globálně ze skriptu v index.html
const { createClient } = supabase;

// DŮLEŽITÉ: Nahraďte tyto hodnoty vašimi skutečnými údaji ze Supabase!
// Najdete je ve vašem Supabase projektu v "Project Settings" -> "API".
const supabaseUrl = 'https://oyzddspqmtvpsaplaokx.supabase.co'; // např. 'https://xxxxxxxxxxxxxxxxxxxx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95emRkc3BxbXR2cHNhcGxhb2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE5MDksImV4cCI6MjA3MTk4NzkwOX0.dlluYC8tok2yMWEyEYt-cVOkIDhnfmQexN2pxwmOWgg';

if (!supabaseUrl || supabaseUrl === 'VAŠ_PROJECT_URL' || !supabaseKey || supabaseKey === 'VÁŠ_ANON_PUBLIC_KLÍČ') {
  const errorMsg = "Chyba: V souboru supabaseClient.ts chybí vaše přístupové údaje k Supabase. Aplikace nemůže načíst data.";
  console.error(errorMsg);
  // Zobrazit chybu uživateli, aby věděl, co má dělat.
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `<div style="padding: 2rem; text-align: center; color: red; font-family: sans-serif;"><h1>Chyba konfigurace</h1><p>${errorMsg}</p><p>Prosím, doplňte URL a klíč do souboru <strong>supabaseClient.ts</strong>.</p></div>`;
    }
  });
  // Vytvoříme "falešného" klienta, aby zbytek aplikace nespadl na chybě `undefined`
  const dummyClient = { from: () => dummyClient, select: async () => ({ error: { message: 'Not configured' } }), insert: async () => ({ error: { message: 'Not configured' } }), update: async () => ({ error: { message: 'Not configured' } }), storage: { from: () => ({ upload: async () => ({ error: { message: 'Not configured' } }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) }};
  // @ts-ignore
  globalThis.supabaseClient = dummyClient;
} else {
    globalThis.supabaseClient = createClient(supabaseUrl, supabaseKey);
}

export const supabase = globalThis.supabaseClient;
