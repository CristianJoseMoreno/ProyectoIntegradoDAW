import React from "react";
import ReferenceList from "../components/ReferenceList";
import Logout from "../components/Logout";

const ReferencesPage = () => {
  return (
    <div>
      <h1>Tus referencias</h1>
      <Logout />
      <ReferenceList />
    </div>
  );
};

export default ReferencesPage;
