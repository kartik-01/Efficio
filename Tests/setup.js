const request = require("supertest");
const app = require("../app.cjs"); // update path if needed
module.exports = request(app);
