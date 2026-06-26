import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  AdminDangerConfirmModal,
  AdminMasterDetailLayout,
  AdminPageShell,
  AdminEmptyListNotice,
  AdminScrollableList,
} from '../components/admin/adminPageUi';
import {
  adminErrorText,
  adminLoadingLabel,
  adminUiText,
} from '../components/admin/adminPageUiHelpers';
import { api, type NewsPost } from '../services/api';

const emptyForm = {
  titleUk: '',
  titleEn: '',
  bodyUk: '',
  bodyEn: '',
  isPublished: false,
};

type NewsFormState = typeof emptyForm;

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
        adminErrorText(
          t,
          isEn,
          'adminNewsLoadError',
          'Не вдалося завантажити новини.',
          'Failed to load news.',
          err
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
        adminErrorText(
          t,
          isEn,
          'adminNewsSaveError',
          'Не вдалося зберегти новину.',
          'Failed to save news.',
          err
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
        adminErrorText(
          t,
          isEn,
          'adminNewsDeleteError',
          'Не вдалося видалити новину.',
          'Failed to delete news.',
          err
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
      <AdminEmptyListNotice
        message={adminUiText(
          t,
          isEn,
          'adminNewsEmpty',
          'Публікацій поки немає.',
          'No articles yet.'
        )}
      />
    );
  }

  return (
    <AdminScrollableList>
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
                  ? adminUiText(t, isEn, 'adminNewsPublished', 'Опубліковано', 'Published')
                  : adminUiText(t, isEn, 'adminNewsDraft', 'Чернетка', 'Draft')}
              </div>
            </button>
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="text-xs text-red-400 hover:underline shrink-0"
            >
              {adminUiText(t, isEn, 'delete', 'Видалити', 'Delete')}
            </button>
          </div>
        </div>
      ))}
    </AdminScrollableList>
  );
}

function AdminNewsLocalizedField({
  label,
  value,
  onChange,
  maxLength,
  rows,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  rows?: number;
}>) {
  const className =
    'w-full rounded border border-cyber-border bg-cyber-panel/80 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyber-primary';

  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-gray-500 mb-2">{label}</span>
      {rows ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          maxLength={maxLength}
          required
          className={`${className} resize-none`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          required
          className={className}
        />
      )}
    </label>
  );
}

function AdminNewsFormFields({
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
  const editorTitle = isEditing
    ? adminUiText(t, isEn, 'adminNewsEdit', 'Редагування', 'Edit article')
    : adminUiText(t, isEn, 'adminNewsCreate', 'Нова публікація', 'New article');
  const saveButtonText = saving
    ? adminUiText(t, isEn, 'saving', 'Збереження...', 'Saving...')
    : adminUiText(t, isEn, 'save', 'Зберегти', 'Save');

  return (
    <>
      <h2 className="font-heading text-lg text-cyber-primary mb-4">{editorTitle}</h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <AdminNewsLocalizedField
          label={adminUiText(t, isEn, 'adminNewsTitleUk', 'Заголовок (UK)', 'Title (UK)')}
          value={form.titleUk}
          onChange={(value) => onChange({ ...form, titleUk: value })}
          maxLength={200}
        />
        <AdminNewsLocalizedField
          label={adminUiText(t, isEn, 'adminNewsTitleEn', 'Заголовок (EN)', 'Title (EN)')}
          value={form.titleEn}
          onChange={(value) => onChange({ ...form, titleEn: value })}
          maxLength={200}
        />
        <AdminNewsLocalizedField
          label={adminUiText(t, isEn, 'adminNewsBodyUk', 'Текст (UK)', 'Text (UK)')}
          value={form.bodyUk}
          onChange={(value) => onChange({ ...form, bodyUk: value })}
          maxLength={10000}
          rows={5}
        />
        <AdminNewsLocalizedField
          label={adminUiText(t, isEn, 'adminNewsBodyEn', 'Текст (EN)', 'Text (EN)')}
          value={form.bodyEn}
          onChange={(value) => onChange({ ...form, bodyEn: value })}
          maxLength={10000}
          rows={5}
        />

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(event) => onChange({ ...form, isPublished: event.target.checked })}
          />
          {adminUiText(t, isEn, 'adminNewsPublish', 'Опублікувати', 'Publish')}
        </label>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded border border-cyber-primary text-cyber-primary text-sm hover:bg-cyber-primary/10 transition-colors disabled:opacity-50"
          >
            {saveButtonText}
          </button>
          {isEditing && (
            <button
              type="button"
              disabled={saving}
              onClick={onCancel}
              className="px-4 py-2 rounded border border-cyber-border text-gray-400 text-sm hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              {adminUiText(t, isEn, 'cancel', 'Скасувати', 'Cancel')}
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

  const createButton = (
    <button
      type="button"
      onClick={startCreate}
      className="px-4 py-2 rounded border border-cyber-primary text-cyber-primary text-sm hover:bg-cyber-primary/10 transition-colors"
    >
      {adminUiText(t, isEn, 'adminNewsCreate', 'Нова публікація', 'New article')}
    </button>
  );

  return (
    <AdminPageShell
      title={adminUiText(t, isEn, 'adminNews', 'Керування новинами', 'News management')}
      headerAction={createButton}
    >
      <AdminMasterDetailLayout
        loading={loading}
        error={error}
        loadingLabel={adminLoadingLabel(t, isEn)}
        listTitle={adminUiText(t, isEn, 'adminNewsList', 'Усі публікації', 'All articles')}
        list={
          <AdminNewsPostList
            posts={posts}
            selectedId={selectedId}
            isEn={isEn}
            t={t}
            onEdit={startEdit}
            onDelete={setDeletingId}
          />
        }
        detail={
          <AdminNewsFormFields
            form={form}
            isEditing={isEditing}
            isEn={isEn}
            saving={saving}
            t={t}
            onChange={setForm}
            onSubmit={handleSubmit}
            onCancel={resetForm}
          />
        }
      />

      <AdminDangerConfirmModal
        isOpen={deletingId !== null}
        titleId="admin-news-delete-title"
        title={adminUiText(
          t,
          isEn,
          'adminNewsDeleteTitle',
          'Видалити публікацію?',
          'Delete article?'
        )}
        message={adminUiText(
          t,
          isEn,
          'adminNewsDeleteMessage',
          'Цю публікацію буде видалено назавжди.',
          'This article will be permanently removed.'
        )}
        isLoading={saving}
        onCancel={() => setDeletingId(null)}
        onConfirm={() => {
          handleDelete().catch(() => {
            // handleDelete already sets error state
          });
        }}
        t={t}
        isEn={isEn}
      />
    </AdminPageShell>
  );
}
