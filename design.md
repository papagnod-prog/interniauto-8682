# Interni Auto — Luxury Boutique: design definitivo (Fase 2, variante A scura)

Scelta dell'utente il 3/11/2026: **A scura**. Tema unico, nessun interruttore chiaro/scuro.
Negozio di sola vendita di volanti e tappezzerie plurimarche: nessun riferimento a officina,
lavorazioni, restauri o realizzazioni.

## Identità
- Logo: `mark-dark.png` (sedile/auto con linee crema) + `wordmark-dark.png` su fondo scuro.
- Titoli editoriali Cormorant Garamond 500 ("Boutique Editorial"), corsivo oro per l'enfasi.
- Corpo, controlli e dati Manrope 400–700 ("Boutique Sans"). Font serviti localmente.
- Eyebrow: Manrope 700, 10–11px, tracking 0.2em, maiuscolo, oro.

## Colori (CSS vars in `boutique.css`, classe `.bp-site`)
| Token | Valore | Uso |
|---|---|---|
| `--bp-bg` | #161715 | fondo |
| `--bp-surface` | #22231f | pannelli, campi |
| `--bp-hero` | #25261f | fondi immagine |
| `--bp-footer` | #11120f | footer, sidebar admin |
| `--bp-text` | #f1eadc | testo |
| `--bp-muted` | #b8b2a6 | testo secondario |
| `--bp-accent` | #c89b65 | oro: prezzi, eyebrow, focus |
| `--bp-button` | #cfaa77 | CTA pieni, testo #181b15 |
| `--bp-line` | #44463e | filetti 1px |
| `--bp-danger` | #e38b76 | errori |
| `--bp-ok` | #9fc79a | conferme |

## Layout e componenti
- Container 1396px, gutter 56px desktop / 22px mobile. Hero asimmetrica, filetti sottili.
- Card prodotto senza riquadri: foto 4:5 su `--bp-hero`, testo sotto, prezzo oro.
- Bottoni rettangolari (radius 0), maiuscoletto con tracking; outline per azioni secondarie.
- Campi: fondo `--bp-surface`, bordo `--bp-line`, focus outline oro 2px offset 3px, label sempre visibili.
- Stati: vuoto elegante (titolo editoriale + testo breve), errori in `--bp-danger` con testo,
  badge "TEST" ben visibile su tutto ciò che riguarda la modalità di prova Stripe.
- Movimento: solo reveal leggeri, rispetto di prefers-reduced-motion.

## Dashboard (/admin)
Stessa palette, più densa: sidebar `--bp-footer` 248px, contenuto a tabelle con filetti,
titoli Cormorant 40px, numeri tabellari Manrope. Mobile: sidebar diventa barra orizzontale scorrevole.

## Regole di contenuto
- WhatsApp solo per assistenza, mai per ordini. Solo spedizione in Italia.
- Testi legali non pubblicati fino alla Fase 3: il footer lo dichiara.
- Nessuna mappa Google, nessun chatbot, nessun font esterno.

## Archivio — design del sito precedente (non applicare). Anteprime Fase 1: backup in interniauto-backups/phase1/design.md

Restyling di interniautodesign.it. Tappezzeria auto artigianale (Corato, BA) con trent'anni di mestiere:
il sito deve trasmettere **officina premium + pellame cucito a mano**, non e-commerce generico.

## Direzione visiva

Dark automotive premium: nero carbone, pelle cognac, cuciture crema. Foto prodotto grandi e ravvicinate,
tipografia industriale in maiuscolo, molto spazio nero attorno alle immagini. Zero card bianche arrotondate,
zero gradienti viola, nessun Inter/Roboto.

## Colori

| Token | Valore | Uso |
|---|---|---|
| `--ink` | `oklch(0.16 0.006 60)` — #16161A | sfondo base |
| `--ink-deep` | `oklch(0.11 0.005 60)` | sezioni alternate, footer |
| `--surface` | `oklch(0.21 0.008 60)` | pannelli, card prodotto |
| `--surface-2` | `oklch(0.26 0.01 60)` | hover, bordi interni |
| `--leather` | `oklch(0.66 0.11 62)` — cognac | accento primario, CTA, prezzi |
| `--leather-deep` | `oklch(0.52 0.11 55)` | hover CTA, ombre calde |
| `--stitch` | `oklch(0.93 0.02 85)` — crema | testo su scuro, cuciture decorative |
| `--muted` | `oklch(0.68 0.01 70)` | testo secondario |
| `--wa` | `oklch(0.72 0.17 150)` — #25D366 | solo bottoni WhatsApp |
| `--line` | `oklch(1 0 0 / 12%)` | divisori hairline |

Regola: il cognac è accento, non decorazione — CTA, prezzi, numeri di sezione, hover. Il verde WhatsApp
appare **solo** sui pulsanti d'ordine.

## Tipografia

- Display: **Anton** (Google Fonts) — titoli in MAIUSCOLO, `letter-spacing: -0.01em`, righe strette (0.95).
- Body: **Manrope** 400/500/700 — `line-height: 1.65`, testi corti in `--muted`.
- Etichette/eyebrow: Manrope 700, `text-[11px]`, `tracking-[0.22em]`, uppercase, colore cognac.
- Scala: hero `clamp(3rem, 9vw, 7.5rem)` · h2 `clamp(2rem, 4.5vw, 3.5rem)` · h3 `1.35rem` · body `1.0625rem`.

## Layout

- Contenitore `max-w-[1280px]`, padding laterale `px-5 md:px-10`.
- Griglie asimmetriche: hero 7/5, sezione storia 5/7 con immagine che sborda oltre la colonna.
- Sezioni separate da hairline `--line` + numerazione (`01 — CATALOGO`).
- Card prodotto: immagine 4:5 piena, testo sotto senza box, bordo solo su hover, angoli 2px (quasi vivi).
- Densità controllata: spazio verticale generoso (`py-24 md:py-32`), niente riempitivi.

## Texture e sfondi

- Grana pellicola leggera in overlay (`radial-gradient` + noise SVG a bassa opacità).
- Pattern "cucitura": linea tratteggiata cognac 1px usata come divisore o cornice di dettaglio.
- Bagliore caldo radiale dietro l'hero e dietro le immagini prodotto.

## Motion

Un solo ingresso orchestrato per pagina: reveal in sequenza (opacity + translateY 16px, stagger 60ms,
`cubic-bezier(.2,.7,.2,1)`), via CSS. Hover: immagine `scale(1.03)` 500ms, freccia CTA che avanza 4px.
Nessuna animazione perpetua.

## Componenti chiave

- **Header** sticky trasparente → nero al primo scroll, con barra contatti (tel, WhatsApp, orari).
- **Bottone WhatsApp**: pieno verde, icona, testo "Ordina su WhatsApp".
- **Bottone primario**: cognac pieno, uppercase, tracking largo, angolo 2px.
- **Carrello a drawer** laterale nero con riepilogo e totale in cognac.
- **Checkout**: colonna form + riepilogo sticky; scelta pagamento a 3 tessere (Carta/Stripe · Bonifico · Contanti).
- **Badge categoria**: eyebrow cognac su bordo hairline.

## Contenuti e voce

Italiano, diretto, artigiano: "trent'anni di mestiere", "su misura", "pelle vera cucita a mano".
Dati reali: Via Brindisi 26/28, Corato (BA) · Tel +39 333 35 62 836 · WhatsApp +39 345 49 58 428 ·
info@interniautodesign.it · Lun–Ven 08–13 / 15–19, Sab 08–13 · P.IVA 07166400726.

