"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/types/auth";
import {
  createActivityLogEntry,
  fetchUsersList,
  getActivityLogs,
  type ActivityLogPerPage,
  type ActivityLogRow,
} from "@/services/activityLog";

const PER_PAGE_OPTIONS: ActivityLogPerPage[] = [30, 50, 100];
const PHNOM_PENH_TIMEZONE = "Asia/Phnom_Penh";

const formatPhnomPenhTime = (value: string, fallback: string): string => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: PHNOM_PENH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(parsed);
};

export default function ActivityLogPage() {
  const { user, isUserSME } = useAuth();
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<ActivityLogPerPage>(30);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [actionDraft, setActionDraft] = useState("");
  const [filterUserDraft, setFilterUserDraft] = useState<number | "">("");
  const [appliedAction, setAppliedAction] = useState("");
  const [appliedFilterUserId, setAppliedFilterUserId] = useState<number | null>(null);

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualAction, setManualAction] = useState("");
  const [manualDetails, setManualDetails] = useState("");
  const [manualAttributionUserId, setManualAttributionUserId] = useState<number | "">("");
  const [manualSaving, setManualSaving] = useState(false);
  const startRow = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endRow = total === 0 ? 0 : Math.min(page * perPage, total);

  const load = useCallback(async () => {
    if (!user?.id || !isUserSME) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getActivityLogs(user.id, {
        page,
        perPage,
        filterByUserId: appliedFilterUserId,
        actionContains: appliedAction.trim() || null,
      });
      setRows(res.data);
      setTotalPages(res.pagination.last_page);
      setTotal(res.pagination.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load activity log");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [
    user?.id,
    isUserSME,
    page,
    perPage,
    appliedAction,
    appliedFilterUserId,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isUserSME || !user?.id) return;
    let cancelled = false;
    setUsersLoading(true);
    fetchUsersList()
      .then((list) => {
        if (!cancelled) setUsers(list);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isUserSME, user?.id]);

  useEffect(() => {
    if (user?.id && manualAttributionUserId === "") {
      setManualAttributionUserId(user.id);
    }
  }, [user?.id, manualAttributionUserId]);

  const applyFilters = () => {
    setAppliedAction(actionDraft.trim());
    setAppliedFilterUserId(
      filterUserDraft === "" ? null : Number(filterUserDraft),
    );
    setPage(1);
  };

  const clearFilters = () => {
    setActionDraft("");
    setFilterUserDraft("");
    setAppliedAction("");
    setAppliedFilterUserId(null);
    setPage(1);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    const action = manualAction.trim();
    const details = manualDetails.trim();
    if (action.length < 2 || details.length < 3) return;
    setManualSaving(true);
    try {
      await createActivityLogEntry(user.id, {
        action,
        details,
        user_id:
          manualAttributionUserId === ""
            ? user.id
            : Number(manualAttributionUserId),
      });
      setManualAction("");
      setManualDetails("");
      setShowManualForm(false);
      setPage(1);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save entry");
    } finally {
      setManualSaving(false);
    }
  };

  if (!isUserSME) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Access denied</h1>
          <p className="mt-2 text-sm text-gray-600">
            Activity log is visible only to SME, Admin, and Super Admin roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7]">
      {/* Page header */}
      <div className="flex-1 space-y-4 px-6 py-6">
        {showManualForm && (
          <form
            onSubmit={handleManualSubmit}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-gray-900">Add log entry</h2>
            <p className="mt-1 text-xs text-gray-500">
              Creates a row attributed to the selected user (defaults to you). No edit API —
              delete if mistaken.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600">
                  Action
                </label>
                <input
                  type="text"
                  value={manualAction}
                  onChange={(e) => setManualAction(e.target.value)}
                  placeholder="e.g. Reviewed draft"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                  maxLength={120}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600">
                  Details
                </label>
                <textarea
                  value={manualDetails}
                  onChange={(e) => setManualDetails(e.target.value)}
                  placeholder="Clear description of what happened"
                  rows={3}
                  className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                  maxLength={5000}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Attributed user
                </label>
                <select
                  value={manualAttributionUserId === "" ? "" : String(manualAttributionUserId)}
                  onChange={(e) =>
                    setManualAttributionUserId(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  disabled={usersLoading}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2 sm:justify-end">
                <button
                  type="submit"
                  disabled={manualSaving}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#273C8F] px-4 py-2 text-sm font-medium text-white hover:bg-[#1f2f70] disabled:opacity-50"
                >
                  {manualSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save entry"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <label className="block text-xs font-medium text-gray-600">
                Filter by action
              </label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={actionDraft}
                  onChange={(e) => setActionDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  placeholder="Contains… (e.g. Update Title)"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600">
                Filter by user
              </label>
              <select
                value={filterUserDraft === "" ? "" : String(filterUserDraft)}
                onChange={(e) =>
                  setFilterUserDraft(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="cursor-pointer mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                disabled={usersLoading}
              >
                <option value="">All users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>
          {(appliedAction || appliedFilterUserId != null) && (
            <p className="mt-3 text-xs text-gray-500">
              Active filters:
              {appliedAction ? (
                <span className="ml-1 font-medium text-gray-700">
                  action “{appliedAction}”
                </span>
              ) : null}
              {appliedFilterUserId != null ? (
                <span className="ml-1 font-medium text-gray-700">
                  user id {appliedFilterUserId}
                </span>
              ) : null}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#273C8F]" />
            Loading activity…
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/90">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    <th className="whitespace-nowrap px-4 py-3">Time</th>
                    <th className="whitespace-nowrap px-4 py-3">User</th>
                    <th className="whitespace-nowrap px-4 py-3">Action</th>
                    <th className="min-w-[240px] px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-14 text-center text-sm text-gray-500"
                      >
                        No entries match your filters, or nothing has been logged yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-gray-50/90"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-gray-800 tabular-nums">
                          {formatPhnomPenhTime(row.created_at, row.created_at_display)}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.username ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-900">
                            {row.action}
                          </span>
                        </td>
                        <td className="max-w-xl px-4 py-3 text-gray-700">
                          <span className="line-clamp-3" title={row.details}>
                            {row.details}
                          </span>
                          {row.subject_type && row.subject_id ? (
                            <span className="mt-1 block text-[11px] text-gray-400">
                              {row.subject_type} #{row.subject_id}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-4 py-3 text-sm text-gray-600">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Rows per page:
                <div className="relative">
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value) as ActivityLogPerPage);
                      setPage(1);
                    }}
                    className="cursor-pointer appearance-none rounded-md border border-gray-200 bg-white px-2 py-1.5 flex pr-6 text-sm text-gray-900"
                  >
                    {PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <span className="text-sm text-gray-600">
                {startRow}-{endRow} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="First page"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(1)}
                  className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Last page"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage(Math.max(1, totalPages))}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
