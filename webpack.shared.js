const path = require("path");

const pkg = require(path.resolve(__dirname, "package.json"));

const defaultSingletons = [
  "react",
  "react-dom",
  "react-router-dom",
  "@auth0/auth0-react",
  "@efficio/ui",
  "@efficio/theme",
  "clsx",
  "class-variance-authority",
  "tailwind-merge",
  "framer-motion",
  "lucide-react",
  "sonner",
  "zustand"
];

const createSharedConfig = () => {
  const shared = {};

  const addShared = (name) => {
    if (!pkg.dependencies?.[name]) return;
    shared[name] = {
      singleton: true,
      requiredVersion: pkg.dependencies[name],
      eager: ["react", "react-dom"].includes(name)
    };
  };

  defaultSingletons.forEach(addShared);

  Object.keys(pkg.dependencies || {})
    .filter((dependency) => dependency.startsWith("@radix-ui/"))
    .forEach(addShared);

  return shared;
};

const resolveWorkspaceAliases = {
  "@efficio/ui": path.resolve(__dirname, "packages/ui/src"),
  "@efficio/theme": path.resolve(__dirname, "packages/theme/src")
};

module.exports = {
  createSharedConfig,
  resolveWorkspaceAliases
};

