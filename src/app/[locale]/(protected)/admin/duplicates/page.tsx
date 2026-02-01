import { redirect } from 'next/navigation';
import { requireAdminContext } from '@/lib/admin/auth';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { DuplicateQueue } from '@/components/duplicates/DuplicateQueue';

export const metadata = {
  title: 'Duplicate Detection - Admin',
  description: 'Review and merge duplicate profiles',
};

export default async function DuplicatesPage() {
  const authResult = await requireAdminContext();

  if (!authResult.authorized) {
    redirect('/login');
  }

  return (
    <AdminLayout adminName={authResult.user.name}>
      <DuplicateQueue />
    </AdminLayout>
  );
}
