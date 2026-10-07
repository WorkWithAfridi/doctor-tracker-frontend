import assert from "node:assert/strict";
import { test } from "node:test";
import {
  demoActions,
  getDemoSnapshot,
  initializeDemoStore,
} from "../src/services/demo-store";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

test("demo management preserves relationships and persists all mutations", () => {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
  initializeDemoStore();
  assert.equal(getDemoSnapshot().doctors.length, 24);
  assert.equal(getDemoSnapshot().patients.length, 186);
  assert.equal(getDemoSnapshot().authenticated, false);
  assert.throws(() =>
    demoActions.login("admin@doctortracker.com", "incorrect"),
  );
  demoActions.login("admin@doctortracker.com", "Admin123!");
  assert.equal(getDemoSnapshot().authenticated, true);
  assert.equal(sessionStorage.getItem("doctor-tracker-demo-session"), "active");

  const doctor = {
    name: "Dr. Demo Test",
    specialization: "Cardiology",
    hospital: "Demo Hospital",
    email: "demo-test@example.com",
    phone: "+880 1712345678",
  };
  demoActions.saveDoctor(doctor);
  const addedDoctor = getDemoSnapshot().doctors[0];
  assert.equal(getDemoSnapshot().doctors.length, 25);
  assert.throws(
    () =>
      demoActions.saveDoctor({ ...doctor, email: doctor.email.toUpperCase() }),
    /already exists/,
  );
  assert.throws(
    () => demoActions.saveDoctor({ ...doctor, name: " " }),
    /complete all/,
  );
  demoActions.saveDoctor(
    { ...doctor, name: "Dr. Updated Demo" },
    addedDoctor.id,
  );
  assert.equal(getDemoSnapshot().doctors[0].createdAt, addedDoctor.createdAt);
  assert.equal(getDemoSnapshot().doctors[0].name, "Dr. Updated Demo");

  const patient = {
    firstName: "Demo",
    lastName: "Patient",
    age: 32,
    gender: "Female",
    email: "",
    phone: "+880 1812345678",
    condition: "Stable" as const,
    doctorId: addedDoctor.id,
  };
  assert.throws(
    () => demoActions.savePatient({ ...patient, doctorId: "missing" }),
    /existing doctor/,
  );
  assert.throws(
    () => demoActions.savePatient({ ...patient, age: -1 }),
    /valid age/,
  );
  demoActions.savePatient(patient);
  const addedPatient = getDemoSnapshot().patients[0];
  assert.equal(getDemoSnapshot().patients.length, 187);
  const reassignedDoctor = getDemoSnapshot().doctors[1].id;
  demoActions.savePatient(
    { ...patient, doctorId: reassignedDoctor, condition: "Recovering" },
    addedPatient.id,
  );
  assert.equal(getDemoSnapshot().patients[0].doctorId, reassignedDoctor);
  assert.equal(getDemoSnapshot().patients[0].condition, "Recovering");
  assert.equal(getDemoSnapshot().patients[0].createdAt, addedPatient.createdAt);
  const persisted = JSON.parse(localStorage.getItem("doctor-tracker-demo-v1")!);
  assert.equal(persisted.patients[0].doctorId, reassignedDoctor);
  demoActions.deletePatient(addedPatient.id);
  assert.equal(getDemoSnapshot().patients.length, 186);
  assert.equal(
    JSON.parse(localStorage.getItem("doctor-tracker-demo-v1")!).patients.length,
    186,
  );
  demoActions.reset();
  assert.equal(getDemoSnapshot().doctors.length, 24);
  assert.equal(getDemoSnapshot().authenticated, true);
  assert.ok(
    getDemoSnapshot().patients.every((item) =>
      getDemoSnapshot().doctors.some((doctor) => doctor.id === item.doctorId),
    ),
  );
  demoActions.logout();
  assert.equal(getDemoSnapshot().authenticated, false);
  assert.equal(sessionStorage.getItem("doctor-tracker-demo-session"), null);
});

test("storage failures retain current-session changes and expose a warning", () => {
  const original = localStorage.setItem.bind(localStorage);
  localStorage.setItem = () => {
    throw new Error("Storage blocked");
  };
  demoActions.saveDoctor({
    name: "Dr. Temporary",
    specialization: "Neurology",
    hospital: "Demo",
    email: "temporary@example.com",
    phone: "0123456789",
  });
  assert.equal(getDemoSnapshot().doctors[0].name, "Dr. Temporary");
  assert.equal(getDemoSnapshot().storageError, true);
  localStorage.setItem = original;
  demoActions.reset();
  assert.equal(getDemoSnapshot().storageError, false);
});
