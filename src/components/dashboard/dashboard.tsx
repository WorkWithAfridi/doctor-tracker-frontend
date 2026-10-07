"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Plus,
  Stethoscope,
  UsersRound,
  UserPlus,
  HeartPulse,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/services/auth-store";
import type { DashboardData, DoctorOptions } from "@/types/domain";
import { RequestState } from "@/components/common/request-state";
import { conditions } from "@/types/domain";
import { localDate } from "@/hooks/use-list-filters";
import { Avatar, Badge, EmptyState, formatDate } from "@/components/common/ui";
import { DoctorForm } from "@/components/common/record-forms";

const conditionColors = ["#287968", "#86b7a8", "#e5bc73", "#d98682"];
export function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(30);
  const [adding, setAdding] = useState(false);
  const now = new Date();
  const result = useApi<{ data: DashboardData }>(
    `/analytics/dashboard?days=${period}`,
  );
  const options = useApi<{ data: DoctorOptions }>("/doctors/options");
  if (result.loading || result.error) return <RequestState {...result} />;
  const data = result.data!.data;
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const thisMonth = data.totals.patientsAddedThisMonth;
  const specialties = options.data?.data.specializations.length ?? "…";
  const topDoctors = data.patientsPerDoctor;
  const recent = data.recentPatients;
  const bins = Array.from({ length: 6 }, (_, index) => {
    const days = data.patientGrowth.slice(
      index * (period / 6),
      (index + 1) * (period / 6),
    );
    return {
      date: new Date(days[0].date + "T00:00:00.000Z"),
      value: days.reduce((sum, day) => sum + day.count, 0),
    };
  });
  const max = Math.max(
    5,
    Math.ceil(Math.max(...bins.map((bin) => bin.value)) / 5) * 5,
  );
  const points = bins.map(
    (bin, index) => `${48 + index * 100},${180 - (bin.value / max) * 145}`,
  );
  const totalPeriod = bins.reduce((sum, bin) => sum + bin.value, 0);
  const distribution = conditions.map((condition, index) => ({
    condition,
    color: conditionColors[index],
    count:
      data.conditionDistribution.find((item) => item.condition === condition)
        ?.count ?? 0,
  }));

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR CARE NETWORK AT A GLANCE</span>
          <h1>
            Good{" "}
            {now.getHours() < 12
              ? "morning"
              : now.getHours() < 18
                ? "afternoon"
                : "evening"}
            , {user?.name.split(" ")[0]} <span className="greeting-dot">✳</span>
          </h1>
          <p>Here&apos;s what&apos;s happening across your care team.</p>
        </div>
        <div className="heading-actions">
          <span className="date-display">
            <CalendarDays size={16} />
            {now.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <button className="button primary" onClick={() => setAdding(true)}>
            <Plus size={16} />
            Add doctor
          </button>
        </div>
      </div>
      <div className="metric-grid">
        {[
          {
            label: "Total doctors",
            value: data.totals.doctors,
            icon: Stethoscope,
            detail: `Across ${specialties} specialties`,
            color: "mint",
          },
          {
            label: "Total patients",
            value: data.totals.patients,
            icon: UsersRound,
            detail: "Connected to your care team",
            color: "blue",
          },
          {
            label: "Added this month",
            value: thisMonth,
            icon: UserPlus,
            detail: `Since ${monthStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
            color: "peach",
          },
          {
            label: "Patients per doctor",
            value: data.totals.averagePatientsPerDoctor.toFixed(1),
            icon: HeartPulse,
            detail: "Average across your network",
            color: "lilac",
          },
        ].map(({ label, value, icon: Icon, detail, color }) => (
          <div className="metric-card" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <span className={`mini-icon ${color}`}>
                <Icon size={19} />
              </span>
            </div>
            <strong className="metric-value">{value}</strong>
            <span className="metric-detail">{detail}</span>
          </div>
        ))}
      </div>
      <div className="chart-grid">
        <section className="panel growth-panel">
          <div className="panel-title">
            <div>
              <h2>Patient growth</h2>
              <span>New patients joining your care network</span>
            </div>
            <select
              aria-label="Patient growth period"
              value={period}
              onChange={(event) => setPeriod(Number(event.target.value))}
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div className="chart-summary">
            <strong>{totalPeriod}</strong>
            <span>
              patients added <i />
              Over the last {period} days
            </span>
          </div>
          <div className="line-chart">
            <svg
              viewBox="0 0 590 225"
              role="img"
              aria-label={`${totalPeriod} patients added over the last ${period} days. ${bins.map((bin) => `${formatDate(bin.date.toISOString())}: ${bin.value}`).join("; ")}`}
            >
              <defs>
                <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#83b8a3" stopOpacity=".28" />
                  <stop offset="100%" stopColor="#83b8a3" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((index) => (
                <g key={index}>
                  <line
                    x1="48"
                    x2="550"
                    y1={35 + (index * 145) / 3}
                    y2={35 + (index * 145) / 3}
                    stroke="#e8edeb"
                    strokeDasharray="4 5"
                  />
                  <text
                    x="28"
                    y={39 + (index * 145) / 3}
                    textAnchor="end"
                    fill="#8b9691"
                    fontSize="11"
                  >
                    {Math.round(max * (1 - index / 3))}
                  </text>
                </g>
              ))}
              <path
                d={`M ${points[0]} L ${points.slice(1).join(" L ")} L 548,180 L 48,180 Z`}
                fill="url(#growth-fill)"
              />
              <polyline
                points={points.join(" ")}
                fill="none"
                stroke="#287968"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {bins.map((bin, index) => (
                <g key={index}>
                  <circle
                    cx={48 + index * 100}
                    cy={180 - (bin.value / max) * 145}
                    r="4"
                    fill="white"
                    stroke="#287968"
                    strokeWidth="2"
                  >
                    <title>
                      {formatDate(bin.date.toISOString())}: {bin.value} new
                      patients
                    </title>
                  </circle>
                  <text
                    x={48 + index * 100}
                    y="213"
                    textAnchor="middle"
                    fill="#8b9691"
                    fontSize="11"
                  >
                    {bin.date.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="chart-note">
            <span className="legend-dot" />
            New patients · {period / 6}-day intervals · UTC
          </div>
        </section>
        <section className="panel condition-panel">
          <div className="panel-title">
            <div>
              <h2>Patient conditions</h2>
              <span>A snapshot of patient wellbeing</span>
            </div>
            <HeartPulse size={18} className="muted" />
          </div>
          <div className="donut-wrap">
            <svg
              viewBox="0 0 180 180"
              role="img"
              aria-label={distribution
                .map((item) => `${item.condition}: ${item.count}`)
                .join(", ")}
            >
              <circle
                cx="90"
                cy="90"
                r="65"
                fill="none"
                stroke="#eef2ef"
                strokeWidth="22"
              />
              {distribution.map((item, index) => {
                const length = data.totals.patients
                  ? (item.count / data.totals.patients) * 408.407
                  : 0;
                const current = data.totals.patients
                  ? (distribution
                      .slice(0, index)
                      .reduce((sum, entry) => sum + entry.count, 0) /
                      data.totals.patients) *
                    408.407
                  : 0;
                return (
                  <circle
                    key={item.condition}
                    cx="90"
                    cy="90"
                    r="65"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="22"
                    strokeDasharray={`${length} ${408.407 - length}`}
                    strokeDashoffset={-current}
                    transform="rotate(-90 90 90)"
                  >
                    <title>
                      {item.condition}: {item.count}
                    </title>
                  </circle>
                );
              })}
              <text x="90" y="90" textAnchor="middle" className="donut-number">
                {data.totals.patients}
              </text>
              <text
                x="90"
                y="109"
                textAnchor="middle"
                fill="#89938e"
                fontSize="11"
              >
                Total patients
              </text>
            </svg>
          </div>
          <div className="condition-legend">
            {distribution.map((item) => (
              <div key={item.condition}>
                <span style={{ background: item.color }} />
                <label>{item.condition}</label>
                <strong>{item.count}</strong>
                <small>
                  {data.totals.patients
                    ? Math.round((item.count / data.totals.patients) * 100)
                    : 0}
                  %
                </small>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="lower-grid">
        <section className="panel doctors-chart">
          <div className="panel-title">
            <div>
              <h2>Patients per doctor</h2>
              <span>Your five largest patient groups</span>
            </div>
            <Link className="text-link" href="/doctors">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {topDoctors.length ? (
            <div className="doctor-bars">
              {topDoctors.map((doctor) => (
                <div key={doctor.doctorId}>
                  <div className="bar-label">
                    <Link href={`/doctors/${doctor.doctorId}`}>
                      {doctor.doctorName}
                    </Link>
                    <strong>{doctor.patientCount}</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      style={{
                        width: `${(doctor.patientCount / Math.max(1, ...topDoctors.map((item) => item.patientCount))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Your team starts here"
              description="Add a doctor to see your care network."
            />
          )}
        </section>
        <section className="panel recent-panel">
          <div className="panel-title">
            <div>
              <h2>Recently added patients</h2>
              <span>The latest additions to your network</span>
            </div>
            <Link className="text-link" href="/patients">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {recent.length ? (
            <div className="recent-list">
              {recent.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/patients?search=${encodeURIComponent(`${patient.firstName} ${patient.lastName}`)}`}
                >
                  <Avatar name={`${patient.firstName} ${patient.lastName}`} />
                  <div>
                    <strong>
                      {patient.firstName} {patient.lastName}
                    </strong>
                    <small>
                      {patient.doctor?.name ?? "Unassigned"} ·{" "}
                      {localDate(patient.createdAt) === localDate(now)
                        ? "Today"
                        : formatDate(patient.createdAt)}
                    </small>
                  </div>
                  <Badge condition={patient.condition} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No patients yet"
              description="Add a patient to see recent activity."
            />
          )}
        </section>
      </div>
      <div className="overview-tip">
        <div>
          <span className="mini-icon mint">
            <ActivityIcon />
          </span>
          <span>
            <strong>Every connection makes care better.</strong>
            <small>
              Keep doctor and patient information current for a clearer view of
              your network.
            </small>
          </span>
        </div>
        <Link href="/patients">
          Explore patients <ArrowRight size={16} />
        </Link>
      </div>
      {adding && <DoctorForm onClose={() => setAdding(false)} />}
    </>
  );
}
function ActivityIcon() {
  return <HeartPulse size={21} />;
}
