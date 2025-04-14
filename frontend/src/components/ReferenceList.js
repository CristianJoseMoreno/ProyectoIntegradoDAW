import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ReferenceList = () => {
  const { token } = useAuth();
  const [references, setReferences] = useState([]);

  useEffect(() => {
    if (!token) return;

    axios
      .get("http://localhost:5000/api/references", {
        headers: {
          "x-auth-token": token,
        },
      })
      .then((res) => setReferences(res.data))
      .catch((err) => console.error("Error cargando referencias:", err));
  }, [token]);

  if (!token) return <p>Debes iniciar sesión para ver las referencias</p>;

  return (
    <div>
      <h2>Referencias</h2>
      <ul>
        {references.map((ref) => (
          <li key={ref._id}>
            {ref.title} - {ref.authors}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReferenceList;
