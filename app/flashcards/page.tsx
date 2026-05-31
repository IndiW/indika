import FlashCardFeed from './components/FlashCardFeed';

export const metadata = {
  title: 'Flashcards',
  description: 'Study anything. Scroll endlessly.',
};

export default function FlashcardsPage() {
  return (
    <main className="h-dvh overflow-hidden" style={{ position: 'fixed', inset: 0, background: 'var(--fc-bg)' }}>
      <FlashCardFeed />
    </main>
  );
}
