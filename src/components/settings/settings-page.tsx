"use client";
import { useState, type FormEvent } from "react";
import { Database, Trash2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useApi, invalidateRecords } from "@/hooks/use-api";
import { Modal } from "@/components/common/ui";
import { RequestState } from "@/components/common/request-state";
import { notify } from "@/components/common/record-forms";

interface Counts {
  doctors: number;
  patients: number;
}
export function SettingsPage() {
  const result = useApi<{ data: Counts }>("/settings/data");
  const [count, setCount] = useState(1500);
  const [doctorCount, setDoctorCount] = useState(100);
  const [operation, setOperation] = useState<"reset" | "populate" | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  function open(action: "reset" | "populate") {
    setError("");
    setConfirmation("");
    setOperation(action);
  }
  async function execute(event: FormEvent) {
    event.preventDefault();
    if (
      pending ||
      !operation ||
      (operation === "reset" && confirmation !== "RESET")
    )
      return;
    setPending(true);
    setError("");
    try {
      const response = await apiRequest<{
        data: Counts & { patientsAdded?: number; doctorsAdded?: number };
      }>(`/settings/${operation}`, {
        method: "POST",
        body: JSON.stringify(
          operation === "reset"
            ? { confirmation }
            : { patientCount: count, doctorCount },
        ),
      });
      invalidateRecords();
      notify(
        operation === "reset"
          ? "All doctor and patient records removed"
          : `${response.data.doctorsAdded} doctors and ${response.data.patientsAdded} patients added successfully`,
      );
      setOperation(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update the workspace.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORKSPACE PREFERENCES</span>
          <h1>Settings</h1>
          <p>Manage your workspace data.</p>
        </div>
      </div>
      {result.loading || result.error ? (
        <RequestState {...result} />
      ) : (
        <div className="settings-counts">
          <span>
            <strong>{result.data?.data.doctors.toLocaleString()}</strong>{" "}
            doctors
          </span>
          <span>
            <strong>{result.data?.data.patients.toLocaleString()}</strong>{" "}
            patients
          </span>
        </div>
      )}
      <div className="settings-grid">
        <section className="panel settings-card">
          <span className="mini-icon mint">
            <Database size={21} />
          </span>
          <h2>Populate sample data</h2>
          <p>
            Add fictional doctors and patients to the database for exploring
            search, pagination, and charts. Existing records are preserved.
          </p>
          <label className="form-field">
            Number of doctors
            <input
              type="number"
              min={1}
              max={2000}
              step={1}
              value={doctorCount}
              onChange={(event) => setDoctorCount(Number(event.target.value))}
            />
          </label>
          <label className="form-field">
            Number of patients
            <input
              type="number"
              min={1000}
              max={2000}
              step={1}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </label>
          <small>
            Choose 1–2,000 doctors and 1,000–2,000 patients. Every batch adds
            both; patients are assigned across your existing and new doctors.
          </small>
          <button
            className="button primary"
            disabled={
              pending ||
              result.loading ||
              !!result.error ||
              !Number.isInteger(count) ||
              count < 1000 ||
              count > 2000 ||
              !Number.isInteger(doctorCount) ||
              doctorCount < 1 ||
              doctorCount > 2000
            }
            onClick={() => open("populate")}
          >
            <Plus size={17} />
            Populate database
          </button>
        </section>
        <section className="panel settings-card">
          <span className="mini-icon peach">
            <Trash2 size={21} />
          </span>
          <h2>Reset workspace data</h2>
          <p>
            Permanently remove every doctor and patient from the connected
            database. Your administrator account, session, and database indexes
            are preserved.
          </p>
          <div className="warning-box">
            This deletes all doctor and patient records, including records you
            added yourself.
          </div>
          <button
            className="button danger"
            disabled={pending || result.loading || !!result.error}
            onClick={() => open("reset")}
          >
            Reset all records
          </button>
        </section>
      </div>
      {operation && (
        <Modal
          title={
            operation === "reset"
              ? "Reset all workspace records?"
              : "Populate sample data?"
          }
          description={
            operation === "reset"
              ? "This permanently deletes all doctors and patients. It cannot be undone."
              : `Add ${doctorCount.toLocaleString()} fictional doctors and ${count.toLocaleString()} patients while preserving your existing records.`
          }
          onClose={() => {
            if (!pending) setOperation(null);
          }}
        >
          <form onSubmit={execute}>
            <fieldset disabled={pending} className="settings-confirmation">
              {operation === "reset" && (
                <label className="form-field">
                  Type RESET to confirm
                  <input
                    autoComplete="off"
                    required
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                  />
                </label>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {pending && (
                <p role="status">Updating the database. Please wait…</p>
              )}
              <div className="modal-footer">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setOperation(null)}
                >
                  Cancel
                </button>
                <button
                  className={`button ${operation === "reset" ? "danger" : "primary"}`}
                  type="submit"
                  disabled={operation === "reset" && confirmation !== "RESET"}
                >
                  {pending
                    ? "Working…"
                    : operation === "reset"
                      ? "Delete all records"
                      : `Add ${doctorCount.toLocaleString()} doctors & ${count.toLocaleString()} patients`}
                </button>
              </div>
            </fieldset>
          </form>
        </Modal>
      )}
    </>
  );
}
