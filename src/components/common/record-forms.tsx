"use client";
import { useState, type FormEvent } from "react";
import { demoActions, useDemo } from "@/services/demo-store";
import { conditions, type Doctor, type Patient } from "@/types/domain";
import { specializations, hospitals } from "@/constants/demo-data";
import { Modal } from "./ui";

export function notify(message: string) {
  window.dispatchEvent(new CustomEvent("demo-notice", { detail: message }));
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
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      demoActions.saveDoctor(
        {
          name: text(data, "name"),
          specialization: text(data, "specialization"),
          hospital: text(data, "hospital"),
          email: text(data, "email").toLowerCase(),
          phone: text(data, "phone"),
        },
        doctor?.id,
      );
      notify(
        doctor ? "Doctor updated successfully" : "Doctor added successfully",
      );
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save doctor.",
      );
    }
  }
  return (
    <Modal
      title={doctor ? "Edit doctor" : "Add a doctor"}
      description="Keep your care team information up to date."
      onClose={onClose}
    >
      <form onSubmit={submit}>
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
              {hospitals.map((value) => (
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
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="submit">
            {doctor ? "Save changes" : "Add doctor"}
          </button>
        </div>
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
  const { doctors } = useDemo();
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const condition = text(data, "condition");
    if (!conditions.some((value) => value === condition)) {
      setError("Please select a condition.");
      return;
    }
    try {
      demoActions.savePatient(
        {
          firstName: text(data, "firstName"),
          lastName: text(data, "lastName"),
          age: Number(data.get("age")),
          gender: text(data, "gender"),
          email: text(data, "email"),
          phone: text(data, "phone"),
          condition: condition as Patient["condition"],
          doctorId: doctorId ?? text(data, "doctorId"),
        },
        patient?.id,
      );
      notify(
        patient ? "Patient updated successfully" : "Patient added successfully",
      );
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save patient.",
      );
    }
  }
  return (
    <Modal
      title={patient ? "Edit patient" : "Add a patient"}
      description="Patient information is fictional and saved in this browser."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field
            label="First name"
            name="firstName"
            value={patient?.firstName}
          />
          <Field label="Last name" name="lastName" value={patient?.lastName} />
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
              disabled={!!doctorId}
              defaultValue={doctorId ?? patient?.doctorId ?? ""}
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
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="submit">
            {patient ? "Save changes" : "Add patient"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DeletePatient({
  patient,
  onClose,
}: {
  patient: Patient;
  onClose: () => void;
}) {
  return (
    <Modal
      title="Delete patient?"
      description={`This will permanently remove ${patient.firstName} ${patient.lastName} from the demo records and their doctor's patient list.`}
      onClose={onClose}
    >
      <div className="warning-box">
        This action cannot be undone. You can restore the original fictional
        records using Reset demo data.
      </div>
      <div className="modal-footer">
        <button className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="button danger"
          onClick={() => {
            demoActions.deletePatient(patient.id);
            notify("Patient deleted successfully");
            onClose();
          }}
        >
          Delete patient
        </button>
      </div>
    </Modal>
  );
}
