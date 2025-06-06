// src/components/PromptConfirmModal.js
import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function PromptConfirmModal({
  isOpen,
  onClose,
  onConfirm, // Callback cuando se confirma (ej: borrar, guardar)
  title,
  message,
  showInputField = false, // Nuevo prop: ¿mostrar campo de entrada?
  inputPlaceholder = "",
  initialInputValue = "",
  confirmButtonText = "Aceptar",
  cancelButtonText = "Cancelar",
  iconType = "warning", // 'warning' para confirmación, 'document' para prompt de archivo
}) {
  const [inputValue, setInputValue] = useState(initialInputValue);

  // Reset input value when modal opens or initialInputValue changes
  React.useEffect(() => {
    if (isOpen) {
      // Solo resetear cuando la modal se abre
      setInputValue(initialInputValue);
    }
  }, [isOpen, initialInputValue]);

  const handleConfirmClick = () => {
    if (showInputField) {
      onConfirm(inputValue); // Pasa el valor del input si el campo está visible
    } else {
      onConfirm(); // Solo ejecuta la acción si no hay campo de input
    }
    // onClose(); // La modal se cerrará automáticamente en la mayoría de los casos después de onConfirm,
    // pero si onConfirm no cierra, puedes descomentar esto. Por ahora, asumimos que onConfirm
    // o el padre gestiona el cierre.
  };

  const IconComponent = () => {
    if (iconType === "warning") {
      return (
        <ExclamationTriangleIcon
          className="h-6 w-6 text-red-600"
          aria-hidden="true"
        />
      );
    } else if (iconType === "document") {
      return (
        <DocumentTextIcon
          className="h-6 w-6 text-indigo-600"
          aria-hidden="true"
        />
      );
    }
    return null; // O un icono por defecto
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
          <div className="fixed inset-0 bg-black bg-opacity-50" />
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
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <IconComponent />
                </div>
                <Dialog.Title
                  as="h3"
                  className="mt-4 text-lg font-medium leading-6 text-gray-900 text-center"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 text-center">{message}</p>
                  {showInputField && (
                    <div className="mt-4">
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder={inputPlaceholder}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => {
                          // Permite al usuario "confirmar" presionando Enter si hay un campo de input
                          if (e.key === "Enter") {
                            handleConfirmClick();
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-center gap-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={handleConfirmClick}
                  >
                    {confirmButtonText}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    {cancelButtonText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
