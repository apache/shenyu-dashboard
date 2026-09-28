import { buildHandle } from "./selectorHandle";

describe("buildHandle", () => {
  it("preserves every springCloud handle field", () => {
    const values = {
      serviceId: "orders",
      protocol: "http",
      keys: [0],
      divideUpstreams: [{ upstreamUrl: "http://orders" }],
      gray: true,
    };

    expect(
      buildHandle(
        [[{ field: "serviceId" }, { field: "protocol" }]],
        values,
        "8",
      ),
    ).toEqual([
      {
        serviceId: "orders",
        protocol: "http",
        divideUpstreams: [{ upstreamUrl: "http://orders" }],
        gray: true,
      },
    ]);
    expect(values).not.toHaveProperty("keys");
  });
});
