import React, { useState } from 'react';
import { FolderKanban, Plus, FileCode, Calendar, ArrowRight } from 'lucide-react';
import { Language, Project } from '../types';

interface ProjectsManagerProps {
  projects: Project[];
  onSelectProject: (proj: Project) => void;
  onCreateProject: (name: string, description: string) => void;
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({ projects, onSelectProject, onCreateProject }) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateProject(name, description);
    setName('');
    setDescription('');
    setShowNewModal(false);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            Projects & Workspaces
          </h2>
          <p className="text-slate-400 text-xs mt-1">Manage multiple code files, repositories, and analysis sandboxes.</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {showNewModal && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-lg shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white">Create New Project Sandbox</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Backend Analytics Microservice"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Project overview and objectives..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 h-20 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-xl group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-all">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(proj.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">{proj.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{proj.description || 'No description provided.'}</p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className="flex items-center gap-1 text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                  <FileCode className="w-3 h-3" />
                  {proj.files.length} Files
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 mt-6 flex justify-end">
              <button
                onClick={() => onSelectProject(proj)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-sm"
              >
                <span>Open Project</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
