"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";

interface Task {
  id: string;
  type: string;
  agent: string;
  status: string;
  result?: unknown; // Use unknown for result
  error?: string;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let socket: ReturnType<typeof import("socket.io-client").default> | null =
      null;
    let isMounted = true;
    import("socket.io-client").then(({ default: io }) => {
      socket = io("http://localhost:3000"); // Adjust for your backend
      socket.on(
        "task:completed",
        (data: { taskId: string; result?: unknown }) => {
          if (!isMounted) return;
          setTasks((prev) =>
            prev.map((t) =>
              t.id === data.taskId
                ? { ...t, status: "done", result: data.result }
                : t
            )
          );
          setLogs((prev) => [...prev, `Task ${data.taskId} completed`]);
        }
      );
      socket.on("task:failed", (data: { taskId: string; error?: string }) => {
        if (!isMounted) return;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === data.taskId
              ? { ...t, status: "failed", error: data.error }
              : t
          )
        );
        setLogs((prev) => [...prev, `Task ${data.taskId} failed`]);
      });
      socket.on("log:info", (args: string[]) =>
        setLogs((prev) => [...prev, "[INFO] " + args.join(" ")])
      );
      socket.on("log:debug", (args: string[]) =>
        setLogs((prev) => [...prev, "[DEBUG] " + args.join(" ")])
      );
      socket.on("log:error", (args: string[]) =>
        setLogs((prev) => [...prev, "[ERROR] " + args.join(" ")])
      );
    });
    return () => {
      isMounted = false;
      if (socket) {
        socket.off("task:completed");
        socket.off("task:failed");
        socket.off("log:info");
        socket.off("log:debug");
        socket.off("log:error");
        socket.disconnect();
      }
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-10 px-4 flex flex-col items-center">
      <Card className="w-full max-w-2xl mb-8 shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-800">
            Workflow Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="font-semibold mb-2 text-blue-700">Tasks</h2>
          <ul className="space-y-4">
            {(Array.isArray(tasks) ? tasks : []).map((task: Task) => (
              <li
                key={task.id}
                className="p-4 rounded bg-white border shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-600">{task.type}</span>{" "}
                    <span className="text-xs text-muted-foreground">
                      ({task.agent})
                    </span>
                  </div>
                  <span
                    className={
                      task.status === "done"
                        ? "text-green-600 font-semibold"
                        : task.status === "failed"
                        ? "text-red-600 font-semibold"
                        : "text-gray-600"
                    }
                  >
                    {task.status}
                  </span>
                </div>
                {typeof task.result !== "undefined" && (
                  <pre className="bg-gray-50 p-2 mt-2 rounded text-xs overflow-x-auto">
                    {typeof task.result === "string"
                      ? task.result
                      : JSON.stringify(task.result, null, 2)}
                  </pre>
                )}
                {task.error && (
                  <div className="text-red-500 mt-2">
                    {typeof task.error === "string"
                      ? task.error
                      : JSON.stringify(task.error, null, 2)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="w-full max-w-2xl shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-blue-700">
            Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="bg-gray-50 p-4 rounded max-h-64 overflow-y-auto text-xs space-y-1">
            {(Array.isArray(logs) ? logs : []).map((log: string, i: number) => (
              <li key={i}>{log}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
