import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

/**
 * @file Componente PromptConfirmModal.
 * @description Modal de confirmación genérico o de entrada de texto,
 * que ofrece al usuario una opción para confirmar una acción o introducir un valor.
 */

/**
 * PromptConfirmModal es un componente de modal versátil para solicitar confirmación
 * o una entrada de texto al usuario.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {boolean} props.isOpen - Controla la visibilidad del modal.
 * @param {function(): void} props.onClose - Callback que se invoca cuando el modal debe cerrarse (ej. al cancelar o al hacer clic fuera).
 * @param {function(?string): void} props.onConfirm - Callback que se ejecuta cuando el usuario confirma la acción. Si `showInputField` es `true`, pasa el valor actual del input como argumento; de lo contrario, no pasa argumentos. El argumento es `string` si `showInputField` es `true`, o `undefined` si no.
 * @param {string} props.title - El título que se muestra en el modal.
 * @param {string} props.message - El mensaje principal o la pregunta que se muestra en el modal.
 * @param {boolean} [props.showInputField=false] - Si es `true`, muestra un campo de entrada de texto dentro del modal.
 * @param {string} [props.inputPlaceholder=""] - El texto de placeholder para el campo de entrada, si `showInputField` es `true`.
 * @param {string} [props.initialInputValue=""] - El valor inicial del campo de entrada, si `showInputField` es `true`.
 * @param {string} [props.confirmButtonText="Aceptar"] - El texto para el botón de confirmación.
 * @param {string} [props.cancelButtonText="Cancelar"] - El texto para el botón de cancelación.
 * @param {string} [props.iconType='warning'] - El tipo de icono a mostrar en el modal. 'warning' para un icono de advertencia (rojo/naranja), 'document' para un icono relacionado con documentos (azul/índigo).
 * @returns {JSX.Element} El componente del modal.
 */
export default function PromptConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  showInputField = false,
  inputPlaceholder = "",
  initialInputValue = "",
  confirmButtonText = "Aceptar",
  cancelButtonText = "Cancelar",
  iconType = "warning",
}) {
  /**
   * Estado local para gestionar el valor del campo de entrada.
   * @type {string}
   */
  const [inputValue, setInputValue] = useState(initialInputValue);

  /**
   * Hook de efecto para resetear el valor del input cuando el modal se abre
   * o cuando `initialInputValue` cambia.
   */
  React.useEffect(() => {
    if (isOpen) {
      setInputValue(initialInputValue);
    }
  }, [isOpen, initialInputValue]);

  /**
   * Maneja el clic en el botón de confirmación.
   * Ejecuta el callback `onConfirm` pasando el valor del input si `showInputField` es `true`.
   * @returns {void}
   */
  const handleConfirmClick = () => {
    if (showInputField) {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
    // La modal se cerrará automáticamente en la mayoría de los casos después de onConfirm,
    // pero si onConfirm no cierra, puedes descomentar la siguiente línea:
    // onClose();
  };

  /**
   * Componente interno para renderizar el icono apropiado según `iconType`.
   * @returns {JSX.Element | null} El icono a mostrar.
   */
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
    return null;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Fondo oscuro del modal */}
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

        {/* Contenedor principal del modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Panel del modal */}
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
                {/* Icono del modal */}
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <IconComponent />
                </div>
                {/* Título del modal */}
                <Dialog.Title
                  as="h3"
                  className="mt-4 text-lg font-medium leading-6 text-gray-900 text-center"
                >
                  {title}
                </Dialog.Title>
                {/* Mensaje y campo de entrada (si aplica) */}
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
                          if (e.key === "Enter") {
                            handleConfirmClick();
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
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
