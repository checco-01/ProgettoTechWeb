-- ============================================================================
-- RESET DATI DI SEED
-- RoadToUnina - script di seed per MySQL 8.x
-- Schema creato da Hibernate (ddl-auto=update), tabelle: users, games, game_steps
-- ============================================================================
SET NAMES utf8mb4;

-- ============================================================================
-- 00_reset_seed.sql
-- RIMUOVE i dati di seed esistenti (id utenti 1000-1999, partite 2000-2999,
-- passi 30000-39999) senza toccare eventuali altri dati presenti nel DB.
-- Da eseguire PRIMA degli script 01/02/03 se si vuole ri-popolare.
-- ============================================================================

DELETE FROM game_steps WHERE game_id BETWEEN 2000 AND 2999;
DELETE FROM games      WHERE id BETWEEN 2000 AND 2999;
DELETE FROM users      WHERE id BETWEEN 1000 AND 1999;

-- Riallinea gli AUTO_INCREMENT ai massimi attuali (opzionale, utile dopo i reset)
-- ALTER TABLE game_steps AUTO_INCREMENT = 1;
-- ALTER TABLE games      AUTO_INCREMENT = 1;
-- ALTER TABLE users      AUTO_INCREMENT = 1;
