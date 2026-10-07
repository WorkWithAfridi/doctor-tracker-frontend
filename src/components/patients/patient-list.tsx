"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { useDemo } from "@/services/demo-store";
import { conditions, type Patient } from "@/types/domain";
import { useListFilters, matchesDate } from "@/hooks/use-list-filters";
import {
  Avatar,
  Badge,
  EmptyState,
  Pagination,
  SearchField,
  formatDate,
} from "@/components/common/ui";
import { PatientForm, DeletePatient } from "@/components/common/record-forms";

export function PatientList({ doctorId }: { doctorId?: string }) {
  const { doctors, patients } = useDemo();
  const filters = useListFilters();
  const [editing, setEditing] = useState<Patient | "new" | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);
  const search = filters.get("search").toLowerCase().trim();
  const doctorMap = new Map(doctors.map((doctor) => [doctor.id, doctor]));
  const source = patients.filter(
    (patient) => !doctorId || patient.doctorId === doctorId,
  );
  const filtered = source
    .filter(
      (patient) =>
        `${patient.firstName} ${patient.lastName} ${patient.email} ${patient.phone} ${doctorMap.get(patient.doctorId)?.name}`
          .toLowerCase()
          .includes(search) &&
        (!filters.get("condition") ||
          patient.condition === filters.get("condition")) &&
        (!filters.get("doctor") ||
          patient.doctorId === filters.get("doctor")) &&
        matchesDate(patient.createdAt, filters.get("from"), filters.get("to")),
    )
    .sort((a, b) =>
      filters.get("sort") === "name"
        ? `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
          )
        : b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
    );
  const page = Math.min(
    filters.page,
    Math.max(1, Math.ceil(filtered.length / filters.size)),
  );
  const rows = filtered.slice((page - 1) * filters.size, page * filters.size);
  return (
    <>
      <div className={doctorId ? "section-heading" : "page-heading"}>
        <div>
          {!doctorId && <span className="eyebrow">YOUR PATIENT NETWORK</span>}
          <h1 className={doctorId ? "section-title" : ""}>
            {doctorId ? "Assigned patients" : "Patients"}
            <span className="count-chip">{source.length}</span>
          </h1>
          <p>
            {doctorId
              ? "A clear view of everyone under this doctor's care."
              : "Every patient, connected to the right care."}
          </p>
        </div>
        <button
          className="button primary"
          disabled={!doctors.length}
          onClick={() => setEditing("new")}
        >
          <Plus size={17} />
          Add patient
        </button>
      </div>
      {!doctorId && (
        <div className="patient-summary">
          <div>
            <span className="mini-icon mint">
              <UsersRound size={18} />
            </span>
            <span>
              All patients<strong>{patients.length}</strong>
            </span>
          </div>
          {conditions.slice(0, 3).map((condition) => (
            <div key={condition}>
              <span
                className={`summary-dot ${condition.toLowerCase().replaceAll(" ", "-")}`}
              />
              <span>
                {condition}
                <strong>
                  {
                    patients.filter(
                      (patient) => patient.condition === condition,
                    ).length
                  }
                </strong>
              </span>
            </div>
          ))}
        </div>
      )}
      <section className="panel list-panel">
        <div className="panel-title">
          <div>
            <h2>{doctorId ? "Patient directory" : "All patients"}</h2>
            <span>
              {filtered.length} {filtered.length === 1 ? "record" : "records"}
              {filters.active ? " matching your filters" : " in your workspace"}
            </span>
          </div>
          <label className="sort-control">
            Sort by{" "}
            <select
              aria-label="Sort patients"
              value={filters.get("sort")}
              onChange={(event) => filters.update("sort", event.target.value)}
            >
              <option value="">Newest first</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
        <div className="filter-bar">
          <SearchField
            value={filters.get("search")}
            onChange={(value) => filters.update("search", value)}
            placeholder="Search patients…"
          />
          <select
            aria-label="Filter by condition"
            value={filters.get("condition")}
            onChange={(event) =>
              filters.update("condition", event.target.value)
            }
          >
            <option value="">All conditions</option>
            {conditions.map((condition) => (
              <option key={condition}>{condition}</option>
            ))}
          </select>
          {!doctorId && (
            <select
              aria-label="Filter by doctor"
              value={filters.get("doctor")}
              onChange={(event) => filters.update("doctor", event.target.value)}
            >
              <option value="">All doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          )}
          <div className="date-filters">
            <SlidersHorizontal size={15} />
            <label>
              From
              <input
                type="date"
                aria-label="Patients added from"
                value={filters.get("from")}
                max={filters.get("to") || undefined}
                onChange={(event) => filters.update("from", event.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                aria-label="Patients added to"
                value={filters.get("to")}
                min={filters.get("from") || undefined}
                onChange={(event) => filters.update("to", event.target.value)}
              />
            </label>
          </div>
          {filters.active && (
            <button className="text-button" onClick={filters.clear}>
              Clear filters
            </button>
          )}
        </div>
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  {!doctorId && <th>Assigned doctor</th>}
                  <th>Condition</th>
                  <th>Phone number</th>
                  <th>Date added</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="person-cell">
                        <Avatar
                          name={`${patient.firstName} ${patient.lastName}`}
                        />
                        <div>
                          <strong>
                            {patient.firstName} {patient.lastName}
                          </strong>
                          <small>
                            {patient.age} years old ·{" "}
                            {patient.gender || "Not specified"}
                          </small>
                        </div>
                      </div>
                    </td>
                    {!doctorId && (
                      <td>
                        <Link
                          className="doctor-link"
                          href={`/doctors/${patient.doctorId}`}
                        >
                          {doctorMap.get(patient.doctorId)?.name ??
                            "Unassigned"}
                          <small>
                            {doctorMap.get(patient.doctorId)?.specialization}
                          </small>
                        </Link>
                      </td>
                    )}
                    <td>
                      <Badge condition={patient.condition} />
                    </td>
                    <td className="muted nowrap">{patient.phone}</td>
                    <td className="muted nowrap">
                      {formatDate(patient.createdAt)}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${patient.firstName} ${patient.lastName}`}
                          onClick={() => setEditing(patient)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button delete-action"
                          aria-label={`Delete ${patient.firstName} ${patient.lastName}`}
                          onClick={() => setDeleting(patient)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={filters.active ? "No matching patients" : "No patients yet"}
            description={
              filters.active
                ? "Try another name, condition, or date range."
                : "Add the first patient to get started."
            }
          >
            <button
              className="button secondary"
              onClick={filters.active ? filters.clear : () => setEditing("new")}
            >
              {filters.active ? "Clear filters" : "Add patient"}
            </button>
          </EmptyState>
        )}
        <Pagination
          page={page}
          total={filtered.length}
          size={filters.size}
          onPage={(value) => filters.update("page", String(value))}
          onSize={(value) => filters.update("size", String(value))}
        />
      </section>
      {editing && (
        <PatientForm
          patient={editing === "new" ? undefined : editing}
          doctorId={doctorId}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeletePatient patient={deleting} onClose={() => setDeleting(null)} />
      )}
    </>
  );
}
