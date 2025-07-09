"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useProjectStore } from "@/store/useProjectStore";
import type { FileNode } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useMemo } from "react";

// Sample file tree data
const sampleFileTree: FileNode[] = [
  {
    id: "1",
    name: "src",
    type: "folder",
    path: "src",
    isOpen: true,
    children: [
      {
        id: "2",
        name: "index.tsx",
        type: "file",
        path: "src/index.tsx",
        content: "console.log('Hello, world!');",
      },
      {
        id: "3",
        name: "components",
        type: "folder",
        path: "src/components",
        isOpen: false,
        children: [
          {
            id: "4",
            name: "Button.tsx",
            type: "file",
            path: "src/components/Button.tsx",
            content: "export const Button = () => <button>Click</button>;",
          },
        ],
      },
    ],
  },
  {
    id: "5",
    name: "README.md",
    type: "file",
    path: "README.md",
    content: "# Project README",
  },
];

export function FileTreeSidebar() {
  const { fileTree, openFile, setRightPanelMode } = useProjectStore();
  // Use sample data if fileTree is empty
  const displayFileTree = useMemo(
    () => (fileTree.length === 0 ? sampleFileTree : fileTree),
    [fileTree]
  );

  const handleFileClick = (file: FileNode) => {
    if (file.type === "file") {
      openFile(file);
      // Automatically switch to code editor when a file is opened
      setRightPanelMode("coder");
    }
  };

  const handleFolderToggle = (folderId: string) => {
    const updateTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map((node) => {
        if (node.id === folderId && node.type === "folder") {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.type === "folder" && node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });

    // Update either fileTree or sampleFileTree
    if (fileTree.length === 0) {
      // Update sampleFileTree locally (no state update)
      // No-op: sampleFileTree is static for demo
    } else {
      const updatedTree = updateTree(fileTree);
      useProjectStore.setState({ fileTree: updatedTree });
    }
  };

  const FileTreeNode = ({
    node,
    level = 0,
  }: {
    node: FileNode;
    level?: number;
  }) => {
    const isFolder = node.type === "folder";
    const paddingLeft = level * 16 + 8;

    return (
      <div>
        <Button
          variant="ghost"
          className="w-full justify-start h-8 px-2 font-normal hover:bg-muted/50"
          style={{ paddingLeft }}
          onClick={() =>
            isFolder ? handleFolderToggle(node.id) : handleFileClick(node)
          }
        >
          <div className="flex items-center gap-2 min-w-0">
            {isFolder ? (
              <>
                {node.isOpen ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                )}
                {node.isOpen ? (
                  <FolderOpen className="h-4 w-4 flex-shrink-0 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 flex-shrink-0 text-blue-500" />
                )}
              </>
            ) : (
              <>
                <div className="w-4" />
                <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </>
            )}
            <span className="truncate text-sm">{node.name}</span>
          </div>
        </Button>

        {isFolder && node.isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-user-bg text-stone-300 shadow">
      {/* Header */}
      <div className="p-4 border-b bg-user-bg">
        <h3 className="font-semibold text-sm">File Explorer</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Click files to open in editor
        </p>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {displayFileTree.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Spinner size={28} />
            </div>
          ) : (
            displayFileTree.map((node) => (
              <FileTreeNode key={node.id} node={node} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
