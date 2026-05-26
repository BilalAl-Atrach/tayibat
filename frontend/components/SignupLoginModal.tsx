"use client";
import { useState } from "react";
import axios from "axios";
import api from "@/lib/api";

interface AuthUser {
  id: number;
  name?: string;
  condition?: string | null;
  role?: "user" | "admin" | string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
}

const setAuthCookie = (name: string, value: string) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=2592000; samesite=lax`;
};

export default function SignupLoginModal({ onClose }: { onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint = isLogin ? "/login" : "/register";
      const { data } = await api.post<AuthResponse>(endpoint, formData);

      setMessageType("success");
      setMessage(isLogin ? "Login successful!" : "Registration successful!");

      const user = data.user;

      if (user.id && data.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userId", user.id.toString());
        if (user.name) localStorage.setItem("userName", user.name);
        localStorage.setItem("userRole", user.role || "user");
        setAuthCookie("tayibat_role", user.role || "user");

        const savedCondition = user.condition || null;

        if (savedCondition) {
          localStorage.setItem("selectedCondition", savedCondition);
        } else {
          localStorage.removeItem("selectedCondition");
        }
      }

      onClose();
      window.location.reload();
    } catch (err) {
      setMessageType("error");

      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setMessage("We cannot reach the backend right now. Check that Laravel is running and try again.");
          return;
        }

        setMessage(
          err.response.data?.error ||
            err.response.data?.message ||
            (isLogin
              ? "Login failed. Check your email and password."
              : "Registration failed. Check the form and try again.")
        );
        return;
      }

      setMessage("The request could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-5">
      <div className="relative max-h-[calc(100dvh-2.5rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-lg sm:p-8">
        <button
          onClick={onClose}
          disabled={loading}
          aria-label="Close authentication modal"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          X
        </button>

        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">
          {isLogin ? "Login to Tayibat" : "Sign Up for Tayibat"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              className="min-h-11 w-full rounded-lg border px-4 py-2 text-gray-950 outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          )}
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="min-h-11 w-full rounded-lg border px-4 py-2 text-gray-950 outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="min-h-11 w-full rounded-lg border px-4 py-2 text-gray-950 outline-none focus:ring-2 focus:ring-green-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 rounded-md px-3 py-2 text-center text-sm ${
              messageType === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-center text-gray-600 mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}
            disabled={loading}
            className="text-green-700 font-semibold hover:underline"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
