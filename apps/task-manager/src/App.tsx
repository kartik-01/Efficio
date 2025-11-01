import { BrowserRouter } from "react-router-dom";

import { TaskManagerApp } from "./RemoteApp";

const App = () => (
  <BrowserRouter>
    <TaskManagerApp />
  </BrowserRouter>
);

export default App;

