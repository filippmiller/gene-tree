interface Props {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ q?: string }>;
}

export default async function ProfileSearchPage({ searchParams }: Props) {
  const query = (await searchParams)?.q || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Relatives</h1>
          <p className="text-gray-600 mb-6">
            Search for people by name to discover potential family connections
          </p>

          {/* Search Form */}
          <form method="GET" className="flex gap-4">
            <input
              type="text"
              name="q"
              placeholder="Search by name..."
              defaultValue={query}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Search
            </button>
          </form>
        </div>

        {query ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Results</h2>
            <p className="text-gray-600">
              Search functionality coming soon...
            </p>
            {/* TODO: Add actual search results */}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Searching</h3>
              <p className="text-gray-600">
                Enter a name above to find people who might be your relatives
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
