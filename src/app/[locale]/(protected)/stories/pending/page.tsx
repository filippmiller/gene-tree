import PendingStoriesList from '@/components/stories/PendingStoriesList';

export default function PendingStoriesPage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Ожидающие одобрения истории</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Просмотрите и одобрите истории, добавленные к вашему профилю
                </p>
            </div>

            <PendingStoriesList />
        </div>
    );
}
