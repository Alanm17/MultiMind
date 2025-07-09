import { useEffect, useState } from "react";
import { create } from "zustand";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FiFolder,
  FiFolderOpen,
  FiFile,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { FileService } from "@/services/fileService";

interface FileOrFolder {
  id: string;
  projectId: string;
  filePath: string;
  content: string;
  isFolder: boolean;
  parentId?: string | null;
}

interface FileNode {
  __file: FileOrFolder | null;
  __children: Record<string, FileNode>;
}

interface FileTreeStore {
  openFolders: string[];
  selectedFile: string | null;
  toggleFolder: (path: string) => void;
  selectFile: (path: string) => void;
  setOpenFolders: (folders: string[]) => void;
  setSelectedFile: (file: string | null) => void;
}

export const useFileTreeStore = create<FileTreeStore>((set, get) => ({
  openFolders: [],
  selectedFile: null,
  toggleFolder: (path) =>
    set((state) => ({
      openFolders: state.openFolders.includes(path)
        ? state.openFolders.filter((f) => f !== path)
        : [...state.openFolders, path],
    })),
  selectFile: (path) => set({ selectedFile: path }),
  setOpenFolders: (folders) => set({ openFolders: folders }),
  setSelectedFile: (file) => set({ selectedFile: file }),
}));

function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

function joinPath(parts: string[]) {
  return parts.filter(Boolean).join("/");
}

interface FileTreeSidebarProps {
  projectId: string;
  onFileClick?: (filePath: string) => void;
  className?: string;
}

export default function FileTreeSidebar({
  projectId,
  onFileClick,
  className,
}: FileTreeSidebarProps) {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [renamePath, setRenamePath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState("");
  const {
    openFolders,
    selectedFile,
    toggleFolder,
    selectFile,
    setSelectedFile,
  } = useFileTreeStore();

  useEffect(() => {
    async function fetchTree() {
      setLoading(true);
      setError("");
      try {
        const tree = await FileService.getFiles(projectId);
        setTree(tree);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load file tree");
      } finally {
        setLoading(false);
      }
    }
    fetchTree();
  }, [projectId]);

  function handleFileClick(path: string) {
    selectFile(path);
    onFileClick?.(path);
  }

  function handleRename(path: string, value: string) {
    setRenamePath(path);
    setRenameValue(value);
  }

  async function submitRename(oldPath: string, newName: string) {
    setError("");
    const parts = oldPath.split("/");
    parts[parts.length - 1] = newName;
    const newPath = joinPath(parts);
    const isFolder = openFolders.includes(oldPath);
    const endpoint = isFolder ? "folder" : "file";
    const body = isFolder ? { oldPath, newPath } : { path: oldPath, newPath };
    const method = "PUT";
    try {
      await fetch(`/api/files/${projectId}/${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(body),
      });
      setRenamePath(null);
      setRenameValue("");
      // Refresh tree
      const tree = await FileService.getFiles(projectId);
      setTree(tree);
    } catch {
      setError("Rename failed");
    }
  }

  async function handleDelete(path: string, isFolder: boolean) {
    setError("");
    try {
      await FileService.deleteFile(projectId, path);
      // Refresh tree
      const tree = await FileService.getFiles(projectId);
      setTree(tree);
    } catch {
      setError("Delete failed");
    }
  }

  function renderTree(node: FileNode, pathParts: string[] = []) {
    return (
      Array.isArray(Object.entries(node)) ? Object.entries(node) : []
    ).map(([name, data]: [string, any]) => {
      if (name.startsWith("__")) return null;
      const path = joinPath([...pathParts, name]);
      const isFolder = data.__file?.isFolder;
      const isOpen = openFolders.includes(path);
      const isSelected = selectedFile === path;
      return (
        <div
          key={path}
          className={cn("flex flex-col", isFolder ? "font-semibold" : "")}
        >
          <div
            className={cn(
              "flex items-center px-2 py-1 rounded hover:bg-accent group cursor-pointer",
              isSelected && !isFolder && "bg-accent text-accent-foreground",
              isFolder && "bg-muted"
            )}
            onClick={() =>
              isFolder ? toggleFolder(path) : handleFileClick(path)
            }
          >
            {isFolder ? (
              isOpen ? (
                <FiFolderOpen className="mr-2 text-yellow-600" />
              ) : (
                <FiFolder className="mr-2 text-yellow-600" />
              )
            ) : (
              <FiFile className="mr-2 text-blue-600" />
            )}
            {renamePath === path ? (
              <Input
                className="w-32 h-6 text-xs"
                value={renameValue}
                autoFocus
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => submitRename(path, renameValue)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename(path, renameValue);
                  if (e.key === "Escape") setRenamePath(null);
                }}
              />
            ) : (
              <span
                className="truncate flex-1"
                onDoubleClick={() => handleRename(path, name)}
              >
                {name}
              </span>
            )}
            <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename(path, name);
                }}
              >
                <FiEdit2 className="text-xs" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(path, !!isFolder);
                }}
              >
                <FiTrash2 className="text-xs text-red-500" />
              </Button>
            </div>
          </div>
          {isFolder && isOpen && (
            <div className="ml-4 border-l border-muted-foreground/20 pl-2">
              {renderTree(data.__children, [...pathParts, name])}
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <aside
      className={cn(
        "w-full max-w-xs min-w-[180px] bg-background border-r h-full overflow-y-auto",
        className
      )}
    >
      <div className="p-2 text-xs font-bold text-muted-foreground border-b">
        FILES
      </div>
      {loading && (
        <div className="p-2 text-xs text-muted-foreground">Loading...</div>
      )}
      {error && <div className="p-2 text-xs text-red-500">{error}</div>}
      <div className="p-2">
        {tree
          ? renderTree(tree)
          : !loading && (
              <div className="text-xs text-muted-foreground">No files</div>
            )}
      </div>
    </aside>
  );
}
