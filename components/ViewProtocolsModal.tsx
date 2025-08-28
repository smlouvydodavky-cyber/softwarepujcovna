import React from 'react';
import Modal from './Modal';
import type { Rental, HandoverProtocol } from '../types';

interface ViewProtocolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental;
}

const ProtocolDetail: React.FC<{ protocol: HandoverProtocol; title: string }> = ({ protocol, title }) => {
    const fuelLevelText = (level: number) => {
        const map: {[key: number]: string} = {1: 'Plná', 0.75: '3/4', 0.5: '1/2', 0.25: '1/4', 0: 'Prázdná'};
        return map[level] || 'N/A';
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">{title}</h3>
            <p><strong>Datum:</strong> {new Date(protocol.timestamp).toLocaleString('cs-CZ')}</p>
            <p><strong>Stav tachometru:</strong> {protocol.mileage.toLocaleString('cs-CZ')} km</p>
            <p><strong>Stav paliva:</strong> {fuelLevelText(protocol.fuelLevel)}</p>
            <p><strong>Poznámky:</strong> {protocol.notes || 'Žádné'}</p>
            <div>
                <p><strong>Fotodokumentace:</strong></p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    {protocol.photos.length > 0 ? protocol.photos.map((p, i) => (
                        <img key={i} src={p} alt={`Photo ${i+1}`} className="rounded-md object-cover w-full h-32"/>
                    )) : <p className="text-gray-500">Nebyly pořízeny žádné fotografie.</p>}
                </div>
            </div>
             <div>
                <p><strong>Podpis zákazníka:</strong></p>
                <div className="mt-2 border rounded-md p-2 bg-gray-50">
                    <img src={protocol.signature} alt="Signature" className="mx-auto h-20"/>
                </div>
            </div>
        </div>
    )
}


const ViewProtocolsModal: React.FC<ViewProtocolsModalProps> = ({ isOpen, onClose, rental }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Protokoly pro pronájem #${rental.id.toUpperCase()}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {rental.pickupProtocol ? (
                <ProtocolDetail protocol={rental.pickupProtocol} title="Předávací protokol" />
            ) : <p>Předávací protokol nebyl nalezen.</p>}
            
            {rental.returnProtocol ? (
                <ProtocolDetail protocol={rental.returnProtocol} title="Vracící protokol" />
            ) : <p>Vracící protokol nebyl nalezen.</p>}
        </div>
    </Modal>
  );
};

export default ViewProtocolsModal;
