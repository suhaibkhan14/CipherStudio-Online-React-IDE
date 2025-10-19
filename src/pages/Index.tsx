import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Code2 } from 'lucide-react';
import TopBar from '@/components/TopBar';
import FileExplorer from '@/components/FileExplorer';
import CodeEditor from '@/components/CodeEditor';
import { Project, FileNode } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import {
  saveProject,
  getAllProjects,
  getProject,
  createDefaultProject,
} from '@/utils/projectStorage';

const Index = () => {
  const navigate = useNavigate();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    loadProjects();
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projects = await getAllProjects();
      setAllProjects(projects);

      if (projects.length === 0) {
        const newProject = await createDefaultProject();
        await saveProject(newProject);
        setCurrentProject(newProject);
        setAllProjects([newProject]);
      } else {
        setCurrentProject(projects[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-select first file when project loads
    if (currentProject && currentProject.files.length > 0 && !selectedFileId) {
      const firstFile = currentProject.files.find(f => f.type === 'file');
      if (firstFile) {
        setSelectedFileId(firstFile.id);
      }
    }
  }, [currentProject, selectedFileId]);

  const handleSave = async () => {
    if (currentProject) {
      try {
        await saveProject(currentProject);
        const projects = await getAllProjects();
        setAllProjects(projects);
        toast.success('Project saved successfully!');
      } catch (error) {
        console.error('Failed to save project:', error);
        toast.error('Failed to save project');
      }
    }
  };

  const handleLoadProject = async (projectId: string) => {
    try {
      const project = await getProject(projectId);
      if (project) {
        setCurrentProject(project);
        setSelectedFileId(null);
        toast.success(`Loaded: ${project.name}`);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
    }
  };

  const handleNewProject = async () => {
    try {
      const newProject = await createDefaultProject();
      await saveProject(newProject);
      setCurrentProject(newProject);
      const projects = await getAllProjects();
      setAllProjects(projects);
      setSelectedFileId(null);
      toast.success('New project created!');
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleCreateFile = (parentId: string | null, name: string, type: 'file' | 'folder') => {
    if (!currentProject) return;

    const newFile: FileNode = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      name,
      type,
      parentId,
      content: type === 'file' ? '' : undefined,
    };

    const updatedProject = {
      ...currentProject,
      files: [...currentProject.files, newFile],
    };

    setCurrentProject(updatedProject);
    if (type === 'file') {
      setSelectedFileId(newFile.id);
    }
    toast.success(`${type === 'file' ? 'File' : 'Folder'} created: ${name}`);
  };

  const handleDeleteFile = (fileId: string) => {
    if (!currentProject) return;

    const fileToDelete = currentProject.files.find(f => f.id === fileId);
    if (!fileToDelete) return;

    // Delete the file and all its children
    const deleteRecursive = (id: string): string[] => {
      const children = currentProject.files.filter(f => f.parentId === id);
      let toDelete = [id];
      children.forEach(child => {
        toDelete = [...toDelete, ...deleteRecursive(child.id)];
      });
      return toDelete;
    };

    const idsToDelete = deleteRecursive(fileId);
    const updatedFiles = currentProject.files.filter(f => !idsToDelete.includes(f.id));

    setCurrentProject({
      ...currentProject,
      files: updatedFiles,
    });

    if (selectedFileId === fileId) {
      setSelectedFileId(null);
    }

    toast.success(`Deleted: ${fileToDelete.name}`);
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    if (!currentProject) return;

    const updatedFiles = currentProject.files.map(f =>
      f.id === fileId ? { ...f, name: newName } : f
    );

    setCurrentProject({
      ...currentProject,
      files: updatedFiles,
    });

    toast.success('File renamed successfully!');
  };

  const handleCodeChange = (fileId: string, content: string) => {
    if (!currentProject) return;

    const updatedFiles = currentProject.files.map(f =>
      f.id === fileId ? { ...f, content } : f
    );

    setCurrentProject({
      ...currentProject,
      files: updatedFiles,
    });
  };

  if (loading || !currentProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Code2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading CipherStudio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopBar
        currentProject={currentProject}
        allProjects={allProjects}
        onSave={handleSave}
        onLoadProject={handleLoadProject}
        onNewProject={handleNewProject}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 shrink-0">
          <FileExplorer
            files={currentProject.files}
            selectedFileId={selectedFileId}
            onFileSelect={setSelectedFileId}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <CodeEditor
            files={currentProject.files}
            activeFileId={selectedFileId}
            onCodeChange={handleCodeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
