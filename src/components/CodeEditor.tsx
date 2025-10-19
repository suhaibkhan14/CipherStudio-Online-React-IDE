import { Sandpack, SandpackFile } from '@codesandbox/sandpack-react';
import { FileNode } from '@/types/project';

interface CodeEditorProps {
  files: FileNode[];
  activeFileId: string | null;
  onCodeChange: (fileId: string, content: string) => void;
}

const CodeEditor = ({ files, activeFileId, onCodeChange }: CodeEditorProps) => {
  // Convert FileNode array to Sandpack files format
  const sandpackFiles: Record<string, SandpackFile> = {};
  
  files.forEach(file => {
    if (file.type === 'file') {
      const path = `/${file.name}`;
      sandpackFiles[path] = {
        code: file.content || ''
      };
    }
  });

  const activeFile = files.find(f => f.id === activeFileId);
  const activeFilePath = activeFile && activeFile.type === 'file' ? `/${activeFile.name}` : '/App.jsx';

  return (
    <div className="h-full w-full">
      <Sandpack
        theme="dark"
        template="react"
        files={sandpackFiles}
        options={{
          showNavigator: false,
          showTabs: true,
          showLineNumbers: true,
          showInlineErrors: true,
          wrapContent: true,
          editorHeight: '100%',
          activeFile: activeFilePath,
          autorun: true,
          autoReload: true,
        }}
        customSetup={{
          dependencies: {
            'react': '^18.0.0',
            'react-dom': '^18.0.0'
          }
        }}
      />
    </div>
  );
};

export default CodeEditor;
