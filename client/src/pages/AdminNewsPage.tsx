import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import ConfirmModal from '../components/common/ConfirmModal';
import { api, type NewsPost } from '../services/api';

const emptyForm = {
  titleUk: '',
  titleEn: '',
  bodyUk: '',
  bodyEn: '',
  isPublished: false,
};

type NewsFormState = typeof emptyForm;

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function useAdminNews(t: TFunction, isEn: boolean) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminNewsPosts();
      setPosts(data);
    } catch (err) {
      setError(
        toErrorMessage(
          err,
          t('adminNewsLoadError', {
            ns: 'ui',
            defaultValue: isEn ? 'Failed to load news.' : 'Не вдалося завантажити новини.',
          })
        )
      );
    } finally {
      setLoading(false);
    }
  }, [t, isEn]);

  useEffect(() => {
    loadPosts().catch(() => {
      // loadPosts already sets error state
    });
  }, [loadPosts]);

  const resetForm = () => {
    setSelectedId(null);
    setForm(emptyForm);
  };

  const startCreate = () => {
    setSelectedId(null);
    setForm(emptyForm);
  };

  const startEdit = (post: NewsPost) => {
    setSelectedId(post.id);
    setForm({
      titleUk: post.titleUk,
      titleEn: post.titleEn,
      bodyUk: post.bodyUk,
      bodyEn: post.bodyEn,
      isPublished: post.isPublished,
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (selectedId) {
        await api.updateAdminNewsPost(selectedId, form);
      } else {
        await api.createAdminNewsPost(form);
      }
      resetForm();
      await loadPosts();
    } catch (err) {
      setError(
        toErrorMessage(
          err,
          t('adminNewsSaveError', {
            ns: 'ui',
            defaultValue: isEn ? 'Failed to save news.' : 'Не вдалося зберегти новину.',
          })
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.deleteAdminNewsPost(deletingId);
      if (selectedId === deletingId) {
        resetForm();
      }
      setDeletingId(null);
      await loadPosts();
    } catch (err) {
      setError(
        toErrorMessage(
          err,
          t('adminNewsDeleteError', {
            ns: 'ui',
            defaultValue: isEn ? 'Failed to delete news.' : 'Не вдалося видалити новину.',
          })
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    posts,
    selectedId,
    form,
    setForm,
    loading,
    saving,
    deletingId,
    setDeletingId,
    error,
    isEditing: selectedId !== null,
    resetForm,
    startCreate,
    startEdit,
    handleSubmit,
    handleDelete,
  };
}

function AdminNewsPostList({
  posts,
  selectedId,
  isEn,
  t,
  onEdit,
  onDelete,
}: Readonly<{
  posts: NewsPost[];
  selectedId: string | null;
  isEn: boolean;
  t: TFunction;
  onEdit: (post: NewsPost) => void;
  onDelete: (postId: string) => void;
}>) {
  if (posts.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        {t('adminNewsEmpty', {
          ns: 'ui',
          defaultValue: isEn ? 'No articles yet.' : 'Публікацій поки немає.',
        })}
      </div>
    );
  }

  return (
    <div className="divide-y divide-cyber-border/60 max-h-[32rem] overflow-y-auto">
      {posts.map((post) => (
        <div
          key={post.id}
          className={`px-4 py-3 ${selectedId === post.id ? 'bg-cyber-panel/60' : ''}`}
        >
          <div className="flex items-start justify-between gap-3">
            <button type="button" onClick={() => onEdit(post)} className="text-left min-w-0 flex-1">
              <div className="font-medium text-gray-100 truncate">{post.titleUk}</div>
              <div className="text-xs text-gray-500 mt-1">
                {post.isPublished
                  ? t('adminNewsPublished', {
                      ns: 'ui',
                      defaultValue: isEn ? 'Published' : 'Опубліковано',
                    })
                  : t('adminNewsDraft', {
                      ns: 'ui',
                      defaultValue: isEn ? 'Draft' : 'Чернетка',
                    })}
              </div>
            </button>
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="text-xs text-red-400 hover:underline shrink-0"
            >
              {t('delete', { ns: 'ui', defaultValue: isEn ? 'Delete' : 'Видалити' })}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminNewsEditorForm({
  form,
  isEditing,
  isEn,
  saving,
  t,
  onChange,
  onSubmit,
  onCancel,
}: Readonly<{
  form: NewsFormState;
  isEditing: boolean;
  isEn: boolean;
  saving: boolean;
  t: TFunction;
  onChange: (next: NewsFormState) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}>) {
  return (
    <>
      <h2 className="font-heading text-lg text-cyber-primary mb-4">
        {isEditing
          ? t('adminNewsEdit', {
              ns: 'ui',
              defaultValue: isEn ? 'Edit article' : 'Редагування',
            })
          : t('adminNewsCreate', {
              ns: 'ui',
              defaultValue: isEn ? 'New article' : 'Нова публікація',
            })}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
            {t('adminNewsTitleUk', {
              ns: 'ui',
              defaultValue: isEn ? 'Title (UK)' : 'Заголовок (UK)',
            })}
          </span>
          <input
            value={form.titleUk}
            onChange={(event) => onChange({ ...form, titleUk: event.target.value })}
            maxLength={200}
            required
            className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyber-primary"
          />
        </label>

        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
            {t('adminNewsTitleEn', {
              ns: 'ui',
              defaultValue: isEn ? 'Title (EN)' : 'Заголовок (EN)',
            })}
          </span>
          <input
            value={form.titleEn}
            onChange={(event) => onChange({ ...form, titleEn: event.target.value })}
            maxLength={200}
            required
            className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyber-primary"
          />
        </label>

        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
            {t('adminNewsBodyUk', {
              ns: 'ui',
              defaultValue: isEn ? 'Text (UK)' : 'Текст (UK)',
            })}
          </span>
          <textarea
            value={form.bodyUk}
            onChange={(event) => onChange({ ...form, bodyUk: event.target.value })}
            rows={5}
            maxLength={10000}
            required
            className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyber-primary resize-none"
          />
        </label>

        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
            {t('adminNewsBodyEn', {
              ns: 'ui',
              defaultValue: isEn ? 'Text (EN)' : 'Текст (EN)',
            })}
          </span>
          <textarea
            value={form.bodyEn}
            onChange={(event) => onChange({ ...form, bodyEn: event.target.value })}
            rows={5}
            maxLength={10000}
            required
            className="w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyber-primary resize-none"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(event) => onChange({ ...form, isPublished: event.target.checked })}
          />
          {t('adminNewsPublish', {
            ns: 'ui',
            defaultValue: isEn ? 'Publish' : 'Опублікувати',
          })}
        </label>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded border border-cyber-primary text-cyber-primary text-sm hover:bg-cyber-primary/10 transition-colors disabled:opacity-50"
          >
            {saving
              ? t('saving', {
                  ns: 'ui',
                  defaultValue: isEn ? 'Saving...' : 'Збереження...',
                })
              : t('save', { ns: 'ui', defaultValue: isEn ? 'Save' : 'Зберегти' })}
          </button>
          {isEditing && (
            <button
              type="button"
              disabled={saving}
              onClick={onCancel}
              className="px-4 py-2 rounded border border-cyber-border text-gray-400 text-sm hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              {t('cancel', { ns: 'ui', defaultValue: isEn ? 'Cancel' : 'Скасувати' })}
            </button>
          )}
        </div>
      </form>
    </>
  );
}

export default function AdminNewsPage() {
  const { t, i18n } = useTranslation(['ui']);
  const isEn = i18n.resolvedLanguage?.startsWith('en') ?? false;
  const {
    posts,
    selectedId,
    form,
    setForm,
    loading,
    saving,
    deletingId,
    setDeletingId,
    error,
    isEditing,
    resetForm,
    startCreate,
    startEdit,
    handleSubmit,
    handleDelete,
  } = useAdminNews(t, isEn);

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary">
            {t('adminNews', {
              ns: 'ui',
              defaultValue: isEn ? 'News management' : 'Керування новинами',
            })}
          </h1>
          <button
            type="button"
            onClick={startCreate}
            className="px-4 py-2 rounded border border-cyber-primary text-cyber-primary text-sm hover:bg-cyber-primary/10 transition-colors"
          >
            {t('adminNewsCreate', {
              ns: 'ui',
              defaultValue: isEn ? 'New article' : 'Нова публікація',
            })}
          </button>
        </div>

        {loading && (
          <div className="cyber-panel p-6 text-center text-gray-400 text-sm">
            {t('loading', { ns: 'ui', defaultValue: isEn ? 'Loading...' : 'Завантаження...' })}
          </div>
        )}

        {!loading && error && (
          <div className="cyber-panel p-4 border border-red-500/40 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="cyber-panel border border-cyber-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-cyber-border bg-cyber-panel/80">
                <h2 className="font-heading text-lg text-cyber-primary">
                  {t('adminNewsList', {
                    ns: 'ui',
                    defaultValue: isEn ? 'All articles' : 'Усі публікації',
                  })}
                </h2>
              </div>
              <AdminNewsPostList
                posts={posts}
                selectedId={selectedId}
                isEn={isEn}
                t={t}
                onEdit={startEdit}
                onDelete={setDeletingId}
              />
            </section>

            <section className="cyber-panel border border-cyber-border rounded-lg p-4 sm:p-6">
              <AdminNewsEditorForm
                form={form}
                isEditing={isEditing}
                isEn={isEn}
                saving={saving}
                t={t}
                onChange={setForm}
                onSubmit={handleSubmit}
                onCancel={resetForm}
              />
            </section>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deletingId !== null}
        titleId="admin-news-delete-title"
        title={t('adminNewsDeleteTitle', {
          ns: 'ui',
          defaultValue: isEn ? 'Delete article?' : 'Видалити публікацію?',
        })}
        message={t('adminNewsDeleteMessage', {
          ns: 'ui',
          defaultValue: isEn
            ? 'This article will be permanently removed.'
            : 'Цю публікацію буде видалено назавжди.',
        })}
        cancelLabel={t('cancel', { ns: 'ui', defaultValue: isEn ? 'Cancel' : 'Скасувати' })}
        confirmLabel={t('delete', { ns: 'ui', defaultValue: isEn ? 'Delete' : 'Видалити' })}
        loadingLabel={t('deleting', {
          ns: 'ui',
          defaultValue: isEn ? 'Deleting...' : 'Видалення...',
        })}
        isLoading={saving}
        variant="danger"
        onCancel={() => setDeletingId(null)}
        onConfirm={() => {
          handleDelete().catch(() => {
            // handleDelete already sets error state
          });
        }}
      />
    </div>
  );
}
