'use client';

import dynamic from 'next/dynamic';

const DuckDuckGooseGame = dynamic(() => import('./DuckDuckGooseGame'), { ssr: false });

export default function GameLoader() {
  return <DuckDuckGooseGame />;
}
