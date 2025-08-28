import React from 'react';
import Modal from './Modal';
import { useData } from '../hooks/useDataContext';
import type { Invoice } from '../types';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ isOpen, onClose, invoice }) => {
    const { updateInvoiceStatus } = useData();

    const handlePrint = () => {
        window.print();
    };
    
    const emailSubject = `Faktura č. ${invoice.id.toUpperCase()} - ${invoice.supplier.name}`;
    const emailBody = `Dobrý den,

zde jsou údaje k Vaší faktuře č. ${invoice.id.toUpperCase()} za pronájem vozidla.

Celková částka k úhradě: ${invoice.amount.toLocaleString('cs-CZ')} Kč
Datum splatnosti: ${new Date(invoice.dueDate).toLocaleDateString('cs-CZ')}
Variabilní symbol: ${invoice.variableSymbol}

Platební údaje:
Číslo účtu: ${invoice.supplier.bankAccount}

V případě dotazů nás neváhejte kontaktovat.

S pozdravem,
Tým ${invoice.supplier.name}
`;
    
    const mailtoLink = `mailto:${invoice.customer.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;


    return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Faktura č. ${invoice.id.toUpperCase()}`}
    >
        <div>
            <div id="invoice-to-print" className="p-8 bg-white text-gray-800 font-sans">
                <header className="flex justify-between items-start pb-6 border-b-2 border-gray-800">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">FAKTURA</h1>
                        <p className="text-gray-600">Daňový doklad</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-semibold">{invoice.supplier.name}</h2>
                        <p>{invoice.supplier.address}</p>
                        <p>{invoice.supplier.idNumber}</p>
                    </div>
                </header>

                <section className="grid grid-cols-2 gap-8 my-6">
                    <div>
                        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Odběratel</h3>
                        <p className="font-bold">{invoice.customer.name}</p>
                        <p>{invoice.customer.address}</p>
                        <p>{invoice.customer.idNumber}</p>
                    </div>
                    <div className="text-right">
                        <p><strong className="text-gray-600">Číslo faktury:</strong> {invoice.id.toUpperCase()}</p>
                        <p><strong className="text-gray-600">Datum vystavení:</strong> {new Date(invoice.issueDate).toLocaleDateString('cs-CZ')}</p>
                        <p><strong className="text-gray-600">Datum splatnosti:</strong> {new Date(invoice.dueDate).toLocaleDateString('cs-CZ')}</p>
                        <p><strong className="text-gray-600">Variabilní symbol:</strong> {invoice.variableSymbol}</p>
                    </div>
                </section>

                <section>
                    <table className="w-full text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-sm font-semibold uppercase text-gray-600">Popis položky</th>
                                <th className="p-3 text-sm font-semibold uppercase text-gray-600 text-right">Cena celkem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-3">{item.description}</td>
                                    <td className="p-3 text-right">{item.total.toLocaleString('cs-CZ')} Kč</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="flex justify-end mt-6">
                    <div className="w-1/2">
                        <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                            <span className="text-xl font-bold">Celkem k úhradě</span>
                            <span className="text-2xl font-bold">{invoice.amount.toLocaleString('cs-CZ')} Kč</span>
                        </div>
                    </div>
                </section>

                <footer className="mt-8 pt-6 border-t">
                    <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Platební údaje</h3>
                    <p><strong className="text-gray-600">Číslo účtu:</strong> {invoice.supplier.bankAccount}</p>
                     {invoice.status === 'paid' && (
                        <div className="mt-4 text-center">
                            <p className="text-2xl font-bold text-green-600 uppercase">UHRAZENO</p>
                            <p className="text-sm text-gray-500">Děkujeme za Vaši platbu.</p>
                        </div>
                    )}
                </footer>
            </div>
             <div className="p-4 bg-gray-50 border-t flex justify-end items-center gap-4 no-print">
                 {invoice.status === 'unpaid' && (
                    <button 
                        onClick={() => {
                            updateInvoiceStatus(invoice.id, 'paid');
                            onClose();
                        }}
                        className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">
                        Označit jako zaplacené
                    </button>
                )}
                 <a
                    href={invoice.customer.email ? mailtoLink : undefined}
                    onClick={(e) => {
                        if (!invoice.customer.email) {
                            e.preventDefault();
                            alert('Fakturu nelze odeslat, protože u zákazníka není evidován e-mail.');
                        }
                    }}
                    className={`inline-block text-center px-5 py-2 text-white font-semibold rounded-lg shadow-md ${
                        invoice.customer.email ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!invoice.customer.email}
                >
                    Odeslat emailem
                </a>
                 <button onClick={handlePrint} className="px-5 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700">
                    Tisk / PDF
                </button>
            </div>
        </div>
    </Modal>
    );
};

export default InvoiceDetailModal;