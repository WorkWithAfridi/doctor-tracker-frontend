"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Stethoscope,
  UsersRound,
  ChartNoAxesCombined,
} from "lucide-react";
import { authActions, useAuth } from "@/services/auth-store";

export default function LoginPage() {
  const { ready, authenticated, error: sessionError, retry } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (ready && authenticated) router.replace("/dashboard");
  }, [ready, authenticated, router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await authActions.login(
        String(data.get("email")),
        String(data.get("password")),
      );
      router.replace("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-icon">
            <Activity size={24} />
          </span>
          <span>
            Doctor Tracker<small>CARE OPERATIONS</small>
          </span>
        </div>
        <div className="login-story-content">
          <span className="eyebrow">A CLEARER PICTURE OF CARE</span>
          <h1>
            Good care starts
            <br />
            with a connected
            <br />
            <em>team.</em>
          </h1>
          <p>
            Your doctors, patients, and insights.
            <br />
            Together in one thoughtful workspace.
          </p>
          <div className="login-preview">
            <div className="preview-heading">
              <span className="demo-dot" />
              Your care network <span>All connected</span>
            </div>
            <div className="preview-metrics">
              <div>
                <Stethoscope size={20} />
                <strong>24</strong>
                <span>Doctors</span>
              </div>
              <div>
                <UsersRound size={20} />
                <strong>186</strong>
                <span>Patients</span>
              </div>
              <div>
                <ChartNoAxesCombined size={20} />
                <strong>6</strong>
                <span>Specialties</span>
              </div>
            </div>
            <div className="preview-footer">
              <Check size={15} />
              Less administration. More clarity.
            </div>
          </div>
        </div>
        <div className="login-story-footer">
          Designed around your team. Built for better oversight.
        </div>
      </section>
      <section className="login-form-side">
        <div className="login-form-wrap">
          <span className="login-tag">WELCOME TO YOUR WORKSPACE</span>
          <h2>A good day to care.</h2>
          <p>Sign in to manage your care network.</p>
          <form onSubmit={submit}>
            <label className="form-field">
              Email address
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="form-field">
              Password
              <div className="password-field">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {sessionError && (
              <p className="form-error" role="alert">
                {sessionError}{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => void retry()}
                >
                  Retry connection
                </button>
              </p>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button primary login-submit"
              disabled={!ready || pending}
            >
              {pending ? "Signing in…" : "Sign in to workspace"}{" "}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="login-copyright">
            Doctor Tracker · Care operations
          </div>
        </div>
      </section>
    </main>
  );
}
