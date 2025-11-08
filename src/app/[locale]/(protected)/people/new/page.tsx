import { Metadata } from 'next';
import AddRelativeForm from '@/components/relatives/AddRelativeForm';

export const metadata: Metadata = {
  title: 'Add Relative',
  description: 'Invite a family member to join your family tree',
};

export default function AddRelativePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Add Family Member
        </h1>
        <p className="text-gray-600">
          Invite a relative to join your family tree. They'll receive an invitation to create their account.
        </p>
      </div>
      
      <AddRelativeForm />
    </div>
  );
}
