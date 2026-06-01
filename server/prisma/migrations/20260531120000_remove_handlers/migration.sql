-- Drop legacy handlers API tables/columns
DROP TABLE IF EXISTS "handlers";

ALTER TABLE "missions" DROP COLUMN IF EXISTS "handler_group";
