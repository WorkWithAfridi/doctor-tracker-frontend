"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, X, Inbox } from "lucide-react";
import type { Condition } from "@/types/domain";

export function Avatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  const clean = name.replace(/^Dr\.\s*/, "");
  const colors = ["mint", "lilac", "peach", "blue"];
  return (
    <span
      className={`avatar ${colors[clean.charCodeAt(0) % 4]} ${large ? "large" : ""}`}
    >
      {clean
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function Badge({ condition }: { condition: Condition }) {
  return (
    <span className={`badge ${condition.toLowerCase().replaceAll(" ", "-")}`}>
      <i />
      {condition}
    </span>
  );
}
export function EmptyState({
  title = "No results found",
  description = "Try changing your search or filters.",
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callback = useRef(onChange);
  if (previousValue !== value) {
    setPreviousValue(value);
    setDraft(value);
  }
  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (pending.current) clearTimeout(pending.current);
  }, [value]);
  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );
  function change(next: string) {
    setDraft(next);
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(() => callback.current(next), 300);
  }
  return (
    <div className="search-field">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => change(event.target.value)}
      />
      {draft && (
        <button
          className="icon-button"
          aria-label="Clear search"
          onClick={() => {
            if (pending.current) clearTimeout(pending.current);
            setDraft("");
            onChange("");
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
export function Pagination({
  page,
  total,
  size,
  onPage,
  onSize,
}: {
  page: number;
  total: number;
  size: number;
  onPage: (page: number) => void;
  onSize: (size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pagination">
      <span>
        {total
          ? `${(page - 1) * size + 1}–${Math.min(page * size, total)}`
          : "0"}{" "}
        of {total} results
      </span>
      <div>
        <label>
          Rows{" "}
          <select
            value={size}
            onChange={(event) => onSize(Number(event.target.value))}
          >
            {[10, 20, 50].map((count) => (
              <option key={count}>{count}</option>
            ))}
          </select>
        </label>
        <button
          className="icon-button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        <span className="page-number">
          {page} / {pages}
        </span>
        <button
          className="icon-button"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
export function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <div>
          <h2 id="modal-title">{title}</h2>
          {description && <p id="modal-description">{description}</p>}
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
