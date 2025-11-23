require("dotenv").config();
const express = require("express");
const mongoose = require("./config/db");
const cors = require("cors");

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const { auth } = require('express-oauth2-jwt-bearer');

const openapiDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

const app = express();
app.use(cors());
app.use(express.json());

// Root health/info route
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Efficio Backend</title></head><body><h1>Efficio Backend</h1><p>Server is running. Visit <a href="/api-docs">API docs</a>.</p></body></html>`);
  }
  return res.json({ message: 'Efficio backend is running. See /api-docs for API documentation.' });
});

// Routes
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/team", require("./routes/team"));
app.use("/api/productivity", require("./routes/productivity"));
app.use("/api/sprints", require("./routes/sprints"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/activity", require("./routes/activity"));
app.use("/api/users", require("./routes/users"));
app.use("/api/trends", require("./routes/trends"));
app.use("/api/team", require("./routes/team"));
app.use("/api/sprints", require("./routes/sprints"));
app.use("/api/projects", require("./routes/projects"));

// Serve OpenAPI spec with Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

// Protect user routes using Auth0 JWT middleware
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE || process.env.REACT_APP_AUTH0_AUDIENCE,
  issuerBaseURL: (process.env.AUTH0_DOMAIN && `https://${process.env.AUTH0_DOMAIN}/`) || (process.env.AUTH0_ISSUER) || undefined,
});

app.use('/api/users', checkJwt, require('./routes/users'));

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app; // ✅ Export app for testing
