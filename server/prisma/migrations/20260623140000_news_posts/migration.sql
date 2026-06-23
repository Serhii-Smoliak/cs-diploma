-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NEWS';

-- CreateTable
CREATE TABLE "news_posts" (
    "id" TEXT NOT NULL,
    "title_uk" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "body_uk" TEXT NOT NULL,
    "body_en" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "news_posts_is_published_published_at_idx" ON "news_posts"("is_published", "published_at");

-- AddForeignKey
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
