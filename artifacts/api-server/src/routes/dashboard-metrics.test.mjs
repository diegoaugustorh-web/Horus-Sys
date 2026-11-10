import assert from "node:assert/strict";
import test from "node:test";
import {
  activePolicies,
  addDays,
  monthKey,
  sumCommissionsCreatedInMonth,
  sumPoliciesStartedInMonth,
  todayDateKey,
  upcomingPolicies,
  upcomingPolicyCount,
  validDateKey,
} from "./dashboard-metrics.ts";

const policy = (id, overrides = {}) => ({
  id,
  status: "Vigente",
  inicio: "2025-06-15",
  fim: "2025-06-15",
  premio: "100",
  ...overrides,
});

test("São Paulo's current date is derived in the business timezone", () => {
  assert.equal(todayDateKey(new Date("2025-06-15T02:30:00.000Z")), "2025-06-14");
  assert.equal(todayDateKey(new Date("2025-06-15T03:00:00.000Z")), "2025-06-15");
});

test("active policies include start and end dates today and reject missing or invalid dates", () => {
  const today = "2025-06-15";
  const rows = [
    policy("starts-today", { inicio: today, fim: "2025-06-20" }),
    policy("ends-today", { inicio: "2025-06-10", fim: today }),
    policy("starts-tomorrow", { inicio: "2025-06-16" }),
    policy("ended-yesterday", { fim: "2025-06-14" }),
    policy("missing-start", { inicio: null }),
    policy("missing-end", { fim: null }),
    policy("invalid-start", { inicio: "2025-02-30" }),
    policy("invalid-end", { fim: "not-a-date" }),
    policy("not-current", { status: "Cancelada" }),
  ];

  assert.deepEqual(
    activePolicies(rows, today).map(({ id }) => id),
    ["starts-today", "ends-today"],
  );
  assert.equal(validDateKey(null), null);
  assert.equal(validDateKey("2025-02-30"), null);
  assert.equal(validDateKey("not-a-date"), null);
});

test("renewal window includes today and day 30, but excludes day 31", () => {
  const today = "2025-06-15";
  const rows = [
    policy("today", { fim: today }),
    policy("day-30", { fim: addDays(today, 30) }),
    policy("day-31", { fim: addDays(today, 31) }),
    policy("expired", { fim: "2025-06-14" }),
    policy("missing", { fim: null }),
    policy("invalid", { fim: "2025-02-30" }),
    policy("cancelled", { fim: "2025-06-20", status: "Cancelada" }),
    policy("renewal-status", { fim: "2025-06-20", status: "A Renovar" }),
  ];

  assert.deepEqual(
    upcomingPolicies(rows, today).map(({ id }) => id),
    ["today", "renewal-status", "day-30"],
  );
});

test("30-day renewal window and date keys cross month and year boundaries", () => {
  assert.equal(addDays("2024-12-31", 30), "2025-01-30");
  assert.equal(monthKey(new Date("2025-01-01T02:59:59.999Z")), "2024-12");
  assert.equal(monthKey(new Date("2025-01-01T03:00:00.000Z")), "2025-01");
});

test("monthly premium uses policy coverage start date, not another policy date", () => {
  const policies = [
    { inicio: "2025-01-01", premio: "1200" },
    { inicio: "2025-01-31", premio: "800" },
    { inicio: "2024-12-31", premio: "4000" },
    { inicio: null, premio: "9000" },
    { inicio: "2025-02-30", premio: "9000" },
  ];

  assert.equal(sumPoliciesStartedInMonth(policies, "2025-01"), 2000);
});

test("monthly commission uses creation timestamp in São Paulo, including year rollover", () => {
  const commissions = [
    { criadoEm: new Date("2025-01-01T02:59:59.999Z"), valor: "100" },
    { criadoEm: new Date("2025-01-01T03:00:00.000Z"), valor: "200" },
    { criadoEm: new Date("2024-12-01T03:00:00.000Z"), valor: "300" },
  ];

  assert.equal(sumCommissionsCreatedInMonth(commissions, "2024-12"), 400);
  assert.equal(sumCommissionsCreatedInMonth(commissions, "2025-01"), 200);
});

test("renewal list and summary count share the same filter", () => {
  const today = "2025-06-15";
  const rows = Array.from({ length: 12 }, (_, index) =>
    policy(`valid-${index}`, { fim: addDays(today, index) }),
  );
  rows.push(
    policy("outside-window", { fim: addDays(today, 31) }),
    policy("invalid-date", { fim: "2025-02-30" }),
    policy("wrong-status", { fim: addDays(today, 1), status: "Cancelada" }),
  );

  const renewalList = upcomingPolicies(rows, today);
  assert.equal(upcomingPolicyCount(rows, today), renewalList.length);
  assert.equal(renewalList.length, 12);
  assert.ok(renewalList.slice(0, 10).every((item) => item.fim <= addDays(today, 30)));
});
