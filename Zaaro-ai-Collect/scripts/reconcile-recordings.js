// Réconciliation unique des données d'enregistrement (à exécuter une seule fois).
// Utilisation :
//   npx dotenv -e .env.local -- node scripts/reconcile-recordings.js
//
// Ce script :
//   1. Sauvegarde les tables recordings et phrases dans backups/<timestamp>/
//      (point de restauration local avant toute modification)
//   2. Dédoublonne : pour chaque groupe (userId, phraseId, language) avec
//      plusieurs soumissions, conserve le plus ancien (createdAt, puis id)
//      et supprime les suivants — lignes en base + fichiers audio Supabase
//   3. Recalcule les compteurs : Phrase.recordingCount = nombre réel de
//      Recording ; status = DONE si >= MAX_RECORDINGS, sinon PENDING
//
// ⚠️ Exécuter scripts/audit-recordings.js d'abord pour voir l'état initial.
const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const p = new PrismaClient()

// Doit rester identique à MAX_RECORDINGS dans src/app/api/recordings/route.ts
const MAX_RECORDINGS = 10
const RECORDINGS_BUCKET = 'recordings'

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Variables Supabase manquantes dans .env.local')
  return createClient(url, key)
}

// Un chemin de stockage est relatif au bucket ; les anciens enregistrements
// peuvent stocker des URLs http(s) directes qu'il ne faut pas "supprimer".
function isBucketPath(value) {
  return Boolean(value) && !value.startsWith('http://') && !value.startsWith('https://')
}

async function backupTables(recordings, phrases) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = path.join(__dirname, '..', 'backups', stamp)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'recordings.json'), JSON.stringify(recordings, null, 2))
  fs.writeFileSync(path.join(dir, 'phrases.json'), JSON.stringify(phrases, null, 2))
  console.log(`Sauvegarde écrite dans backups/${stamp}/`)
  return dir
}

async function main() {
  const recordings = await p.recording.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] })
  const phrases = await p.phrase.findMany()
  console.log(`Avant : ${recordings.length} enregistrements, ${phrases.length} phrases`)

  // ── 1. Sauvegarde locale ──────────────────────────────────────────────────
  await backupTables(recordings, phrases)

  // ── 2. Dédoublonnage (keep earliest) ──────────────────────────────────────
  const groups = new Map()
  for (const r of recordings) {
    const key = `${r.userId}|${r.phraseId}|${r.language}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(r) // trié par createdAt asc puis id asc
  }

  const toDelete = []
  for (const rows of groups.values()) {
    if (rows.length > 1) toDelete.push(...rows.slice(1)) // conserve rows[0]
  }

  const deletedIds = new Set(toDelete.map(r => r.id))

  if (toDelete.length > 0) {
    // Suppression best-effort des fichiers audio (uniquement chemins bucket)
    const paths = toDelete.flatMap(r => [r.audioUrl, r.audioUrl2]).filter(isBucketPath)
    if (paths.length > 0) {
      const supabase = createSupabaseAdmin()
      const { error } = await supabase.storage.from(RECORDINGS_BUCKET).remove(paths)
      if (error) console.warn('Suppression fichiers (non bloquant) :', error.message)
    }
    const ids = toDelete.map(r => r.id)
    await p.recording.deleteMany({ where: { id: { in: ids } } })
    console.log(`Doublons supprimés : ${toDelete.length} (fichiers : ${paths.length})`)
  } else {
    console.log('Doublons supprimés : 0 — rien à faire')
  }

  // ── 3. Recalcul des compteurs ────────────────────────────────────────────
  const actualCounts = new Map()
  for (const r of recordings.filter(r => !deletedIds.has(r.id))) {
    actualCounts.set(r.phraseId, (actualCounts.get(r.phraseId) || 0) + 1)
  }

  let fixed = 0
  for (const ph of phrases) {
    const actual = actualCounts.get(ph.id) || 0
    const status = actual >= MAX_RECORDINGS ? 'DONE' : 'PENDING'
    if (ph.recordingCount !== actual || ph.status !== status) {
      await p.phrase.update({ where: { id: ph.id }, data: { recordingCount: actual, status } })
      fixed++
      console.log(`  - "${ph.text.slice(0, 50)}" → recordingCount=${actual}, status=${status}`)
    }
  }
  console.log(`Compteurs corrigés : ${fixed}`)

  console.log('\n✅ Réconciliation terminée. Relancer scripts/audit-recordings.js pour vérifier.')
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); process.exit(1); })
