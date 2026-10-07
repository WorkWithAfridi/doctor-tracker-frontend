import assert from "node:assert/strict";
import { test } from "node:test";
import { apiRequest, ApiError, onUnauthorized } from "../src/lib/api";
import { listQuery, records, doctorDirectory } from "../src/services/records";

test("requests include cookies, decode responses, and preserve cancellation", async (t) => {
  const calls: { url: string; options?: RequestInit }[] = [];
  const fetch = t.mock.method(
    globalThis,
    "fetch",
    async (url: string, options?: RequestInit) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ data: { id: "record" } }), {
        status: 200,
      });
    },
  );
  const result = await apiRequest<{ data: { id: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@example.com", password: "secret" }),
  });
  assert.equal(result.data.id, "record");
  assert.equal(calls[0].url, "/api/auth/login");
  assert.equal(calls[0].options?.credentials, "include");
  assert.equal(calls[0].options?.cache, "no-store");
  assert.equal(
    new Headers(calls[0].options?.headers).get("Content-Type"),
    "application/json",
  );
  fetch.mock.mockImplementation(
    async () => new Response(null, { status: 204 }),
  );
  assert.equal(await records.deletePatient("patient-id"), undefined);
  const abort = new DOMException("Cancelled", "AbortError");
  fetch.mock.mockImplementation(async () => {
    throw abort;
  });
  await assert.rejects(apiRequest("/doctors"), (error) => error === abort);
  fetch.mock.mockImplementation(async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(
    apiRequest("/doctors"),
    (error) => error instanceof ApiError && error.status === 0,
  );
});

test("field errors survive and only expired sessions trigger sign-out", async (t) => {
  let expired = 0;
  const unsubscribe = onUnauthorized(() => expired++);
  t.after(unsubscribe);
  const fetch = t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({
          message: "Validation failed",
          errors: { email: "Already used" },
        }),
        { status: 409 },
      ),
  );
  await assert.rejects(
    records.saveDoctor({
      name: "Dr Test",
      specialization: "Cardiology",
      hospital: "Hospital",
      phone: "1234567",
      email: "test@example.com",
    }),
    (error) =>
      error instanceof ApiError &&
      error.status === 409 &&
      error.fields?.email === "Already used",
  );
  fetch.mock.mockImplementation(
    async () =>
      new Response(JSON.stringify({ message: "Sign in again" }), {
        status: 401,
      }),
  );
  await assert.rejects(apiRequest("/auth/login"));
  assert.equal(expired, 0);
  await assert.rejects(apiRequest("/patients"));
  assert.equal(expired, 1);
});

test("URL filters map to backend query keys without forwarding unrelated keys", () => {
  const params = new URLSearchParams(
    "search=Ann&doctor=abc&condition=Stable&size=20&sort=name&from=2026-10-01&to=2026-10-07&unexpected=true",
  );
  const patient = new URLSearchParams(listQuery(params, 2, 20, "patients"));
  assert.equal(patient.get("doctorId"), "abc");
  assert.equal(patient.get("limit"), "20");
  assert.equal(patient.get("page"), "2");
  assert.equal(patient.get("sortBy"), "name");
  assert.equal(patient.get("sortOrder"), "asc");
  assert.equal(patient.get("to"), "2026-10-07");
  assert.equal(patient.has("unexpected"), false);
  assert.equal(patient.has("size"), false);
  const doctor = new URLSearchParams(listQuery(params, 1, 10, "doctors"));
  assert.equal(doctor.has("doctorId"), false);
  assert.equal(doctor.has("condition"), false);
  assert.equal(
    new URLSearchParams(listQuery(new URLSearchParams(), 1, 10, "doctors")).get(
      "sortOrder",
    ),
    "desc",
  );
});

test("nested creation omits doctorId while edits preserve reassignment", async (t) => {
  const calls: { url: string; options: RequestInit }[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (url: string, options: RequestInit) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ data: {} }), { status: 201 });
    },
  );
  const input = {
    firstName: "Test",
    lastName: "Patient",
    age: 20,
    gender: "",
    email: "",
    phone: "1234567",
    condition: "Stable" as const,
    doctorId: "assigned-doctor",
  };
  await records.savePatient(input, undefined, "route-doctor");
  assert.ok(calls[0].url.endsWith("/doctors/route-doctor/patients"));
  assert.equal(JSON.parse(String(calls[0].options.body)).doctorId, undefined);
  await records.savePatient(input, "patient-id", "route-doctor");
  assert.ok(calls[1].url.endsWith("/patients/patient-id"));
  assert.equal(calls[1].options.method, "PATCH");
  assert.equal(
    JSON.parse(String(calls[1].options.body)).doctorId,
    "assigned-doctor",
  );
});

test("assignment selector loads every page rather than truncating after 50 doctors", async (t) => {
  let page = 0;
  t.mock.method(globalThis, "fetch", async () => {
    page++;
    return new Response(
      JSON.stringify({
        data: [{ id: `doctor-${page}` }],
        pagination: { page, pages: 3 },
      }),
      { status: 200 },
    );
  });
  const directory = await doctorDirectory(new AbortController().signal);
  assert.deepEqual(
    directory.map((doctor) => doctor.id),
    ["doctor-1", "doctor-2", "doctor-3"],
  );
});
