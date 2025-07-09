import { useState } from "react";
import { useRouter } from "next/router";
import { apiRequest } from "@/lib/api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await apiRequest("/api/users/register", {
        method: "POST",
        body: { email, password },
      });
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (typeof err === "object" && err && "error" in err) {
        setError((err as { error: string }).error || "Registration failed");
      } else {
        setError("Registration failed");
      }
    }
  }

  return (
    <form
      onSubmit={handleRegister}
      className="max-w-sm mx-auto mt-10 p-4 border rounded"
    >
      <h2 className="text-lg font-bold mb-4">Register</h2>
      <input
        className="w-full mb-2 p-2 border rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="w-full mb-2 p-2 border rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button
        className="w-full bg-blue-600 text-white p-2 rounded"
        type="submit"
      >
        Register
      </button>
      <div className="mt-2 text-sm">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 underline">
          Login
        </a>
      </div>
    </form>
  );
}
