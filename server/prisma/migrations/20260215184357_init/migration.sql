-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "rank" TEXT NOT NULL DEFAULT 'Script Kiddie',
    "stealth" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "mitre_techniques" JSONB NOT NULL,
    "handler_group" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "mitre_id" TEXT,
    "title" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "task_type" TEXT NOT NULL,
    "dialogue" JSONB NOT NULL,
    "work_area" JSONB NOT NULL,
    "validation" JSONB NOT NULL,
    "rewards" JSONB NOT NULL,
    "hints" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt" TIMESTAMP(3),
    "last_answer" TEXT,
    "best_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stats" (
    "user_id" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "rank" TEXT NOT NULL DEFAULT 'Script Kiddie',
    "stealth" INTEGER NOT NULL DEFAULT 100,
    "completed_levels" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_mitre_techniques" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "mitre_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_mitre_techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mitre_techniques" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tactic" TEXT NOT NULL,
    "url" TEXT,
    "platforms" JSONB DEFAULT '[]',
    "dataSources" JSONB DEFAULT '[]',
    "defenseBypassed" JSONB DEFAULT '[]',
    "permissionsRequired" JSONB DEFAULT '[]',
    "examples" JSONB DEFAULT '[]',
    "mitigation" JSONB DEFAULT '[]',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mitre_techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_mitre_techniques" (
    "id" SERIAL NOT NULL,
    "mission_id" TEXT NOT NULL,
    "mitre_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_mitre_techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "translations" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'uk',
    "value" TEXT NOT NULL,
    "namespace" TEXT NOT NULL DEFAULT 'common',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handlers" (
    "id" TEXT NOT NULL,
    "code_name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handlers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "levels_mitre_id_idx" ON "levels"("mitre_id");

-- CreateIndex
CREATE INDEX "user_progress_user_id_idx" ON "user_progress"("user_id");

-- CreateIndex
CREATE INDEX "user_progress_level_id_idx" ON "user_progress"("level_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_user_id_level_id_key" ON "user_progress"("user_id", "level_id");

-- CreateIndex
CREATE INDEX "user_mitre_techniques_user_id_idx" ON "user_mitre_techniques"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_mitre_techniques_user_id_mitre_id_key" ON "user_mitre_techniques"("user_id", "mitre_id");

-- CreateIndex
CREATE INDEX "mitre_techniques_tactic_idx" ON "mitre_techniques"("tactic");

-- CreateIndex
CREATE INDEX "mission_mitre_techniques_mission_id_idx" ON "mission_mitre_techniques"("mission_id");

-- CreateIndex
CREATE INDEX "mission_mitre_techniques_mitre_id_idx" ON "mission_mitre_techniques"("mitre_id");

-- CreateIndex
CREATE UNIQUE INDEX "mission_mitre_techniques_mission_id_mitre_id_key" ON "mission_mitre_techniques"("mission_id", "mitre_id");

-- CreateIndex
CREATE INDEX "translations_locale_idx" ON "translations"("locale");

-- CreateIndex
CREATE INDEX "translations_namespace_idx" ON "translations"("namespace");

-- CreateIndex
CREATE UNIQUE INDEX "translations_key_locale_namespace_key" ON "translations"("key", "locale", "namespace");

-- CreateIndex
CREATE UNIQUE INDEX "handlers_code_name_key" ON "handlers"("code_name");

-- CreateIndex
CREATE INDEX "handlers_group_idx" ON "handlers"("group");

-- AddForeignKey
ALTER TABLE "levels" ADD CONSTRAINT "levels_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "levels" ADD CONSTRAINT "levels_mitre_id_fkey" FOREIGN KEY ("mitre_id") REFERENCES "mitre_techniques"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mitre_techniques" ADD CONSTRAINT "user_mitre_techniques_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mitre_techniques" ADD CONSTRAINT "user_mitre_techniques_mitre_id_fkey" FOREIGN KEY ("mitre_id") REFERENCES "mitre_techniques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_mitre_techniques" ADD CONSTRAINT "mission_mitre_techniques_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_mitre_techniques" ADD CONSTRAINT "mission_mitre_techniques_mitre_id_fkey" FOREIGN KEY ("mitre_id") REFERENCES "mitre_techniques"("id") ON DELETE CASCADE ON UPDATE CASCADE;
