'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Flashcard, loadCards, addCard, addCards, updateCard, deleteCard, defaultCards, saveCards } from '../lib/cards';

type Tab = 'single' | 'bulk';

function parseBulk(raw: string): { prompt: string; answer: string; category: string }[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

export default function ManagePage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [tab, setTab] = useState<Tab>('single');

  const [sPrompt, setSPrompt] = useState('');
  const [sAnswer, setSAnswer] = useState('');
  const [sCategory, setSCategory] = useState('');

  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<ReturnType<typeof parseBulk>>([]);

  const [editId, setEditId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const refreshCards = useCallback(() => setCards(loadCards()), []);

  useEffect(() => { refreshCards(); }, [refreshCards]);

  useEffect(() => {
    setBulkPreview(bulkText.trim() ? parseBulk(bulkText) : []);
  }, [bulkText]);

  const flash = (type: 'ok' | 'err', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleSingleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addCard(sPrompt, sAnswer, sCategory);
    flash('ok', 'Card added');
    setSPrompt(''); setSAnswer(''); setSCategory('');
    refreshCards();
  };

  const handleBulkAdd = () => {
    if (bulkPreview.length === 0) return;
    const created = addCards(bulkPreview);
    flash('ok', `${created.length} cards added`);
    setBulkText('');
    refreshCards();
  };

  const startEdit = (card: Flashcard) => {
    setEditId(card.id);
    setEditPrompt(card.prompt);
    setEditAnswer(card.answer);
    setEditCategory(card.category);
  };

  const cancelEdit = () => setEditId(null);

  const saveEdit = () => {
    if (!editId) return;
    updateCard(editId, { prompt: editPrompt, answer: editAnswer, category: editCategory });
    flash('ok', 'Saved');
    setEditId(null);
    refreshCards();
  };

  const handleDelete = (id: string) => {
    deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (editId === id) setEditId(null);
  };

  const handleSeedDefaults = () => {
    saveCards(defaultCards);
    flash('ok', `Loaded ${defaultCards.length} default cards`);
    refreshCards();
  };

  const categories = Array.from(new Set(cards.map((c) => c.category))).sort();

  return (
    <div className="min-h-dvh" style={{ background: 'var(--fc-bg)' }}>
      <header
        className="flex items-center justify-between px-6 sm:px-10 py-5 border-b sticky top-0 z-10"
        style={{ borderColor: 'var(--fc-border)', background: 'var(--fc-bg)' }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/flashcards"
            className="text-xs tracking-[0.1em] uppercase transition-opacity hover:opacity-60"
            style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-secondary)' }}
          >
            ← Study
          </Link>
          <div className="w-px h-4" style={{ background: 'var(--fc-border-hover)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--fc-text-primary)' }}>
            Manage Cards
          </span>
          <span
            className="text-xs tracking-[0.1em]"
            style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-tertiary)' }}
          >
            {cards.length}
          </span>
        </div>

        {status && (
          <span
            className="text-xs tracking-[0.1em] uppercase fc-fade-up"
            style={{
              fontFamily: 'var(--font-geist-mono)',
              color: status.type === 'ok' ? 'var(--fc-accent-correct)' : 'var(--fc-accent-wrong)',
            }}
          >
            {status.msg}
          </span>
        )}
      </header>

      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-10 space-y-12">
        {/* Add cards */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xs tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-secondary)' }}>
              Add cards
            </h2>
            <div className="flex-1 h-px" style={{ background: 'var(--fc-border)' }} />
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--fc-border)' }}>
              {(['single', 'bulk'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-1.5 text-xs tracking-[0.1em] uppercase transition-all"
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    background: tab === t ? 'var(--fc-text-primary)' : 'transparent',
                    color: tab === t ? '#080808' : 'var(--fc-text-secondary)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {tab === 'single' ? (
            <form onSubmit={handleSingleAdd} className="space-y-4">
              <Field label="Prompt" value={sPrompt} onChange={setSPrompt} required multiline />
              <Field label="Answer" value={sAnswer} onChange={setSAnswer} required multiline />
              <Field label="Category" value={sCategory} onChange={setSCategory} placeholder="General" />
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-sm font-medium tracking-wide"
                style={{ background: 'var(--fc-text-primary)', color: '#080808' }}
              >
                Add card
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs tracking-[0.15em] uppercase" style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-secondary)' }}>
                  Paste cards
                </label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={16}
                  placeholder={'[\n  { "prompt": "What is a closure?", "answer": "A function that retains access to its outer scope", "category": "Programming" }\n]'}
                  className="w-full rounded-xl p-4 text-sm leading-relaxed resize-none outline-none border"
                  style={{
                    background: 'var(--fc-surface)',
                    borderColor: 'var(--fc-border)',
                    color: 'var(--fc-text-primary)',
                    fontFamily: 'var(--font-geist-mono)',
                  }}
                />
              </div>

              {bulkPreview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-tertiary)' }}>
                    Preview — {bulkPreview.length} cards
                  </p>
                  <div className="rounded-xl border divide-y overflow-hidden" style={{ borderColor: 'var(--fc-border)', maxHeight: '400px', overflowY: 'auto' }}>
                    {bulkPreview.map((c, i) => (
                      <div key={i} className="px-4 py-3 flex items-start justify-between gap-4" style={{ background: 'var(--fc-surface)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate" style={{ color: 'var(--fc-text-primary)' }}>{c.prompt}</p>
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--fc-text-secondary)' }}>{c.answer}</p>
                        </div>
                        <span className="flex-none text-xs px-2 py-0.5 rounded" style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-tertiary)', background: 'var(--fc-bg)' }}>
                          {c.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleBulkAdd}
                disabled={bulkPreview.length === 0}
                className="w-full py-3 rounded-xl text-sm font-medium tracking-wide transition-opacity disabled:opacity-40"
                style={{ background: 'var(--fc-text-primary)', color: '#080808' }}
              >
                Add {bulkPreview.length || 0} cards
              </button>
            </div>
          )}
        </section>

        {/* Card list */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xs tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-secondary)' }}>
              All cards
            </h2>
            <div className="flex-1 h-px" style={{ background: 'var(--fc-border)' }} />
            <button
              onClick={handleSeedDefaults}
              className="text-xs tracking-[0.1em] uppercase transition-opacity hover:opacity-60"
              style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-secondary)' }}
            >
              Reset to defaults
            </button>
          </div>

          {cards.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--fc-text-tertiary)' }}>
              No cards yet — add some above.
            </p>
          ) : (
            <div className="space-y-8">
              {categories.map((cat) => (
                <div key={cat} className="space-y-2">
                  <p className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-tertiary)' }}>
                    {cat} — {cards.filter((c) => c.category === cat).length}
                  </p>
                  <div className="rounded-xl border overflow-hidden divide-y" style={{ borderColor: 'var(--fc-border)' }}>
                    {cards
                      .filter((c) => c.category === cat)
                      .map((card) =>
                        editId === card.id ? (
                          <div key={card.id} className="p-4 space-y-3" style={{ background: 'var(--fc-surface)' }}>
                            <Field label="Prompt" value={editPrompt} onChange={setEditPrompt} required multiline />
                            <Field label="Answer" value={editAnswer} onChange={setEditAnswer} required multiline />
                            <Field label="Category" value={editCategory} onChange={setEditCategory} required />
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={saveEdit}
                                className="flex-1 py-2 rounded-lg text-xs font-medium tracking-wide"
                                style={{ background: 'var(--fc-text-primary)', color: '#080808' }}
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex-1 py-2 rounded-lg text-xs font-medium tracking-wide border transition-opacity hover:opacity-60"
                                style={{ borderColor: 'var(--fc-border-hover)', color: 'var(--fc-text-secondary)' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div key={card.id} className="px-4 py-3 flex items-start gap-4" style={{ background: 'var(--fc-surface)' }}>
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-sm" style={{ color: 'var(--fc-text-primary)' }}>{card.prompt}</p>
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--fc-text-secondary)' }}>{card.answer}</p>
                            </div>
                            <div className="flex-none flex items-center gap-3 pt-0.5">
                              <button
                                onClick={() => startEdit(card)}
                                className="text-xs transition-opacity hover:opacity-60"
                                style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-tertiary)' }}
                              >
                                edit
                              </button>
                              <button
                                onClick={() => handleDelete(card.id)}
                                className="text-xs transition-opacity hover:opacity-60"
                                style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-accent-wrong)' }}
                              >
                                delete
                              </button>
                            </div>
                          </div>
                        )
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
}

function Field({ label, value, onChange, required, multiline, placeholder }: FieldProps) {
  const sharedStyle = {
    background: 'var(--fc-surface)',
    borderColor: 'var(--fc-border)',
    color: 'var(--fc-text-primary)',
    fontFamily: 'var(--font-geist-sans)',
  };
  return (
    <div className="space-y-1.5">
      <label className="block text-xs tracking-[0.15em] uppercase" style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-secondary)' }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none outline-none border"
          style={sharedStyle}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none border"
          style={sharedStyle}
        />
      )}
    </div>
  );
}
