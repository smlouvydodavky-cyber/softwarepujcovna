// @ts-nocheck
// Supabase je načteno globálně ze skriptu v index.html
const { createClient } = supabase;

// ====================================================================
// KROK 1: PROSÍM, DOPLŇTE SVÉ ÚDAJE ZDE, ABYCHOM APLIKACI ZPROVOZNILI
// ====================================================================
// Tyto údaje najdete ve vašem Supabase projektu v "Project Settings" -> "API"

const supabaseUrl = 'https://oyzddspqmtvpsaplaokx.supabase.co'; // Nahraďte tento text vaším Project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95emRkc3BxbXR2cHNhcGxhb2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE5MDksImV4cCI6MjA3MTk4NzkwOX0.dlluYC8tok2yMWEyEYt-cVOkIDhnfmQexN2pxwmOWgg'; // Nahraďte tento text vaším 'anon public' klíčem

// ====================================================================


// Kontrola, zda byly údaje vyplněny. Pokud ne, zobrazí se na obrazovce chyba.
if (supabaseUrl.includes('VAŠE_PROJECT_URL') || supabaseKey.includes('VÁŠ_ANON_PUBLIC_KLÍČ')) {
  const rootDiv = document.getElementById('root');
  if(rootDiv) {
    rootDiv.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; text-align: center; background-color: #fff; height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div>
          <h1 style="color: #e53e3e; font-size: 24px;">Chyba v konfiguraci!</h1>
          <p style="font-size: 18px; margin-top: 10px;">Je potřeba doplnit přístupové údaje k databázi do souboru <strong>supabaseClient.ts</strong>.</p>
          <p style="font-size: 16px; margin-top: 20px; color: #718096;">Otevřete tento soubor a nahraďte zástupné texty vašimi skutečnými údaji ze Supabase.</p>
        </div>
      </div>
    `;
  }
  // Zastavíme další vykonávání skriptu, pokud chybí klíče
  throw new Error("Supabase URL or Key not configured.");
}

// Inicializace klienta Supabase s vyplněnými údaji
export const supabase = createClient(supabaseUrl, supabaseKey);

