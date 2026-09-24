import { toVenueLocal, tradingMomentFromLocal } from "./time";

describe("toVenueLocal", () => {
  it("handles Adelaide's daylight saving start on 4 Oct 2026", () => {
    expect(toVenueLocal("2026-10-02T06:30:00Z", "Australia/Adelaide")).toBe("2026-10-02T16:00");
    expect(toVenueLocal("2026-10-05T06:30:00Z", "Australia/Adelaide")).toBe("2026-10-05T17:00");
  });

  it("puts Victorian venues half an hour ahead of South Australian ones", () => {
    expect(toVenueLocal("2026-09-19T08:00:00Z", "Australia/Melbourne")).toBe("2026-09-19T18:00");
    expect(toVenueLocal("2026-09-19T08:00:00Z", "Australia/Adelaide")).toBe("2026-09-19T17:30");
  });

  it("reads Trestle's +09:30 order timestamps back to the till's wall clock", () => {
    expect(toVenueLocal("2026-09-19T18:42:11+09:30", "Australia/Adelaide")).toBe("2026-09-19T18:42");
  });
});

describe("tradingMomentFromLocal", () => {
  it("keeps sales after midnight on the previous trading day", () => {
    expect(tradingMomentFromLocal("2026-09-26T00:45")).toMatchObject({
      tradingDate: "2026-09-25",
      tradingDay: "fri",
      afterMidnight: true,
    });
  });

  it("starts a new trading day at 5am", () => {
    expect(tradingMomentFromLocal("2026-09-26T05:00")).toMatchObject({
      tradingDate: "2026-09-26",
      tradingDay: "sat",
      afterMidnight: false,
    });
  });
});
