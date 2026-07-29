# 🚀 PROMPT MASTER v2 — Sviluppo Web App PWA "Giochi & Bans" (Scout Edition)

Sei un agente di sviluppo web con accesso a filesystem reale. Il tuo compito è costruire una Web App completa, professionale e pronta per la messa online, basandoti sulle specifiche seguenti.

Questa è un'app **personale/associativa** (uso oratorio/scout, non commerciale per clienti), usata quasi esclusivamente da mobile, deve essere una PWA funzionante offline, con prestazioni ottime e un design "effetto WOW" in stile scout.

## 🧭 CONTESTO D'USO (leggi prima di progettare la UI)

I **"Bans"** sono canzoni/balli di gruppo eseguiti ad alta voce e a memoria durante attività di oratorio/scout: il testo deve essere **leggibile a distanza e con font grande** durante l'esecuzione dal vivo, non solo archiviato come nota. I **"Giochi"** vengono consultati rapidamente, spesso con bambini che aspettano — la velocità di ricerca conta più di qualunque estetica.

---

## 🎯 SPECIFICHE DELLA WEB APP

**Obiettivo:** Creare un'app per salvare e consultare "Giochi" e "Bans", sincronizzata in tempo reale per tutti gli utenti, ospitata gratuitamente (Vercel o GitHub Pages per il frontend statico).

### 🗄️ Architettura Dati — DECISA, non negoziabile

Usa **Supabase** (Postgres + Realtime + Auth). Non usare Firebase, non usare l'API di GitHub per scrivere su `data.json`: quest'ultima esporrebbe un token di scrittura nel bundle JS pubblico, inaccettabile anche per un progetto personale.

- **Lettura pubblica**: chiunque visiti il sito vede i dati, senza login.
- **Scrittura protetta**: un singolo utente admin via Supabase Auth (email+password). Row Level Security:

```sql
create policy "public read" on giochi for select using (true);
create policy "auth write" on giochi for insert with check (auth.role() = 'authenticated');
create policy "auth update" on giochi for update using (auth.role() = 'authenticated');
create policy "auth delete" on giochi for delete using (auth.role() = 'authenticated');
-- stesse policy per la tabella bans
```

- **Sync realtime**: usa `supabase.channel().on('postgres_changes', ...)` su entrambe le tabelle, così ogni dispositivo connesso vede gli aggiornamenti degli altri senza bisogno di refresh manuale.

### 📋 Schema Dati (esatto, non improvvisare campi)

```json
// tabella: giochi
{
  "id": "uuid (PK, default gen_random_uuid())",
  "nome": "text NOT NULL",
  "regole": "text | null",
  "materiali": "text | null",
  "created_at": "timestamptz default now()",
  "updated_at": "timestamptz default now()"
}

// tabella: bans
{
  "id": "uuid (PK, default gen_random_uuid())",
  "nome": "text NOT NULL",
  "testo": "text NOT NULL",
  "note_gesti": "text | null",
  "created_at": "timestamptz default now()",
  "updated_at": "timestamptz default now()"
}
```

Nessuna categorizzazione (interno/esterno, età, ecc.): non richiesta, non implementarla.

### 🔎 Ricerca — il cuore dell'app, deve essere eccellente

Questo è il requisito più importante di tutto il progetto. Implementa:

1. **Multi-campo**: la ricerca deve matchare su `nome` + `regole`/`testo` (non solo il titolo).
2. **Live con debounce** (~200ms), nessun pulsante "cerca".
3. **Normalizzazione accenti/case**: `str.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()` su entrambi i lati del confronto.
4. **Tolleranza ai typo**: implementa un match parziale parola-per-parola (substring su ogni token) oppure una distanza di Levenshtein leggera (poche righe di JS, no librerie esterne) per tollerare piccoli errori di battitura.
5. **Evidenziazione del match**: la porzione di testo che corrisponde alla query appare in grassetto/colore nel risultato.
6. **Stato vuoto gestito esplicitamente**: se non ci sono risultati, mostra "Nessun risultato per 'xxx'" — mai una lista bianca silenziosa.
7. **Persistenza del filtro**: se l'utente apre una card e torna indietro, il testo di ricerca e i risultati filtrati restano invariati (usa `sessionStorage` per lo stato di ricerca, non i dati).

### 🛡️ Sicurezza contenuti

Ogni input libero (nome, regole, testo, note_gesti) deve essere renderizzato con `textContent` (mai `innerHTML` diretto su dati utente) per evitare rendering rotto o injection accidentale con caratteri come `<`, `>`, `&`, virgolette.

**Struttura Pagine:**

1. `index.html`: Pagina principale breve e d'impatto, stile scout (vedi sezione design). Pulsanti grandi per Giochi e Bans. Link discreto per l'Admin. Placeholder per il logo (stemma/gruppo).
2. `giochi.html`: Griglia dei giochi, ricerca come sopra, espandibile per regole/materiali.
3. `bans.html`: Griglia dei bans, ricerca come sopra, espandibile per il testo (font grande, leggibile a distanza quando espanso).
4. `admin.html`: Protetto da login Supabase Auth (email+password, non un semplice PIN finto). Permette di:
   - Inserire, modificare, eliminare Giochi e Bans.
   - **Warning soft** se il nome inserito è quasi identico a uno già esistente (possibile doppione).
   - **Conferma esplicita a doppio step** per ogni eliminazione, con il nome dell'elemento scritto per esteso nel modal ("Eliminare 'Ban del Silenzio'? Azione irreversibile").
   - Generare e scaricare un backup JSON **on-demand** tramite un pulsante esplicito (mai download automatico in background).
   - Ordinamento alfabetico di default nelle liste admin.

---

## 📱 RESPONSIVITÀ E LAYOUT (Regole Rigorose)

1. **Mobile-First**: CSS prima per mobile (320px), poi `min-width` per desktop.
2. **Breakpoint (variabili CSS)**: `--bp-xs: 320px`, `--bp-sm: 480px`, `--bp-md: 768px`, `--bp-lg: 1024px`.
3. **Tipografia fluida**: `--font-size-h1: clamp(2rem, 5vw + 1rem, 3.5rem);`
4. **Spaziature fluide**: `--space-sm: clamp(0.5rem, 1vw, 1rem);`
5. **Touch target**: minimo `min-height: 44px; min-width: 44px`. Bottom Navigation Bar app-like invece di hamburger menu.
6. **Accessibilità minima** (proporzionata a un progetto personale, non enterprise): contrasto testo/sfondo sempre leggibile anche con glassmorphism/glow attivi, `:focus-visible` con outline chiaro su ogni elemento interattivo, `aria-live="polite"` sulla lista risultati di ricerca.

---

## 🎨 STILE — Scout Edition (obbligatorio)

Il design deve richiamare visivamente l'identità scout: i colori del fazzolettone — **giallo, rosso, azzurro** — sono il cuore della palette, non un accento marginale.

### Palette (variabili CSS in `tokens.css`)

```css
:root {
  /* Colori fazzolettone — base identità */
  --color-giallo: #FFC93C;      /* giallo caldo, non fluo */
  --color-rosso: #E8442D;       /* rosso acceso ma non aggressivo */
  --color-azzurro: #2F8FC7;     /* azzurro cielo/scout */

  /* Neutri di supporto per leggibilità */
  --color-bg: #FAF6EC;          /* crema chiaro, richiama la tela/canvas */
  --color-bg-dark: #1E2A33;     /* blu notte per eventuale dark mode */
  --color-text: #21262B;
  --color-text-light: #FFFFFF;

  /* Glow/gradienti coerenti con la palette */
  --glow-giallo: radial-gradient(circle, rgba(255,201,60,0.35), transparent 70%);
  --glow-azzurro: radial-gradient(circle, rgba(47,143,199,0.30), transparent 70%);
}
```

Uso consigliato: azzurro per navbar/elementi strutturali e stati "attivi", giallo per accenti/hover/badge, rosso per call-to-action primarie (es. bottoni "Aggiungi", bottone Bans) e stati di attenzione (conferma eliminazione). Non mescolare i tre colori in gradienti garish: usali come blocchi solidi o glow singoli, mai tutti insieme in un solo elemento.

Font: mantieni Inter o Outfit per il testo, ma valuta un font leggermente più "scout/artigianale" per i titoli (es. un font con carattere robusto/outdoor, non corsivo decorativo) — se non disponibile via Google Fonts gratuito, resta su Outfit in bold/extrabold per i titoli.

Elementi grafici: badge/cuciture stile "distintivo scout" sui bottoni principali (bordo doppio, angoli leggermente smussati non eccessivi), texture sottilissima "canvas/tela" opzionale sullo sfondo (bassissimo contrasto, non deve interferire con la leggibilità).

---

## 🎬 ANIMAZIONI, UI "EFFETTO WOW"

- **Stack Zero Overhead**: nessuna libreria JS pesante. Usa **CSS View Transitions API** per cambi pagina, con fallback obbligatorio:
```css
@view-transition { navigation: auto; }
```
Se `document.startViewTransition` non esiste, il cambio pagina deve avvenire normalmente **senza errori in console** — nessuna feature bloccante.
- Usa **CSS Scroll-Driven Animations** (`animation-timeline: scroll()`) per fade-in allo scroll, con lo stesso principio di fallback silenzioso via `@supports`.
- **Micro-interazioni tattili obbligatorie**: `:active`/`:hover` con `transform: scale(0.96)` e ombre dinamiche su ogni elemento interattivo.
- **Glassmorphism** (`backdrop-filter: blur()`) su navbar/modali, coerente con la palette scout (es. azzurro semi-trasparente).
- **Architettura JS**: Vanilla JS puro, ES6 Modules, file separati per logica.

---

## 📡 OFFLINE, PWA E SINCRONIZZAZIONE — Comportamento garantito

Requisito chiave: **se apro l'app oggi e la riapro fra giorni senza connessione, deve mostrare l'ultima versione sincronizzata con successo**, non una schermata vuota o un errore.

1. **IndexedDB obbligatorio** per i dati (mai LocalStorage per giochi/bans — solo IndexedDB, usa la libreria leggera `idb` o IndexedDB raw).
2. **Cache Service Worker versionata**: `CACHE_NAME = 'giochi-bans-v1'` (incrementare ad ogni deploy), con `skipWaiting()` e `clients.claim()` obbligatori per evitare che un utente resti bloccato su una versione vecchia della cache.
3. **Indicatore di stato di rete**: un banner discreto ("Modalità offline — dati salvati localmente") quando cade la connessione, che sparisce automaticamente al reconnect.
4. **Sync al reconnect**: last-write-wins basato su `updated_at`, sincronizzazione silenziosa in background, nessun blocco della UI.
5. **⚠️ Nota critica iOS Safari**: iOS applica una politica di eviction (ITP) che può cancellare IndexedDB/Cache API dopo ~7 giorni di non-interazione se il sito è aperto come normale scheda browser. Questo **non si applica** se l'app è installata come PWA sulla schermata Home. Per questo motivo:
   - Genera icone reali a 192px e 512px, **più una maskable icon** (obbligatoria per Android, altrimenti il logo viene tagliato male).
   - Aggiungi i meta tag iOS specifici: `apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`.
   - Mostra un banner leggero al primo utilizzo che suggerisce "Aggiungi alla schermata Home" per garantire persistenza offline reale, non solo teorica.

---

## 🖨️ STAMPA

- **Stampa singola**: ogni gioco/ban deve poter essere stampato con `@media print` che nasconde navbar, footer, bottoni, bottom-nav e colori/glow di sfondo, mostrando solo titolo + contenuto testuale.
- **Stampa batch**: nelle pagine `giochi.html`/`bans.html`, permetti la selezione multipla (checkbox) e la stampa di tutti gli elementi selezionati in un'unica sessione di stampa, con `page-break-inside: avoid` su ogni elemento e `page-break-after: always` tra un elemento e il successivo.
- **Leggibilità in condizioni di campo**: font minimo 14pt in stampa, alto contrasto (nero su bianco, niente colori di sfondo).

---

## 📤 FORMATO DI OUTPUT RICHIESTO PER L'AGENTE

**STEP 0 - Analisi e Conferma:**
Dichiara: palette applicata (conferma uso di giallo/rosso/azzurro), struttura tabelle Supabase create, come hai configurato le RLS policy, come gestisci l'Auth admin.

⛔ **GATE OBBLIGATORIO**: ATTENDI la mia conferma esplicita su questa analisi prima di generare qualunque file. Non procedere allo STEP 1 senza il mio via libera.

**STEP 1 - Codice Completo:**
Dopo la mia conferma, genera l'intera struttura di cartelle:
- CSS: `tokens.css` (palette scout), `global.css`, `components.css`, `animations.css`
- JS Modules: `app.js`, `db.js` (client Supabase + IndexedDB), `search.js` (logica di ricerca), `sw.js`
- HTML: `index.html`, `giochi.html`, `bans.html`, `admin.html`
- `manifest.json`, icone PWA (192, 512, maskable), configurazioni complete

**STEP 2 - Checklist di Verifica (puntuale, conferma ogni voce):**
1. ☐ Ricerca multi-campo con normalizzazione accenti e typo tolerance testata
2. ☐ Realtime sync verificato (simula due sessioni/schede aperte)
3. ☐ Transizione offline → online senza perdita dati, banner di stato funzionante
4. ☐ Escape/textContent verificato su input con caratteri speciali (`<`, `&`, virgolette)
5. ☐ Icone PWA e installabilità testate concettualmente su Android e iOS, banner "Aggiungi a Home" presente
6. ☐ Stampa singola e stampa batch con page-break corretto
7. ☐ Fallback silenzioso per View Transitions API e Scroll-Driven Animations su browser non supportati
8. ☐ RLS policy Supabase verificate: lettura pubblica, scrittura solo autenticata
9. ☐ Palette scout (giallo/rosso/azzurro) applicata coerentemente, contrasto testo sempre leggibile
