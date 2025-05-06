import React from "react";

const Modal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg relative min-w-[320px] max-w-full p-0">
        <button
          className="absolute top-2 right-2 text-xl text-gray-400 hover:text-gray-700 focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        {children}
      </div>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />
    </div>
  );
};

export default Modal;
