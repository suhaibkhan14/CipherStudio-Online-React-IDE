import { Project, FileNode } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const saveProject = async (project: Project): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Upsert project
  const { error: projectError } = await supabase
    .from('projects')
    .upsert({
      id: project.id,
      user_id: user.id,
      name: project.name,
      description: project.description || null,
    });

  if (projectError) throw projectError;

  // Delete existing files for this project
  await supabase
    .from('files')
    .delete()
    .eq('project_id', project.id);

  // Insert files
  if (project.files.length > 0) {
    const filesToInsert = project.files.map(file => ({
      id: file.id,
      project_id: project.id,
      name: file.name,
      type: file.type,
      parent_id: file.parentId || null,
      content: file.content || null,
    }));

    const { error: filesError } = await supabase
      .from('files')
      .insert(filesToInsert);

    if (filesError) throw filesError;
  }
};

export const getAllProjects = async (): Promise<Project[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch projects:', error);
    return [];
  }

  // Fetch files for all projects
  const projectsWithFiles = await Promise.all(
    (projects || []).map(async (project) => {
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', project.id);

      const fileNodes: FileNode[] = (files || []).map(file => ({
        id: file.id,
        name: file.name,
        type: file.type as 'file' | 'folder',
        parentId: file.parent_id,
        content: file.content || undefined,
      }));

      return {
        id: project.id,
        name: project.name,
        description: project.description || undefined,
        files: fileNodes,
        createdAt: project.created_at || new Date().toISOString(),
        updatedAt: project.updated_at || new Date().toISOString(),
      };
    })
  );

  return projectsWithFiles;
};

export const getProject = async (id: string): Promise<Project | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !project) return null;

  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('project_id', id);

  const fileNodes: FileNode[] = (files || []).map(file => ({
    id: file.id,
    name: file.name,
    type: file.type as 'file' | 'folder',
    parentId: file.parent_id,
    content: file.content || undefined,
  }));

  return {
    id: project.id,
    name: project.name,
    description: project.description || undefined,
    files: fileNodes,
    createdAt: project.created_at || new Date().toISOString(),
    updatedAt: project.updated_at || new Date().toISOString(),
  };
};

export const deleteProject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const createDefaultProject = async (): Promise<Project> => {
  const projectId = uuidv4();
  const rootId = uuidv4();
  
  const files: FileNode[] = [
    {
      id: rootId,
      name: 'src',
      type: 'folder',
      parentId: null,
    },
    {
      id: uuidv4(),
      name: 'App.jsx',
      type: 'file',
      parentId: rootId,
      content: `export default function App() {
  return (
    <div className="app">
      <h1>Welcome to CipherStudio</h1>
      <p>Start coding your React app here!</p>
    </div>
  );
}`
    },
    {
      id: uuidv4(),
      name: 'styles.css',
      type: 'file',
      parentId: rootId,
      content: `.app {
  font-family: sans-serif;
  text-align: center;
  padding: 2rem;
}

h1 {
  color: #3b82f6;
}
`
    }
  ];

  return {
    id: projectId,
    name: 'My First Project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files
  };
};
