"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createDemoData } from "@/constants/demo-data";
import type { DemoData, Doctor, Patient } from "@/types/domain";
import { conditions } from "@/types/domain";

const dataKey = "doctor-tracker-demo-v1";
const sessionKey = "doctor-tracker-demo-session";
interface Snapshot extends DemoData {
  ready: boolean;
  authenticated: boolean;
  storageError: boolean;
}
const empty: Snapshot = {
  doctors: [],
  patients: [],
  ready: false,
  authenticated: false,
  storageError: false,
};
let snapshot = empty;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function validData(value: unknown): value is DemoData {
  if (
    !isRecord(value) ||
    !Array.isArray(value.doctors) ||
    !Array.isArray(value.patients)
  )
    return false;
  const doctorsValid = value.doctors.every(
    (doctor: unknown) =>
      isRecord(doctor) &&
      [
        "id",
        "name",
        "specialization",
        "hospital",
        "email",
        "phone",
        "createdAt",
      ].every((key) => typeof doctor[key] === "string") &&
      !Number.isNaN(Date.parse(String(doctor.createdAt))),
  );
  if (!doctorsValid) return false;
  const ids = new Set(
    value.doctors.map((doctor: Record<string, unknown>) => doctor.id),
  );
  return (
    doctorsValid &&
    value.patients.every(
      (patient: unknown) =>
        isRecord(patient) &&
        [
          "id",
          "firstName",
          "lastName",
          "gender",
          "email",
          "phone",
          "doctorId",
          "createdAt",
        ].every((key) => typeof patient[key] === "string") &&
        typeof patient.age === "number" &&
        Number.isInteger(patient.age) &&
        patient.age >= 0 &&
        patient.age <= 120 &&
        conditions.some((condition) => condition === patient.condition) &&
        ids.has(patient.doctorId) &&
        !Number.isNaN(Date.parse(String(patient.createdAt))),
    )
  );
}

export function initializeDemoStore() {
  if (snapshot.ready) return;
  let data = createDemoData();
  let authenticated = false;
  let storageError = false;
  try {
    const raw = localStorage.getItem(dataKey);
    if (raw) {
      const saved: unknown = JSON.parse(raw);
      if (validData(saved)) data = saved;
    }
    localStorage.setItem(dataKey, JSON.stringify(data));
    authenticated = sessionStorage.getItem(sessionKey) === "active";
  } catch {
    storageError = true;
  }
  snapshot = { ...data, ready: true, authenticated, storageError };
  emit();
}

function save(data: DemoData) {
  let storageError = snapshot.storageError;
  try {
    localStorage.setItem(dataKey, JSON.stringify(data));
    storageError = false;
  } catch {
    storageError = true;
  }
  snapshot = { ...snapshot, ...data, storageError };
  emit();
}

export function useDemo() {
  const state = useSyncExternalStore(subscribe, getDemoSnapshot, () => empty);
  useEffect(initializeDemoStore, []);
  return state;
}

export function getDemoSnapshot() {
  return snapshot;
}

export const demoActions = {
  login(email: string, password: string) {
    if (
      email.trim().toLowerCase() !== "admin@doctortracker.com" ||
      password !== "Admin123!"
    )
      throw new Error(
        "The email or password is incorrect. Try the demo credentials below.",
      );
    let storageError = snapshot.storageError;
    try {
      sessionStorage.setItem(sessionKey, "active");
    } catch {
      storageError = true;
    }
    snapshot = { ...snapshot, authenticated: true, storageError };
    emit();
  },
  logout() {
    try {
      sessionStorage.removeItem(sessionKey);
    } catch {
      /* Session still ends in memory. */
    }
    snapshot = { ...snapshot, authenticated: false };
    emit();
  },
  saveDoctor(input: Omit<Doctor, "id" | "createdAt">, id?: string) {
    if (
      [input.name, input.specialization, input.hospital, input.phone].some(
        (value) => !value.trim(),
      ) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)
    )
      throw new Error("Please complete all doctor fields with a valid email.");
    if (id && !snapshot.doctors.some((doctor) => doctor.id === id))
      throw new Error("This doctor no longer exists.");
    if (
      snapshot.doctors.some(
        (doctor) =>
          doctor.id !== id &&
          doctor.email.toLowerCase() === input.email.toLowerCase(),
      )
    )
      throw new Error("A doctor with this email already exists.");
    const doctor: Doctor = {
      ...input,
      id: id ?? crypto.randomUUID(),
      createdAt:
        snapshot.doctors.find((item) => item.id === id)?.createdAt ??
        new Date().toISOString(),
    };
    save({
      doctors: id
        ? snapshot.doctors.map((item) => (item.id === id ? doctor : item))
        : [doctor, ...snapshot.doctors],
      patients: snapshot.patients,
    });
  },
  savePatient(input: Omit<Patient, "id" | "createdAt">, id?: string) {
    if (
      !input.firstName.trim() ||
      !input.lastName.trim() ||
      !input.phone.trim() ||
      !Number.isInteger(input.age) ||
      input.age < 0 ||
      input.age > 120 ||
      !conditions.includes(input.condition)
    )
      throw new Error("Please enter a name, phone, valid age, and condition.");
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
      throw new Error("Please enter a valid patient email.");
    if (id && !snapshot.patients.some((patient) => patient.id === id))
      throw new Error("This patient no longer exists.");
    if (!snapshot.doctors.some((doctor) => doctor.id === input.doctorId))
      throw new Error("Please select an existing doctor.");
    const patient: Patient = {
      ...input,
      id: id ?? crypto.randomUUID(),
      createdAt:
        snapshot.patients.find((item) => item.id === id)?.createdAt ??
        new Date().toISOString(),
    };
    save({
      doctors: snapshot.doctors,
      patients: id
        ? snapshot.patients.map((item) => (item.id === id ? patient : item))
        : [patient, ...snapshot.patients],
    });
  },
  deletePatient(id: string) {
    save({
      doctors: snapshot.doctors,
      patients: snapshot.patients.filter((patient) => patient.id !== id),
    });
  },
  reset() {
    save(createDemoData());
  },
};
