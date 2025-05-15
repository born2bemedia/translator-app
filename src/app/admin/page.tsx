'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface DeleteConfirmation {
  isOpen: boolean;
  projectId: string | null;
  projectName: string;
}

export default function AdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [baseJson, setBaseJson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    projectId: null,
    projectName: ''
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
    } else {
      fetchProjects(token);
    }
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  const handleDeleteProject = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`/api/project/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.ok) {
      fetchProjects(token);
      setDeleteConfirmation({ isOpen: false, projectId: null, projectName: '' });
    }
  };

  const handleDeleteClick = (project: Project) => {
    setDeleteConfirmation({
      isOpen: true,
      projectId: project.id,
      projectName: project.name
    });
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, projectId: null, projectName: '' });
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
                onClick={() => handleDeleteClick(project)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {/* Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Project Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the project <span className="font-semibold">{deleteConfirmation.projectName}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConfirmation.projectId && handleDeleteProject(deleteConfirmation.projectId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 