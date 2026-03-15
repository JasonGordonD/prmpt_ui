import { Suspense } from 'react';
import { LandingPage } from '@/components/shared/landing-page';

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <LandingPage />
    </Suspense>
  );
}
