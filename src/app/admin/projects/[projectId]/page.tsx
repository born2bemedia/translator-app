'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface TranslationData {
  [key: string]: any;
}

interface NewTranslation {
  path: string;
  value: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
];

export default function ProjectTranslationPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.projectId as string;

  const [baseJson, setBaseJson] = useState<TranslationData>({});
  const [translations, setTranslations] = useState<TranslationData>({});
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedPaths, setSavedPaths] = useState<Set<string>>(new Set());
  const [newTranslation, setNewTranslation] = useState<NewTranslation>({ path: '', value: '' });
  const saveTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    fetchBaseJson(token);
    fetchTranslations(token, selectedLanguage);
    // eslint-disable-next-line
  }, [projectId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetchTranslations(token, selectedLanguage);
    // eslint-disable-next-line
  }, [selectedLanguage]);

  const fetchBaseJson = async (token: string) => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/project/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
      setError('Failed to load project');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setBaseJson(data.project.baseJson);
    setLoading(false);
  };

  const fetchTranslations = async (token: string, language: string) => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/project-translations?id=${projectId}&language=${language}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.status === 404) {
      setTranslations({});
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError('Failed to load translations');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTranslations(data.translation.json);
    setLoading(false);
  };

  function buildFullTranslation(base: any, translation: any): any {
    if (typeof base !== 'object' || base === null) return translation ?? base;
    const result: any = Array.isArray(base) ? [] : {};
    for (const key in base) {
      if (typeof base[key] === 'object' && base[key] !== null) {
        result[key] = buildFullTranslation(base[key], translation?.[key]);
      } else {
        result[key] = translation?.[key] !== undefined ? translation[key] : base[key];
      }
    }
    return result;
  }

  const handleTranslationChange = async (path: string[], value: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    // Update local state
    const newTranslations = { ...translations };
    let current = newTranslations;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setTranslations(newTranslations);
    // Build full JSON for saving
    const fullJson = buildFullTranslation(baseJson, newTranslations);
    // Update in DB
    await fetch(`/api/project-translations?id=${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ language: selectedLanguage, json: fullJson }),
    });
    // Mark as saved (green)
    const pathKey = path.join('.');
    setSavedPaths(prev => new Set(prev).add(pathKey));
    if (saveTimeouts.current[pathKey]) clearTimeout(saveTimeouts.current[pathKey]);
    saveTimeouts.current[pathKey] = setTimeout(() => {
      setSavedPaths(prev => {
        const newSet = new Set(prev);
        newSet.delete(pathKey);
        return newSet;
      });
    }, 2000);
  };

  function getTranslationValue(obj: any, path: string[]) {
    return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  function deleteByPath(obj: any, path: string[]) {
    if (!obj || path.length === 0) return;
    const lastKey = path[path.length - 1];
    const parent = path.slice(0, -1).reduce((acc, key) => acc && acc[key], obj);
    if (parent && typeof parent === 'object') {
      delete parent[lastKey];
    }
  }

  const handleDeleteTranslation = async (path: string[]) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    // Видаляємо з baseJson
    const newBaseJson = JSON.parse(JSON.stringify(baseJson));
    deleteByPath(newBaseJson, path);
    setBaseJson(newBaseJson);
    // Видаляємо з поточної мови
    const newTranslations = JSON.parse(JSON.stringify(translations));
    deleteByPath(newTranslations, path);
    setTranslations(newTranslations);
    // Оновлюємо всі мови
    for (const lang of SUPPORTED_LANGUAGES) {
      const res = await fetch(`/api/project-translations?id=${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          language: lang.code,
          json: buildFullTranslation(newBaseJson, lang.code === 'en' ? {} : newTranslations)
        }),
      });
      if (!res.ok) {
        setError(`Failed to update ${lang.name} translation`);
        return;
      }
    }
    // Оновлюємо поточний вигляд
    fetchTranslations(token, selectedLanguage);
  };

  const renderTranslationFields = (data: any, currentPath: string[] = []) => {
    return Object.entries(data).map(([key, value]) => {
      const newPath = [...currentPath, key];
      const translationValue = getTranslationValue(translations, newPath) ?? value;
      const isUntranslated = selectedLanguage !== 'en' && (getTranslationValue(translations, newPath) === undefined || getTranslationValue(translations, newPath) === '' || getTranslationValue(translations, newPath) === value);
      const pathKey = newPath.join('.');
      const isSaved = savedPaths.has(pathKey);
      if (typeof value === 'object' && value !== null) {
        return (
          <div key={key} className="ml-4 border-l-2 border-gray-200 pl-4 my-4">
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-700 bg-gray-50 p-2 rounded-md flex-1">{key}</h3>
              <button
                onClick={() => handleDeleteTranslation(newPath)}
                className="ml-2 h-10 text-xs text-red-700 roundedflex items-center justify-center"
                title="Видалити об'єкт"
                aria-label="Видалити"
              >
                <TrashBinIcon />
              </button>
            </div>
            {renderTranslationFields(value, newPath)}
          </div>
        );
      }
      return (
        <div key={key} className="mb-4 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1"
              style={{ color: isUntranslated ? '#dc2626' : isSaved ? '#16a34a' : undefined }}
            >
              {newPath.join('.')}
            </label>
            <input
              type="text"
              value={translationValue as string}
              onChange={(e) => handleTranslationChange(newPath, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 ${isUntranslated ? 'border-red-500' : isSaved ? 'border-green-500' : 'border-gray-300'}`}
            />
          </div>
          <button
            onClick={() => handleDeleteTranslation(newPath)}
            className="ml-2 h-10 text-xs text-red-700 roundedflex items-center justify-center"
            title="Видалити строку"
            aria-label="Видалити"
          >
            <TrashBinIcon />
          </button>
        </div>
      );
    });
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(translations, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedLanguage}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  const handleAddNewTranslation = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const pathParts = newTranslation.path.split('.');
    let current = baseJson;
    let currentPath: string[] = [];

    // Create nested structure if it doesn't exist
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
      currentPath.push(pathParts[i]);
    }

    // Add the new translation
    current[pathParts[pathParts.length - 1]] = newTranslation.value;
    
    // Update base JSON
    setBaseJson({ ...baseJson });
    
    // Update translations for all languages
    for (const lang of SUPPORTED_LANGUAGES) {
      const res = await fetch(`/api/project-translations?id=${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          language: lang.code, 
          json: buildFullTranslation(baseJson, lang.code === 'en' ? {} : translations) 
        }),
      });
      
      if (!res.ok) {
        setError(`Failed to update ${lang.name} translation`);
        return;
      }
    }

    // Clear the form
    setNewTranslation({ path: '', value: '' });
    
    // Refresh translations
    fetchTranslations(token, selectedLanguage);
  };

  // SVG класичний trash bin
  const TrashBinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m2 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7m3 4v6m4-6v6" />
    </svg>
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            ← Back to Projects
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Log out
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Translation Editor</h1>
          
          {/* Add New Translation Form */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Add New Translation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Translation Path (e.g., "header.navigation.newItem")
                </label>
                <input
                  type="text"
                  value={newTranslation.path}
                  onChange={(e) => setNewTranslation(prev => ({ ...prev, path: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter path"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Translation Value
                </label>
                <input
                  type="text"
                  value={newTranslation.value}
                  onChange={(e) => setNewTranslation(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter value"
                />
              </div>
            </div>
            <button
              onClick={handleAddNewTranslation}
              disabled={!newTranslation.path || !newTranslation.value}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Translation
            </button>
          </div>

          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-start sm:items-center">
            <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
              Select Language:
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Download {selectedLanguage}.json
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-4">
            {renderTranslationFields(baseJson)}
          </div>
        </div>
      </div>
    </main>
  );
} 