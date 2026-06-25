import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { loadMultipleNamespaces } from '../i18n/config';
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_TOPICS,
  type CommunityCategoryId,
  type CommunityTopic,
} from '../constants/community';

export default function CommunityPage() {
  const { t, i18n } = useTranslation(['community', 'ui']);
  const [translationsTick, setTranslationsTick] = useState(0);
  const [activeCategory, setActiveCategory] = useState<CommunityCategoryId>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    COMMUNITY_TOPICS[0]?.id ?? null
  );

  const isEn = i18n.resolvedLanguage?.startsWith('en') ?? false;

  useEffect(() => {
    const locale = isEn ? 'en' : 'uk';
    void loadMultipleNamespaces(locale, ['community', 'ui']).then(() => {
      setTranslationsTick((tick) => tick + 1);
    });
  }, [isEn, i18n.resolvedLanguage, i18n.language]);

  const filteredTopics = useMemo(() => {
    if (activeCategory === 'all') {
      return COMMUNITY_TOPICS;
    }
    return COMMUNITY_TOPICS.filter((topic) => topic.categoryId === activeCategory);
  }, [activeCategory]);

  const selectedTopic = useMemo(
    () => filteredTopics.find((topic) => topic.id === selectedTopicId) ?? filteredTopics[0] ?? null,
    [filteredTopics, selectedTopicId]
  );

  useEffect(() => {
    if (filteredTopics.length === 0) {
      setSelectedTopicId(null);
      return;
    }
    if (!filteredTopics.some((topic) => topic.id === selectedTopicId)) {
      setSelectedTopicId(filteredTopics[0].id);
    }
  }, [filteredTopics, selectedTopicId]);

  const getCategoryLabel = (categoryId: CommunityCategoryId): string =>
    t(`categories.${categoryId}`, { ns: 'community' });

  const renderThread = (topic: CommunityTopic) => (
    <motion.div
      key={topic.id}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-4 min-h-0"
    >
      <div>
        <span className="text-xs px-2 py-1 rounded bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary">
          {getCategoryLabel(topic.categoryId)}
        </span>
        <h2 className="font-heading font-bold text-xl text-cyber-primary mt-3 leading-snug">
          {t(topic.titleKey, { ns: 'community' })}
        </h2>
        <p className="text-xs text-gray-500 mt-2">
          {t('metaReplies', {
            ns: 'community',
            count: topic.replyCount,
          })}{' '}
          · {t(topic.lastActivityKey, { ns: 'community' })}
        </p>
      </div>

      <div className="space-y-3 overflow-y-auto cyber-scrollbar pr-1">
        {topic.posts.map((post, index) => (
          <article
            key={post.id}
            className={`rounded-lg border p-4 ${
              index === 0
                ? 'border-cyber-primary/40 bg-cyber-primary/5'
                : 'border-cyber-border bg-cyber-panel/40 ml-0 sm:ml-4'
            }`}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
              <span className="text-sm font-medium text-cyber-primary">
                {t(post.authorKey, { ns: 'community' })}
              </span>
              <span className="text-xs text-gray-500">{t(post.timeKey, { ns: 'community' })}</span>
              {index === 0 && (
                <span className="text-[10px] uppercase tracking-wider text-gray-500 border border-cyber-border rounded px-1.5 py-0.5">
                  {t('originalPost', { ns: 'community' })}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {t(post.bodyKey, { ns: 'community' })}
            </p>
          </article>
        ))}
      </div>

      <p className="text-xs text-gray-500 border border-dashed border-cyber-border rounded-lg p-3">
        {t('readOnlyNotice', { ns: 'community' })}
      </p>
    </motion.div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <span hidden>{translationsTick}</span>
      <div className="max-w-6xl mx-auto">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary mb-2 text-center">
          {t('title', { ns: 'community' })}
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-6 text-center max-w-2xl mx-auto">
          {t('intro', { ns: 'community' })}
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {COMMUNITY_CATEGORIES.map((categoryId) => (
            <button
              key={categoryId}
              type="button"
              onClick={() => setActiveCategory(categoryId)}
              className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === categoryId
                  ? 'border-cyber-primary bg-cyber-primary/15 text-cyber-primary'
                  : 'border-cyber-border text-gray-400 hover:border-cyber-primary/50 hover:text-gray-200'
              }`}
            >
              {getCategoryLabel(categoryId)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[auto_1fr] gap-x-6 gap-y-3 lg:items-start">
          <h2 className="font-heading font-bold text-sm text-gray-400 uppercase tracking-wider lg:mb-0">
            {t('topicsHeading', { ns: 'community' })}
          </h2>
          <h2 className="hidden lg:block font-heading font-bold text-sm text-gray-400 uppercase tracking-wider">
            {t('discussionHeading', { ns: 'community' })}
          </h2>

          <div className="space-y-2 min-w-0 lg:row-start-2 lg:col-start-1">
            {filteredTopics.length === 0 ? (
              <div className="cyber-panel border border-dashed border-cyber-border p-6 text-center text-sm text-gray-500">
                {t('noTopics', { ns: 'community' })}
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const isSelected = selectedTopic?.id === topic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`w-full text-left cyber-panel p-4 border-2 transition-colors ${
                      isSelected
                        ? 'border-cyber-primary bg-cyber-primary/5'
                        : 'border-cyber-border hover:border-cyber-primary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">
                        {getCategoryLabel(topic.categoryId)}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {t('replyCount', { ns: 'community', count: topic.replyCount })}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-cyber-primary leading-snug mb-2">
                      {t(topic.titleKey, { ns: 'community' })}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {t(topic.excerptKey, { ns: 'community' })}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-2">
                      {t(topic.lastActivityKey, { ns: 'community' })}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          <div className="cyber-panel border border-cyber-border p-5 sm:p-6 min-h-[20rem] lg:row-start-2 lg:col-start-2 lg:sticky lg:top-4">
            <h2 className="font-heading font-bold text-sm text-gray-400 uppercase tracking-wider mb-4 lg:hidden">
              {t('discussionHeading', { ns: 'community' })}
            </h2>
            <AnimatePresence mode="wait">
              {selectedTopic ? (
                renderThread(selectedTopic)
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-500 text-center py-12"
                >
                  {t('selectTopic', { ns: 'community' })}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
