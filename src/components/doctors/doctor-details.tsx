"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  UsersRound,
} from "lucide-react";
import { useDemo } from "@/services/demo-store";
import { Avatar, EmptyState, formatDate } from "@/components/common/ui";
import { DoctorForm } from "@/components/common/record-forms";
import { PatientList } from "@/components/patients/patient-list";
export function DoctorDetails() {
  const { id } = useParams<{ id: string }>();
  const { doctors, patients } = useDemo();
  const [editing, setEditing] = useState(false);
  const doctor = doctors.find((doctor) => doctor.id === id);
  if (!doctor)
    return (
      <EmptyState
        title="Doctor not found"
        description="This doctor may no longer exist in your demo workspace."
      >
        <Link className="button primary" href="/doctors">
          Back to doctors
        </Link>
      </EmptyState>
    );
  return (
    <>
      <Link className="back-link" href="/doctors">
        <ArrowLeft size={16} />
        Back to doctors
      </Link>
      <div className="doctor-profile panel">
        <div className="profile-main">
          <Avatar name={doctor.name} large />
          <div>
            <span className="eyebrow">DOCTOR PROFILE</span>
            <h1>{doctor.name}</h1>
            <span className="specialty-tag">{doctor.specialization}</span>
          </div>
          <button className="button secondary" onClick={() => setEditing(true)}>
            <Pencil size={16} />
            Edit profile
          </button>
        </div>
        <div className="profile-details">
          <div>
            <Building2 size={17} />
            <span>
              Hospital<strong>{doctor.hospital}</strong>
            </span>
          </div>
          <div>
            <Mail size={17} />
            <span>
              Email<a href={`mailto:${doctor.email}`}>{doctor.email}</a>
            </span>
          </div>
          <div>
            <Phone size={17} />
            <span>
              Phone
              <a href={`tel:${doctor.phone.replaceAll(" ", "")}`}>
                {doctor.phone}
              </a>
            </span>
          </div>
          <div>
            <CalendarDays size={17} />
            <span>
              Joined<strong>{formatDate(doctor.createdAt)}</strong>
            </span>
          </div>
        </div>
        <div className="profile-bottom">
          <UsersRound size={17} />
          <strong>
            {patients.filter((patient) => patient.doctorId === id).length}
          </strong>{" "}
          patients under care<span>Part of your connected care network</span>
        </div>
      </div>
      <PatientList doctorId={id} />
      {editing && (
        <DoctorForm doctor={doctor} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
