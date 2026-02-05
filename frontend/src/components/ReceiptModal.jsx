import React, { useState, useEffect } from 'react';
import { X, Printer, MessageCircle, Share2, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ReceiptModal = ({ isOpen, onClose, order, settings }) => {
    // Editable state for the modal view (won't save back to DB for now, just for print)
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerGstin, setCustomerGstin] = useState('');

    useEffect(() => {
        if (order) {
            setCustomerName(order.customer?.name || '');
            setCustomerPhone(order.customer?.phone || '');
            setCustomerGstin(order.customer?.gstin || '');
        }
    }, [order]);

    if (!isOpen || !order) return null;

    const restaurant = settings?.restaurant || {};
    const receipt = settings?.receipt || {};
    const billData = order.billingDetails || {
        itemTotal: order.subtotal,
        discountAmount: order.discount,
        taxDetails: [], // Ideally this should be stored, but fallback if missing
        taxableAmount: order.subtotal - order.discount,
        totalTax: order.tax,
        roundOff: 0,
        grandTotal: order.total
    };

    const [isGenerating, setIsGenerating] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleSharePDF = async () => {
        try {
            setIsGenerating(true);

            // Create PDF manually to avoid html2canvas OKLCH color errors
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, 250] // POS width
            });

            let y = 10;
            const mid = 40;
            const leftMargin = 5;
            const rightMargin = 75;

            // Header
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text((restaurant.name || 'Restaurant').toUpperCase(), mid, y, { align: 'center' });
            y += 6;

            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            if (restaurant.address) {
                const addrLines = pdf.splitTextToSize(restaurant.address, 65);
                addrLines.forEach(l => { pdf.text(l, mid, y, { align: 'center' }); y += 4; });
            }
            if (restaurant.phone) { pdf.text(`Phone: ${restaurant.phone}`, mid, y, { align: 'center' }); y += 4; }
            if (restaurant.gstin) { pdf.text(`GSTIN: ${restaurant.gstin}`, mid, y, { align: 'center' }); y += 4; }

            y += 2;
            pdf.setLineDash([1, 1], 0);
            pdf.line(leftMargin, y, rightMargin, y);
            pdf.setLineDash([]);
            y += 6;

            // Order Info
            pdf.setFontSize(9);
            pdf.text(`Order: ${order.orderNumber}`, leftMargin, y);
            pdf.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, rightMargin, y, { align: 'right' });
            y += 4.5;
            pdf.text(`Type: ${(order.orderType || 'dine-in').toUpperCase()}`, leftMargin, y);
            if (order.tableNumber) pdf.text(`Table: ${order.tableNumber}`, rightMargin, y, { align: 'right' });
            y += 6;

            // Items Table
            pdf.setFont("helvetica", "bold");
            pdf.line(leftMargin, y - 4, rightMargin, y - 4);
            pdf.text("Item", leftMargin, y);
            pdf.text("Qty", 55, y, { align: 'center' });
            pdf.text("Total", rightMargin, y, { align: 'right' });
            y += 4;
            pdf.line(leftMargin, y, rightMargin, y);
            y += 6;

            pdf.setFont("helvetica", "normal");
            order.items.forEach(item => {
                const name = item.menuItem?.name || item.name;
                const lines = pdf.splitTextToSize(name, 48);
                pdf.text(lines[0], leftMargin, y);
                pdf.text(item.quantity.toString(), 55, y, { align: 'center' });
                pdf.text((item.price * item.quantity).toFixed(2), rightMargin, y, { align: 'right' });
                y += 5;
                for (let i = 1; i < lines.length; i++) { pdf.text(lines[i], leftMargin, y); y += 4; }
            });

            y += 1;
            pdf.setLineDash([1, 1], 0);
            pdf.line(leftMargin, y, rightMargin, y);
            pdf.setLineDash([]);
            y += 6;

            // Totals
            pdf.text("Subtotal", leftMargin, y);
            pdf.text(billData.itemTotal.toFixed(2), rightMargin, y, { align: 'right' });
            y += 4.5;
            if (billData.discountAmount > 0) {
                pdf.text("Discount", leftMargin, y);
                pdf.text("-" + billData.discountAmount.toFixed(2), rightMargin, y, { align: 'right' });
                y += 4.5;
            }
            if (billData.taxDetails?.length > 0) {
                billData.taxDetails.forEach(t => {
                    pdf.text(`${t.name} (${t.rate}%)`, leftMargin, y);
                    pdf.text(t.amount.toFixed(2), rightMargin, y, { align: 'right' });
                    y += 4.5;
                });
            } else if (order.tax > 0) {
                pdf.text("Tax", leftMargin, y);
                pdf.text(order.tax.toFixed(2), rightMargin, y, { align: 'right' });
                y += 4.5;
            }

            y += 2;
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.text("Grand Total", leftMargin, y);
            pdf.text(`Rs. ${billData.grandTotal.toFixed(2)}`, rightMargin, y, { align: 'right' });
            y += 8;

            // Footer
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            const footerTxt = receipt.footer || 'Thank you for dining with us!';
            pdf.splitTextToSize(footerTxt, 65).forEach(l => { pdf.text(l, mid, y, { align: 'center' }); y += 4; });
            pdf.setFont("helvetica", "italic");
            pdf.text("Generated via RestoPOS", mid, y + 2, { align: 'center' });

            // Sharing / Saving
            const pdfBlob = pdf.output('blob');
            const fileName = `Receipt-${order.orderNumber}.pdf`;
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `Receipt - ${order.orderNumber}`,
                        text: `Bill from ${restaurant.name || 'Our Restaurant'}`
                    });
                } catch (e) { if (e.name !== 'AbortError') throw e; }
            } else {
                pdf.save(fileName);
                const phone = customerPhone.replace(/\D/g, '');
                if (phone && phone.length >= 10) {
                    handleWhatsAppText();
                } else alert('PDF downloaded.');
            }
        } catch (error) {
            console.error('Sharing failed:', error);
            handleWhatsAppText();
        } finally {
            setIsGenerating(false);
        }
    };

    const handleWhatsAppText = () => {
        const phone = customerPhone.replace(/\D/g, '');
        if (!phone || phone.length < 10) {
            alert('Please enter a valid 10-digit customer phone number.');
            return;
        }

        const restaurantName = restaurant.name || 'Our Restaurant';
        const itemsList = order.items.map(i => `• ${i.quantity}x ${i.menuItem?.name || i.name} - ₹${(i.price * i.quantity).toFixed(0)}`).join('%0A');
        const formattedPhone = phone.length === 10 ? `91${phone}` : phone;

        const message = `*Bill from ${restaurantName}*%0A%0A` +
            `*Order:* ${order.orderNumber}%0A` +
            `*Items:*%0A${itemsList}%0A%0A` +
            `*Total: ₹${billData.grandTotal.toFixed(2)}*%0A%0A` +
            `Thank you!`;

        window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white text-black w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header Controls */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 print:hidden">
                    <h2 className="font-bold text-lg">Transaction Receipt</h2>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                {/* Scrollable Receipt Area */}
                <div className="flex-1 overflow-y-auto p-8 font-mono text-sm print:p-0" id="printable-receipt">
                    {/* Restaurant Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold uppercase mb-2">{restaurant.name || 'Restaurant Name'}</h1>
                        {restaurant.address && <p className="whitespace-pre-line">{restaurant.address}</p>}
                        {restaurant.phone && <p>Phone: {restaurant.phone}</p>}
                        {restaurant.email && <p>Email: {restaurant.email}</p>}
                        {restaurant.gstin && <p className="font-bold mt-1">GSTIN: {restaurant.gstin}</p>}
                        <div className="border-b-2 border-dashed border-black my-4"></div>
                    </div>

                    {/* Order Info */}
                    <div className="mb-4 flex justify-between">
                        <div>
                            <p>Order No: {order.orderNumber}</p>
                            <p>Date: {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}</p>
                        </div>
                        <div className="text-right">
                            <p>Type: {order.orderType.toUpperCase()}</p>
                            {order.tableNumber && <p>Table: {order.tableNumber}</p>}
                        </div>
                    </div>

                    {/* Customer Info (Read Only or Editable if needed, prioritizing Read Only for history) */}
                    <div className="mb-4">
                        <p><strong>Customer:</strong> {customerName || 'Guest'}</p>
                        {customerPhone && <p><strong>Phone:</strong> {customerPhone}</p>}
                        {customerGstin && <p><strong>GSTIN:</strong> {customerGstin}</p>}
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-4">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="text-left py-1">Item</th>
                                <th className="text-center w-12">Qty</th>
                                <th className="text-right w-16">Price</th>
                                <th className="text-right w-16">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-1">{item.menuItem?.name || item.name}</td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-right">{item.price}</td>
                                    <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-b-2 border-dashed border-black mb-4"></div>

                    {/* Totals */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{billData.itemTotal?.toFixed(2)}</span>
                        </div>
                        {billData.discountAmount > 0 && (
                            <div className="flex justify-between">
                                <span>Discount</span>
                                <span>-{billData.discountAmount?.toFixed(2)}</span>
                            </div>
                        )}
                        {/* If detailed tax breakdown is saved, use it. Else fall back to simple tax */}
                        {billData.taxDetails && billData.taxDetails.length > 0 ? (
                            billData.taxDetails.map((tax, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span>{tax.name} ({tax.rate}%)</span>
                                    <span>{tax.amount.toFixed(2)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-between text-xs">
                                <span>Tax</span>
                                <span>{billData.totalTax?.toFixed(2)}</span>
                            </div>
                        )}

                        {billData.roundOff !== 0 && (
                            <div className="flex justify-between text-xs italic">
                                <span>Round Off</span>
                                <span>{billData.roundOff}</span>
                            </div>
                        )}
                        <div className="border-t border-black pt-2 mt-2 flex justify-between font-bold text-lg">
                            <span>Grand Total</span>
                            <span>{billData.grandTotal?.toFixed(2)}</span>
                        </div>
                        {/* Payment Method Display */}
                        <div className="text-right text-xs mt-1 uppercase">
                            Paid via: {order.paymentMethod || 'Cash'}
                        </div>
                    </div>

                    <div className="text-center mt-8 text-xs">
                        <p>{receipt.footer || 'Thank you for dining with us!'}</p>
                        <p className="mt-2 text-gray-400">Powered by POS System</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t bg-gray-50 flex gap-2 print:hidden overflow-x-auto">
                    <button
                        onClick={handleSharePDF}
                        disabled={isGenerating}
                        className="flex-1 bg-blue-600 text-white py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg disabled:opacity-50 min-w-fit"
                    >
                        {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Share2 size={18} />}
                        Share PDF
                    </button>
                    <button
                        onClick={handleWhatsAppText}
                        className="flex-1 bg-green-600 text-white py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg min-w-fit"
                    >
                        <MessageCircle size={18} />
                        WhatsApp
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-slate-900 text-white py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg min-w-fit"
                    >
                        <Printer size={18} />
                        Print / PDF
                    </button>
                </div>
            </div>

            {/* Print CSS */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                    }
                    #printable-receipt {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto;
                        padding: 0;
                        margin: 0;
                        color: black;
                        background: white;
                    }
                    /* Ensure exact margins/padding for clean PDF */
                    @page {
                        margin: 0;
                        size: auto;
                    }
                }
            `}</style>
        </div>
    );
};

export default ReceiptModal;
