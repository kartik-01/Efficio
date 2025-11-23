const request = require("./setup");

describe("/api/sprints API", () => {
  it("should return 200 OK and JSON", async () => {
    const res = await request.get("/api/sprints");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toBeDefined();
  });
});
