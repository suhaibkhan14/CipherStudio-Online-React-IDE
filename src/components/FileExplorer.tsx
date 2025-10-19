import { useState } from 'react';
import { FileNode } from '@/types/project';
import { File, Folder, FolderOpen, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileExplorerProps {
  files: FileNode[];
  selectedFileId: string | null;
  onFileSelect: (fileId: string) => void;
  onCreateFile: (parentId: string | null, name: string, type: 'file' | 'folder') => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
}

const FileExplorer = ({
  files,
  selectedFileId,
  onFileSelect,
  onCreateFile,
  onDeleteFile,
  onRenameFile
}: FileExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingIn, setCreatingIn] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const startCreating = (parentId: string | null, type: 'file' | 'folder') => {
    setCreatingIn(parentId);
    setNewItemType(type);
    setNewItemName('');
  };

  const confirmCreate = () => {
    if (newItemName.trim()) {
      onCreateFile(creatingIn, newItemName.trim(), newItemType);
      setCreatingIn(null);
      setNewItemName('');
    }
  };

  const startRename = (file: FileNode) => {
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const confirmRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameFile(renamingId, renameValue.trim());
      setRenamingId(null);
    }
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    const rootNodes = nodes.filter(n => n.parentId === (level === 0 ? null : nodes[0]?.parentId));
    
    return nodes.map(node => {
      const isFolder = node.type === 'folder';
      const isExpanded = expandedFolders.has(node.id);
      const isSelected = node.id === selectedFileId;
      const children = nodes.filter(n => n.parentId === node.id);
      const isRenaming = renamingId === node.id;

      return (
        <div key={node.id}>
          <div
            className={`
              flex items-center gap-2 px-2 py-1 cursor-pointer rounded group
              hover:bg-file-hover transition-colors
              ${isSelected ? 'bg-file-active' : ''}
            `}
            style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
          >
            <div
              className="flex items-center gap-2 flex-1 min-w-0"
              onClick={() => {
                if (isFolder) {
                  toggleFolder(node.id);
                } else {
                  onFileSelect(node.id);
                }
              }}
            >
              {isFolder ? (
                isExpanded ? <FolderOpen className="w-4 h-4 text-primary shrink-0" /> : <Folder className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <File className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              
              {isRenaming ? (
                <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                  <Input
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') confirmRename();
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    className="h-6 px-1 py-0 text-sm"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={confirmRename}>
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRenamingId(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <span className="text-sm truncate">{node.name}</span>
              )}
            </div>

            {!isRenaming && (
              <div className="hidden group-hover:flex items-center gap-1">
                {isFolder && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={e => {
                      e.stopPropagation();
                      startCreating(node.id, 'file');
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={e => {
                    e.stopPropagation();
                    startRename(node);
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 hover:text-destructive"
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteFile(node.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {isFolder && isExpanded && children.length > 0 && (
            <div>{renderFileTree(children, level + 1)}</div>
          )}

          {isFolder && isExpanded && creatingIn === node.id && (
            <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: `${(level + 1) * 1 + 0.5}rem` }}>
              <File className="w-4 h-4 text-muted-foreground" />
              <Input
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmCreate();
                  if (e.key === 'Escape') setCreatingIn(null);
                }}
                placeholder={`New ${newItemType}...`}
                className="h-6 px-1 py-0 text-sm flex-1"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={confirmCreate}>
                <Check className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCreatingIn(null)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-sidebar-foreground">Files</h2>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => startCreating(null, 'file')}
            title="New File"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => startCreating(null, 'folder')}
            title="New Folder"
          >
            <Folder className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {renderFileTree(files)}
        
        {creatingIn === null && (
          <div className="mt-2">
            {newItemName === '' && creatingIn === null && files.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">
                Click + to create files
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
