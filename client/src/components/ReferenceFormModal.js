// src/components/ReferenceFormModal.js
import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

function ReferenceFormModal({ isOpen, onClose, onSave, referenceToEdit }) {
  const [formData, setFormData] = useState({
    citationData: "", // Será un string JSON
    formattedString: "",
    url: "",
    notes: "",
  });
  const [citationDataError, setCitationDataError] = useState("");

  useEffect(() => {
    if (referenceToEdit) {
      // Si estamos editando, precarga los datos
      setFormData({
        citationData:
          JSON.stringify(referenceToEdit.citationData, null, 2) || "",
        formattedString: referenceToEdit.formattedString || "",
        url: referenceToEdit.url || "",
        notes: referenceToEdit.notes || "",
      });
    } else {
      // Si es una nueva referencia, resetea el formulario
      setFormData({
        citationData: "",
        formattedString: "",
        url: "",
        notes: "",
      });
    }
    setCitationDataError(""); // Resetea errores al abrir/cambiar ref
  }, [referenceToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validar citationData al escribir
    if (name === "citationData") {
      try {
        JSON.parse(value);
        setCitationDataError("");
      } catch (err) {
        setCitationDataError("JSON inválido");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (citationDataError) {
      alert("Corrige los errores en los datos de citación.");
      return;
    }

    try {
      const parsedCitationData = JSON.parse(formData.citationData);
      onSave({
        ...formData,
        citationData: parsedCitationData, // Envía el objeto parseado
      });
      onClose(); // Cierra la modal después de guardar
    } catch (err) {
      setCitationDataError("Los datos de citación deben ser JSON válido.");
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {referenceToEdit
                    ? "Editar Referencia"
                    : "Añadir Nueva Referencia"}
                </Dialog.Title>
                <div className="mt-2">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="citationData"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Datos de Citación (JSON CSL)
                      </label>
                      <textarea
                        id="citationData"
                        name="citationData"
                        value={formData.citationData}
                        onChange={handleChange}
                        rows="8"
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          citationDataError ? "border-red-500" : ""
                        }`}
                        placeholder='Ej: {"type": "article-journal", "title": "Mi Artículo", "author": [{"family": "Doe", "given": "John"}]}'
                      ></textarea>
                      {citationDataError && (
                        <p className="text-red-500 text-xs mt-1">
                          {citationDataError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="formattedString"
                        className="block text-sm font-medium text-gray-700"
                      >
                        String Formateado (Opcional)
                      </label>
                      <input
                        type="text"
                        id="formattedString"
                        name="formattedString"
                        value={formData.formattedString}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Ej: Doe, J. (2023). Mi Artículo."
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="url"
                        className="block text-sm font-medium text-gray-700"
                      >
                        URL (Opcional)
                      </label>
                      <input
                        type="url"
                        id="url"
                        name="url"
                        value={formData.url}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="https://ejemplo.com/recurso"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="notes"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Notas (Opcional)
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Notas adicionales sobre esta referencia..."
                      ></textarea>
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                        onClick={onClose}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        {referenceToEdit
                          ? "Guardar Cambios"
                          : "Crear Referencia"}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default ReferenceFormModal;
