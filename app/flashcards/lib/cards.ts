const STORAGE_KEY = 'flashcards_v1';

export interface Flashcard {
  id: string;
  prompt: string;
  answer: string;
  category: string;
}

export const defaultCards: Flashcard[] = [
  { id: '1', prompt: 'What does REST stand for?', answer: 'Representational State Transfer — an architectural style for distributed hypermedia systems.', category: 'Programming' },
  { id: '2', prompt: 'What is a closure in JavaScript?', answer: "A function that retains access to its outer scope's variables even after the outer function has returned.", category: 'Programming' },
  { id: '3', prompt: 'What is the time complexity of binary search?', answer: 'O(log n) — each step halves the search space.', category: 'Programming' },
  { id: '4', prompt: 'What does SOLID stand for in object-oriented design?', answer: 'Single Responsibility, Open–Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.', category: 'Programming' },
  { id: '5', prompt: 'What is a Promise in JavaScript?', answer: 'An object representing the eventual completion or failure of an asynchronous operation.', category: 'Programming' },
  { id: '6', prompt: 'In what year did the Berlin Wall fall?', answer: '1989 — specifically on the night of 9 November 1989.', category: 'History' },
  { id: '7', prompt: 'Who painted the Sistine Chapel ceiling?', answer: 'Michelangelo, commissioned by Pope Julius II and painted between 1508 and 1512.', category: 'History' },
  { id: '8', prompt: 'What year was the Magna Carta signed?', answer: '1215 — sealed by King John at Runnymede, establishing that the king was subject to the rule of law.', category: 'History' },
  { id: '9', prompt: 'Who was the first person to walk on the Moon?', answer: 'Neil Armstrong, on July 20, 1969, during the Apollo 11 mission.', category: 'History' },
  { id: '10', prompt: 'What empire built the Colosseum?', answer: 'The Roman Empire — construction began under Emperor Vespasian around 70–72 AD and was completed in 80 AD.', category: 'History' },
  { id: '11', prompt: 'What is the speed of light in a vacuum?', answer: 'Approximately 299,792,458 metres per second — often rounded to 3 × 10⁸ m/s.', category: 'Science' },
  { id: '12', prompt: 'What is the powerhouse of the cell?', answer: 'The mitochondria — they produce ATP through cellular respiration.', category: 'Science' },
  { id: '13', prompt: "What is Newton's Second Law of Motion?", answer: 'Force equals mass times acceleration: F = ma.', category: 'Science' },
  { id: '14', prompt: 'What is the atomic number of carbon?', answer: '6 — carbon has 6 protons in its nucleus.', category: 'Science' },
  { id: '15', prompt: 'What particle carries the electromagnetic force?', answer: 'The photon — a massless boson that mediates the electromagnetic interaction.', category: 'Science' },
  { id: '16', prompt: "What is Occam's Razor?", answer: 'The principle that among competing hypotheses, the one with the fewest assumptions should be selected — "entities should not be multiplied unnecessarily."', category: 'Philosophy' },
  { id: '17', prompt: 'Who wrote "Meditations"?', answer: 'Marcus Aurelius — Roman Emperor and Stoic philosopher, written as a private journal around 161–180 AD.', category: 'Philosophy' },
  { id: '18', prompt: 'What is the Ship of Theseus paradox?', answer: 'If every part of a ship is replaced over time, is it still the same ship? It questions the nature of identity and persistence through gradual change.', category: 'Philosophy' },
  { id: '19', prompt: "What is Kant's Categorical Imperative?", answer: 'Act only according to that maxim by which you can at the same time will that it should become a universal law.', category: 'Philosophy' },
  { id: '20', prompt: "What is Plato's Allegory of the Cave about?", answer: 'Prisoners mistake shadows on a cave wall for reality. It illustrates how philosophical education is the journey from darkness into light — from appearance to knowledge.', category: 'Philosophy' },
  { id: '21', prompt: 'What is the Golden Ratio?', answer: 'Approximately 1.618, denoted φ (phi). A proportion found throughout nature and used in design for its perceived aesthetic harmony.', category: 'Design' },
  { id: '22', prompt: "What is Fitts's Law?", answer: 'The time to acquire a target is a function of the distance to and size of the target — larger, closer targets are faster to interact with.', category: 'Design' },
  { id: '23', prompt: 'What is the Gestalt principle of Proximity?', answer: 'Elements placed close together are perceived as belonging to the same group, even without visual borders.', category: 'Design' },
  { id: '24', prompt: 'What is a design system?', answer: 'A collection of reusable components guided by clear standards — enabling teams to build consistent products at scale.', category: 'Design' },
  { id: '25', prompt: 'What does UX stand for, and what does it encompass?', answer: 'User Experience — the sum of perceptions, emotions, and responses a person has when interacting with a product or system.', category: 'Design' },
];

export function loadCards(): Flashcard[] {
  if (typeof window === 'undefined') return defaultCards;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCards;
    const parsed = JSON.parse(raw) as Flashcard[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultCards;
  } catch {
    return defaultCards;
  }
}

export function saveCards(cards: Flashcard[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function addCard(prompt: string, answer: string, category: string): Flashcard {
  const cards = loadCards();
  const card: Flashcard = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, prompt: prompt.trim(), answer: answer.trim(), category: category.trim() || 'General' };
  saveCards([...cards, card]);
  return card;
}

export function addCards(newCards: Omit<Flashcard, 'id'>[]): Flashcard[] {
  const cards = loadCards();
  const created = newCards.map((c) => ({ ...c, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }));
  saveCards([...cards, ...created]);
  return created;
}

export function updateCard(id: string, data: Partial<Omit<Flashcard, 'id'>>): void {
  const cards = loadCards().map((c) => c.id === id ? { ...c, ...data } : c);
  saveCards(cards);
}

export function deleteCard(id: string): void {
  saveCards(loadCards().filter((c) => c.id !== id));
}

export function shuffleDeck(cards: Flashcard[]): Flashcard[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
