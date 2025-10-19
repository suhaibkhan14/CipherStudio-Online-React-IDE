import { Code2, Save, FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Project } from '@/types/project';
import UserMenu from '@/components/UserMenu';

interface TopBarProps {
  currentProject: Project | null;
  allProjects: Project[];
  onSave: () => void;
  onLoadProject: (projectId: string) => void;
  onNewProject: () => void;
}

const TopBar = ({ currentProject, allProjects, onSave, onLoadProject, onNewProject }: TopBarProps) => {
  return (
    <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold">CipherStudio</h1>
        </div>
        
        {currentProject && (
          <span className="text-sm text-muted-foreground">
            {currentProject.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewProject}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Open Project
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Your Projects</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allProjects.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No saved projects
              </div>
            ) : (
              allProjects.map(project => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => onLoadProject(project.id)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span>{project.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </Button>

        <UserMenu />
      </div>
    </div>
  );
};

export default TopBar;
