'use client';

import React, { useState } from 'react';
import './ErpDocumentBuilderView.css';
import {
  FileText,
  Printer,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Building,
  Calendar,
  Settings,
  HelpCircle,
  Download,
  Eye,
  Sliders,
  DollarSign,
  Package,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { DynamicDocumentColumn, DynamicDocumentRow } from '../../types';

// Preset from Somorita Hospital Price Quotation PDF
const SAMORITA_COLUMNS: DynamicDocumentColumn[] = [
  { id: 'sl', label: 'Sl No', field: 'sl', width: '50px', align: 'center', isDeletable: false },
  { id: 'code', label: 'Code No', field: 'code', width: '70px', align: 'center', isDeletable: true },
  { id: 'name', label: 'Name of items', field: 'name', width: 'auto', align: 'left', isDeletable: false },
  { id: 'origin', label: 'Country of Origin', field: 'origin', width: '120px', align: 'center', isDeletable: true },
  { id: 'size', label: 'Size', field: 'size', width: '90px', align: 'center', isDeletable: true },
  { id: 'unit', label: 'Unit/Box', field: 'unit', width: '90px', align: 'center', isDeletable: true },
  { id: 'rate', label: 'Unit Price in Tk.', field: 'rate', width: '110px', align: 'right', isDeletable: true },
  { id: 'rateWord', label: 'Price In Word', field: 'rateWord', width: '150px', align: 'left', isDeletable: true },
  { id: 'clientRate', label: 'Hospital Present Rate', field: 'clientRate', width: '110px', align: 'right', isDeletable: true },
];

const SAMORITA_ROWS: DynamicDocumentRow[] = [
  { id: 'r-1', sl: 1, code: '5', name: 'HBsAg Device', origin: 'China', size: '1 pcs', unit: '1 pcs', rate: 17, rateWord: 'Seventeen', clientRate: '18' },
  { id: 'r-2', sl: 2, code: '32', name: 'HCV Device', origin: 'China', size: '1 pcs', unit: '1 pcs', rate: 27, rateWord: 'Twenty-Seven', clientRate: '28' },
  { id: 'r-3', sl: 3, code: '824', name: 'HIV Device', origin: 'China', size: '1 pcs', unit: '1 pcs', rate: 27, rateWord: 'Twenty-Seven', clientRate: '28' },
  { id: 'r-4', sl: 4, code: '11', name: 'TPHA Device', origin: 'China', size: '1 pcs', unit: '1 pcs', rate: 23, rateWord: 'Twenty-Three', clientRate: '25' },
  { id: 'r-5', sl: 5, code: '59', name: 'Malaria Device', origin: 'China', size: '1 pcs', unit: '1 pcs', rate: 48, rateWord: 'Forty-Eight', clientRate: '50' },
  { id: 'r-6', sl: 6, code: '1655', name: 'Dengue NS1 Antigen Device', origin: 'China', size: '1 pcs', unit: '1 pcs', rate: 38, rateWord: 'Thirty-Eight', clientRate: '40' },
  { id: 'r-7', sl: 7, code: '30', name: 'Microscope Glass Slides', origin: 'China', size: '50 pcs', unit: '1 box', rate: 63, rateWord: 'Sixty-Three', clientRate: '98/100' },
  { id: 'r-8', sl: 8, code: '1171', name: 'Urine C/S Sterile Container Pot', origin: 'China', size: '1 pcs', unit: '1 pcs', rate: 7, rateWord: 'Seven', clientRate: '7.5' },
  { id: 'r-9', sl: 9, code: '58', name: 'Tourniquet Elastic Band', origin: 'China', size: '1 pcs', unit: '1 pcs', rate: 18, rateWord: 'Eighteen', clientRate: '20' },
  { id: 'r-10', sl: 10, code: '102', name: 'Hydrogen Peroxide 6% USP', origin: 'BD', size: '100 ml', unit: '1 pcs', rate: 38, rateWord: 'Thirty-Eight', clientRate: '39' },
];

export function ErpDocumentBuilderView() {
  const { showToast } = useToast();

  // Document meta
  const [docType, setDocType] = useState<'QUOTATION' | 'INVOICE' | 'CHALLAN' | 'VOUCHER'>('QUOTATION');
  const [docNumber, setDocNumber] = useState('SBC-QT-2026-0941');
  const [date, setDate] = useState('27/06/2026');
  const [recipientTitle, setRecipientTitle] = useState('Managing Director');
  const [recipientCompany, setRecipientCompany] = useState('Samorita Hospital Ltd.');
  const [recipientAddress, setRecipientAddress] = useState('89/1, Panthapath, Dhaka-1215.');
  const [subject, setSubject] = useState('Price offer letter of Pathology Items.');
  const [salutation, setSalutation] = useState('Dear Sir,');
  const [openingText, setOpeningText] = useState(
    'We are supplying these items to various hospitals across Bangladesh. We are willing to supply these certified medical items to your reputed hospital. Below is our price quotation:-'
  );

  // Pad print mode: hide header and footer so user can feed official printed pad into printer
  const [isPadPrintMode, setIsPadPrintMode] = useState(true);

  // Dynamic table columns and rows
  const [columns, setColumns] = useState<DynamicDocumentColumn[]>(SAMORITA_COLUMNS);
  const [rows, setRows] = useState<DynamicDocumentRow[]>(SAMORITA_ROWS);

  // New column modal / input
  const [newColLabel, setNewColLabel] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);

  // Signatory details
  const [signatoryName, setSignatoryName] = useState('Md. Saiful Islam');
  const [signatoryDesignation, setSignatoryDesignation] = useState('Sr. Marketing Officer');
  const [signatoryCompany, setSignatoryCompany] = useState('Sun Bird Corporation');
  const [signatoryPhone, setSignatoryPhone] = useState('01751-195752');

  // Terms & Conditions
  const [terms, setTerms] = useState<string[]>([
    'Price: Offered price is included Vat & Tax 15% for free delivery basis inside Dhaka.',
    'Delivery: Products will be delivered as per your official hospital work order within 24-48 hours.',
    'Payment: By Cash or A/C payee Cheque in favor of Sun Bird Corporation.',
    'Validity: Price will be valid for 30 days and is subject to DGDA tariff & statutory NBR notifications.',
  ]);

  // Handle cell edit
  const handleCellChange = (rowId: string, field: string, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return { ...r, [field]: value };
        }
        return r;
      })
    );
  };

  // Add new product row
  const handleAddRow = () => {
    const newSl = rows.length + 1;
    const newRow: DynamicDocumentRow = {
      id: `r-${Date.now()}`,
      sl: newSl,
      code: `${100 + newSl}`,
      name: 'New Medical Equipment / Item',
      origin: 'China / BD',
      size: '1 pcs',
      unit: '1 pcs',
      rate: 100,
      rateWord: 'One Hundred',
      clientRate: '-',
    };
    // Include any custom columns
    columns.forEach((col) => {
      if (!(col.field in newRow)) {
        newRow[col.field] = '';
      }
    });
    setRows((prev) => [...prev, newRow]);
    showToast('নতুন আইটেম রো যোগ করা হয়েছে।', 'info');
  };

  // Remove row
  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) {
      showToast('কমপক্ষে ১টি রো রাখতে হবে।', 'error');
      return;
    }
    setRows((prev) => {
      const filtered = prev.filter((r) => r.id !== rowId);
      return filtered.map((r, idx) => ({ ...r, sl: idx + 1 }));
    });
  };

  // Add new column
  const handleAddColumn = () => {
    if (!newColLabel.trim()) return;
    const newFieldKey = `col_${Date.now()}`;
    const newCol: DynamicDocumentColumn = {
      id: newFieldKey,
      label: newColLabel.trim(),
      field: newFieldKey,
      width: '120px',
      align: 'center',
      isDeletable: true,
    };
    setColumns((prev) => [...prev, newCol]);
    // initialize empty value in each row
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        [newFieldKey]: '',
      }))
    );
    setNewColLabel('');
    setIsAddingCol(false);
    showToast(`"${newCol.label}" কলাম যোগ করা হয়েছে।`, 'success');
  };

  // Remove column
  const handleRemoveColumn = (colId: string) => {
    const colToRemove = columns.find((c) => c.id === colId);
    if (!colToRemove || !colToRemove.isDeletable) {
      showToast('এই কলামটি ডিলিট করা সম্ভব নয়।', 'error');
      return;
    }
    setColumns((prev) => prev.filter((c) => c.id !== colId));
    showToast(`"${colToRemove.label}" কলাম মুছে ফেলা হয়েছে।`, 'info');
  };

  // Edit column header label
  const handleRenameColumn = (colId: string, currentLabel: string) => {
    const updated = prompt('কলামের নতুন নাম লিখুন:', currentLabel);
    if (updated && updated.trim()) {
      setColumns((prev) =>
        prev.map((c) => (c.id === colId ? { ...c, label: updated.trim() } : c))
      );
    }
  };

  // Load preset template
  const loadPreset = (type: 'SAMORITA' | 'STANDARD_INVOICE' | 'CHALLAN') => {
    if (type === 'SAMORITA') {
      setDocType('QUOTATION');
      setDocNumber('SBC-QT-2026-0941');
      setRecipientCompany('Samorita Hospital Ltd.');
      setSubject('Price offer letter of Pathology Items.');
      setColumns(SAMORITA_COLUMNS);
      setRows(SAMORITA_ROWS);
      showToast('সমরিতা হাসপাতাল কোটেশন টেমপ্লেট লোড করা হয়েছে।', 'success');
    } else if (type === 'STANDARD_INVOICE') {
      setDocType('INVOICE');
      setDocNumber('SBC-INV-2026-4410');
      setRecipientCompany('Green Life Medical College & Hospital');
      setSubject('Commercial Tax Invoice (মূসক-৬.৩ চালান)');
      setColumns([
        { id: 'sl', label: 'Sl', field: 'sl', width: '40px', align: 'center', isDeletable: false },
        { id: 'name', label: 'Item Description', field: 'name', width: 'auto', align: 'left', isDeletable: false },
        { id: 'qty', label: 'Qty', field: 'qty', width: '60px', align: 'center', isDeletable: true },
        { id: 'rate', label: 'Unit Price (BDT)', field: 'rate', width: '120px', align: 'right', isDeletable: true },
        { id: 'vat', label: 'VAT 15%', field: 'vat', width: '100px', align: 'right', isDeletable: true },
        { id: 'total', label: 'Total (BDT)', field: 'total', width: '130px', align: 'right', isDeletable: true },
      ]);
      setRows([
        { id: 'r-1', sl: 1, name: 'Multi-function ICU Electric Bed 5-Way', qty: 2, rate: 85000, vat: 25500, total: 195500 },
        { id: 'r-2', sl: 2, name: 'Multipara Patient Monitor 12.1 Inch OLED', qty: 2, rate: 65000, vat: 19500, total: 149500 },
      ]);
      showToast('স্ট্যান্ডার্ড ইনভয়েস ফরম্যাট লোড করা হয়েছে।', 'success');
    } else if (type === 'CHALLAN') {
      setDocType('CHALLAN');
      setDocNumber('CH-2026-8812');
      setSubject('Delivery Challan (পণ্য সরবরাহ চালান)');
      setColumns([
        { id: 'sl', label: 'Sl', field: 'sl', width: '40px', align: 'center', isDeletable: false },
        { id: 'name', label: 'Item Description', field: 'name', width: 'auto', align: 'left', isDeletable: false },
        { id: 'batch', label: 'Batch / Lot No', field: 'batch', width: '130px', align: 'center', isDeletable: true },
        { id: 'qty', label: 'Delivered Qty', field: 'qty', width: '100px', align: 'center', isDeletable: true },
        { id: 'remarks', label: 'Remarks', field: 'remarks', width: '150px', align: 'left', isDeletable: true },
      ]);
      setRows([
        { id: 'r-1', sl: 1, name: 'IV Cannula 20G with Injection Port', batch: 'BATCH-2024-C20', qty: '1,000 Pcs', remarks: 'Sterile & Sealed' },
        { id: 'r-2', sl: 2, name: 'Disposable Sterile Syringe 5ml (Box of 100)', batch: 'BATCH-2025-SYR', qty: '20 Boxes', remarks: 'Good Condition' },
      ]);
      showToast('ডেলিভারি চালান ফরম্যাট লোড করা হয়েছে।', 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="doc-builder-container font-sans">
      {/* Top Controls Bar (Hidden during Print) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl space-y-4 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-[#c89348]" />
              <span>ইনভয়েস, কোটেশন, চালান ও ভাউচার বিল্ডার</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              যেকোনো কলাম ও রো এডিট করুন, প্রডাক্ট বাড়ান/কমান এবং প্যাডে প্রিন্ট করার জন্য হেডার-ফুটার নিয়ন্ত্রণ করুন
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => loadPreset('SAMORITA')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900 transition-colors"
            >
              সমরিতা কোটেশন লোড
            </button>

            <button
              type="button"
              onClick={() => loadPreset('STANDARD_INVOICE')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-950/80 border border-sky-700/60 text-sky-300 hover:bg-sky-900 transition-colors"
            >
              ট্যাক্স ইনভয়েস লোড
            </button>

            <button
              type="button"
              onClick={() => loadPreset('CHALLAN')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/80 border border-amber-700/60 text-amber-300 hover:bg-amber-900 transition-colors"
            >
              ডেলিভারি চালান লোড
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e3932] hover:bg-[#284c43] text-white flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#e6b980]" />
              <span>প্রিন্ট / PDF ডাউনলোড</span>
            </button>
          </div>
        </div>

        {/* Pad Print Mode Switch & Row/Column Modifiers */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Pad mode switch */}
          <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950 border border-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPadPrintMode}
              onChange={(e) => setIsPadPrintMode(e.target.checked)}
              className="w-4 h-4 accent-[#1e3932] rounded cursor-pointer"
            />
            <span className="font-semibold text-amber-300">
              অফিসিয়াল প্যাডে প্রিন্ট মোড (হেডার ও ফুটার ছাড়া)
            </span>
            <span className="text-[10px] text-slate-400">
              {isPadPrintMode ? '— প্যাডের জন্য টপ স্পেস রেখে প্রিন্ট হবে' : '— কোম্পানির পূর্ণাঙ্গ লেটারহেড সহ'}
            </span>
          </label>

          {/* Add Row & Column buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>নতুন রো (Row) যোগ করুন</span>
            </button>

            {!isAddingCol ? (
              <button
                type="button"
                onClick={() => setIsAddingCol(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                <span>নতুন কলাম (Column) যোগ করুন</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg">
                <input
                  type="text"
                  placeholder="কলামের নাম..."
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none w-36"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCol(false)}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PRINTABLE SHEET AREA ────────────────────────────────────── */}
      <div
        className={`printable-sheet bg-white text-slate-900 rounded-xl shadow-2xl p-8 sm:p-12 max-w-[900px] mx-auto border border-slate-200 transition-all ${
          isPadPrintMode ? 'pad-mode' : 'standard-mode'
        }`}
      >
        {/* Full Company Header (Hidden when isPadPrintMode is active) */}
        {!isPadPrintMode && (
          <header className="border-b-2 border-[#1e3932] pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-[#1e3932] tracking-wide font-serif">
                  SUN BIRD CORPORATION
                </h1>
                <p className="text-xs font-semibold text-[#c89348] tracking-widest uppercase mt-0.5">
                  All Kinds of Medical Equipment & Hospital Supplier
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  House: 42, Road: 11, Block-E, Banani, Dhaka-1213 | DGDA Reg: 2024-8841 | BIN: 002491823-0101
                </p>
              </div>
              <div className="text-right text-xs text-slate-600 space-y-0.5">
                <p className="font-semibold text-slate-900">হটলাইন: +880 1711-000000</p>
                <p>ইমেইল: info@sunbirdcorp.com</p>
                <p>ওয়েব: www.sunbirdcorp.com</p>
              </div>
            </div>
          </header>
        )}

        {/* Spacer for pre-printed letterhead pad */}
        {isPadPrintMode && <div className="pad-top-spacer h-28 hidden-screen" />}

        {/* Date & Document Info */}
        <div className="flex items-center justify-between text-xs mb-4">
          <div className="font-mono text-slate-500 font-semibold">
            স্মারক নং / Ref: <span className="text-slate-800">{docNumber}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">Date:</span>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-b border-dotted border-slate-400 font-mono text-xs px-1 py-0.5 text-slate-800 outline-none w-28 bg-transparent"
            />
          </div>
        </div>

        {/* Recipient Details (Directly Editable) */}
        <div className="space-y-1 text-xs mb-4">
          <p className="font-bold text-slate-800">To,</p>
          <div className="space-y-0.5">
            <input
              type="text"
              value={recipientTitle}
              onChange={(e) => setRecipientTitle(e.target.value)}
              className="w-full font-semibold border-b border-transparent hover:border-slate-300 focus:border-[#1e3932] outline-none px-1 py-0.5 text-xs bg-transparent"
              placeholder="Designation (e.g. Managing Director)"
            />
            <input
              type="text"
              value={recipientCompany}
              onChange={(e) => setRecipientCompany(e.target.value)}
              className="w-full font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-[#1e3932] outline-none px-1 py-0.5 text-sm bg-transparent"
              placeholder="Hospital / Company Name"
            />
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full text-slate-600 border-b border-transparent hover:border-slate-300 focus:border-[#1e3932] outline-none px-1 py-0.5 text-xs bg-transparent"
              placeholder="Address (e.g. 89/1, Panthapath, Dhaka-1215)"
            />
          </div>
        </div>

        {/* Subject & Salutation */}
        <div className="space-y-2 mb-4 text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-slate-800">Subject:</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 font-bold underline border-b border-transparent hover:border-slate-300 focus:border-[#1e3932] outline-none px-1 py-0.5 bg-transparent"
            />
          </div>
          <div>
            <input
              type="text"
              value={salutation}
              onChange={(e) => setSalutation(e.target.value)}
              className="font-bold border-b border-transparent hover:border-slate-300 focus:border-[#1e3932] outline-none px-1 py-0.5 bg-transparent"
            />
          </div>
          <div>
            <textarea
              rows={2}
              value={openingText}
              onChange={(e) => setOpeningText(e.target.value)}
              className="w-full text-slate-700 border border-transparent hover:border-slate-200 focus:border-slate-300 rounded p-1 text-xs outline-none resize-none bg-transparent"
            />
          </div>
        </div>

        {/* Dynamic Editable Table */}
        <div className="overflow-x-auto border border-slate-700 mb-6">
          <table className="w-full text-xs text-slate-800 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-700 text-slate-900 font-bold">
                {columns.map((col) => (
                  <th
                    key={col.id}
                    style={{ width: col.width }}
                    className="p-2 border-r border-slate-400 last:border-r-0 relative group text-center"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        onClick={() => handleRenameColumn(col.id, col.label)}
                        className="cursor-pointer hover:underline text-left"
                        title="ক্লিক করে নাম এডিট করুন"
                      >
                        {col.label}
                      </span>
                      {col.isDeletable && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(col.id)}
                          className="no-print text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          title="এই কলামটি ডিলিট করুন"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="no-print p-2 w-12 text-center bg-slate-200">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-slate-300 last:border-b-0 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className="p-1.5 border-r border-slate-300 last:border-r-0"
                      style={{ textAlign: col.align || 'left' }}
                    >
                      <input
                        type="text"
                        value={row[col.field] ?? ''}
                        onChange={(e) => handleCellChange(row.id, col.field, e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1e3932] rounded px-1 py-0.5 outline-none font-sans"
                        style={{ textAlign: col.align || 'left' }}
                      />
                    </td>
                  ))}
                  <td className="no-print p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                      title="এই রো মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Terms & Conditions */}
        <div className="space-y-1.5 text-xs mb-8">
          <p className="font-bold text-slate-800">Terms & Condition:-</p>
          <div className="space-y-1 pl-1">
            {terms.map((term, tIdx) => (
              <div key={tIdx} className="flex items-start gap-1">
                <span className="font-semibold text-slate-700">{tIdx + 1}.</span>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => {
                    const newTerms = [...terms];
                    newTerms[tIdx] = e.target.value;
                    setTerms(newTerms);
                  }}
                  className="flex-1 border-b border-transparent hover:border-slate-200 focus:border-slate-400 outline-none text-xs text-slate-700 bg-transparent px-1 py-0.5"
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-600 pt-2">
            If you need any further assistance please don&apos;t hesitate to contact us. Thanking and assuring you of our best services at all the time.
          </p>
          <p className="text-[11px] text-slate-700 font-semibold pt-1">
            Thank you for your time and consideration.
          </p>
        </div>

        {/* Signatory Area */}
        <div className="pt-6 flex justify-between items-end text-xs">
          <div>
            <p className="text-slate-600 mb-6">Kind regards,</p>
            <div className="space-y-0.5">
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-[#1e3932] outline-none px-1 py-0.5 text-sm bg-transparent"
              />
              <input
                type="text"
                value={signatoryDesignation}
                onChange={(e) => setSignatoryDesignation(e.target.value)}
                className="block text-slate-700 border-b border-transparent hover:border-slate-300 focus:border-[#1e3932] outline-none px-1 py-0.5 text-xs bg-transparent"
              />
              <input
                type="text"
                value={signatoryCompany}
                onChange={(e) => setSignatoryCompany(e.target.value)}
                className="block font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-[#1e3932] outline-none px-1 py-0.5 text-xs bg-transparent"
              />
              <input
                type="text"
                value={`Mobile: ${signatoryPhone}`}
                onChange={(e) => setSignatoryPhone(e.target.value.replace('Mobile: ', ''))}
                className="block font-mono text-slate-700 border-b border-transparent hover:border-slate-300 focus:border-[#1e3932] outline-none px-1 py-0.5 text-xs bg-transparent"
              />
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="w-36 border-b border-slate-400 mb-1" />
            <p className="text-[11px] text-slate-500 font-medium">কর্তৃপক্ষের স্বাক্ষর ও সিল</p>
          </div>
        </div>

        {/* Full Footer (Hidden when isPadPrintMode is active) */}
        {!isPadPrintMode && (
          <footer className="mt-12 pt-3 border-t border-slate-300 text-[10px] text-slate-500 text-center space-y-0.5">
            <p>House: 42, Road: 11, Block-E, Banani, Dhaka-1213 | Phone: +880 1711-000000 | Email: sales@sunbirdcorp.com</p>
            <p className="font-mono text-slate-400">Sun Bird Corporation — DGDA Authorized Medical Devices & Healthcare Equipment</p>
          </footer>
        )}
      </div>
    </div>
  );
}

export default ErpDocumentBuilderView;

