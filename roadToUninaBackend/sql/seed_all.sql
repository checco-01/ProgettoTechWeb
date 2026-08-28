-- ============================================================================
-- SEED COMPLETO (master)
-- RoadToUnina - script di seed per MySQL 8.x
-- Schema creato da Hibernate (ddl-auto=update), tabelle: users, games, game_steps
-- ============================================================================
SET NAMES utf8mb4;

-- ============================================================================
-- seed_all.sql
-- Script "master": resetta e ripopola l'intero dataset di demo.
-- Uso (dalla cartella roadToUninaBackend/sql):
--   mysql -u RoadToUnina -p roadtounina < seed_all.sql
-- Oppure dal client mysql:  SOURCE seed_all.sql;
-- ============================================================================

SOURCE 00_reset_seed.sql;
SOURCE 01_seed_users.sql;
SOURCE 02_seed_games.sql;
SOURCE 03_seed_game_steps.sql;
