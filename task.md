# Interni Auto Luxury Boutique — avanzamento

## Approvazioni
- Piano `/home/user/plan.md` approvato il 2 novembre 2026.
- Questo turno implementa solo Fase 1: due alternative, poi pausa obbligatoria per scelta.
- Prodotti demo non acquistabili; nessuna scrittura nel database, nessun addebito.

## Lavoro
- [x] Backup codice UI e design esistente.
- [x] Nuovo logo: originali puliti, variante testo crema solo per fondo scuro.
- [x] Confronto React gestito: home, catalogo filtrabile, scheda foto demo.
- [x] Asset e font locali, noindex per anteprime.
- [x] Test desktop/mobile e interazioni, lint/typecheck/build.
- [x] Screenshot A/B distinti e consegna sito.

## Non eseguire prima della scelta
- Nessuna dashboard o migrazione catalogo in questo checkpoint.
- Nessuna pubblicazione di testi legali.
- API commerciali legacy non modificate in Fase 1; nessun collegamento alle anteprime.
- Tariffa/tempi/indirizzo resi e credenziali ancora mancanti.
## Verifica Fase 1 (2 novembre 2026)
- Playwright: 2 temi × home/catalogo/scheda a 1440/1024/768/390 px; nessun overflow, nessuna immagine rotta, nessun errore pagina, nessuna chiamata `/api/rpc`, nessun dominio esterno, nessun cookie. Report: `/home/user/interniauto-previews/verification.json`.
- Interazioni verificate: filtri, ricerca/vuoto/reset, ordinamento, galleria, acquisto disabilitato, switch tema, menu mobile, skip link.
- `bun run lint`, `typecheck`, `build`: passati.
- Logo: marchio trasparente (linee auto crema su tema scuro), favicon nuova (backup vecchia in `/home/user/interniauto-backups/phase1/favicon.ico`).
- Nota: tutte le route mostrano l'anteprima (anche il vecchio sito non è più composto); routing definitivo e 404 in Fase 2.

## In attesa
- Scelta A scura / B chiara.
- Tariffe e tempi di spedizione, indirizzo resi, regime fiscale, dati dimensione impresa, CAP sede, credenziali Stripe/email.

---
# Fase 2 — negozio + dashboard (variante A scura scelta il 3/11/2026)

## Decisioni
- Tema unico scuro; anteprime /anteprima e prodotti demo rimossi dal sito pubblico.
- Admin: Better Auth email/password, signup disabilitato, allowlist server-side info@interniautodesign.it, bearer in sessionStorage (iframe preview), rate limit login.
- Segreti Stripe cifrati AES-256-GCM (SETTINGS_ENCRYPTION_KEY in .env), mai restituiti al browser.
- Checkout: modalità test solo con sessione admin; live solo se Stripe live + spedizione + condizioni pubblicate (Fase 3) + prodotti.
- Stock prenotato alla creazione sessione Stripe (scadenza 30 min), rilasciato su expired/cancel/sweep.
- Pagato solo via webhook firmato o retrieve server-side della sessione.
- Legacy: prodotti/categorie marcati legacy+archived; blog/telegram/media/ordini WhatsApp smontati dal router; file legacy spostati fuori da public in /home/user/interniauto/archivio-legacy.
- Backup DB: /home/user/interniauto-backups/phase2/database-export-2026-11-03.json; progetto: project-before-phase2.tgz

## Stato
- [x] Backup
- [x] Schema + migrazione additive + archivio legacy
- [x] Auth + account admin
- [x] API pubbliche (catalogo, carrello, checkout, ordine, webhook)
- [x] API admin (prodotti, foto, categorie, spedizioni, stripe, ordini)
- [x] UI pubblica scura
- [x] UI dashboard (panoramica, prodotti+foto, categorie, ordini, impostazioni)
- [x] Test API sicurezza + browser + lint/typecheck/build

## Note sessione 3/11 (dopo compattazione)
- ADMIN_INITIAL_PASSWORD rimossa da .env.
- Frontend in corso: boutique.css, pagine pubbliche, dashboard.

### Chiusura Fase 2 (3/11/2026)
- Test curl: create anonimo 403; San Marino/estero 400; legacy → missing/403; stock insufficiente segnalato; campi prezzo nel carrello ignorati; ordine con token falso 404; webhook senza segreto 503, firma errata/assente/vecchia 400, firma valida 200.
- Test browser (desktop 1440 + mobile 390): pagine pubbliche, 404, redirect login, categoria → prodotto con upload Tigris → pubblicazione → catalogo/scheda/carrello; checkout admin bloccato senza Stripe+spedizione.
- Pulizia: prodotto e categoria di test eliminati, 2 file di test rimossi dal bucket, segreto webhook finto e evento rimossi, tutte le sessioni revocate.
- Bloccanti: chiave Stripe test + whsec, tariffe/tempi spedizione, indirizzo resi, CAP sede, regime IVA, dimensione impresa, provider email, bozze legali (Fase 3).
- Nota: il 404 è solo lato client (il server risponde 200 su ogni rotta).
