import Nav from '@/components/Nav';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <div className="p-4">
        <LanguageSwitcher />
        {children}
      </div>
    </>
  );
}

