import { Suspense } from "react";
import { DoctorList } from "@/components/doctors/doctor-list";
export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="page-skeleton" />}>
      <DoctorList />
    </Suspense>
  );
}
