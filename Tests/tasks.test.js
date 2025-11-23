const request = require("./setup");

describe("/api/tasks API", () => {
  it("should return 200 OK and JSON", async () => {
    const res = await request.get("/api/tasks");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toBeDefined();
  });
});
