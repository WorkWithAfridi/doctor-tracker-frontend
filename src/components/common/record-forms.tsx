"use client";
import { useState, type FormEvent } from "react";
import { records } from "@/services/records";
import { useApi, invalidateRecords } from "@/hooks/use-api";
import { ApiError } from "@/lib/api";
import {
  conditions,
  type Doctor,
  type Patient,
  type DoctorOptions,
} from "@/types/domain";
import { specializations, hospitals } from "@/constants/care-options";
import { Modal } from "./ui";

export function notify(message: string) {
  window.dispatchEvent(
    new CustomEvent("workspace-notice", { detail: message }),
  );
}
function text(data: FormData, key: string) {
  return String(data.get(key) ?? "").trim();
}
function Field({
  label,
  name,
  value = "",
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  value?: string | number;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="form-field">
      {label}
      {required && <span className="required"> *</span>}
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        min={type === "number" ? 0 : undefined}
        max={type === "number" ? 120 : undefined}
        maxLength={type === "email" ? 254 : 100}
        pattern={type === "text" && required ? ".*\\S.*" : undefined}
      />
    </label>
  );
}

export function DoctorForm({
  doctor,
  onClose,
}: {
  doctor?: Doctor;
  onClose: () => void;
}) {
  const options = useApi<{ data: DoctorOptions }>("/doctors/options");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await records.saveDoctor(
        {
          name: text(data, "name"),
          specialization: text(data, "specialization"),
          hospital: text(data, "hospital"),
          email: text(data, "email").toLowerCase(),
          phone: text(data, "phone"),
        },
        doctor?.id,
      );
      invalidateRecords();
      notify(
        doctor ? "Doctor updated successfully" : "Doctor added successfully",
      );
      onClose();
    } catch (error) {
      setError(errorMessage(error, "Unable to save doctor."));
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title={doctor ? "Edit doctor" : "Add a doctor"}
      description="Keep your care team information up to date."
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <form onSubmit={submit}>
        <fieldset
          disabled={pending}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <div className="form-grid">
            <Field label="Full name" name="name" value={doctor?.name} />
            <label className="form-field">
              Specialization <span className="required">*</span>
              <select
                name="specialization"
                defaultValue={doctor?.specialization ?? ""}
                required
              >
                <option value="" disabled>
                  Select specialization
                </option>
                {[
                  ...new Set([
                    ...specializations,
                    ...(options.data?.data.specializations ?? []),
                    ...(doctor ? [doctor.specialization] : []),
                  ]),
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="form-field full">
              Hospital <span className="required">*</span>
              <input
                name="hospital"
                list="hospitals"
                defaultValue={doctor?.hospital}
                required
                maxLength={100}
                pattern=".*\S.*"
              />
              <datalist id="hospitals">
                {[
                  ...new Set([
                    ...hospitals,
                    ...(options.data?.data.hospitals ?? []),
                  ]),
                ].map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </label>
            <Field
              label="Email address"
              name="email"
              type="email"
              value={doctor?.email}
            />
            <Field
              label="Phone number"
              name="phone"
              type="tel"
              value={doctor?.phone}
            />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-footer">
            <button
              className="button secondary"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button primary" type="submit">
              {pending ? "Saving…" : doctor ? "Save changes" : "Add doctor"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

export function PatientForm({
  patient,
  doctorId,
  onClose,
}: {
  patient?: Patient;
  doctorId?: string;
  onClose: () => void;
}) {
  const directory = useApi<Doctor[]>("doctor-directory");
  const doctors = directory.data ?? [];
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [assignedDoctorId, setAssignedDoctorId] = useState(
    patient?.doctorId ?? doctorId ?? "",
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const condition = text(data, "condition");
    if (!conditions.some((value) => value === condition)) {
      setError("Please select a condition.");
      return;
    }
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await records.savePatient(
        {
          firstName: text(data, "firstName"),
          lastName: text(data, "lastName"),
          age: Number(data.get("age")),
          gender: text(data, "gender"),
          email: text(data, "email"),
          phone: text(data, "phone"),
          condition: condition as Patient["condition"],
          doctorId: patient
            ? text(data, "doctorId")
            : (doctorId ?? text(data, "doctorId")),
        },
        patient?.id,
        doctorId,
      );
      invalidateRecords();
      notify(
        patient ? "Patient updated successfully" : "Patient added successfully",
      );
      onClose();
    } catch (error) {
      setError(errorMessage(error, "Unable to save patient."));
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title={patient ? "Edit patient" : "Add a patient"}
      description="Keep patient information and care assignments up to date."
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      {directory.loading && <p role="status">Loading doctors…</p>}
      {directory.error && (
        <p className="form-error" role="alert">
          {directory.error}{" "}
          <button className="text-button" onClick={directory.retry}>
            Try again
          </button>
        </p>
      )}
      <form onSubmit={submit}>
        <fieldset
          disabled={pending || directory.loading || !!directory.error}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <div className="form-grid">
            <Field
              label="First name"
              name="firstName"
              value={patient?.firstName}
            />
            <Field
              label="Last name"
              name="lastName"
              value={patient?.lastName}
            />
            <Field label="Age" name="age" type="number" value={patient?.age} />
            <label className="form-field">
              Gender
              <select name="gender" defaultValue={patient?.gender ?? ""}>
                <option value="">Prefer not to say</option>
                {["Female", "Male", "Other"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <Field
              label="Phone number"
              name="phone"
              type="tel"
              value={patient?.phone}
            />
            <Field
              label="Email address"
              name="email"
              type="email"
              value={patient?.email}
              required={false}
            />
            <label className="form-field">
              Condition <span className="required">*</span>
              <select
                name="condition"
                defaultValue={patient?.condition ?? "Stable"}
              >
                {conditions.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Assigned doctor <span className="required">*</span>
              <select
                name="doctorId"
                required
                disabled={!!doctorId && !patient}
                value={assignedDoctorId}
                onChange={(event) => setAssignedDoctorId(event.target.value)}
              >
                <option value="" disabled>
                  Select doctor
                </option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-footer">
            <button
              className="button secondary"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button primary" type="submit">
              {pending ? "Saving…" : patient ? "Save changes" : "Add patient"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.fields)
    return Object.entries(error.fields)
      .map(([field, message]) => `${field}: ${message}`)
      .join("; ");
  return error instanceof Error ? error.message : fallback;
}

export function DeletePatient({
  patient,
  onClose,
}: {
  patient: Patient;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal
      title="Delete patient?"
      description={`This will permanently remove ${patient.firstName} ${patient.lastName} from the database and their doctor's patient list.`}
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="warning-box">This action cannot be undone.</div>
      <div className="modal-footer">
        <button
          className="button secondary"
          disabled={pending}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="button danger"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError("");
            try {
              await records.deletePatient(patient.id);
              invalidateRecords();
              notify("Patient deleted successfully");
              onClose();
            } catch (error) {
              setError(errorMessage(error, "Unable to delete patient."));
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? "Deleting…" : "Delete patient"}
        </button>
      </div>
    </Modal>
  );
}
