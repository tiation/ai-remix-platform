'use client';

import { useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  height?: string;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
}

export default function CodeEditor({
  value,
  onChange,
  language = 'html',
  height = '600px',
  theme = 'dark',
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineHeight: 20,
      padding: { top: 10, bottom: 10 },
      wordWrap: 'on',
      automaticLayout: true,
    });

    // Add custom themes
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1a1a1a',
        'editor.foreground': '#f8f8f2',
      },
    });

    monaco.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#333333',
      },
    });

    // Set theme
    monaco.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'custom-light');
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Editor
        height={height}
        defaultLanguage={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          fontSize: 14,
          lineHeight: 20,
          padding: { top: 10, bottom: 10 },
          wordWrap: 'on',
        }}
      />
    </div>
  );
}