"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectStore } from "@/store/useProjectStore";

const CodeEditor = dynamic(
  () => import("@/components/Editor/CodeEditor").then((mod) => mod.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Spinner size={32} />
      </div>
    ),
  }
);
const PreviewPane = dynamic(
  () =>
    import("@/components/Preview/PreviewPane").then((mod) => mod.PreviewPane),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Spinner size={32} />
      </div>
    ),
  }
);
const TerminalWindow = dynamic(
  () =>
    import("@/components/Terminal/TerminalWindow").then(
      (mod) => mod.TerminalWindow
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Spinner size={32} />
      </div>
    ),
  }
);

export function RightPanel() {
  const { rightPanelMode, setRightPanelMode } = useProjectStore();

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={rightPanelMode}
        onValueChange={(value) =>
          setRightPanelMode(value as "app" | "coder" | "terminal")
        }
        className="flex flex-col h-full"
      >
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 p-0">
          <TabsTrigger
            value="app"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            App Preview
          </TabsTrigger>
          <TabsTrigger
            value="coder"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Code Editor
          </TabsTrigger>
          <TabsTrigger
            value="terminal"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Terminal
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent
            value="app"
            className="h-full m-0 data-[state=inactive]:hidden overflow-hidden"
          >
            <PreviewPane />
          </TabsContent>

          <TabsContent
            value="coder"
            className="h-full m-0 data-[state=inactive]:hidden overflow-hidden"
          >
            <CodeEditor />
          </TabsContent>

          <TabsContent
            value="terminal"
            className="h-full m-0 data-[state=inactive]:hidden overflow-hidden"
          >
            <TerminalWindow />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
