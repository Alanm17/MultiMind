import { useEffect, useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { apiRequest } from "@/lib/api";

interface Member {
  userId: string;
  user: { email: string };
  role: string;
}

export default function ProjectMembers({
  projectId,
  token,
}: {
  projectId: string;
  token: string;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [userId, setUserId] = useState<string | null>(null);
  const [userLookupLoading, setUserLookupLoading] = useState(false);
  const [userLookupError, setUserLookupError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const lookupTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    apiRequest(`/api/projects/${projectId}/members`, { protected: true })
      .then(setMembers)
      .catch(() => setError("Failed to load members"));
  }, [projectId, token]);

  // Auto-lookup user by email as user types
  useEffect(() => {
    setUserId(null);
    setUserLookupError("");
    if (!email) return;
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    lookupTimeout.current = setTimeout(async () => {
      setUserLookupLoading(true);
      try {
        const user = await apiRequest(
          `/api/users/by-email?email=${encodeURIComponent(email)}`,
          { protected: true }
        );
        setUserId(user.id);
      } catch {
        setUserLookupError("User not found");
        setUserId(null);
      } finally {
        setUserLookupLoading(false);
      }
    }, 500);
    return () => {
      if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    };
  }, [email, token]);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAddLoading(true);
    setAddSuccess(false);
    if (!userId) {
      setError("Please enter a valid user email");
      setAddLoading(false);
      return;
    }
    const res = await apiRequest(`/api/projects/${projectId}/members`, {
      method: "POST",
      body: { userId, role },
      protected: true,
    });
    if (res) {
      setEmail("");
      setRole("editor");
      setAddSuccess(true);
      toast({
        title: "Member added",
        description: "User added to project successfully.",
      });
      // Refresh members
      apiRequest(`/api/projects/${projectId}/members`, { protected: true })
        .then(setMembers)
        .catch(() => setError("Failed to load members"));
    } else {
      setError("Failed to add member");
    }
    setAddLoading(false);
  }

  return (
    <div className="border p-4 rounded bg-white shadow-sm">
      <h3 className="font-bold mb-2">Project Members</h3>
      <form onSubmit={addMember} className="mb-2 flex gap-2 items-center">
        <Input
          className="border p-1 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="User email"
          required
        />
        <Select value={role} onValueChange={setRole}>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </Select>
        <Button type="submit" disabled={addLoading || !userId}>
          Add
        </Button>
        {userLookupLoading && (
          <span className="text-blue-500 text-xs ml-2">Looking up...</span>
        )}
        {userLookupError && (
          <span className="text-red-500 text-xs ml-2">{userLookupError}</span>
        )}
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <ul className="divide-y divide-gray-200">
        {members.map((m) => (
          <li key={m.userId} className="py-1 flex items-center justify-between">
            <span>
              {m.user.email}{" "}
              <span className="text-xs text-gray-500">({m.role})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
