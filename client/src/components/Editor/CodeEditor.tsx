"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectStore } from "@/store/useProjectStore";
import Editor, { loader } from "@monaco-editor/react";
import { Copy, MoreHorizontal, Save, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { toast } from "sonner";

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <Spinner size={32} />
    </div>
  ),
});

loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs" },
});

export function CodeEditor() {
  const {
    openTabs,
    activeTabId,
    setActiveTab,
    closeTab,
    updateTabContent,
    theme,
  } = useProjectStore();

  // Monaco CDN loader doesn't provide types, so use 'any' for compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoRef = useRef<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  const activeTab = openTabs.find((tab) => tab.id === activeTabId);

  // Setup Yjs binding when activeTab changes
  useEffect(() => {
    if (!activeTab) return;
    // Clean up previous Yjs doc/provider/binding
    if (providerRef.current) providerRef.current.destroy();
    if (ydocRef.current) ydocRef.current.destroy();
    ydocRef.current = new Y.Doc();
    // Use file path as room name
    const roomName = `file-${activeTab.path}`;
    providerRef.current = new WebsocketProvider(
      "ws://localhost:1234",
      roomName,
      ydocRef.current
    );
    const yText = ydocRef.current.getText("monaco");
    // If the file is new, set its content
    if (yText.length === 0 && activeTab.content) {
      yText.insert(0, activeTab.content);
    }
    // Setup Monaco binding when editor is ready
    if (editorRef.current && monacoRef.current) {
      // biome-ignore lint/suspicious/noExplicitAny: Required for Monaco CDN loader compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = (editorRef.current as any).getModel(); // TODO: Use Monaco types if possible with CDN loader
      if (model) {
        // TODO: Implement manual Yjs <-> Monaco sync here (see Yjs docs for collaborative text binding)
      }
    }
    // Cleanup on unmount or tab change
    return () => {
      if (providerRef.current) providerRef.current.destroy();
      if (ydocRef.current) ydocRef.current.destroy();
    };
  }, [activeTab, activeTab?.path, activeTab?.content]);

  // Keyboard shortcut for save (Ctrl+S/Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeTab && activeTab.isDirty) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  // Save handler
  const handleSave = () => {
    if (activeTabId && activeTab?.isDirty) {
      // Simulate save (replace with real save logic if needed)
      updateTabContent(activeTabId, activeTab.content);
      toast.success(`Saved ${activeTab.name}`);
    }
  };

  // Copy handler
  const handleCopy = async () => {
    if (activeTab?.content) {
      await navigator.clipboard.writeText(activeTab.content);
      toast.success("Copied to clipboard");
    }
  };

  const handleEditorDidMount = (editor: unknown, monacoInstance: unknown) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeTabId && value !== undefined) {
      updateTabContent(activeTabId, value);
    }
  };

  // Middle-click to close tab
  const handleTabMouseDown = (
    tabId: string,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (e.button === 1) {
      closeTab(tabId);
    }
  };

  // Restore handleTabClose for close button
  const handleTabClose = (
    tabId: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  if (openTabs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-code-bg text-code-text">
        <div className="text-center space-y-4">
          <div className="text-6xl">📝</div>
          <h3 className="text-lg font-medium">No files open</h3>
          <p className="text-sm">
            Click on files in the File Explorer to open them here
          </p>
          <p className="text-xs text-code-text">
            Try clicking on "page.tsx" in the file tree!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-user-bg min-h-0">
      {/* Tabs Header */}
      <div className="border-b bg-user-bg">
        <ScrollArea>
          <div className="flex">
            {openTabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center gap-2 px-4 py-3 border-r cursor-pointer hover:bg-muted/50 min-w-0 ${
                  activeTabId === tab.id ? "bg-user-bg" : "bg-user-bg"
                }`}
                onClick={() => setActiveTab(tab.id)}
                onMouseDown={(e) => handleTabMouseDown(tab.id, e)}
                tabIndex={0}
                aria-label={`Open ${tab.name}`}
                title={tab.name}
              >
                <span className="text-sm truncate max-w-32" title={tab.name}>
                  {tab.name}
                </span>
                {tab.isDirty ? (
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"
                    title="Unsaved changes"
                  />
                ) : (
                  <div
                    className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"
                    title="Saved"
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-muted"
                  onClick={(e) => handleTabClose(tab.id, e)}
                  aria-label={`Close ${tab.name}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Editor Controls */}
      <div className="flex items-center justify-between p-2 border-b bg-blue-950">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">{activeTab?.path}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={handleSave}
            disabled={!activeTab?.isDirty}
            aria-label="Save file"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={handleCopy}
            aria-label="Copy code"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Format Document</DropdownMenuItem>
              <DropdownMenuItem>Find & Replace</DropdownMenuItem>
              <DropdownMenuItem>Go to Line</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab && (
          <Editor
            height="100%"
            width="100%"
            language={activeTab.language}
            value={activeTab.content}
            onChange={handleEditorChange}
            theme={"vs"}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: "on",
              contextmenu: true,
              selectOnLineNumbers: true,
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              renderLineHighlight: "all",
            }}
            onMount={handleEditorDidMount}
            loading={<Spinner size={32} />}
          />
        )}
      </div>
    </div>
  );
}
