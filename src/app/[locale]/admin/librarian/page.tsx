import LibrarianDashboard from './LibrarianDashboard';

export default async function LibrarianPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-slate-600 dark:text-slate-400">
          View the project knowledge base and agent activity history.
        </p>
      </div>
      <LibrarianDashboard />
    </div>
  );
}
