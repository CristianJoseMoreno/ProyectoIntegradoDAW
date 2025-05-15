import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Investigar from "./pages/Investigar";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/investigar" element={<Investigar />} />
      </Routes>
    </div>
  );
}

export default App;
