-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "support_message_id" TEXT;
ALTER TABLE "notifications" ADD COLUMN "news_post_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "notifications_support_message_id_key" ON "notifications"("support_message_id");
CREATE INDEX "notifications_news_post_id_idx" ON "notifications"("news_post_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_support_message_id_fkey" FOREIGN KEY ("support_message_id") REFERENCES "support_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_news_post_id_fkey" FOREIGN KEY ("news_post_id") REFERENCES "news_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
