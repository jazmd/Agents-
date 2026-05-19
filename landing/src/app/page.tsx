import { Navbar } from '@/components/nav/Navbar';
import { Hero } from '@/components/sections/Hero';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
      </main>
    </>
  );
}
