import { useRef } from 'react';
import { CreditCard, Download, Printer, ScanLine, ShoppingBag, Sparkles } from 'lucide-react';
import type { QRData } from '../types';

interface QRCardProps {
  data: QRData;
  onClose: () => void;
}

export default function QRCard({ data, onClose }: QRCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = data.qrDataUrl;
    link.download = `qr-table-${data.tableNumber}-${data.restaurantSlug}.png`;
    link.click();
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>QR – Table ${data.tableNumber}</title>
      <style>
        body { font-family: sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; background:#f5f5f5; margin:0; }
        .card { background:#fff; border-radius:16px; overflow:hidden; width:280px; box-shadow:0 4px 20px rgba(0,0,0,.1); text-align:center; padding-bottom:16px; }
        .header { background:#2563eb; padding:16px; color:#fff; font-size:16px; font-weight:700; }
        .hero { background:#ffffff; padding:14px 14px 8px; }
        .qr-wrap { width:220px; height:220px; margin:8px auto 0; border-radius:18px; padding:6px; border:1px solid #e5e7eb; background:#ffffff; }
        img { width:100%; height:100%; display:block; border-radius:12px; background:#fff; padding:10px; box-sizing:border-box; }
        .steps { margin-top:10px; font-size:14px; font-weight:700; color:#374151; letter-spacing:.2px; }
        .tag { display:inline-block; margin-top:6px; background:#f9fafb; color:#374151; border:1px solid #e5e7eb; border-radius:999px; padding:3px 10px; font-size:14px; font-weight:700; }
        .table { font-size:20px; font-weight:800; color:#111; }
        .url { font-size:14px; color:#6b7280; margin-top:6px; word-break:break-all; padding:0 12px; }
        .scan { font-size:14px; color:#2563eb; font-weight:700; margin-top:8px; text-transform:uppercase; letter-spacing:.3px; }
      </style></head><body>
      <div class="card">
        <div class="header">${data.restaurantName}</div>
        <div class="hero">
          <div class="qr-wrap"><img src="${data.qrDataUrl}" alt="QR Code"/></div>
          <div class="steps">SCAN -> ORDER -> PAY</div>
          <div class="tag">Skip the queue</div>
        </div>
        <div class="scan">Scan to Order</div>
        <div class="table">Table ${data.tableNumber}</div>
        <div class="url">${data.menuUrl}</div>
      </div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.addEventListener('afterprint', () => win.close());
    win.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden w-72 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        ref={cardRef}
      >
        {/* Card header */}
        <div className="bg-brand px-4 py-4 text-white">
          <p className="font-bold text-lg">{data.restaurantName}</p>
        </div>

        {/* QR hero */}
        <div className="bg-white px-4 pt-4 pb-3">
          <div className="mx-auto w-56 h-56 rounded-2xl border border-border bg-white p-1.5">
            <img
              src={data.qrDataUrl}
              alt={`QR Code for Table ${data.tableNumber}`}
              className="w-full h-full rounded-xl bg-white p-2"
            />
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-base font-bold uppercase tracking-wide text-gray-700">
            <span className="inline-flex items-center gap-1"><ScanLine className="w-3.5 h-3.5" /> Scan</span>
            <span className="text-gray-400">-&gt;</span>
            <span className="inline-flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" /> Order</span>
            <span className="text-gray-400">-&gt;</span>
            <span className="inline-flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Pay</span>
          </div>

          <div className="mt-2 flex justify-center">
            <p className="inline-flex items-center gap-1 rounded-full border border-border bg-gray-50 px-3 py-1 text-base font-semibold text-gray-700">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Skip the queue
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 text-center border-t border-gray-100 pt-3">
          <p className="text-base font-semibold text-brand">Scan to Order</p>
          <p className="text-2xl font-extrabold text-gray-900">Table {data.tableNumber}</p>
          <p className="text-base text-gray-400 mt-1 break-all">{data.menuUrl}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand text-white
                       text-base font-semibold py-2.5 rounded-xl hover:bg-brand-dark transition-colors min-h-11"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700
                       text-base font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition-colors min-h-11"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
