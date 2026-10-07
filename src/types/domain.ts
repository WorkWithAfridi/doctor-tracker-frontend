export const conditions = [
  "Stable",
  "Recovering",
  "Under Observation",
  "Critical",
] as const;
export type Condition = (typeof conditions)[number];
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  email: string;
  phone: string;
  createdAt: string;
  patientCount?: number;
}
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  condition: Condition;
  doctorId: string;
  createdAt: string;
  doctor?: Pick<Doctor, "id" | "name" | "specialization"> | null;
}
export interface Admin {
  id: string;
  name: string;
  email: string;
  role: "admin";
}
export interface ListResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
export interface DoctorOptions {
  specializations: string[];
  hospitals: string[];
}
export interface DashboardData {
  totals: {
    doctors: number;
    patients: number;
    patientsAddedThisMonth: number;
    averagePatientsPerDoctor: number;
  };
  patientsPerDoctor: {
    doctorId: string;
    doctorName: string;
    patientCount: number;
  }[];
  patientGrowth: { date: string; count: number }[];
  conditionDistribution: { condition: Condition; count: number }[];
  recentPatients: {
    id: string;
    firstName: string;
    lastName: string;
    condition: Condition;
    createdAt: string;
    doctor: { _id: string; name: string; specialization: string } | null;
  }[];
  period: { days: number; timezone: "UTC"; from: string; to: string };
}
