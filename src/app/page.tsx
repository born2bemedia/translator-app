'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TranslationData {
  [key: string]: any;
}

interface Language {
  code: string;
  name: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
];

// Helper functions for localStorage
const getCachedTranslations = (language: string): TranslationData | null => {
  if (typeof window === 'undefined') return null;
  const cached = localStorage.getItem(`translations_${language}`);
  return cached ? JSON.parse(cached) : null;
};

const setCachedTranslations = (language: string, data: TranslationData) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`translations_${language}`, JSON.stringify(data));
};

const getCachedLanguages = (): string[] => {
  if (typeof window === 'undefined') return ['en'];
  const cached = localStorage.getItem('available_languages');
  return cached ? JSON.parse(cached) : ['en'];
};

const setCachedLanguages = (languages: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('available_languages', JSON.stringify(languages));
};

export default function Home() {
  const router = useRouter();
  const [translations, setTranslations] = useState<TranslationData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(getCachedLanguages());

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    fetchAvailableLanguages();
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      fetchTranslations(selectedLanguage);
    }
  }, [selectedLanguage]);

  const fetchAvailableLanguages = async () => {
    try {
      const response = await fetch('/api/languages');
      const data = await response.json();
      setAvailableLanguages(data.languages);
      setCachedLanguages(data.languages);
      setLoading(false);
    } catch (err) {
      setError('Failed to load available languages');
      setLoading(false);
    }
  };

  const fetchTranslations = async (language: string) => {
    try {
      setLoading(true);
      
      // Try to get from cache first
      const cachedData = getCachedTranslations(language);
      if (cachedData) {
        setTranslations(cachedData);
        setLoading(false);
        return;
      }

      // If not in cache, fetch from server
      const response = await fetch(`/api/translations?language=${language}`);
      const data = await response.json();
      setTranslations(data);
      setCachedTranslations(language, data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load translations');
      setLoading(false);
    }
  };

  const handleTranslationChange = async (path: string[], value: string) => {
    try {
      const response = await fetch('/api/translations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, value, language: selectedLanguage }),
      });

      if (!response.ok) {
        throw new Error('Failed to update translation');
      }

      // Update local state
      const newTranslations = { ...translations };
      let current = newTranslations;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      setTranslations(newTranslations);
      
      // Update cache
      setCachedTranslations(selectedLanguage, newTranslations);
    } catch (err) {
      setError('Failed to update translation');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setAvailableLanguages(data.languages);
      setCachedLanguages(data.languages);
      setSelectedLanguage('en');
      
      // Clear all cached translations
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('translations_')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      fetchTranslations('en');
    } catch (err) {
      setError('Failed to upload file');
    }
  };

  const handleAddLanguage = async (languageCode: string) => {
    try {
      const response = await fetch('/api/languages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: languageCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to add language');
      }

      const data = await response.json();
      setAvailableLanguages(data.languages);
      setCachedLanguages(data.languages);
      setSelectedLanguage(languageCode);
      fetchTranslations(languageCode);
    } catch (err) {
      setError('Failed to add language');
    }
  };

  const handleDownload = async (language: string) => {
    try {
      // Try to get from cache first
      const cachedData = getCachedTranslations(language);
      const data = cachedData || await (await fetch(`/api/translations?language=${language}`)).json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${language}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download file');
    }
  };

  const renderTranslationFields = (data: any, currentPath: string[] = []) => {
    return Object.entries(data).map(([key, value]) => {
      const newPath = [...currentPath, key];
      if (typeof value === 'object' && value !== null) {
        return (
          <div key={key} className="ml-4 border-l-2 border-gray-200 pl-4 my-4">
            <h3 className="text-lg font-semibold text-gray-700 bg-gray-50 p-2 rounded-md">{key}</h3>
            {renderTranslationFields(value, newPath)}
          </div>
        );
      }
      return (
        <div key={key} className="mb-4 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {newPath.join('.')}
          </label>
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleTranslationChange(newPath, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
          />
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading translations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Translation Editor</h1>
          
          <div className="space-y-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-start sm:items-center">
              <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                Upload Base Translation File:
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100
                  cursor-pointer"
              />
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
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.name || lang}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleDownload(selectedLanguage)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Download {selectedLanguage}.json
              </button>
            </div>

            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-start sm:items-center">
              <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                Add New Language:
              </label>
              <select
                onChange={(e) => handleAddLanguage(e.target.value)}
                value=""
                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select language</option>
                {SUPPORTED_LANGUAGES
                  .filter((lang) => !availableLanguages.includes(lang.code))
                  .map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-4">
            {renderTranslationFields(translations)}
          </div>
        </div>
      </div>
    </main>
  );
} 