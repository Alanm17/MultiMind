"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProjectStore } from "@/store/useProjectStore";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Download,
  FolderTree,
  Github,
  Moon,
  Play,
  Settings,
  Square,
  Sun,
} from "lucide-react";
import { useRef, useState } from "react";
import { apiRequest } from "@/lib/api";

export function Header() {
  const {
    project,
    theme,
    toggleTheme,
    toggleFileTree,
    isFileTreeCollapsed,
    createNewProject,
  } = useProjectStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const downloadZip = async () => {
    if (!project?.id) return;
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      }/api/projects/${project.id}/download`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) return;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name || "project"}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // New Project button handler
  const handleNewProject = async () => {
    const name = prompt("Enter project name:", "Untitled Project");
    if (!name) return;
    await createNewProject(name);
  };

  return (
    <TooltipProvider>
      <header className="h-14 border-b bg-user-bg text-user-text shadow">
        <div className="flex h-full items-center justify-between px-4">
          {/* Left Section - Logo & Project Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-user-bg flex items-center justify-center shadow">
                <span className="text-user-text font-bold text-sm">M</span>
              </div>
              <h1 className="text-lg font-semibold text-user-text">
                MultiMind
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">|</span>

              <Badge variant="secondary" className="text-xs">
                {project?.framework}
              </Badge>
              <Badge
                variant={
                  project?.status === "idle"
                    ? "default"
                    : project?.status === "generating"
                    ? "secondary"
                    : project?.status === "building"
                    ? "secondary"
                    : "destructive"
                }
                className="text-xs"
              >
                {project?.status}
              </Badge>
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center gap-2">
            {/* File Tree Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFileTree}
                  className="h-8 w-8 p-0"
                >
                  <FolderTree className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFileTreeCollapsed ? "Show" : "Hide"} File Tree</p>
              </TooltipContent>
            </Tooltip>

            {/* Project Controls */}
            <div className="hidden md:flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Start Development Server</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Stop Development Server</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Export Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadZip}>
                  <Download className="mr-2 h-4 w-4" />
                  Download ZIP
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Github className="mr-2 h-4 w-4" />
                  Export to GitHub
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="h-8 w-8 p-0"
                >
                  {theme === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle {theme === "light" ? "dark" : "light"} mode</p>
              </TooltipContent>
            </Tooltip>

            {/* New Project Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewProject}
              className="ml-2"
            >
              New Project
            </Button>
          </div>
        </div>
      </header>
      {/* Settings Modal */}
      <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-user-bg dark:bg-zinc-900 p-6 shadow-lg">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Settings
            </Dialog.Title>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Theme</span>
                <Button onClick={toggleTheme} variant="outline">
                  {theme === "light" ? "Switch to Dark" : "Switch to Light"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Font Size</span>
                <span className="text-muted-foreground">(Coming soon)</span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setSettingsOpen(false)}
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </TooltipProvider>
  );
}
