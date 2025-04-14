import React, { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google'; // Importar GoogleLogin
import jwt_decode from 'jwt-decode';  // Importar jwt_decode para decodificar el JWT

const Login = () => {
  const [user, setUser] = useState(null);  // Estado para almacenar los datos del usuario

  // Función para manejar la respuesta de Google después de la autenticación
  const responseGoogle = (response) => {
    const token = response.credential;  // Obtener el token de Google
    const decoded = jwt_decode(token);  // Decodificar el JWT para obtener los datos del usuario
    console.log(decoded);  // Mostrar los datos decodificados en la consola
    setUser(decoded);  // Actualizar el estado con los datos del usuario
  };

  useEffect(() => {
    if (user) {
      // Aquí puedes hacer alguna acción adicional si es necesario,
      // como almacenar el JWT en el estado global o enviar al backend
    }
  }, [user]);

  return (
    <div>
      <h2>Iniciar sesión con Google</h2>
      {/* Componente GoogleLogin */}
      <GoogleLogin
        onSuccess={responseGoogle}  // Llamar a la función en caso de éxito
        onError={() => console.log('Error en el inicio de sesión')}  // Llamar en caso de error
      />
      {user && (
        <div>
          <h3>Bienvenido, {user.name}</h3>  {/* Mostrar el nombre del usuario */}
          <p>Email: {user.email}</p>  {/* Mostrar el correo del usuario */}
        </div>
      )}
    </div>
  );
};

export default Login;  // Exportar el componente Login
