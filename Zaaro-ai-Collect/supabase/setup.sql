-- Configuration Supabase pour Zaaro AI Collect
-- Exécuter dans le SQL Editor du dashboard Supabase

-- 1. Créer le bucket de stockage (privé)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recordings',
  'recordings',
  false,
  52428800, -- 50 Mo max par fichier
  array['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/ogg']
)
on conflict (id) do nothing;

-- 2. Les uploads passent par la service role key côté serveur Next.js.
--    Aucune policy publique n'est nécessaire pour les contributeurs.
--    Les lectures admin utilisent des URLs signées générées côté serveur.

-- Optionnel : autoriser la service role (déjà implicite) — policy explicite pour clarté
create policy "Service role full access on recordings"
on storage.objects
for all
to service_role
using (bucket_id = 'recordings')
with check (bucket_id = 'recordings');
