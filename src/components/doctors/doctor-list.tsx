"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus, Pencil, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { useDemo } from "@/services/demo-store";
import type { Doctor } from "@/types/domain";
import { useListFilters, matchesDate } from "@/hooks/use-list-filters";
import {
  Avatar,
  EmptyState,
  Pagination,
  SearchField,
  formatDate,
} from "@/components/common/ui";
import { DoctorForm } from "@/components/common/record-forms";

export function DoctorList() {
  const { doctors, patients } = useDemo();
  const filters = useListFilters();
  const [editing, setEditing] = useState<Doctor | "new" | null>(null);
  const search = filters.get("search").toLowerCase().trim();
  const counts = new Map<string, number>();
  patients.forEach((patient) =>
    counts.set(patient.doctorId, (counts.get(patient.doctorId) ?? 0) + 1),
  );
  const filtered = doctors
    .filter(
      (doctor) =>
        `${doctor.name} ${doctor.email} ${doctor.specialization} ${doctor.hospital}`
          .toLowerCase()
          .includes(search) &&
        (!filters.get("specialization") ||
          doctor.specialization === filters.get("specialization")) &&
        (!filters.get("hospital") ||
          doctor.hospital === filters.get("hospital")) &&
        matchesDate(doctor.createdAt, filters.get("from"), filters.get("to")),
    )
    .sort((a, b) =>
      filters.get("sort") === "name"
        ? a.name.localeCompare(b.name)
        : b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
    );
  const page = Math.min(
    filters.page,
    Math.max(1, Math.ceil(filtered.length / filters.size)),
  );
  const rows = filtered.slice((page - 1) * filters.size, page * filters.size);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE PEOPLE BEHIND THE CARE</span>
          <h1>
            Doctors <span className="count-chip">{doctors.length}</span>
          </h1>
          <p>Your care team, all in one place.</p>
        </div>
        <button className="button primary" onClick={() => setEditing("new")}>
          <Plus size={17} />
          Add doctor
        </button>
      </div>
      <div className="directory-banner">
        <div className="banner-avatars">
          {doctors.slice(0, 4).map((doctor) => (
            <Avatar key={doctor.id} name={doctor.name} />
          ))}
        </div>
        <div>
          <strong>A connected team. A stronger care network.</strong>
          <p>
            {doctors.length} doctors across{" "}
            {new Set(doctors.map((doctor) => doctor.specialization)).size}{" "}
            specialties and{" "}
            {new Set(doctors.map((doctor) => doctor.hospital)).size} hospitals.
          </p>
        </div>
        <span className="banner-tag">
          <span className="demo-dot" />
          Care team directory
        </span>
      </div>
      <section className="panel list-panel">
        <div className="panel-title">
          <div>
            <h2>All doctors</h2>
            <span>
              {filtered.length} {filtered.length === 1 ? "doctor" : "doctors"}
              {filters.active ? " matching your filters" : " in your workspace"}
            </span>
          </div>
          <label className="sort-control">
            Sort by{" "}
            <select
              aria-label="Sort doctors"
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
            placeholder="Search doctors…"
          />
          <select
            aria-label="Filter by specialization"
            value={filters.get("specialization")}
            onChange={(event) =>
              filters.update("specialization", event.target.value)
            }
          >
            <option value="">All specializations</option>
            {[...new Set(doctors.map((doctor) => doctor.specialization))]
              .sort()
              .map((value) => (
                <option key={value}>{value}</option>
              ))}
          </select>
          <select
            aria-label="Filter by hospital"
            value={filters.get("hospital")}
            onChange={(event) => filters.update("hospital", event.target.value)}
          >
            <option value="">All hospitals</option>
            {[...new Set(doctors.map((doctor) => doctor.hospital))]
              .sort()
              .map((value) => (
                <option key={value}>{value}</option>
              ))}
          </select>
          <div className="date-filters">
            <SlidersHorizontal size={15} />
            <label>
              From
              <input
                aria-label="Doctors added from"
                type="date"
                value={filters.get("from")}
                max={filters.get("to") || undefined}
                onChange={(event) => filters.update("from", event.target.value)}
              />
            </label>
            <label>
              To
              <input
                aria-label="Doctors added to"
                type="date"
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
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Hospital</th>
                  <th>Patients</th>
                  <th>Date added</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>
                      <Link
                        href={`/doctors/${doctor.id}`}
                        className="person-cell"
                      >
                        <Avatar name={doctor.name} />
                        <div>
                          <strong>{doctor.name}</strong>
                          <small>{doctor.email}</small>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <span className="specialty-tag">
                        {doctor.specialization}
                      </span>
                    </td>
                    <td className="muted">{doctor.hospital}</td>
                    <td>
                      <span className="patient-count">
                        {counts.get(doctor.id) ?? 0}
                        <span> patients</span>
                      </span>
                    </td>
                    <td className="muted nowrap">
                      {formatDate(doctor.createdAt)}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${doctor.name}`}
                          onClick={() => setEditing(doctor)}
                        >
                          <Pencil size={16} />
                        </button>
                        <Link
                          className="icon-button"
                          aria-label={`View ${doctor.name}`}
                          href={`/doctors/${doctor.id}`}
                        >
                          <ArrowUpRight size={17} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No matching doctors"
            description="Try a different name, specialty, hospital, or date range."
          >
            <button className="button secondary" onClick={filters.clear}>
              Clear filters
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
        <DoctorForm
          doctor={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
