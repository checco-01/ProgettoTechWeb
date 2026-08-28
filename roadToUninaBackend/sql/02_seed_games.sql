-- ============================================================================
-- SEED PARTITE (25)
-- RoadToUnina - script di seed per MySQL 8.x
-- Schema creato da Hibernate (ddl-auto=update), tabelle: users, games, game_steps
-- ============================================================================
SET NAMES utf8mb4;

-- ============================================================================
-- 02_seed_games.sql
-- 5 partite COMPLETATE per ciascuno dei 5 utenti (25 partite in totale).
-- Ogni partita è 'Completed' e termina sull'obiettivo del gioco:
--   Università_degli_Studi_di_Napoli_Federico_II
-- number_of_steps esclude lo step 0 (pagina di partenza): equivale ai
-- click fatti dall'utente (coerente con GameService.startGame/recordStep).
-- ============================================================================

INSERT INTO games (id, user_id, start_url, number_of_steps, time_elapsed_seconds, game_status, created_at) VALUES
(2001, 1001, 'Napoli', 1, 87, 'Completed', '2026-08-03 09:12:00'),
(2002, 1001, 'Vesuvio', 2, 152, 'Completed', '2026-08-05 15:40:00'),
(2003, 1001, 'Castel_dell''Ovo', 2, 134, 'Completed', '2026-08-10 11:05:00'),
(2004, 1001, 'Pizza', 2, 118, 'Completed', '2026-08-17 18:22:00'),
(2005, 1001, 'Federico_II_di_Svevia', 1, 95, 'Completed', '2026-08-21 10:33:00'),
(2006, 1002, 'Campania', 2, 143, 'Completed', '2026-08-02 16:00:00'),
(2007, 1002, 'Italia', 3, 210, 'Completed', '2026-08-06 12:15:00'),
(2008, 1002, 'Roma', 4, 289, 'Completed', '2026-08-09 20:45:00'),
(2009, 1002, 'Diego_Armando_Maradona', 3, 176, 'Completed', '2026-08-14 17:30:00'),
(2010, 1002, 'Gaetano_Manfredi', 2, 122, 'Completed', '2026-08-19 08:50:00'),
(2011, 1003, 'San_Gennaro', 2, 141, 'Completed', '2026-08-01 10:00:00'),
(2012, 1003, 'Piazza_del_Plebiscito', 2, 155, 'Completed', '2026-08-04 19:20:00'),
(2013, 1003, 'Certosa_di_San_Martino', 2, 137, 'Completed', '2026-08-08 14:10:00'),
(2014, 1003, 'Storia_di_Napoli', 2, 168, 'Completed', '2026-08-12 09:40:00'),
(2015, 1003, 'Giambattista_Vico', 1, 78, 'Completed', '2026-08-16 21:05:00'),
(2016, 1004, 'Pompei', 3, 233, 'Completed', '2026-08-05 08:30:00'),
(2017, 1004, 'Lazio', 5, 356, 'Completed', '2026-08-07 13:55:00'),
(2018, 1004, 'Salerno', 3, 201, 'Completed', '2026-08-11 16:25:00'),
(2019, 1004, 'Ischia_(isola)', 3, 188, 'Completed', '2026-08-15 10:15:00'),
(2020, 1004, 'Capri_(comune)', 2, 195, 'Completed', '2026-08-20 17:40:00'),
(2021, 1005, 'Città_del_Vaticano', 5, 312, 'Completed', '2026-08-02 11:20:00'),
(2022, 1005, 'Mar_Mediterraneo', 4, 245, 'Completed', '2026-08-06 15:35:00'),
(2023, 1005, 'Unità_d''Italia', 4, 227, 'Completed', '2026-08-13 09:55:00'),
(2024, 1005, 'Seconda_guerra_mondiale', 4, 342, 'Completed', '2026-08-18 20:10:00'),
(2025, 1005, 'Vesuvio', 2, 104, 'Completed', '2026-08-22 12:45:00');
