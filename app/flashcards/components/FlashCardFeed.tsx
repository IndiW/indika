'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Flashcard, loadCards, shuffleDeck } from '../lib/cards';
import FlashCard from './FlashCard';
import Link from 'next/link';

interface CardInstance extends Flashcard {
  instanceId: string;
  globalIndex: number;
}

const BATCH_SIZE = 8;

export default function FlashCardFeed() {
  const [deck, setDeck] = useState<Flashcard[]>([]);
  const [cards, setCards] = useState<CardInstance[]>([]);
  const [results, setResults] = useState<{ correct: number; wrong: number }>({ correct: 0, wrong: 0 });
  const [streak, setStreak] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const batchNumRef = useRef(0);
  const globalIndexRef = useRef(0);

  useEffect(() => {
    setDeck(loadCards());
  }, []);

  const loadMore = useCallback(() => {
    if (deck.length === 0) return;
    const shuffled = shuffleDeck(deck).slice(0, BATCH_SIZE);
    const batch: CardInstance[] = shuffled.map((card, i) => ({
      ...card,
      instanceId: `${card.id}-b${batchNumRef.current}-${i}`,
      globalIndex: globalIndexRef.current + i,
    }));
    globalIndexRef.current += shuffled.length;
    batchNumRef.current += 1;
    setCards((prev) => [...prev, ...batch]);
  }, [deck]);

  useEffect(() => {
    if (deck.length > 0 && cards.length === 0) {
      loadMore();
    }
  }, [deck, cards.length, loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container || deck.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: container, rootMargin: '0px 0px 300% 0px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, deck.length]);

  const handleResult = useCallback((_id: string, result: 'correct' | 'wrong') => {
    setResults((prev) => ({ ...prev, [result]: prev[result] + 1 }));
    setStreak((prev) => result === 'correct' ? prev + 1 : 0);
  }, []);

  const handleUpdate = useCallback((id: string, data: { prompt: string; answer: string; category: string }) => {
    setDeck((prev) => prev.map((c) => c.id === id ? { ...c, ...data } : c));
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, ...data } : c));
  }, []);

  const total = results.correct + results.wrong;

  if (deck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <p className="text-sm" style={{ color: 'var(--fc-text-secondary)' }}>
          No cards yet.
        </p>
        <Link
          href="/flashcards/manage"
          className="px-5 py-2.5 rounded-xl text-sm font-medium tracking-wide"
          style={{ background: 'var(--fc-text-primary)', color: '#080808' }}
        >
          Add cards
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header
        className="flex-none flex items-center justify-between px-6 sm:px-10 py-5 border-b"
        style={{ borderColor: 'var(--fc-border)', background: 'var(--fc-bg)' }}
      >
        <div className="flex items-center gap-4">
          <span
            className="text-sm font-medium tracking-[0.05em]"
            style={{ color: 'var(--fc-text-primary)' }}
          >
            Flashcards
          </span>
          <div className="w-px h-4" style={{ background: 'var(--fc-border-hover)' }} />
          <span
            className="text-xs tracking-[0.1em] uppercase"
            style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-secondary)' }}
          >
            {deck.length} cards
          </span>
        </div>

        <div className="flex items-center gap-5">
          {total > 0 && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--fc-accent-correct)' }} />
                <span
                  className="text-xs tabular-nums"
                  style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-secondary)' }}
                >
                  {results.correct}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--fc-accent-wrong)' }} />
                <span
                  className="text-xs tabular-nums"
                  style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-secondary)' }}
                >
                  {results.wrong}
                </span>
              </div>
            </>
          )}
          <Link
            href="/flashcards/manage"
            className="text-xs tracking-[0.1em] uppercase transition-opacity hover:opacity-60"
            style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--fc-text-secondary)' }}
          >
            Manage
          </Link>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}
      >
        {cards.map((card) => (
          <div
            key={card.instanceId}
            className="flex items-center justify-center px-4 sm:px-8 py-6"
            style={{ scrollSnapAlign: 'start', minHeight: 'calc(100dvh - 57px)' }}
          >
            <div className="w-full" style={{ maxWidth: '480px', height: 'min(580px, calc(100dvh - 120px))' }}>
              <FlashCard card={card} index={card.globalIndex} onResult={handleResult} onUpdate={handleUpdate} streak={streak} />
            </div>
          </div>
        ))}
        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      </div>
    </div>
  );
}
