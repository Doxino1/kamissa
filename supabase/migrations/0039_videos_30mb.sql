-- Vidéos des posts : 30 Mo au lieu de 50 Mo (environ 30 s en 1080p, 45 s en 720p) par fichier (19/11).
-- Le stockage gratuit est de 1 Go pour tout le site et les vidéos en
-- prenaient l'essentiel. lib/upload.ts refuse déjà au-delà de 30 Mo avant
-- l'envoi ; la limite du bucket l'impose aussi côté serveur. Les vidéos déjà
-- envoyées ne sont pas touchées.
update storage.buckets
set file_size_limit = 31457280
where id = 'videos';
