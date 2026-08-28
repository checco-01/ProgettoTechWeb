-- ============================================================================
-- SEED UTENTI (5)
-- RoadToUnina - script di seed per MySQL 8.x
-- Schema creato da Hibernate (ddl-auto=update), tabelle: users, games, game_steps
-- ============================================================================
SET NAMES utf8mb4;

-- ============================================================================
-- 01_seed_users.sql
-- Crea 5 utenti di esempio.
--   username            password
--   mario.rossi         Password1!
--   lucia.bianchi       Password1!
--   giulia.verdi        Password1!
--   francesco.esposito  Password1!
--   anna.russo          Password1!
-- Gli hash sono BCrypt (BCryptPasswordEncoder di Spring Security, costo 10).
-- ============================================================================

INSERT INTO users (id, username, password_hash, created_at) VALUES
(1001, 'mario.rossi', '$2a$10$Qxi/c8ynF5XvvL95XJGzWOhttt0y1ZR2HGdlZirHWeyRPyLYR9HbW', '2026-08-01 17:00:00'),
(1002, 'lucia.bianchi', '$2a$10$oFICR7og0ao2KI2GCayTCey3qgvH4tiXYzaH5t.HFV.lVZ8.BW0Ny', '2026-08-01 18:00:00'),
(1003, 'giulia.verdi', '$2a$10$Z7.N5dB6SU29r/0SmE4cEeFJe/otUQajpCcyQ39VfChOmwu/oUcSu', '2026-08-01 19:00:00'),
(1004, 'francesco.esposito', '$2a$10$JfmzKZ2e2L7dQjIU9H/51.wytzi/chHZ.MX2HLjurfVIr3qGGKqJq', '2026-08-01 20:00:00'),
(1005, 'anna.russo', '$2a$10$6WOs8gl6t0m.SXIIx7oda.rd5olj6JPzZfUiZo80Q8.tBfGKUmjv2', '2026-08-01 21:00:00');
