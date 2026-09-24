import type { Scenario } from "@ridgeline/contracts/scenarios";

// Situations straight from the brief. They double as the regression set for
// "what changes if I publish this draft?". Dates are the week of 21 Sep 2026.
export const SCENARIOS: Scenario[] = [
  {
    scenarioId: "ray-tuesday",
    title: "Ray's Tuesday schnitzel",
    story: "Ray (gold member) orders Schnitzel Tuesday with a pot at 7pm and expects his 10% on top.",
    venueId: "VEN-0233",
    localDateTime: "2026-09-22T19:00",
    customer: { kind: "member", memberNumber: "M-004182" },
    lines: [
      { productId: "PRD-0201", quantity: 1 },
      { productId: "PRD-0109", quantity: 1 },
    ],
  },
  {
    scenarioId: "member-happy-hour",
    title: "Member's beer at happy hour",
    story: "A member buys two pints at 4:30pm on a Wednesday.",
    venueId: "VEN-0233",
    localDateTime: "2026-09-23T16:30",
    customer: { kind: "member", memberNumber: "M-004183" },
    lines: [{ productId: "PRD-0101", quantity: 2 }],
  },
  {
    scenarioId: "staff-parma",
    title: "Staff Parma & Pint on Thursday",
    story: "A staff member orders two parmas and two pints at 6:30pm Thursday.",
    venueId: "VEN-0233",
    localDateTime: "2026-09-24T18:30",
    customer: { kind: "staff", staffId: "STF-11" },
    lines: [
      { productId: "PRD-0202", quantity: 2 },
      { productId: "PRD-0101", quantity: 2 },
    ],
  },
  {
    scenarioId: "walkin-parma-happy-hour",
    title: "Parma & Pint during happy hour",
    story: "A couple walks in at 5:30pm Thursday — both happy hour and Parma & Pint are on.",
    venueId: "VEN-0233",
    localDateTime: "2026-09-24T17:30",
    customer: { kind: "guest" },
    lines: [
      { productId: "PRD-0202", quantity: 2 },
      { productId: "PRD-0101", quantity: 2 },
    ],
  },
  {
    scenarioId: "bistro-530pm",
    title: "Bistro pint at 5:30pm",
    story: "A guest orders a pint at The Gilded Spoon at 5:30pm Monday — inside a 5–7 happy hour, not 4–6.",
    venueId: "VEN-0907",
    localDateTime: "2026-09-21T17:30",
    customer: { kind: "guest" },
    lines: [{ productId: "PRD-0101", quantity: 1 }],
  },
  {
    scenarioId: "bistro-630pm",
    title: "Bistro pint at 6:30pm",
    story: "Same bistro, 6:30pm — after a 4–6 happy hour, inside a 5–7 one.",
    venueId: "VEN-0907",
    localDateTime: "2026-09-21T18:30",
    customer: { kind: "guest" },
    lines: [{ productId: "PRD-0101", quantity: 1 }],
  },
  {
    scenarioId: "inactive-member",
    title: "Lapsed member on a Saturday",
    story: "T. Whelan's membership is inactive; they order a schnitzel and a pint on Saturday night.",
    venueId: "VEN-0233",
    localDateTime: "2026-09-26T20:00",
    customer: { kind: "member", memberNumber: "M-003920" },
    lines: [
      { productId: "PRD-0201", quantity: 1 },
      { productId: "PRD-0101", quantity: 1 },
    ],
  },
  {
    scenarioId: "late-friday",
    title: "Member's pint at 12:30am",
    story: "A member orders a pint at 12:30am after Friday night at The Sable Arms (VIC).",
    venueId: "VEN-1160",
    localDateTime: "2026-09-26T00:30",
    customer: { kind: "member", memberNumber: "M-004183" },
    lines: [{ productId: "PRD-0102", quantity: 1 }],
  },
];
