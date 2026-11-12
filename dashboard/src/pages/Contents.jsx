import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, ImagePlus, Pencil, Plus, Search, SearchX, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import { useConfirm } from '../lib/confirm.jsx';
import { Button, EmptyState, ICON_STROKE, Input, Menu, Skeleton } from '../components/ui.jsx';
import ContentPreview, { CONTENT_TYPES, TypeTag } from '../components/ContentPreview.jsx';
import ContentFormModal from '../components/ContentFormModal.jsx';

const TYPE_FILTERS = [{ id: 'all', label: 'Semua' }, ...Object.entries(CONTENT_TYPES).map(([id, t]) => ({ id, ...t }))];

export default function Contents() {
  const toast = useToast();
  const confirm = useConfirm();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { content? }
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setContents(await api.contents.list());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contents.filter((c) => (type === 'all' || c.tipe === type) && (!q || c.judul.toLowerCase().includes(q)));
  }, [contents, type, query]);

  const remove = (c) =>
    confirm({
      title: `Hapus content "${c.judul}"?`,
      message: 'Content akan dihapus permanen dan dilepas dari semua playlist device.',
      confirmLabel: 'Hapus content',
      icon: Trash2,
      tone: 'danger',
      onConfirm: async () => {
        try {
          await api.contents.remove(c.id);
          toast.success(`Content "${c.judul}" dihapus`);
          load();
        } catch (err) {
          toast.error(err.message);
          throw err;
        }
      },
    });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Contents</h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? 'Memuat pustaka content…' : `${contents.length} content tersimpan di pustaka.`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="sm:w-72">
            <Input
              icon={Search}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul content…"
              aria-label="Cari content"
            />
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setModal({})}>Tambah content</Button>
        </div>
      </div>

      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter tipe content">
        {TYPE_FILTERS.map((f) => {
          const active = type === f.id;
          const count = f.id === 'all' ? contents.length : contents.filter((c) => c.tipe === f.id).length;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => setType(f.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  active
                    ? 'border-accent bg-accent-soft text-accent-ink'
                    : 'border-line bg-surface text-muted hover:border-line-strong hover:text-fg'
                }`}
            >
              {f.icon && <f.icon className="size-3.5" strokeWidth={ICON_STROKE} aria-hidden />}
              {f.label}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Memuat content">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="rounded-2xl border border-line bg-surface shadow-card" aria-hidden>
              <Skeleton className="aspect-video rounded-t-2xl rounded-b-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </li>
          ))}
        </ul>
      ) : contents.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title="Pustaka content masih kosong"
          action={<Button variant="primary" icon={Plus} onClick={() => setModal({})}>Tambah content pertama</Button>}
        >
          Upload gambar atau video, atau tambahkan teks dan halaman web untuk ditayangkan di device.
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Tidak ada content yang cocok"
          action={<Button onClick={() => { setType('all'); setQuery(''); }}>Reset filter</Button>}
        >
          Coba kata kunci lain atau pilih tipe lain.
        </EmptyState>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((c) => (
            <li
              key={c.id}
              className="flex flex-col rounded-2xl border border-line bg-surface shadow-card transition-shadow duration-200 hover:shadow-card-hover"
            >
              <ContentPreview content={c} className="aspect-video w-full rounded-t-2xl" />
              <div className="flex items-start gap-2 p-3.5 pr-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-fg" title={c.judul}>{c.judul}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <TypeTag tipe={c.tipe} />
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" strokeWidth={ICON_STROKE} aria-hidden />
                      {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <Menu
                  label={`Aksi untuk ${c.judul}`}
                  items={[
                    { label: 'Edit content', icon: Pencil, onSelect: () => setModal({ content: c }) },
                    'divider',
                    { label: 'Hapus content', icon: Trash2, onSelect: () => remove(c), tone: 'danger' },
                  ]}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <ContentFormModal
          content={modal.content}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
            toast.success('Content disimpan');
          }}
        />
      )}
    </div>
  );
}
