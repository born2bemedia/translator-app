'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [baseJson, setBaseJson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    fetchProjects(token);
  }, [router]);

  const fetchProjects = async (token: string) => {
    const res = await fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.status === 401) {
      router.replace('/login');
      return;
    }
    const data = await res.json();
    setProjects(data.projects);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setBaseJson(JSON.parse(event.target?.result as string));
      } catch {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !baseJson) {
      setError('Project name and base JSON are required');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name, baseJson }),
    });
    if (!res.ok) {
      setError('Failed to create project');
      return;
    }
    setName('');
    setBaseJson(null);
    fetchProjects(token);
  };

  const handleDeleteProject = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    const res = await fetch(`/api/project/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.ok) {
      fetchProjects(token);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="flex justify-end mb-6">
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Log out
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-6">Admin Panel: Projects</h1>
      <form onSubmit={handleCreateProject} className="mb-8 space-y-4">
        <input
          type="text"
          placeholder="Project name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="file"
          accept="application/JSON"
          onChange={handleFileChange}
          className="w-full"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add Project</button>
        {error && <div className="text-red-600">{error}</div>}
      </form>
      <h2 className="text-xl font-semibold mb-2">Your Projects</h2>
      <ul className="space-y-2">
        {projects.map(project => (
          <li key={project.id} className="flex items-center justify-between border p-3 rounded">
            <span>{project.name}</span>
            <div className="flex gap-2">
              <button
                className="bg-indigo-600 text-white px-3 py-1 rounded"
                onClick={() => router.push(`/admin/projects/${project.id}`)}
              >
                Edit Translations
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => handleDeleteProject(project.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 