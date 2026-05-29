import FlashCardFeed from './components/FlashCardFeed';

export const metadata = {
  title: 'Flashcards',
  description: 'Study anything. Scroll endlessly.',
};

export default function FlashcardsPage() {
  return (
    <main className="h-dvh" style={{ background: 'var(--fc-bg)' }}>
      <FlashCardFeed />
    </main>
  );
}
