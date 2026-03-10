// Router root. Routes: "/" → Login, "/chat" → Chat, "/dashboard" → Dashboard.
import Login from "./pages/login";
import Chat from "./pages/chat";
import Dashboard from "./pages/dashboard";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
