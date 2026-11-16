import Colophon from "@/components/Colophon";
import Cover from "@/components/Cover";
import Plates from "@/components/Plates";
import Stream from "@/components/Stream";

export default function Home() {
  return (
    <>
      <Cover />
      <Stream />
      <Plates />
      <Colophon />
    </>
  );
}