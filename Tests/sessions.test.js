const request = require("./setup");

describe("/api/sessions API", () => {
  it("should return 200 OK and JSON", async () => {
    const res = await request.get("/api/sessions");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toBeDefined();
  });
});
