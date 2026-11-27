import { describe, expect, it } from "vitest";
import { accessUntil, TIERS, TRIAL_DAYS } from "./billing.server";

const now = Date.parse("2026-11-27T00:00:00Z");
describe("billing rules", () => {
  it("student plan is ₹50/month", () => expect(TIERS.student.amountPaise).toBe(5000));
  it("organisation plan is ₹1,000/month", () => expect(TIERS.organization.amountPaise).toBe(100000));
  it("trial is 7 days", () => expect(TRIAL_DAYS).toBe(7));
  it("authenticated during trial grants access", () =>
    expect(accessUntil("authenticated", "2026-12-04T00:00:00Z", null, now)).toBe("2026-12-04T00:00:00Z"));
  it("halted gives no access", () => expect(accessUntil("halted", null, "2026-12-20T00:00:00Z", now)).toBeNull());
  it("cancelled keeps access until period end", () =>
    expect(accessUntil("cancelled", null, "2026-12-20T00:00:00Z", now)).toBe("2026-12-20T00:00:00Z"));
});
