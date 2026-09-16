import { useState } from "react";
import config from "../config";

const AUTH_STORAGE_KEY = "braino_auth_token";
const USER_STORAGE_KEY = "braino_auth_user";

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const response = await fetch(`${config.API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Authentication failed. Please try again.");
      }

      localStorage.setItem(AUTH_STORAGE_KEY, data.access_token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));

      if (onAuthenticated) {
        onAuthenticated(data);
      }
    } catch (submitError) {
      setError(submitError.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] lg:flex-row">
        <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-500 via-cyan-500 to-indigo-600 p-10 text-white lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.25),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.25),transparent_28%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-50">
              Braino AI
            </div>
            <h1 className="mt-8 max-w-md text-4xl font-black leading-tight tracking-tight">
              Your mental wellness journey starts here.
            </h1>
            <p className="mt-4 max-w-md text-base text-emerald-50/90">
              Personalized support, mood tracking, guided routines, and compassionate tools designed around your everyday wellbeing.
            </p>
          </div>

          <div className="relative z-10 grid gap-4">
            {[
              "Daily check-ins and stress insights",
              "AI-guided wellness routines",
              "Secure, private access to your progress",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg">✓</span>
                <span className="text-sm font-medium text-emerald-50">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-1 items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Welcome</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                {isRegister ? "Create your account" : "Sign in to continue"}
              </h2>
            </div>

            <div className="mb-6 inline-flex w-full rounded-2xl bg-slate-100 p-1">
              {[
                { id: "login", label: "Login" },
                { id: "register", label: "Sign up" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    mode === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    required={isRegister}
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Email address</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </label>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (isRegister ? "Creating account..." : "Signing in...") : isRegister ? "Create account" : "Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isRegister ? "Already have an account?" : "Need an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(isRegister ? "login" : "register")}
                className="font-semibold text-emerald-600 hover:text-emerald-500"
              >
                {isRegister ? "Login instead" : "Create one"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;