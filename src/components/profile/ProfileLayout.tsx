/**
 * ProfileLayout Component
 * 
 * Simple wrapper for profile pages.
 * Can be extended later with tabs, navigation, etc.
 */

interface Props {
  children: React.ReactNode;
}

export default function ProfileLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {children}
    </div>
  );
}
