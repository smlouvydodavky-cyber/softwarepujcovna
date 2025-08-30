import React from 'react';
import Modal from './Modal';
import type { PreRegistration } from '../types';

interface PreRegistrationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  preRegistration: PreRegistration;
  onConfirm: (preRegistration: PreRegistration) => void;
}

const DetailRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value || '-'}</p>
    </div>
);

const PreRegistrationDetailModal: React.FC<PreRegistrationDetailModalProps> = ({ isOpen, onClose, preRegistration, onConfirm }) => {
  const { customerData, signature, idCardUrl, licenseUrl } = preRegistration;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail před-registrace">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Údaje zákazníka</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailRow label="Celé jméno" value={customerData?.fullName} />
            <DetailRow label="Email" value={customerData?.email} />
            <DetailRow label="Telefon" value={customerData?.phone} />
            <DetailRow label="Adresa" value={customerData?.address} />
            <DetailRow label="Číslo OP" value={customerData?.idNumber} />
            <DetailRow label="Číslo ŘP" value={customerData?.drivingLicense} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Nahrané doklady a podpis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">Doklady</p>
                <div className="flex flex-col space-y-2">
                  <a href={idCardUrl} target="_blank" rel="noopener noreferrer" className={`inline-block text-center px-4 py-2 rounded-lg ${idCardUrl ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>
                    Zobrazit Občanský průkaz
                  </a>
                  <a href={licenseUrl} target="_blank" rel="noopener noreferrer" className={`inline-block text-center px-4 py-2 rounded-lg ${licenseUrl ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>
                    Zobrazit Řidičský průkaz
                  </a>
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium mb-2">Podpis zákazníka</p>
              <div className="border rounded-md p-2 bg-gray-50 flex justify-center items-center h-28">
                {signature ? (
                  <img src={signature} alt="Podpis" className="h-24 object-contain"/>
                ) : (
                  <p className="text-gray-500">Podpis nebyl poskytnut.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
       <div className="flex justify-between items-center mt-8 pt-4 border-t">
        <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-sm hover:bg-gray-300">
            Zavřít
        </button>
        <button onClick={() => onConfirm(preRegistration)} className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">
            Vytvořit pronájem s těmito údaji
        </button>
      </div>
    </Modal>
  );
};

export default PreRegistrationDetailModal;