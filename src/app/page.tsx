import About from "@/components/About";
import Contact from "@/components/Contact";
import Experiments from "@/components/Experiments";
import Hero from "@/components/Hero";
import Notes from "@/components/Notes";
import Work from "@/components/Work";

export default function Home() {
  return (
    <>
      <Hero />
      <Work />
      <Experiments />
      <Notes />
      <About />
      <Contact />
    </>
  );
}