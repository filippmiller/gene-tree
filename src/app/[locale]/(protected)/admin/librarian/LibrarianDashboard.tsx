'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Domain {
  name: string;
  filename: string;
  type: 'markdown' | 'json';
  size: number;
  sizeKB: number;
  lastModified: string;
  description: string;
}

interface Session {
  id: string;
  timestamp: string;
  agent: string;
  commit: string;
  branch: string;
  keywords: string[];
  summary: string;
  filesChanged: string[];
  topicsUpdated: string[];
}

interface DomainContent {
  name: string;
  content: string;
  type: string;
  lastModified: string;
}

export default function LibrarianDashboard() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<DomainContent | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch domains and sessions on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [domainsRes, sessionsRes] = await Promise.all([
          fetch('/api/library/index'),
          fetch('/api/library/sessions'),
        ]);

        if (!domainsRes.ok || !sessionsRes.ok) {
          throw new Error('Failed to fetch library data');
        }

        const domainsData = await domainsRes.json();
        const sessionsData = await sessionsRes.json();

        setDomains(domainsData.domains || []);
        setSessions(sessionsData.sessions || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fetch domain content
  async function loadDomain(name: string) {
    try {
      setLoadingContent(true);
      const res = await fetch(`/api/library/domain/${name}`);
      if (!res.ok) throw new Error('Failed to load domain');
      const data = await res.json();
      setSelectedDomain(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingContent(false);
    }
  }

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  function formatRelativeTime(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return formatDate(dateStr);
    } catch {
      return dateStr;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading library data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <Tabs defaultValue="knowledge" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
        <TabsTrigger value="knowledge" className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Knowledge Base
        </TabsTrigger>
        <TabsTrigger value="sessions" className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Agent Sessions
        </TabsTrigger>
      </TabsList>

      {/* Knowledge Base Tab */}
      <TabsContent value="knowledge">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Domain List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Domains</CardTitle>
                <CardDescription>{domains.length} knowledge files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {domains.map((domain) => (
                  <button
                    key={domain.filename}
                    onClick={() => loadDomain(domain.name)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDomain?.name === domain.name
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">
                        {domain.filename}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        domain.type === 'markdown'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {domain.type === 'markdown' ? 'MD' : 'JSON'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span>{domain.sizeKB} KB</span>
                      <span>•</span>
                      <span>{formatRelativeTime(domain.lastModified)}</span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Domain Content Viewer */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{selectedDomain?.name || 'Select a domain'}</span>
                  {selectedDomain && (
                    <span className="text-xs font-normal text-gray-500">
                      Last modified: {formatDate(selectedDomain.lastModified)}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingContent ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : selectedDomain ? (
                  <div className="bg-slate-900 rounded-lg p-4 max-h-[550px] overflow-auto">
                    <pre className="text-sm text-slate-100 whitespace-pre-wrap font-mono leading-relaxed">
                      {selectedDomain.content}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Click a domain to view its content</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* Agent Sessions Tab */}
      <TabsContent value="sessions">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Sessions</CardTitle>
                <CardDescription>{sessions.length} recorded activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {sessions.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 text-sm">
                    No agent sessions recorded yet
                  </p>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedSession?.id === session.id
                          ? 'bg-green-50 border-green-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium text-blue-600">
                          {session.id}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {session.agent}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1 line-clamp-2">
                        {session.summary || 'No summary'}
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(session.timestamp)}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Session Details */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {selectedSession?.id || 'Select a session'}
                </CardTitle>
                {selectedSession && (
                  <CardDescription>
                    {formatDate(selectedSession.timestamp)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {selectedSession ? (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Summary</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {selectedSession.summary || 'No summary provided'}
                      </p>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Agent</h4>
                        <p className="text-sm text-gray-600 font-mono bg-blue-50 px-2 py-1 rounded inline-block">
                          {selectedSession.agent}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Branch</h4>
                        <p className="text-sm text-gray-600 font-mono bg-purple-50 px-2 py-1 rounded inline-block">
                          {selectedSession.branch || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Commit</h4>
                        <p className="text-sm text-gray-600 font-mono bg-green-50 px-2 py-1 rounded inline-block">
                          {selectedSession.commit || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Keywords */}
                    {selectedSession.keywords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedSession.keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Files Changed */}
                    {selectedSession.filesChanged.length > 0 && selectedSession.filesChanged[0] !== 'none' && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Files Changed</h4>
                        <div className="bg-slate-900 rounded-lg p-3 max-h-32 overflow-auto">
                          {selectedSession.filesChanged.map((file, idx) => (
                            <div key={idx} className="text-xs font-mono text-green-400">
                              {file}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Topics Updated */}
                    {selectedSession.topicsUpdated.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Topics Updated</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedSession.topicsUpdated.map((topic, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>Click a session to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
