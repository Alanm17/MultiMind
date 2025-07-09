"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useProjectStore } from "@/store/useProjectStore";
import type { FileNode } from "@/types";
import { Sandpack } from "@codesandbox/sandpack-react";
import {
  ExternalLink,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useState } from "react";

export function PreviewPane() {
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { fileTree } = useProjectStore();

  // Convert fileTree to Sandpack files object
  function getSandpackFiles() {
    const files: Record<string, { code: string }> = {};
    function traverse(nodes: FileNode[]) {
      for (const node of nodes) {
        if (node.type === "file") {
          files[`/${node.path}`] = { code: node.content || "" };
        } else if (node.children) {
          traverse(node.children);
        }
      }
    }
    traverse(fileTree);
    return files;
  }

  const sandpackFiles = getSandpackFiles();

  // Choose template based on project (default to 'react')
  const template = "react";

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const viewportSizes = {
    mobile: { width: "375px", height: "667px" },
    tablet: { width: "768px", height: "1024px" },
    desktop: { width: "100%", height: "100%" },
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Live Preview</h3>
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant={viewport === "mobile" ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewport("mobile")}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              variant={viewport === "tablet" ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewport("tablet")}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={viewport === "desktop" ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewport("desktop")}
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm" className="h-8">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-900">
        <div className="h-full flex justify-center items-start pt-10">
          <div
            className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              width:
                viewport === "desktop" ? "100%" : viewportSizes[viewport].width,
              height:
                viewport === "desktop"
                  ? "100%"
                  : viewportSizes[viewport].height,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <Sandpack
              template={template}
              files={sandpackFiles}
              options={{
                showTabs: true,
                showLineNumbers: true,
                showConsole: true,
                wrapContent: true,
                editorHeight: 300,
                editorWidthPercentage: 50,
                resizablePanels: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
