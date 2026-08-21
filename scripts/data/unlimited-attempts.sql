-- Unlimited attempts (issue #52), applied to waves seeded before the default
-- changed.
--
-- This is a script rather than a migration because course-service does not run
-- its migrations/ directory: it calls GORM AutoMigrate and the SQL files there
-- are dead. Adding a fourth file would have looked applied without ever
-- running. See the note in docs/PROGRESSION-SYSTEM.md.
--
-- New and re-synced waves are already unlimited: the model default is 0 and
-- every content manifest now sets maxReattempts to 0.
--
-- Apply with:
--   docker exec -i studed-postgres psql -U studed -d studed < scripts/data/unlimited-attempts.sql

UPDATE waves SET max_reattempts = 0 WHERE max_reattempts > 0;

SELECT max_reattempts, count(*) AS waves FROM waves GROUP BY max_reattempts;
