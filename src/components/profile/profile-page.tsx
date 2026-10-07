"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, UserRound, UserPlus } from "lucide-react";
import { authActions, useAuth } from "@/services/auth-store";
import { apiRequest } from "@/lib/api";
import { useApi, invalidateRecords } from "@/hooks/use-api";
import { RequestState } from "@/components/common/request-state";
import type { Admin, ListResponse } from "@/types/domain";

export function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get("newPassword"));
    if (password !== data.get("confirmPassword")) {
      setError("New passwords do not match.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await authActions.changePassword(
        String(data.get("currentPassword")),
        password,
      );
      router.replace("/login");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to change password.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR ACCOUNT</span>
          <h1>Profile</h1>
          <p>Manage your password and workspace access.</p>
        </div>
      </div>
      <div className="settings-grid profile-grid">
        <section className="panel settings-card">
          <span className="mini-icon mint">
            <UserRound size={21} />
          </span>
          <h2>Your account</h2>
          <dl className="profile-details">
            <dt>Name</dt>
            <dd>{user?.name}</dd>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
            <dt>Role</dt>
            <dd>{user?.role === "admin" ? "Administrator" : "Staff"}</dd>
          </dl>
          <p>
            {user?.role === "admin"
              ? "You can add staff and manage workspace data."
              : "You can manage doctors and patients. Account creation and database maintenance are reserved for administrators."}
          </p>
        </section>
        <section className="panel settings-card">
          <span className="mini-icon mint">
            <KeyRound size={21} />
          </span>
          <h2>Change password</h2>
          <p>
            Use at least 8 characters. Changing your password signs you out on
            every device. Sign in again with your new password.
          </p>
          <form className="profile-form" onSubmit={changePassword}>
            <label className="form-field">
              Current password
              <input
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                maxLength={72}
              />
            </label>
            <label className="form-field">
              New password
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
              />
            </label>
            <label className="form-field">
              Confirm new password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" disabled={pending}>
              {pending ? "Changing password…" : "Change password"}
            </button>
          </form>
        </section>
      </div>
      {user?.role === "admin" && <StaffManagement />}
    </>
  );
}

function StaffManagement() {
  const [page, setPage] = useState(1);
  const result = useApi<ListResponse<Admin>>(`/users?page=${page}&limit=20`);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function addStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("password") !== data.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const response = await apiRequest<{ data: Admin }>("/users", {
        method: "POST",
        body: JSON.stringify({
          name: String(data.get("name")),
          email: String(data.get("email")).trim().toLowerCase(),
          password: String(data.get("password")),
        }),
      });
      form.reset();
      setPage(1);
      invalidateRecords();
      setSuccess(
        `${response.data.name} can now sign in with their email and the password you provided.`,
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to add staff.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="profile-staff">
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORKSPACE ACCESS</span>
          <h2>Staff accounts</h2>
          <p>
            Create individual logins for your team. Staff cannot add users or
            reset the database.
          </p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel settings-card">
          <span className="mini-icon mint">
            <UserPlus size={21} />
          </span>
          <h2>Add staff</h2>
          <form className="profile-form" onSubmit={addStaff}>
            <label className="form-field">
              Full name
              <input
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
              />
            </label>
            <label className="form-field">
              Staff email
              <input
                name="email"
                type="email"
                autoComplete="off"
                maxLength={254}
                required
              />
            </label>
            <label className="form-field">
              Initial password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />
            </label>
            <label className="form-field">
              Confirm initial password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="profile-success" role="status">
                {success}
              </p>
            )}
            <button className="button primary" disabled={pending}>
              {pending ? "Adding staff…" : "Add staff user"}
            </button>
          </form>
        </section>
        <section className="panel settings-card">
          <h2>Workspace users</h2>
          <p>{result.data?.pagination.total ?? 0} accounts</p>
          {result.loading || result.error ? (
            <RequestState {...result} />
          ) : (
            <>
              <ul className="profile-user-list">
                {result.data?.data.map((user) => (
                  <li key={user.id}>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    <small>
                      {user.role === "admin" ? "Administrator" : "Staff"}
                    </small>
                  </li>
                ))}
              </ul>
              <div className="profile-pagination">
                <button
                  className="button secondary"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>
                  {page} / {result.data?.pagination.pages ?? 1}
                </span>
                <button
                  className="button secondary"
                  disabled={page >= (result.data?.pagination.pages ?? 1)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
