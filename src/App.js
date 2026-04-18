// Router root. Routes: "/" → Login, "/chat" → Chat, "/dashboard" → Dashboard, "/client-dashboard" → ClientDashboard.
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./pages/ClientDashboard";
import NatiqDashboard from "./pages/NatiqDashboard";

import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/management" element={<Dashboard />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/dashboard" element={<NatiqDashboard />} />
        <Route path="/tickets" element={<NatiqDashboard />} />
        <Route path="/calls" element={<NatiqDashboard />} />
        <Route path="/calendar" element={<NatiqDashboard />} />
        <Route path="/profile" element={<NatiqDashboard />} />
        <Route path="/settings" element={<NatiqDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
