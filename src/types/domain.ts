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
}
export interface DemoData {
  doctors: Doctor[];
  patients: Patient[];
}
