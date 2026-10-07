import { apiRequest } from "../lib/api";
import type { Doctor, Patient, ListResponse } from "../types/domain";

export function listQuery(
  params: URLSearchParams,
  page: number,
  size: number,
  kind: "doctors" | "patients",
) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(size),
    sortBy: params.get("sort") === "name" ? "name" : "createdAt",
    sortOrder: params.get("sort") === "name" ? "asc" : "desc",
  });
  for (const key of [
    "search",
    "from",
    "to",
    ...(kind === "doctors" ? ["specialization", "hospital"] : ["condition"]),
  ]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }
  if (kind === "patients" && params.get("doctor"))
    query.set("doctorId", params.get("doctor")!);
  return query.toString();
}
// Only the assignment selector needs the full doctor directory; feature tables remain paginated.
export async function doctorDirectory(signal: AbortSignal): Promise<Doctor[]> {
  const result: Doctor[] = [];
  let page = 1;
  while (true) {
    const response = await apiRequest<ListResponse<Doctor>>(
      `/doctors?limit=50&page=${page}&sortBy=name&sortOrder=asc`,
      { signal },
    );
    result.push(...response.data);
    if (page >= response.pagination.pages) return result;
    page++;
  }
}
export type DoctorInput = Pick<
  Doctor,
  "name" | "specialization" | "hospital" | "phone" | "email"
>;
export type PatientInput = Pick<
  Patient,
  | "firstName"
  | "lastName"
  | "age"
  | "gender"
  | "email"
  | "phone"
  | "condition"
  | "doctorId"
>;
export const records = {
  saveDoctor(input: DoctorInput, id?: string) {
    return apiRequest<{ data: Doctor }>(id ? `/doctors/${id}` : "/doctors", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(input),
    });
  },
  savePatient(input: PatientInput, id?: string, doctorId?: string) {
    const { doctorId: assignedDoctor, ...fields } = input;
    const nested = !id && !!doctorId;
    return apiRequest<{ data: Patient }>(
      id
        ? `/patients/${id}`
        : nested
          ? `/doctors/${doctorId}/patients`
          : "/patients",
      {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(
          nested ? fields : { ...fields, doctorId: assignedDoctor },
        ),
      },
    );
  },
  deletePatient(id: string) {
    return apiRequest<void>(`/patients/${id}`, { method: "DELETE" });
  },
};
