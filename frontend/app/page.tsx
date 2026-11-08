import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Clients from "@/components/Clients";
import Pitch from "@/components/Pitch";
import Testimonials from "@/components/Testimonials";
import Team from "@/components/Team";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <Clients />
        <Pitch />
        <Testimonials />
        <Team />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
