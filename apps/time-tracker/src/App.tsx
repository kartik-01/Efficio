import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import { TimeTrackerApp } from "./RemoteApp";

const App = () => (
  <BrowserRouter>
    <TimeTrackerApp />
    <Toaster position="top-right" />
  </BrowserRouter>
);

export default App;

