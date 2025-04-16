import React from "react";
import ReferenceList from "../components/ReferenceList";
import Logout from "../components/Logout";
import Navbar from "../components/Navbar";

const ReferencesPage = () => {
  return (
    <div>
      <Navbar />
      <main className="p-4 max-w-5xl mx-auto mt-6">
        <h1 className="text-2xl font-bold mb-4">Tus referencias</h1>
        <ReferenceList />
      </main>
    </div>
  );
};

export default ReferencesPage;
