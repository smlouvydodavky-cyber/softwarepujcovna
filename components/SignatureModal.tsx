import React, { useRef } from 'react';
import SignaturePad from './SignaturePad';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: string) => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSave }) => {
  const signaturePadRef = useRef<{ getSignatureData: () => string | null, clear: () => void }>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    const signatureData = signaturePadRef.current?.getSignatureData();
    if (signatureData) {
      onSave(signatureData);
    }
  };
  
  const handleClear = () => {
    signaturePadRef.current?.clear();
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex flex-col p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-2xl overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-center">Prosím, podepište se</h2>
        </div>
        <div className="flex-1 relative">
            <SignaturePad ref={signaturePadRef} />
        </div>
        <div className="p-4 bg-gray-100 border-t flex justify-between items-center">
            <button
                type="button"
                onClick={handleClear}
                className="px-5 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-sm hover:bg-gray-400"
            >
                Vymazat
            </button>
            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-sm hover:bg-red-600"
                >
                    Zrušit
                </button>
                 <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700"
                >
                    Hotovo
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;