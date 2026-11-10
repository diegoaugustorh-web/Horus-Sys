const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

function dateParts(date: Date, options: Intl.DateTimeFormatOptions) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone: BUSINESS_TIME_ZONE,
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

export function todayDateKey(now = new Date()) {
  const parts = dateParts(now, { year: "numeric", month: "2-digit", day: "2-digit" });
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function monthKey(date: Date) {
  const parts = dateParts(date, { year: "numeric", month: "2-digit" });
  return `${parts.year}-${parts.month}`;
}

export function validDateKey(value: string | null) {
  const key = value?.slice(0, 10);
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const parsed = new Date(`${key}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === key
    ? key
    : null;
}

export function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

type PolicyDateFields = {
  status: string;
  inicio: string | null;
  fim: string | null;
};

export function activePolicies<T extends PolicyDateFields>(rows: T[], today: string) {
  return rows.filter((policy) => {
    const startDate = validDateKey(policy.inicio);
    const endDate = validDateKey(policy.fim);
    return (
      policy.status === "Vigente" &&
      startDate !== null &&
      endDate !== null &&
      startDate <= today &&
      endDate >= today
    );
  });
}

type ExpiringPolicy = { status: string; fim: string | null };

export function upcomingPolicies<T extends ExpiringPolicy>(rows: T[], today: string) {
  const lastDay = addDays(today, 30);
  return rows
    .filter((policy) => {
      if (policy.status !== "Vigente" && policy.status !== "A Renovar") return false;
      const endDate = validDateKey(policy.fim);
      return endDate !== null && endDate >= today && endDate <= lastDay;
    })
    .sort((a, b) => validDateKey(a.fim)!.localeCompare(validDateKey(b.fim)!));
}

export function upcomingPolicyCount(rows: ExpiringPolicy[], today: string) {
  return upcomingPolicies(rows, today).length;
}

export function sumPoliciesStartedInMonth(
  policies: { inicio: string | null; premio: number | string }[],
  currentMonth: string,
) {
  return policies
    .filter((policy) => validDateKey(policy.inicio)?.slice(0, 7) === currentMonth)
    .reduce((sum, policy) => sum + Number(policy.premio), 0);
}

export function sumCommissionsCreatedInMonth(
  commissions: { criadoEm: Date; valor: number | string }[],
  currentMonth: string,
) {
  return commissions
    .filter((commission) => monthKey(commission.criadoEm) === currentMonth)
    .reduce((sum, commission) => sum + Number(commission.valor), 0);
}
