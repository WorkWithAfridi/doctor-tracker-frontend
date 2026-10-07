import type { DemoData } from "@/types/domain";
import { conditions } from "@/types/domain";

export const specializations = [
  "Cardiology",
  "Neurology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "General Medicine",
];
export const hospitals = [
  "Evercare Hospital",
  "Square Hospital",
  "United Hospital",
  "Labaid Hospital",
];
const doctorNames = [
  "Ayesha Rahman",
  "James Wilson",
  "Sarah Ahmed",
  "Daniel Chen",
  "Nadia Islam",
  "Michael Reed",
  "Farhan Karim",
  "Emma Thompson",
  "Omar Hassan",
  "Sofia Patel",
  "Arif Chowdhury",
  "Grace Lee",
  "Maya Roy",
  "Oliver Davis",
  "Rina Akter",
  "Ethan Brooks",
  "Samira Khan",
  "Noah Williams",
  "Leila Ali",
  "Adam Lewis",
  "Priya Das",
  "Lucas Martin",
  "Tania Sultana",
  "Henry Clark",
];
const firstNames = [
  "Amelia",
  "Rafi",
  "Sophia",
  "Hasan",
  "Olivia",
  "Imran",
  "Isabella",
  "Nusrat",
  "Liam",
  "Fatima",
  "Ava",
  "Arman",
  "Charlotte",
  "Sadia",
  "Mason",
  "Zara",
  "Elijah",
  "Anika",
  "Harper",
  "Amin",
];
const lastNames = [
  "Rahman",
  "Ahmed",
  "Wilson",
  "Khan",
  "Patel",
  "Islam",
  "Lee",
  "Hassan",
  "Roy",
  "Chen",
];

export function createDemoData(): DemoData {
  const now = new Date();
  const dateAgo = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };
  const doctors = doctorNames.map((name, index) => ({
    id: `doc-${index + 1}`,
    name: `Dr. ${name}`,
    specialization: specializations[index % specializations.length],
    hospital: hospitals[index % hospitals.length],
    email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
    phone: `+880 1712 ${String(340000 + index)}`,
    createdAt: dateAgo(4 + index * 3),
  }));
  const patients = Array.from({ length: 186 }, (_, index) => ({
    id: `pat-${index + 1}`,
    firstName: firstNames[index % firstNames.length],
    lastName:
      lastNames[(index * 3 + Math.floor(index / 20)) % lastNames.length],
    age: 18 + ((index * 7) % 64),
    gender: index % 2 ? "Male" : "Female",
    email: `patient${index + 1}@example.com`,
    phone: `+880 1812 ${String(450000 + index)}`,
    condition:
      conditions[
        index % 10 < 5 ? 0 : index % 10 < 8 ? 1 : index % 10 === 8 ? 2 : 3
      ],
    doctorId: doctors[(index * 7 + Math.floor(index / 24)) % doctors.length].id,
    createdAt: dateAgo((index * 13) % 90),
  }));
  return { doctors, patients };
}
