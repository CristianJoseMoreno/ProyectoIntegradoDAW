import React from "react";

const LoginModal = ({ isOpen, onClose, error, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Cerrar modal"
        >
          &#x2715;
        </button>

        <h2 className="text-2xl font-semibold text-primary mb-4 text-center">
          Iniciar sesión con Google
        </h2>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <p className="text-center text-gray-700 mb-4">
            Por favor, selecciona una cuenta para iniciar sesión.
          </p>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-center font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
