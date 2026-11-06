# Archivio legacy (non pubblicato)

Codice del precedente sito "Interni Auto Design" (officina, blog, ordini WhatsApp,
bot Telegram, vecchio catalogo) smontato in Fase 2. Non viene compilato né servito.

- `api/database/seed.ts`: **NON ESEGUIRE** — cancella categorie, prodotti e post.
- Immagini legacy (prodotti, blog, brand, og-image) e foto demo dell'anteprima:
  `/home/user/interniauto-backups/phase2/legacy-public/images/`
- Backup database completo: `/home/user/interniauto-backups/phase2/database-export-2026-11-03.json`
- I 9 prodotti e le 3 categorie legacy restano nel database marcati `legacy=1`
  e `status='archived'` (prodotti) / `visible=0` (categorie). Nessuna riga è stata cancellata.
- Tabelle `orders`, `posts`, `admins`, `bot_sessions` restano nel database e nello
  schema (per evitare che `db:push` le elimini), ma nessuna API le espone.
