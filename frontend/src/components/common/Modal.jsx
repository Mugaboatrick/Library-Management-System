import React from 'react';

// `zIndex` exists because this component renders inline instead of through a
// portal, so two open modals share one stacking context. Without an explicit
// value they tie on z-50 and the later sibling in the DOM wins, which silently
// hides a dialog opened from inside another one. Raising the value is the
// deterministic fix; the default keeps every existing call site unchanged.
const Modal = ({ open, onClose, title, children, size = 'md', zIndex = 50 }) => {
  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex }} aria-modal="true">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizes[size]} z-10`}>
          <div className="flex justify-between items-center border-b px-6 py-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
