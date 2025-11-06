import { Nav } from "@/components/Nav";

export default function RelationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}

