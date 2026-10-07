import { Suspense } from "react";
import { PatientList } from "@/components/patients/patient-list";
export default function PatientsPage() {
  return (
    <Suspense fallback={<div className="page-skeleton" />}>
      <PatientList />
    </Suspense>
  );
}
