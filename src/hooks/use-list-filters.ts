"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
export function usePageCorrection(pagination?: {
  page: number;
  pages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const page = pagination?.page;
  const pages = pagination?.pages;
  useEffect(() => {
    if (page === undefined || pages === undefined || page <= pages) return;
    const next = new URLSearchParams(query);
    next.set("page", String(pages));
    router.replace(`${pathname}?${next}`, { scroll: false });
  }, [page, pages, query, pathname, router]);
}
export function useListFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const get = (key: string) => params.get(key) ?? "";
  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  }
  const rawPage = Number(get("page"));
  const rawSize = Number(get("size"));
  return {
    params,
    get,
    update,
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    size: [10, 20, 50].includes(rawSize) ? rawSize : 10,
    clear: () => router.replace(pathname, { scroll: false }),
    active: [
      "search",
      "specialization",
      "hospital",
      "doctor",
      "condition",
      "from",
      "to",
    ].some((key) => get(key)),
  };
}
export function localDate(input: string | Date) {
  const date = new Date(input);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
