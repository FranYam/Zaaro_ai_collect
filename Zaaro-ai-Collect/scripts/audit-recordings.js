// Audit en lecture seule des enregistrements (aucune modification de la base).
// Utilisation :
//   npx dotenv -e .env.local -- node scripts/audit-recordings.js
//
// Vérifie trois choses :
//   1. Le nombre total d'enregistrements
//   2. Les doublons : un même (userId, phraseId, language) soumis plusieurs fois
//   3. La dérive du compteur : Phrase.recordingCount vs nombre réel de Recording
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // ── 1. Volume global ──────────────────────────────────────────────────────
  const recordings = await p.recording.findMany({
    select: { id: true, userId: true, phraseId: true, language: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  const phrases = await p.phrase.findMany({
    select: { id: true, text: true, recordingCount: true, status: true },
  })
  console.log('Enregistrements totaux :', recordings.length)
  console.log('Phrases totales       :', phrases.length)

  // ── 2. Doublons (userId, phraseId, language) ──────────────────────────────
  // Un contributeur ne doit avoir qu'un seul enregistrement par phrase et par
  // langue. On regroupe en mémoire (jeu de données faible, pas besoin de SQL).
  const groups = new Map()
  for (const r of recordings) {
    const key = `${r.userId}|${r.phraseId}|${r.language}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(r)
  }
  const duplicates = [...groups.entries()].filter(([, rows]) => rows.length > 1)
  console.log('\nDoublons (userId+phraseId+language) :', duplicates.length)
  for (const [key, rows] of duplicates) {
    const [userId, phraseId, language] = key.split('|')
    const phrase = phrases.find(ph => ph.id === phraseId)
    console.log(`  - phrase "${phrase ? phrase.text.slice(0, 50) : phraseId}" / langue ${language}`)
    for (const r of rows) {
      console.log(`      id=${r.id} createdAt=${r.createdAt.toISOString()}`)
    }
  }

  // ── 3. Dérive du compteur ──────────────────────────────────────────────────
  // Compare le recordingCount stocké sur la Phrase au nombre réel de Recording.
  const actualCounts = new Map()
  for (const r of recordings) {
    actualCounts.set(r.phraseId, (actualCounts.get(r.phraseId) || 0) + 1)
  }
  const drifted = phrases
    .map(ph => ({
      text: ph.text.slice(0, 50),
      stocke: ph.recordingCount,
      reel: actualCounts.get(ph.id) || 0,
      status: ph.status,
    }))
    .filter(x => x.stocke !== x.reel)
  console.log('\nPhrases avec compteur divergent (stocké ≠ réel) :', drifted.length)
  for (const d of drifted) {
    console.log(`  - "${d.text}" → stocké=${d.stocke}, réel=${d.reel}, status=${d.status}`)
  }

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log('\n=== RÉSUMÉ ===')
  console.log(`Doublons à supprimer        : ${recordings.length - groups.size}`)
  console.log(`Compteurs à recalculer      : ${drifted.length}`)
  if (duplicates.length === 0 && drifted.length === 0) {
    console.log('✅ Base saine — la contrainte d’unicité peut être appliquée directement.')
  } else {
    console.log('⚠️  Nettoyage requis — exécuter scripts/reconcile-recordings.js avant db push.')
  }
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); process.exit(1); })
