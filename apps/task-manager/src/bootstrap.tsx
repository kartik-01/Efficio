import React from "react";
import ReactDOM from "react-dom/client";
import {TaskManager} from "./pages/task-manager";
import "@shared-design-token/global.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<TaskManager />);
