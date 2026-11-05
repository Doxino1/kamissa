// Import manuel des événements parisiens (open data « Que faire à Paris »).
// Usage : npm run import-events -- --dry-run
//
// Avec --dry-run, le script affiche ce qui serait importé sans rien écrire.
// En production, ce même import tourne chaque dimanche via le Vercel Cron Job
// défini dans vercel.json (app/api/cron/import-events).

import { importParisEvents } from "../lib/import-events.ts";

const dryRun = process.argv.includes("--dry-run");

importParisEvents({ dryRun, onLog: (line) => console.log(line) }).catch((err) => {
  console.error(err);
  process.exit(1);
});
