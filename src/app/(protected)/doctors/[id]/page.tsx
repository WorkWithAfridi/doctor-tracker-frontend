import { Suspense } from "react";
import { DoctorDetails } from "@/components/doctors/doctor-details";
export default function DoctorPage() {
  return (
    <Suspense fallback={<div className="page-skeleton" />}>
      <DoctorDetails />
    </Suspense>
  );
}
