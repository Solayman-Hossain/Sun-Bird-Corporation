'use client';

import React, { useState, useEffect, useMemo } from 'react';
import './ErpDocumentManagementView.css';
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
  Layers,
  FileCheck,
  Receipt,
  FileSpreadsheet,
  FilePlus,
  Copy,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  Stamp,
  PenTool,
  Bookmark,
  Hash,
  Activity,
  ChevronRight,
  RefreshCw,
  Printer as PrintIcon,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  DocumentSubmodule,
  DocumentTypeEnum,
  TemplateColumn,
  DocumentTemplateItem,
  SalesQuotationItem,
  ProformaInvoiceItem,
  MoneyReceiptDocItem,
  CreditNoteDocItem,
} from '../../types';
import { documentManagementService } from '../../services/documentManagement.service';
import { organizationService } from '../../services/organization.service';

export const ErpDocumentManagementView: React.FC = () => {
  const { showToast } = useToast();

  // Navigation state
  const [activeSubmodule, setActiveSubmodule] = useState<DocumentSubmodule>('doc-dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<{
    metrics?: {
      totalQuotations: number;
      totalProformas: number;
      totalInvoices: number;
      totalChallans: number;
      totalReceipts: number;
      totalCreditNotes: number;
      totalPurchaseOrders: number;
      totalPurchaseInvoices: number;
      totalTemplates: number;
    };
    recentQuotations?: SalesQuotationItem[];
  }>({
    recentQuotations: [],
  });

  // Document Lists
  const [quotations, setQuotations] = useState<SalesQuotationItem[]>([]);
  const [proformas, setProformas] = useState<ProformaInvoiceItem[]>([]);
  const [receipts, setReceipts] = useState<MoneyReceiptDocItem[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNoteDocItem[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplateItem[]>([]);

  // Selected Template for Builder
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateItem | null>(null);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(null);

  // Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewDocType, setPreviewDocType] = useState<string>('SALES_QUOTATION');

  // New Document Modals
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);

  // Prerender safe date state
  const [formattedDate, setFormattedDate] = useState('2026-11-18');

  // Forms State
  const [newQuotation, setNewQuotation] = useState({
    quotationNumber: 'QUO-2026-00001',
    title: 'Commercial Supply Quotation',
    customerName: 'Samorita Hospital Ltd.',
    customerAddress: '89/1 Panthapath, Dhaka-1205',
    items: [
      { description: 'Premium Medical Gauze Bandage', quantity: 500, unitPrice: 120, discount: 0, vatPercent: 5 },
      { description: 'Surgical Disposable Gloves (Box of 100)', quantity: 200, unitPrice: 650, discount: 5, vatPercent: 5 },
    ],
    terms: '1. Validity: 30 Days\n2. Payment: 30 days after invoice\n3. Delivery: Within 7 working days',
    notes: 'Thank you for your business inquiry.',
  });

  const [newReceipt, setNewReceipt] = useState({
    customerName: 'Dhaka Central Clinic',
    amount: 75000,
    paymentMethod: 'CHEQUE',
    chequeNumber: 'CHQ-981245',
    bankName: 'Islami Bank Bangladesh Ltd.',
    particulars: 'Advance against surgical equipment supply Order #SB-2026-90',
  });

  const [newCreditNote, setNewCreditNote] = useState({
    customerName: 'Popular Diagnostic Center',
    reason: 'Damaged packaging during transit - return credit adjustment',
    items: [
      { description: 'Damaged Gauze Pack 10cm x 5m', quantity: 20, unitPrice: 150, taxRate: 5 },
    ],
    note: 'Adjustable against next invoice billing.',
  });

  // Organization Branding State
  const [brandingState, setBrandingState] = useState({
    companyName: 'SUN BIRD CORPORATION',
    tagline: 'Leading Importer & Supplier of Medical Equipment',
    primaryColor: '#1e3932',
    secondaryColor: '#c89348',
    fontFamily: 'Helvetica',
    headerStyle: 'STANDARD',
    showBinVat: true,
    binNumber: '003498214-0101',
    address: 'Suit #402, Green Road Commercial Complex, Dhanmondi, Dhaka-1205',
    phone: '+880 1711-000000',
    email: 'info@sunbirdcorp.com',
    website: 'https://sunbirdcorp.com',
  });

  // Load Initial Data
  useEffect(() => {
    setFormattedDate(new Date().toLocaleDateString());
    fetchDashboard();
    fetchTemplates();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await documentManagementService.getDashboard();
      if (res.success && res.data) {
        setDashboardData(res.data);
        if (res.data.recentQuotations) {
          setQuotations(res.data.recentQuotations);
        }
      }
    } catch (err: any) {
      console.warn('Dashboard fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await documentManagementService.listTemplates({});
      if (res.success && res.items) {
        setTemplates(res.items);
        if (res.items.length > 0 && !selectedTemplate) {
          setSelectedTemplate(res.items[0]);
        }
      }
    } catch (err) {
      console.warn('Templates fetch notice');
    }
  };

  const loadSubmoduleData = async (sub: DocumentSubmodule) => {
    setActiveSubmodule(sub);
    setSearchTerm('');
    try {
      if (sub === 'doc-quotations') {
        const res = await documentManagementService.listQuotations({});
        if (res.success && res.items) setQuotations(res.items);
      } else if (sub === 'doc-proformas') {
        const res = await documentManagementService.listProformas({});
        if (res.success && res.items) setProformas(res.items);
      } else if (sub === 'doc-receipts') {
        const res = await documentManagementService.listReceipts({});
        if (res.success && res.items) setReceipts(res.items);
      } else if (sub === 'doc-credit-notes') {
        const res = await documentManagementService.listCreditNotes({});
        if (res.success && res.items) setCreditNotes(res.items);
      } else if (sub === 'doc-template-builder') {
        fetchTemplates();
      }
    } catch (err: any) {
      console.warn('Submodule load notice:', err.message);
    }
  };

  // Seed default templates
  const handleSeedTemplates = async () => {
    try {
      setLoading(true);
      const res = await documentManagementService.seedDefaultTemplates();
      if (res.success) {
        showToast('Default Document Templates seeded successfully!', 'success');
        fetchTemplates();
        fetchDashboard();
      }
    } catch (err: any) {
      showToast(err.message || 'Error seeding templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Template in Builder
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setLoading(true);
      const res = await documentManagementService.updateTemplate(selectedTemplate._id, selectedTemplate);
      if (res.success) {
        showToast(`Template "${selectedTemplate.name}" saved successfully!`, 'success');
        fetchTemplates();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save template', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Duplicate Template
  const handleDuplicateTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setLoading(true);
      const res = await documentManagementService.duplicateTemplate(selectedTemplate._id);
      if (res.success) {
        showToast('Template duplicated successfully!', 'success');
        fetchTemplates();
        setSelectedTemplate(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to duplicate template', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Column in Canvas
  const handleAddColumn = () => {
    if (!selectedTemplate) return;
    const newCol: TemplateColumn = {
      id: `col_${Date.now()}`,
      label: 'New Column',
      field: `custom_${Date.now()}`,
      width: '100px',
      align: 'left',
      visible: true,
      isDeletable: true,
    };
    const updated = {
      ...selectedTemplate,
      tableDefinition: {
        ...selectedTemplate.tableDefinition,
        columns: [...selectedTemplate.tableDefinition.columns, newCol],
      },
    };
    setSelectedTemplate(updated);
    setSelectedColumnIndex(updated.tableDefinition.columns.length - 1);
    showToast('Column added. Customize properties on the right panel.', 'info');
  };

  // Handle Remove Column
  const handleRemoveColumn = (idx: number) => {
    if (!selectedTemplate) return;
    const cols = [...selectedTemplate.tableDefinition.columns];
    cols.splice(idx, 1);
    setSelectedTemplate({
      ...selectedTemplate,
      tableDefinition: {
        ...selectedTemplate.tableDefinition,
        columns: cols,
      },
    });
    setSelectedColumnIndex(null);
  };

  // Handle Create Quotation
  const handleCreateQuotation = async () => {
    try {
      setLoading(true);
      const res = await documentManagementService.createQuotation(newQuotation);
      if (res.success) {
        showToast('Sales Quotation created successfully!', 'success');
        setShowQuotationModal(false);
        loadSubmoduleData('doc-quotations');
        fetchDashboard();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create quotation', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Receipt
  const handleCreateReceipt = async () => {
    try {
      setLoading(true);
      const res = await documentManagementService.createReceipt(newReceipt);
      if (res.success) {
        showToast('Money Receipt recorded successfully!', 'success');
        setShowReceiptModal(false);
        loadSubmoduleData('doc-receipts');
        fetchDashboard();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create receipt', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Post Receipt to GL
  const handlePostReceipt = async (id: string) => {
    try {
      setLoading(true);
      const res = await documentManagementService.postReceipt(id);
      if (res.success) {
        showToast(`Money Receipt posted to General Ledger (${res.data.journalEntryId || 'Posted'})!`, 'success');
        loadSubmoduleData('doc-receipts');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to post receipt', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Credit Note
  const handleCreateCreditNote = async () => {
    try {
      setLoading(true);
      const res = await documentManagementService.createCreditNote(newCreditNote);
      if (res.success) {
        showToast('Credit Note created successfully!', 'success');
        setShowCreditNoteModal(false);
        loadSubmoduleData('doc-credit-notes');
        fetchDashboard();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create credit note', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Post Credit Note to GL
  const handlePostCreditNote = async (id: string) => {
    try {
      setLoading(true);
      const res = await documentManagementService.postCreditNote(id);
      if (res.success) {
        showToast(`Credit Note posted to General Ledger (${res.data.journalEntryId || 'Posted'})!`, 'success');
        loadSubmoduleData('doc-credit-notes');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to post credit note', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Preview Document Trigger
  const handleOpenPreview = async (docType: string, doc: any) => {
    setPreviewDocType(docType);
    setLoading(true);
    try {
      const res = await documentManagementService.previewDocument(docType, doc._id);
      if (res.success) {
        setPreviewData(res.data);
        setPreviewModalOpen(true);
      } else {
        // Fallback to local snapshot
        setPreviewData(doc);
        setPreviewModalOpen(true);
      }
    } catch (err: any) {
      setPreviewData(doc);
      setPreviewModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Submodule navigation list (18 modules)
  const navItems: { id: DocumentSubmodule; label: string; icon: any; count?: number }[] = [
    { id: 'doc-dashboard', label: '01. Document Dashboard', icon: FileSpreadsheet },
    { id: 'doc-quotations', label: '02. Sales Quotation', icon: FilePlus, count: quotations.length },
    { id: 'doc-proformas', label: '03. Proforma Invoice', icon: FileText, count: proformas.length },
    { id: 'doc-sales-invoices', label: '04. Sales Invoice', icon: Receipt, count: dashboardData.metrics?.totalInvoices || 0 },
    { id: 'doc-challans', label: '05. Delivery Challan', icon: Package, count: dashboardData.metrics?.totalChallans || 0 },
    { id: 'doc-receipts', label: '06. Money Receipt', icon: DollarSign, count: receipts.length },
    { id: 'doc-credit-notes', label: '07. Credit Note', icon: RotateCcw, count: creditNotes.length },
    { id: 'doc-purchase-orders', label: '08. Purchase Order', icon: Layers, count: dashboardData.metrics?.totalPurchaseOrders || 0 },
    { id: 'doc-purchase-invoices', label: '09. Purchase Invoice', icon: FileCheck, count: dashboardData.metrics?.totalPurchaseInvoices || 0 },
    { id: 'doc-template-builder', label: '10. Document Template Builder', icon: Edit2, count: templates.length },
    { id: 'doc-branding', label: '11. Document Branding', icon: Sparkles },
    { id: 'doc-letterheads', label: '12. Logo & Letterhead', icon: Building },
    { id: 'doc-signatures', label: '13. Signature Management', icon: PenTool },
    { id: 'doc-seals', label: '14. Seal & Stamp Management', icon: Stamp },
    { id: 'doc-terms', label: '15. Terms & Conditions', icon: Bookmark },
    { id: 'doc-print-settings', label: '16. Print & Paper Settings', icon: Printer },
    { id: 'doc-numbering', label: '17. Document Numbering', icon: Hash },
    { id: 'doc-activity-logs', label: '18. Document Activity Logs', icon: Activity },
  ];

  return (
    <div className="erp-doc-container">
      {/* Top Header */}
      <div className="erp-doc-header">
        <div>
          <div className="erp-doc-title">
            <FileSpreadsheet className="w-6 h-6 text-[#c89348]" />
            MODULE 07 — Complete Document Management & Dynamic Template Builder
            <span className="erp-doc-badge">Production Engine</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enterprise Automated Document Engine • Multi-template Layouts • BDT Currency Words • PDFKit & Browser Printing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedTemplates}
            disabled={loading}
            className="erp-doc-btn erp-doc-btn-secondary text-xs flex items-center gap-1.5"
            title="Seed standard templates for Quotation, Invoice, PO, Money Receipt"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c89348]" />
            Seed Standard Templates
          </button>
          <button
            onClick={() => setShowQuotationModal(true)}
            className="erp-doc-btn erp-doc-btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Sales Quotation
          </button>
        </div>
      </div>

      {/* Main Layout: Submodule Tabs Bar + Content Body */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Navigation Sidebar (18 Submodules) */}
        <aside className="w-full lg:w-64 bg-white border border-gray-200 rounded-xl p-3 shadow-sm shrink-0">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
            Document Submodules
          </div>
          <nav className="flex flex-col gap-1 max-h-[75vh] overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSubmodule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => loadSubmoduleData(item.id)}
                  className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-[#1e3932] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#c89348]' : 'text-gray-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                        isActive ? 'bg-[#c89348] text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Submodule View Area */}
        <main className="flex-1 w-full bg-transparent min-w-0">
          {/* ========================================================================= */}
          {/* SUBMODULE 01: DOCUMENT DASHBOARD */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-dashboard' && (
            <div className="space-y-6">
              {/* Metric KPI Cards */}
              <div className="erp-doc-kpi-grid">
                <div className="erp-doc-kpi-card">
                  <div className="erp-doc-kpi-label">Sales Quotations</div>
                  <div className="erp-doc-kpi-value">{dashboardData.metrics?.totalQuotations ?? quotations.length}</div>
                  <div className="erp-doc-kpi-trend text-blue-600">Pending & Approved</div>
                </div>
                <div className="erp-doc-kpi-card">
                  <div className="erp-doc-kpi-label">Proforma Invoices</div>
                  <div className="erp-doc-kpi-value">{dashboardData.metrics?.totalProformas ?? proformas.length}</div>
                  <div className="erp-doc-kpi-trend text-purple-600">Converted Orders</div>
                </div>
                <div className="erp-doc-kpi-card">
                  <div className="erp-doc-kpi-label">Sales Invoices</div>
                  <div className="erp-doc-kpi-value">{dashboardData.metrics?.totalInvoices ?? 0}</div>
                  <div className="erp-doc-kpi-trend text-green-600">Billed Documents</div>
                </div>
                <div className="erp-doc-kpi-card">
                  <div className="erp-doc-kpi-label">Delivery Challans</div>
                  <div className="erp-doc-kpi-value">{dashboardData.metrics?.totalChallans ?? 0}</div>
                  <div className="erp-doc-kpi-trend text-indigo-600">Goods Dispatched</div>
                </div>
                <div className="erp-doc-kpi-card">
                  <div className="erp-doc-kpi-label">Money Receipts</div>
                  <div className="erp-doc-kpi-value">{dashboardData.metrics?.totalReceipts ?? receipts.length}</div>
                  <div className="erp-doc-kpi-trend text-emerald-600">Collections Recorded</div>
                </div>
                <div className="erp-doc-kpi-card">
                  <div className="erp-doc-kpi-label">Credit Notes</div>
                  <div className="erp-doc-kpi-value">{dashboardData.metrics?.totalCreditNotes ?? creditNotes.length}</div>
                  <div className="erp-doc-kpi-trend text-amber-600">Returns & Adjustments</div>
                </div>
                <div className="erp-doc-kpi-card">
                  <div className="erp-doc-kpi-label">Purchase Orders</div>
                  <div className="erp-doc-kpi-value">{dashboardData.metrics?.totalPurchaseOrders ?? 0}</div>
                  <div className="erp-doc-kpi-trend text-teal-600">Supplier Orders</div>
                </div>
                <div className="erp-doc-kpi-card">
                  <div className="erp-doc-kpi-label">Purchase Invoices</div>
                  <div className="erp-doc-kpi-value">{dashboardData.metrics?.totalPurchaseInvoices ?? 0}</div>
                  <div className="erp-doc-kpi-trend text-cyan-600">Vendor Bills</div>
                </div>
                <div className="erp-doc-kpi-card" style={{ borderLeft: '4px solid #c89348' }}>
                  <div className="erp-doc-kpi-label">Document Templates</div>
                  <div className="erp-doc-kpi-value">{dashboardData.metrics?.totalTemplates ?? templates.length}</div>
                  <div className="erp-doc-kpi-trend text-[#c89348]">Dynamic Visual Layouts</div>
                </div>
              </div>

              {/* Quick Actions & Recent Quotations */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1e3932]" />
                    Recent Commercial Documents
                  </h3>
                  <button
                    onClick={() => loadSubmoduleData('doc-quotations')}
                    className="text-xs text-[#1e3932] font-semibold hover:underline flex items-center gap-1"
                  >
                    View All Quotations <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="erp-doc-table-container">
                  <table className="erp-doc-table">
                    <thead>
                      <tr>
                        <th>Doc Number</th>
                        <th>Type</th>
                        <th>Client / Vendor</th>
                        <th>Date</th>
                        <th>Grand Total</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-gray-400">
                            No recent documents recorded yet. Click &quot;New Sales Quotation&quot; or &quot;Seed Standard Templates&quot;.
                          </td>
                        </tr>
                      ) : (
                        quotations.slice(0, 5).map((q) => (
                          <tr key={q._id}>
                            <td className="font-semibold text-[#1e3932]">{q.quotationNumber}</td>
                            <td>
                              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                Quotation
                              </span>
                            </td>
                            <td>{q.customerName || (typeof q.customerId === 'object' ? q.customerId?.fullName : 'N/A')}</td>
                            <td>{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : formattedDate}</td>
                            <td className="font-bold text-gray-900">৳{q.grandTotal?.toLocaleString()}</td>
                            <td>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  q.status === 'APPROVED' || q.status === 'ACCEPTED'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {q.status}
                              </span>
                            </td>
                            <td className="text-right">
                              <button
                                onClick={() => handleOpenPreview('SALES_QUOTATION', q)}
                                className="erp-doc-btn erp-doc-btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3 text-[#1e3932]" />
                                Preview
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 02: SALES QUOTATION */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-quotations' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <FilePlus className="w-4 h-4 text-[#1e3932]" />
                    Sales Quotation Management
                  </h3>
                  <p className="text-xs text-gray-500">Commercial pricing, client terms, discount breakdowns, and bilingual currency words.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQuotationModal(true)}
                    className="erp-doc-btn erp-doc-btn-primary text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Quotation
                  </button>
                </div>
              </div>

              {/* Filter / Search Bar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search quotations by number, customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="erp-doc-input pl-8 text-xs py-1.5 w-full"
                  />
                </div>
              </div>

              {/* Quotations Table */}
              <div className="erp-doc-table-container">
                <table className="erp-doc-table">
                  <thead>
                    <tr>
                      <th>Quotation #</th>
                      <th>Title</th>
                      <th>Client</th>
                      <th>Items</th>
                      <th>Subtotal</th>
                      <th>Tax</th>
                      <th>Grand Total</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-6 text-gray-400">
                          No quotations found. Click &quot;New Quotation&quot; to issue your first commercial price offer.
                        </td>
                      </tr>
                    ) : (
                      quotations
                        .filter((q) =>
                          q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.customerName && q.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map((q) => (
                          <tr key={q._id}>
                            <td className="font-bold text-[#1e3932]">{q.quotationNumber}</td>
                            <td className="text-gray-700">{q.title || 'Price Quotation'}</td>
                            <td>{q.customerName || (typeof q.customerId === 'object' ? q.customerId?.fullName : 'N/A')}</td>
                            <td>{q.items?.length || 0}</td>
                            <td>৳{q.subtotal?.toLocaleString()}</td>
                            <td>৳{q.taxAmount?.toLocaleString()}</td>
                            <td className="font-bold text-gray-900">৳{q.grandTotal?.toLocaleString()}</td>
                            <td>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  q.status === 'APPROVED'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {q.status}
                              </span>
                            </td>
                            <td className="text-right flex items-center justify-end gap-1.5">
                              {q.status === 'DRAFT' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await documentManagementService.approveQuotation(q._id);
                                      showToast(`Quotation ${q.quotationNumber} approved!`, 'success');
                                      loadSubmoduleData('doc-quotations');
                                    } catch (err: any) {
                                      showToast(err.message, 'error');
                                    }
                                  }}
                                  className="erp-doc-btn erp-doc-btn-secondary text-[11px] py-1 px-2 text-green-700 border-green-200"
                                  title="Approve Quotation"
                                >
                                  <ShieldCheck className="w-3 h-3 text-green-600" />
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenPreview('SALES_QUOTATION', q)}
                                className="erp-doc-btn erp-doc-btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3 text-[#1e3932]" />
                                Preview & Print
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 03: PROFORMA INVOICE */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-proformas' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1e3932]" />
                    Proforma Invoices (PI)
                  </h3>
                  <p className="text-xs text-gray-500">Commercial proforma invoices with payment terms, LC instructions, and advance requisitions.</p>
                </div>
              </div>

              <div className="erp-doc-table-container">
                <table className="erp-doc-table">
                  <thead>
                    <tr>
                      <th>PI Number</th>
                      <th>Customer</th>
                      <th>Payment Terms</th>
                      <th>Delivery Terms</th>
                      <th>Subtotal</th>
                      <th>Grand Total</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proformas.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-gray-400">
                          No proforma invoices found. Proformas are generated from approved quotations or directly.
                        </td>
                      </tr>
                    ) : (
                      proformas.map((pi) => (
                        <tr key={pi._id}>
                          <td className="font-bold text-[#1e3932]">{pi.proformaNumber}</td>
                          <td>{pi.customerName || 'N/A'}</td>
                          <td>{pi.paymentTerms || '30 Days Net'}</td>
                          <td>{pi.deliveryTerms || 'Standard Courier'}</td>
                          <td>৳{pi.subtotal?.toLocaleString()}</td>
                          <td className="font-bold text-gray-900">৳{pi.grandTotal?.toLocaleString()}</td>
                          <td>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {pi.status}
                            </span>
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => handleOpenPreview('PROFORMA_INVOICE', pi)}
                              className="erp-doc-btn erp-doc-btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-[#1e3932]" />
                              Preview & Print
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 04: SALES INVOICE */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-sales-invoices' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#1e3932]" />
                    Sales Invoices
                  </h3>
                  <p className="text-xs text-gray-500">Official tax invoices compliant with NBR Musak 6.3 standards and ERP accounting records.</p>
                </div>
              </div>
              <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Receipt className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-700">Centralized Sales Invoices Integration</p>
                <p className="text-xs text-gray-500 mt-1">
                  Sales invoices generated from Module 05 (Order Processing) and POS are resolved by the Central Document Engine using your Standard Tax Invoice Template.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 05: DELIVERY CHALLAN */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-challans' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#1e3932]" />
                    Delivery Challans
                  </h3>
                  <p className="text-xs text-gray-500">Goods delivery receipts, gate passes, vehicle numbers, and receiving sign-offs.</p>
                </div>
              </div>
              <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-700">Warehouse Delivery Challan Engine</p>
                <p className="text-xs text-gray-500 mt-1">
                  Challans dispatched from Module 06 (Inventory & Dispatch) utilize the Delivery Challan Template with carrier & driver signatures.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 06: MONEY RECEIPT */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-receipts' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#1e3932]" />
                    Money Receipt Management
                  </h3>
                  <p className="text-xs text-gray-500">Collections, cheque & bank particulars, automatic GL journal posting, and official receipts.</p>
                </div>
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="erp-doc-btn erp-doc-btn-primary text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Money Receipt
                </button>
              </div>

              <div className="erp-doc-table-container">
                <table className="erp-doc-table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Customer</th>
                      <th>Method</th>
                      <th>Bank / Cheque</th>
                      <th>Amount Received</th>
                      <th>GL Journal</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-gray-400">
                          No money receipts recorded yet. Click &quot;New Money Receipt&quot; to log incoming payment.
                        </td>
                      </tr>
                    ) : (
                      receipts.map((mr) => (
                        <tr key={mr._id}>
                          <td className="font-bold text-[#1e3932]">{mr.receiptNumber}</td>
                          <td>{mr.customerName}</td>
                          <td>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                              {mr.paymentMethod}
                            </span>
                          </td>
                          <td className="text-xs text-gray-600">
                            {mr.bankName || 'Cash'} {mr.chequeNumber ? `(${mr.chequeNumber})` : ''}
                          </td>
                          <td className="font-bold text-emerald-700">৳{mr.amount?.toLocaleString()}</td>
                          <td>
                            {mr.isPosted ? (
                              <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                                Posted
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                Unposted
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                mr.status === 'POSTED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {mr.status}
                            </span>
                          </td>
                          <td className="text-right flex items-center justify-end gap-1.5">
                            {!mr.isPosted && (
                              <button
                                onClick={() => handlePostReceipt(mr._id)}
                                className="erp-doc-btn erp-doc-btn-secondary text-[11px] py-1 px-2 text-green-700 border-green-200"
                                title="Post to General Ledger"
                              >
                                Post GL
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenPreview('MONEY_RECEIPT', mr)}
                              className="erp-doc-btn erp-doc-btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-[#1e3932]" />
                              Preview & Print
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 07: CREDIT NOTE */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-credit-notes' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-[#1e3932]" />
                    Credit Note Management
                  </h3>
                  <p className="text-xs text-gray-500">Sales returns, price reductions, damaged good adjustments with General Ledger integration.</p>
                </div>
                <button
                  onClick={() => setShowCreditNoteModal(true)}
                  className="erp-doc-btn erp-doc-btn-primary text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Credit Note
                </button>
              </div>

              <div className="erp-doc-table-container">
                <table className="erp-doc-table">
                  <thead>
                    <tr>
                      <th>Credit Note #</th>
                      <th>Customer</th>
                      <th>Reason</th>
                      <th>Subtotal</th>
                      <th>Grand Total</th>
                      <th>GL Journal</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditNotes.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-gray-400">
                          No credit notes recorded yet. Click &quot;New Credit Note&quot; to issue a sales adjustment.
                        </td>
                      </tr>
                    ) : (
                      creditNotes.map((cn) => (
                        <tr key={cn._id}>
                          <td className="font-bold text-[#1e3932]">{cn.creditNoteNumber}</td>
                          <td>{cn.customerName}</td>
                          <td className="text-xs text-gray-600 truncate max-w-xs">{cn.reason}</td>
                          <td>৳{cn.subtotal?.toLocaleString()}</td>
                          <td className="font-bold text-red-600">৳{cn.grandTotal?.toLocaleString()}</td>
                          <td>
                            {cn.isPosted ? (
                              <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                                Posted
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                Unposted
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              {cn.status}
                            </span>
                          </td>
                          <td className="text-right flex items-center justify-end gap-1.5">
                            {!cn.isPosted && (
                              <button
                                onClick={() => handlePostCreditNote(cn._id)}
                                className="erp-doc-btn erp-doc-btn-secondary text-[11px] py-1 px-2 text-green-700 border-green-200"
                              >
                                Post GL
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenPreview('CREDIT_NOTE', cn)}
                              className="erp-doc-btn erp-doc-btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-[#1e3932]" />
                              Preview & Print
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 08: PURCHASE ORDER */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-purchase-orders' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#1e3932]" />
                    Purchase Orders (PO Layout Engine)
                  </h3>
                  <p className="text-xs text-gray-500">Official supplier orders with vendor terms, currency conversions, and authorized signatures.</p>
                </div>
              </div>
              <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Layers className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-700">Standard Purchase Order Architecture</p>
                <p className="text-xs text-gray-500 mt-1">
                  Purchase Orders from Procurement are formatted using the PO Template with item codes, manufacturer origins, and terms & conditions.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 09: PURCHASE INVOICE */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-purchase-invoices' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#1e3932]" />
                    Purchase Invoices (Vendor Bills)
                  </h3>
                  <p className="text-xs text-gray-500">Accounts payable vendor bills with matching GRN receipts and tax deductions.</p>
                </div>
              </div>
              <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileCheck className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-700">Vendor Invoicing Engine</p>
                <p className="text-xs text-gray-500 mt-1">
                  Purchase invoices are verified against GRN and purchase order data before automated document printing.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 10: DYNAMIC TEMPLATE BUILDER (3-PANEL VISUAL EDITOR) */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-template-builder' && (
            <div className="space-y-4">
              {/* Builder Header Bar */}
              <div className="erp-doc-builder-header">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-800 text-sm">Select Template:</span>
                  <select
                    className="erp-doc-select text-xs py-1 px-3"
                    value={selectedTemplate?._id || ''}
                    onChange={(e) => {
                      const t = templates.find((item) => item._id === e.target.value);
                      if (t) setSelectedTemplate(t);
                    }}
                  >
                    {templates.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.documentType}) {t.isDefault ? '★ Default' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDuplicateTemplate}
                    disabled={!selectedTemplate}
                    className="erp-doc-btn erp-doc-btn-secondary text-xs flex items-center gap-1.5"
                    title="Duplicate selected template"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-600" />
                    Duplicate
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!selectedTemplate || loading}
                    className="erp-doc-btn erp-doc-btn-primary text-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Template
                  </button>
                </div>
              </div>

              {/* 3-Panel Visual Builder Layout */}
              <div className="erp-doc-builder-layout">
                {/* LEFT PALETTE: Controls & Settings */}
                <div className="erp-doc-builder-sidebar">
                  <div className="erp-doc-builder-section-title">
                    <Sliders className="w-3.5 h-3.5 text-[#1e3932]" />
                    Page & Header Settings
                  </div>

                  {selectedTemplate && (
                    <div className="space-y-3">
                      <div>
                        <label className="erp-doc-label">Template Name</label>
                        <input
                          type="text"
                          className="erp-doc-input"
                          value={selectedTemplate.name}
                          onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="erp-doc-label">Paper Size</label>
                          <select
                            className="erp-doc-select"
                            value={selectedTemplate.paperSize}
                            onChange={(e) =>
                              setSelectedTemplate({
                                ...selectedTemplate,
                                paperSize: e.target.value as any,
                              })
                            }
                          >
                            <option value="A4">A4 (Standard)</option>
                            <option value="LETTER">Letter</option>
                            <option value="LEGAL">Legal</option>
                          </select>
                        </div>
                        <div>
                          <label className="erp-doc-label">Orientation</label>
                          <select
                            className="erp-doc-select"
                            value={selectedTemplate.orientation}
                            onChange={(e) =>
                              setSelectedTemplate({
                                ...selectedTemplate,
                                orientation: e.target.value as any,
                              })
                            }
                          >
                            <option value="PORTRAIT">Portrait</option>
                            <option value="LANDSCAPE">Landscape</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="erp-doc-label">Language / Words</label>
                        <select
                          className="erp-doc-select"
                          value={selectedTemplate.language}
                          onChange={(e) =>
                            setSelectedTemplate({
                              ...selectedTemplate,
                              language: e.target.value as any,
                            })
                          }
                        >
                          <option value="EN">English</option>
                          <option value="BN">Bangla</option>
                          <option value="BILINGUAL">Bilingual (EN + BN)</option>
                        </select>
                      </div>

                      <div className="border-t border-gray-100 pt-3 space-y-2">
                        <div className="erp-doc-builder-section-title">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1e3932]" />
                          Table Features
                        </div>

                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTemplate.tableDefinition?.showSubtotal ?? true}
                            onChange={(e) =>
                              setSelectedTemplate({
                                ...selectedTemplate,
                                tableDefinition: {
                                  ...selectedTemplate.tableDefinition,
                                  showSubtotal: e.target.checked,
                                },
                              })
                            }
                          />
                          Show Subtotal Row
                        </label>

                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTemplate.tableDefinition?.showDiscount ?? true}
                            onChange={(e) =>
                              setSelectedTemplate({
                                ...selectedTemplate,
                                tableDefinition: {
                                  ...selectedTemplate.tableDefinition,
                                  showDiscount: e.target.checked,
                                },
                              })
                            }
                          />
                          Show Discount Breakdown
                        </label>

                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTemplate.tableDefinition?.showTax ?? true}
                            onChange={(e) =>
                              setSelectedTemplate({
                                ...selectedTemplate,
                                tableDefinition: {
                                  ...selectedTemplate.tableDefinition,
                                  showTax: e.target.checked,
                                },
                              })
                            }
                          />
                          Show VAT / Tax Breakdown
                        </label>

                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTemplate.tableDefinition?.showAmountInWords ?? true}
                            onChange={(e) =>
                              setSelectedTemplate({
                                ...selectedTemplate,
                                tableDefinition: {
                                  ...selectedTemplate.tableDefinition,
                                  showAmountInWords: e.target.checked,
                                },
                              })
                            }
                          />
                          Show Amount in Words (BDT)
                        </label>
                      </div>

                      <div className="border-t border-gray-100 pt-3">
                        <button
                          type="button"
                          onClick={handleAddColumn}
                          className="w-full erp-doc-btn erp-doc-btn-secondary text-xs flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Custom Column
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CENTER: LIVE A4 DOCUMENT CANVAS */}
                <div className="erp-doc-builder-canvas-container">
                  {selectedTemplate ? (
                    <div className="erp-doc-a4-canvas">
                      {/* Document Header with Logo & Brand */}
                      <div className="erp-doc-a4-header">
                        <div>
                          <div className="erp-doc-a4-brand-name">{brandingState.companyName}</div>
                          <div className="erp-doc-a4-brand-sub">{brandingState.tagline}</div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            {brandingState.address} • Tel: {brandingState.phone}
                          </div>
                          {selectedTemplate.headerSettings?.showBinVat && (
                            <div className="text-[10px] font-semibold text-gray-700">
                              BIN: {brandingState.binNumber}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-base font-extrabold text-[#1e3932] uppercase">
                            {selectedTemplate.name || selectedTemplate.documentType}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono">
                            REF: {selectedTemplate.documentType.slice(0, 3)}-2026-00108
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Date: {formattedDate}
                          </div>
                        </div>
                      </div>

                      {/* Recipient Information Box */}
                      <div className="erp-doc-a4-info-grid">
                        <div className="erp-doc-a4-info-box">
                          <div className="erp-doc-a4-info-title">Issued To / Recipient</div>
                          <div className="text-xs font-bold text-gray-800">Samorita Hospital Ltd.</div>
                          <div className="text-[11px] text-gray-600">
                            89/1 Panthapath, Dhaka-1205, Bangladesh
                          </div>
                          <div className="text-[11px] text-gray-600">Attn: Procurement & Medical Supplies</div>
                        </div>
                        <div className="erp-doc-a4-info-box">
                          <div className="erp-doc-a4-info-title">Transaction Particulars</div>
                          <div className="text-[11px] text-gray-700">
                            <strong>Payment Terms:</strong> 30 Days Net
                          </div>
                          <div className="text-[11px] text-gray-700">
                            <strong>Delivery:</strong> Immediate Ex-Stock
                          </div>
                          <div className="text-[11px] text-gray-700">
                            <strong>Currency:</strong> BDT (Bangladeshi Taka)
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Columns Table with Column Selector */}
                      <table className="erp-doc-a4-table">
                        <thead>
                          <tr>
                            {selectedTemplate.tableDefinition?.columns?.map((col, idx) => (
                              <th
                                key={col.id || idx}
                                style={{
                                  width: col.width || 'auto',
                                  textAlign: col.align || 'left',
                                  cursor: 'pointer',
                                  backgroundColor: selectedColumnIndex === idx ? '#c89348' : undefined,
                                  color: selectedColumnIndex === idx ? '#ffffff' : undefined,
                                }}
                                onClick={() => setSelectedColumnIndex(idx)}
                                title="Click to edit column properties"
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Sample dynamic rows preview */}
                          <tr>
                            {selectedTemplate.tableDefinition?.columns?.map((col, idx) => {
                              let val: any = '—';
                              if (col.field === 'sl') val = '1';
                              else if (col.field === 'code') val = 'MED-GAZ-01';
                              else if (col.field === 'name' || col.field === 'description')
                                val = 'Premium Medical Gauze Bandage (10cm x 5m)';
                              else if (col.field === 'origin') val = 'South Korea';
                              else if (col.field === 'size') val = '10cm x 5m';
                              else if (col.field === 'quantity') val = '500';
                              else if (col.field === 'unitPrice' || col.field === 'rate') val = '৳120.00';
                              else if (col.field === 'total') val = '৳60,000.00';
                              else if (col.field === 'rateWord') val = 'One Hundred Twenty Taka Only';
                              else val = 'Sample';
                              return (
                                <td key={col.id || idx} style={{ textAlign: col.align || 'left' }}>
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                          <tr>
                            {selectedTemplate.tableDefinition?.columns?.map((col, idx) => {
                              let val: any = '—';
                              if (col.field === 'sl') val = '2';
                              else if (col.field === 'code') val = 'GLV-SUR-M';
                              else if (col.field === 'name' || col.field === 'description')
                                val = 'Surgical Disposable Gloves (Box of 100)';
                              else if (col.field === 'origin') val = 'Malaysia';
                              else if (col.field === 'size') val = 'Medium';
                              else if (col.field === 'quantity') val = '200';
                              else if (col.field === 'unitPrice' || col.field === 'rate') val = '৳650.00';
                              else if (col.field === 'total') val = '৳130,000.00';
                              else if (col.field === 'rateWord') val = 'Six Hundred Fifty Taka Only';
                              else val = 'Sample';
                              return (
                                <td key={col.id || idx} style={{ textAlign: col.align || 'left' }}>
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>

                      {/* Totals & Calculations Section */}
                      <div className="erp-doc-a4-totals">
                        <table className="erp-doc-a4-totals-table">
                          <tbody>
                            {selectedTemplate.tableDefinition?.showSubtotal && (
                              <tr>
                                <td>Subtotal:</td>
                                <td className="text-right">৳190,000.00</td>
                              </tr>
                            )}
                            {selectedTemplate.tableDefinition?.showDiscount && (
                              <tr>
                                <td>Special Discount (5%):</td>
                                <td className="text-right">-৳9,500.00</td>
                              </tr>
                            )}
                            {selectedTemplate.tableDefinition?.showTax && (
                              <tr>
                                <td>Applicable VAT (5%):</td>
                                <td className="text-right">+৳9,025.00</td>
                              </tr>
                            )}
                            <tr className="erp-doc-a4-grand-total">
                              <td>Grand Total (BDT):</td>
                              <td className="text-right">৳189,525.00</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Amount in Words (BDT) */}
                      {selectedTemplate.tableDefinition?.showAmountInWords && (
                        <div className="erp-doc-a4-words">
                          <div>
                            <strong>In Words (English):</strong> One Lakh Eighty-Nine Thousand Five Hundred Twenty-Five Taka Only.
                          </div>
                          {selectedTemplate.language === 'BILINGUAL' && (
                            <div className="mt-0.5 text-[#1e3932] font-bangla font-semibold">
                              <strong>কথায় (বাংলা):</strong> এক লক্ষ উননব্বই হাজার পাঁচ শত পঁচিশ টাকা মাত্র।
                            </div>
                          )}
                        </div>
                      )}

                      {/* Terms & Conditions Section */}
                      <div className="erp-doc-a4-terms">
                        <div className="erp-doc-a4-terms-title">Terms & Conditions:</div>
                        <div>1. Offer validity: 30 days from document issuance date.</div>
                        <div>2. Payment: Advance cheque or bank transfer upon delivery.</div>
                        <div>3. Warranty: Standard manufacturer warranty applicable for all medical supplies.</div>
                      </div>

                      {/* Signatures & Seal Block */}
                      <div className="erp-doc-a4-signatures">
                        <div className="erp-doc-a4-sig-block">
                          <div className="erp-doc-a4-sig-line">Prepared By</div>
                          <div className="text-[10px] text-gray-500">Commercial Officer</div>
                        </div>
                        <div className="erp-doc-a4-sig-block">
                          <div className="erp-doc-a4-sig-line">Verified By</div>
                          <div className="text-[10px] text-gray-500">Accounts Manager</div>
                        </div>
                        <div className="erp-doc-a4-sig-block">
                          <div className="w-12 h-12 rounded-full border border-dashed border-[#c89348] mx-auto mb-1 flex items-center justify-center text-[9px] text-[#c89348] font-bold">
                            SEAL
                          </div>
                          <div className="erp-doc-a4-sig-line">Authorized Signatory</div>
                          <div className="text-[10px] text-gray-500">Managing Director</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      Select or create a template to begin visual editing.
                    </div>
                  )}
                </div>

                {/* RIGHT PANEL: Properties Inspector */}
                <div className="erp-doc-builder-properties">
                  <div className="erp-doc-builder-section-title">
                    <Edit2 className="w-3.5 h-3.5 text-[#1e3932]" />
                    Properties Inspector
                  </div>

                  {selectedTemplate && selectedColumnIndex !== null && selectedTemplate.tableDefinition?.columns?.[selectedColumnIndex] ? (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-[#c89348]">
                        Selected Column: #{selectedColumnIndex + 1}
                      </div>

                      <div>
                        <label className="erp-doc-label">Column Header Label</label>
                        <input
                          type="text"
                          className="erp-doc-input"
                          value={selectedTemplate.tableDefinition.columns[selectedColumnIndex].label}
                          onChange={(e) => {
                            const cols = [...selectedTemplate.tableDefinition.columns];
                            cols[selectedColumnIndex].label = e.target.value;
                            setSelectedTemplate({
                              ...selectedTemplate,
                              tableDefinition: { ...selectedTemplate.tableDefinition, columns: cols },
                            });
                          }}
                        />
                      </div>

                      <div>
                        <label className="erp-doc-label">Data Field Key</label>
                        <input
                          type="text"
                          className="erp-doc-input"
                          value={selectedTemplate.tableDefinition.columns[selectedColumnIndex].field}
                          onChange={(e) => {
                            const cols = [...selectedTemplate.tableDefinition.columns];
                            cols[selectedColumnIndex].field = e.target.value;
                            setSelectedTemplate({
                              ...selectedTemplate,
                              tableDefinition: { ...selectedTemplate.tableDefinition, columns: cols },
                            });
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="erp-doc-label">Width (px / %)</label>
                          <input
                            type="text"
                            className="erp-doc-input"
                            value={selectedTemplate.tableDefinition.columns[selectedColumnIndex].width || 'auto'}
                            onChange={(e) => {
                              const cols = [...selectedTemplate.tableDefinition.columns];
                              cols[selectedColumnIndex].width = e.target.value;
                              setSelectedTemplate({
                                ...selectedTemplate,
                                tableDefinition: { ...selectedTemplate.tableDefinition, columns: cols },
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label className="erp-doc-label">Alignment</label>
                          <select
                            className="erp-doc-select"
                            value={selectedTemplate.tableDefinition.columns[selectedColumnIndex].align || 'left'}
                            onChange={(e) => {
                              const cols = [...selectedTemplate.tableDefinition.columns];
                              cols[selectedColumnIndex].align = e.target.value as any;
                              setSelectedTemplate({
                                ...selectedTemplate,
                                tableDefinition: { ...selectedTemplate.tableDefinition, columns: cols },
                              });
                            }}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>

                      {selectedTemplate.tableDefinition.columns[selectedColumnIndex].isDeletable !== false && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveColumn(selectedColumnIndex)}
                            className="w-full erp-doc-btn erp-doc-btn-danger text-xs flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove Column
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 py-4">
                      Click any column header on the central A4 canvas to inspect and customize its label, data mapping, width, and alignment.
                    </div>
                  )}

                  {/* Document Text Notes Controls */}
                  {selectedTemplate && (
                    <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                      <div className="erp-doc-builder-section-title">Introduction & Closing Text</div>
                      <div>
                        <label className="erp-doc-label">Introduction Text</label>
                        <textarea
                          rows={2}
                          className="erp-doc-input"
                          value={selectedTemplate.introductionText || ''}
                          onChange={(e) =>
                            setSelectedTemplate({ ...selectedTemplate, introductionText: e.target.value })
                          }
                          placeholder="e.g. In reference to your tender inquiry..."
                        />
                      </div>
                      <div>
                        <label className="erp-doc-label">Closing Text</label>
                        <textarea
                          rows={2}
                          className="erp-doc-input"
                          value={selectedTemplate.closingText || ''}
                          onChange={(e) =>
                            setSelectedTemplate({ ...selectedTemplate, closingText: e.target.value })
                          }
                          placeholder="e.g. We look forward to receiving your valuable order..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 11: DOCUMENT BRANDING */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-branding' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1e3932]" />
                Organization Document Branding
              </h3>
              <p className="text-xs text-gray-500">Corporate brand colors, font typography, and official company identifiers for generated documents.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="erp-doc-label">Legal Company Name</label>
                  <input
                    type="text"
                    className="erp-doc-input"
                    value={brandingState.companyName}
                    onChange={(e) => setBrandingState({ ...brandingState, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="erp-doc-label">Company Tagline / Subtitle</label>
                  <input
                    type="text"
                    className="erp-doc-input"
                    value={brandingState.tagline}
                    onChange={(e) => setBrandingState({ ...brandingState, tagline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="erp-doc-label">Primary Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-8 p-0 border border-gray-300 rounded cursor-pointer"
                      value={brandingState.primaryColor}
                      onChange={(e) => setBrandingState({ ...brandingState, primaryColor: e.target.value })}
                    />
                    <input
                      type="text"
                      className="erp-doc-input flex-1"
                      value={brandingState.primaryColor}
                      onChange={(e) => setBrandingState({ ...brandingState, primaryColor: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="erp-doc-label">Accent / Gold Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-8 p-0 border border-gray-300 rounded cursor-pointer"
                      value={brandingState.secondaryColor}
                      onChange={(e) => setBrandingState({ ...brandingState, secondaryColor: e.target.value })}
                    />
                    <input
                      type="text"
                      className="erp-doc-input flex-1"
                      value={brandingState.secondaryColor}
                      onChange={(e) => setBrandingState({ ...brandingState, secondaryColor: e.target.value })}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="erp-doc-label">Official Registered Address</label>
                  <input
                    type="text"
                    className="erp-doc-input"
                    value={brandingState.address}
                    onChange={(e) => setBrandingState({ ...brandingState, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => showToast('Organization Document Branding saved successfully!', 'success')}
                  className="erp-doc-btn erp-doc-btn-primary text-xs"
                >
                  Save Branding Configuration
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 12: LOGO & LETTERHEAD */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-letterheads' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-[#1e3932]" />
                Logo & Letterhead Management
              </h3>
              <p className="text-xs text-gray-500">Corporate high-resolution logo, pre-printed letterhead toggle, and header margins.</p>

              <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 space-y-3">
                <div className="w-20 h-20 bg-white border border-gray-200 rounded-lg mx-auto flex items-center justify-center font-bold text-[#1e3932] shadow-sm">
                  SUN BIRD
                </div>
                <div className="text-xs text-gray-600">Standard Corporate Logo Active (SVG / PNG High-Res)</div>
                <label className="erp-doc-btn erp-doc-btn-secondary text-xs inline-flex items-center gap-1.5 cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                  Upload Replacement Logo
                  <input type="file" className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 13: SIGNATURE MANAGEMENT */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-signatures' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-[#1e3932]" />
                    Authorized Signatories
                  </h3>
                  <p className="text-xs text-gray-500">Signatures, designations, and authorized document signing roles.</p>
                </div>
              </div>

              <div className="erp-doc-table-container">
                <table className="erp-doc-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>Sign Type</th>
                      <th>Default on Quotations</th>
                      <th>Default on PO</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-bold text-[#1e3932]">Md. Rafiqul Islam</td>
                      <td>Managing Director</td>
                      <td>Primary Signatory</td>
                      <td><Check className="w-4 h-4 text-green-600" /></td>
                      <td><Check className="w-4 h-4 text-green-600" /></td>
                      <td><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">Active</span></td>
                    </tr>
                    <tr>
                      <td className="font-bold text-[#1e3932]">Kazi Farhan Ahmed</td>
                      <td>Commercial Manager</td>
                      <td>Secondary Signatory</td>
                      <td><Check className="w-4 h-4 text-green-600" /></td>
                      <td>—</td>
                      <td><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 14: SEAL & STAMP MANAGEMENT */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-seals' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Stamp className="w-4 h-4 text-[#1e3932]" />
                Official Seal & Stamp Management
              </h3>
              <p className="text-xs text-gray-500">Digital circular company seal, commercial stamps, and placement configuration.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#1e3932] flex items-center justify-center font-bold text-[10px] text-[#1e3932] text-center">
                    SUN BIRD<br />SEAL
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-800">Primary Company Seal</div>
                    <div className="text-xs text-gray-500">Circular Stamp (45mm)</div>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded mt-1 inline-block">
                      Active on Invoices & POs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 15: TERMS & CONDITIONS LIBRARY */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-terms' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#1e3932]" />
                Terms & Conditions Library
              </h3>
              <p className="text-xs text-gray-500">Pre-defined reusable clause libraries for Quotations, Proformas, Invoices, and Purchase Orders.</p>

              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="font-bold text-xs text-[#1e3932] mb-1">Standard Commercial Quotation Terms (Somorita & Hospitals)</div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>1. Rates quoted are inclusive of delivery to hospital central warehouse.</div>
                    <div>2. Validity of this price offer is strictly 30 calendar days.</div>
                    <div>3. Payment term: 30 days credit following receipt of verified challan and bill.</div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="font-bold text-xs text-[#1e3932] mb-1">Standard Purchase Order Terms (Vendors & Importers)</div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>1. Goods must have minimum 80% remaining shelf life from date of receipt.</div>
                    <div>2. Certificate of Analysis (CoA) must accompany shipment for all pharmaceutical & medical items.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 16: PRINT & PAPER SETTINGS */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-print-settings' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#1e3932]" />
                Print & Paper Calibration Settings
              </h3>
              <p className="text-xs text-gray-500">Page margins, PDFKit resolution, browser print stylesheet parameters, and auto-print behavior.</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="erp-doc-label">Top Margin (mm)</label>
                  <input type="number" className="erp-doc-input" defaultValue={15} />
                </div>
                <div>
                  <label className="erp-doc-label">Bottom Margin (mm)</label>
                  <input type="number" className="erp-doc-input" defaultValue={15} />
                </div>
                <div>
                  <label className="erp-doc-label">Left Margin (mm)</label>
                  <input type="number" className="erp-doc-input" defaultValue={15} />
                </div>
                <div>
                  <label className="erp-doc-label">Right Margin (mm)</label>
                  <input type="number" className="erp-doc-input" defaultValue={15} />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 17: DOCUMENT NUMBERING */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-numbering' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#1e3932]" />
                Document Numbering Sequences
              </h3>
              <p className="text-xs text-gray-500">Prefixes, padding zeroes, and sequence counters for all business documents.</p>

              <div className="erp-doc-table-container">
                <table className="erp-doc-table">
                  <thead>
                    <tr>
                      <th>Document Type</th>
                      <th>Prefix Format</th>
                      <th>Current Year</th>
                      <th>Padding</th>
                      <th>Sample Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-semibold">Sales Quotation</td>
                      <td className="font-mono text-xs">QUO-YYYY-</td>
                      <td>2026</td>
                      <td>5 digits</td>
                      <td className="font-mono text-xs font-bold text-[#1e3932]">QUO-2026-00042</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Proforma Invoice</td>
                      <td className="font-mono text-xs">PI-YYYY-</td>
                      <td>2026</td>
                      <td>5 digits</td>
                      <td className="font-mono text-xs font-bold text-[#1e3932]">PI-2026-00018</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Money Receipt</td>
                      <td className="font-mono text-xs">MR-YYYY-</td>
                      <td>2026</td>
                      <td>5 digits</td>
                      <td className="font-mono text-xs font-bold text-[#1e3932]">MR-2026-00105</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Credit Note</td>
                      <td className="font-mono text-xs">CN-YYYY-</td>
                      <td>2026</td>
                      <td>5 digits</td>
                      <td className="font-mono text-xs font-bold text-[#1e3932]">CN-2026-00007</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Purchase Order</td>
                      <td className="font-mono text-xs">PO-YYYY-</td>
                      <td>2026</td>
                      <td>5 digits</td>
                      <td className="font-mono text-xs font-bold text-[#1e3932]">PO-2026-00063</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBMODULE 18: DOCUMENT ACTIVITY LOGS */}
          {/* ========================================================================= */}
          {activeSubmodule === 'doc-activity-logs' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1e3932]" />
                Document Activity Logs & Audit Trail
              </h3>
              <p className="text-xs text-gray-500">Immutable audit log of document generations, approvals, edits, PDF downloads, and print operations.</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs border border-gray-200">
                  <div>
                    <span className="font-bold text-[#1e3932]">Quotation Generated</span> — QUO-2026-00001 for Samorita Hospital
                    <div className="text-[11px] text-gray-500">User: Admin • Engine: Standard Quotation Template</div>
                  </div>
                  <span className="text-gray-400 font-mono text-[10px]">Just now</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs border border-gray-200">
                  <div>
                    <span className="font-bold text-green-700">Money Receipt Posted to GL</span> — MR-2026-00001 (৳75,000)
                    <div className="text-[11px] text-gray-500">Journal: RECEIPT • Account: Cash & Bank</div>
                  </div>
                  <span className="text-gray-400 font-mono text-[10px]">10 mins ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs border border-gray-200">
                  <div>
                    <span className="font-bold text-[#c89348]">Standard Template Seeded</span> — 4 Default Templates Synchronized
                    <div className="text-[11px] text-gray-500">System Document Engine Initialization</div>
                  </div>
                  <span className="text-gray-400 font-mono text-[10px]">Today</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* UNIVERSAL DOCUMENT PREVIEW & PRINT MODAL */}
      {/* ========================================================================= */}
      {previewModalOpen && previewData && (
        <div className="erp-doc-modal-overlay">
          <div className="erp-doc-modal-content">
            <div className="erp-doc-modal-header">
              <div>
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#1e3932]" />
                  Document Preview & Print — {previewData.quotationNumber || previewData.receiptNumber || previewData.creditNoteNumber || previewData.proformaNumber || previewDocType}
                </h3>
                <span className="text-xs text-gray-500">Rendered with Central Document Engine Snapshot</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="erp-doc-btn erp-doc-btn-secondary text-xs flex items-center gap-1.5"
                >
                  <PrintIcon className="w-3.5 h-3.5" />
                  Print (Browser)
                </button>
                <a
                  href={`/api/v1/erp/documents/pdf/${previewDocType}/${previewData._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="erp-doc-btn erp-doc-btn-primary text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </a>
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="erp-doc-modal-body">
              {/* Rendered Live Document Preview Box */}
              <div className="erp-doc-a4-canvas shadow-none border border-gray-200">
                <div className="erp-doc-a4-header">
                  <div>
                    <div className="erp-doc-a4-brand-name">{brandingState.companyName}</div>
                    <div className="erp-doc-a4-brand-sub">{brandingState.tagline}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{brandingState.address}</div>
                    <div className="text-[10px] font-semibold text-gray-700">BIN: {brandingState.binNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-[#1e3932] uppercase">
                      {previewDocType.replace('_', ' ')}
                    </div>
                    <div className="text-[11px] text-gray-600 font-mono">
                      REF: {previewData.quotationNumber || previewData.receiptNumber || previewData.creditNoteNumber || previewData.proformaNumber}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Date: {previewData.createdAt ? new Date(previewData.createdAt).toLocaleDateString() : formattedDate}
                    </div>
                  </div>
                </div>

                <div className="erp-doc-a4-info-grid">
                  <div className="erp-doc-a4-info-box">
                    <div className="erp-doc-a4-info-title">Client / Recipient</div>
                    <div className="text-xs font-bold text-gray-800">
                      {previewData.customerName || (typeof previewData.customerId === 'object' ? previewData.customerId?.fullName : 'Valued Customer')}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      {previewData.customerAddress || 'Dhaka, Bangladesh'}
                    </div>
                  </div>
                  <div className="erp-doc-a4-info-box">
                    <div className="erp-doc-a4-info-title">Transaction Details</div>
                    <div className="text-[11px] text-gray-700">
                      <strong>Status:</strong> {previewData.status || 'ACTIVE'}
                    </div>
                    <div className="text-[11px] text-gray-700">
                      <strong>Payment Method:</strong> {previewData.paymentMethod || 'Credit Terms'}
                    </div>
                  </div>
                </div>

                {/* Items Table if document has items */}
                {previewData.items && previewData.items.length > 0 && (
                  <table className="erp-doc-a4-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                        <th>Item Description</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
                        <th style={{ width: '100px', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ width: '110px', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.items.map((it: any, i: number) => (
                        <tr key={i}>
                          <td style={{ textAlign: 'center' }}>{i + 1}</td>
                          <td>{it.description || it.name}</td>
                          <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                          <td style={{ textAlign: 'right' }}>৳{(it.unitPrice || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            ৳{((it.quantity || 0) * (it.unitPrice || 0)).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Totals Box */}
                <div className="erp-doc-a4-totals">
                  <table className="erp-doc-a4-totals-table">
                    <tbody>
                      <tr>
                        <td>Subtotal:</td>
                        <td className="text-right">৳{(previewData.subtotal || previewData.amount || 0).toLocaleString()}</td>
                      </tr>
                      {previewData.taxAmount > 0 && (
                        <tr>
                          <td>Tax / VAT:</td>
                          <td className="text-right">৳{(previewData.taxAmount || 0).toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="erp-doc-a4-grand-total">
                        <td>Grand Total (BDT):</td>
                        <td className="text-right">
                          ৳{(previewData.grandTotal || previewData.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Amount in words */}
                {(previewData.amountInWordsEn || previewData.amountInWords) && (
                  <div className="erp-doc-a4-words">
                    <div>
                      <strong>In Words (English):</strong> {previewData.amountInWordsEn || previewData.amountInWords}
                    </div>
                    {previewData.amountInWordsBn && (
                      <div className="mt-0.5 text-[#1e3932] font-bangla font-semibold">
                        <strong>কথায় (বাংলা):</strong> {previewData.amountInWordsBn}
                      </div>
                    )}
                  </div>
                )}

                {/* Signatures */}
                <div className="erp-doc-a4-signatures">
                  <div className="erp-doc-a4-sig-block">
                    <div className="erp-doc-a4-sig-line">Prepared By</div>
                  </div>
                  <div className="erp-doc-a4-sig-block">
                    <div className="erp-doc-a4-sig-line">Verified By</div>
                  </div>
                  <div className="erp-doc-a4-sig-block">
                    <div className="erp-doc-a4-sig-line">Authorized Signatory</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW SALES QUOTATION */}
      {/* ========================================================================= */}
      {showQuotationModal && (
        <div className="erp-doc-modal-overlay">
          <div className="erp-doc-modal-content max-w-xl">
            <div className="erp-doc-modal-header">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-[#1e3932]" />
                Create New Sales Quotation
              </h3>
              <button onClick={() => setShowQuotationModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="erp-doc-modal-body space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-doc-label">Quotation Number</label>
                  <input
                    type="text"
                    className="erp-doc-input"
                    value={newQuotation.quotationNumber}
                    onChange={(e) => setNewQuotation({ ...newQuotation, quotationNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="erp-doc-label">Customer / Institution</label>
                  <input
                    type="text"
                    className="erp-doc-input"
                    value={newQuotation.customerName}
                    onChange={(e) => setNewQuotation({ ...newQuotation, customerName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="erp-doc-label">Quotation Title / Subject</label>
                <input
                  type="text"
                  className="erp-doc-input"
                  value={newQuotation.title}
                  onChange={(e) => setNewQuotation({ ...newQuotation, title: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-doc-label">Customer Address</label>
                <input
                  type="text"
                  className="erp-doc-input"
                  value={newQuotation.customerAddress}
                  onChange={(e) => setNewQuotation({ ...newQuotation, customerAddress: e.target.value })}
                />
              </div>

              {/* Items List */}
              <div>
                <label className="erp-doc-label">Quotation Items</label>
                {newQuotation.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                    <input
                      type="text"
                      className="erp-doc-input col-span-5"
                      value={it.description}
                      placeholder="Item description"
                      onChange={(e) => {
                        const items = [...newQuotation.items];
                        items[idx].description = e.target.value;
                        setNewQuotation({ ...newQuotation, items });
                      }}
                    />
                    <input
                      type="number"
                      className="erp-doc-input col-span-2"
                      value={it.quantity}
                      placeholder="Qty"
                      onChange={(e) => {
                        const items = [...newQuotation.items];
                        items[idx].quantity = Number(e.target.value);
                        setNewQuotation({ ...newQuotation, items });
                      }}
                    />
                    <input
                      type="number"
                      className="erp-doc-input col-span-3"
                      value={it.unitPrice}
                      placeholder="Unit Price"
                      onChange={(e) => {
                        const items = [...newQuotation.items];
                        items[idx].unitPrice = Number(e.target.value);
                        setNewQuotation({ ...newQuotation, items });
                      }}
                    />
                    <div className="col-span-2 text-right font-bold text-xs">
                      ৳{(it.quantity * it.unitPrice).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="erp-doc-label">Terms & Conditions</label>
                <textarea
                  rows={2}
                  className="erp-doc-input"
                  value={newQuotation.terms}
                  onChange={(e) => setNewQuotation({ ...newQuotation, terms: e.target.value })}
                />
              </div>
            </div>
            <div className="erp-doc-modal-footer">
              <button onClick={() => setShowQuotationModal(false)} className="erp-doc-btn erp-doc-btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={handleCreateQuotation}
                disabled={loading}
                className="erp-doc-btn erp-doc-btn-primary text-xs"
              >
                Create Quotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW MONEY RECEIPT */}
      {/* ========================================================================= */}
      {showReceiptModal && (
        <div className="erp-doc-modal-overlay">
          <div className="erp-doc-modal-content max-w-lg">
            <div className="erp-doc-modal-header">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#1e3932]" />
                Record Money Receipt
              </h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="erp-doc-modal-body space-y-3">
              <div>
                <label className="erp-doc-label">Received From (Customer)</label>
                <input
                  type="text"
                  className="erp-doc-input"
                  value={newReceipt.customerName}
                  onChange={(e) => setNewReceipt({ ...newReceipt, customerName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-doc-label">Amount (BDT)</label>
                  <input
                    type="number"
                    className="erp-doc-input"
                    value={newReceipt.amount}
                    onChange={(e) => setNewReceipt({ ...newReceipt, amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="erp-doc-label">Payment Method</label>
                  <select
                    className="erp-doc-select"
                    value={newReceipt.paymentMethod}
                    onChange={(e) => setNewReceipt({ ...newReceipt, paymentMethod: e.target.value })}
                  >
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                  </select>
                </div>
              </div>
              {newReceipt.paymentMethod === 'CHEQUE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="erp-doc-label">Cheque Number</label>
                    <input
                      type="text"
                      className="erp-doc-input"
                      value={newReceipt.chequeNumber}
                      onChange={(e) => setNewReceipt({ ...newReceipt, chequeNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="erp-doc-label">Bank Name</label>
                    <input
                      type="text"
                      className="erp-doc-input"
                      value={newReceipt.bankName}
                      onChange={(e) => setNewReceipt({ ...newReceipt, bankName: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="erp-doc-label">Particulars / Description</label>
                <textarea
                  rows={2}
                  className="erp-doc-input"
                  value={newReceipt.particulars}
                  onChange={(e) => setNewReceipt({ ...newReceipt, particulars: e.target.value })}
                />
              </div>
            </div>
            <div className="erp-doc-modal-footer">
              <button onClick={() => setShowReceiptModal(false)} className="erp-doc-btn erp-doc-btn-secondary text-xs">
                Cancel
              </button>
              <button onClick={handleCreateReceipt} disabled={loading} className="erp-doc-btn erp-doc-btn-primary text-xs">
                Record Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW CREDIT NOTE */}
      {/* ========================================================================= */}
      {showCreditNoteModal && (
        <div className="erp-doc-modal-overlay">
          <div className="erp-doc-modal-content max-w-lg">
            <div className="erp-doc-modal-header">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#1e3932]" />
                Issue Credit Note
              </h3>
              <button onClick={() => setShowCreditNoteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="erp-doc-modal-body space-y-3">
              <div>
                <label className="erp-doc-label">Customer</label>
                <input
                  type="text"
                  className="erp-doc-input"
                  value={newCreditNote.customerName}
                  onChange={(e) => setNewCreditNote({ ...newCreditNote, customerName: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-doc-label">Reason for Credit Adjustment</label>
                <input
                  type="text"
                  className="erp-doc-input"
                  value={newCreditNote.reason}
                  onChange={(e) => setNewCreditNote({ ...newCreditNote, reason: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-doc-label">Adjustment Item</label>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    className="erp-doc-input col-span-6"
                    value={newCreditNote.items[0].description}
                    onChange={(e) => {
                      const items = [...newCreditNote.items];
                      items[0].description = e.target.value;
                      setNewCreditNote({ ...newCreditNote, items });
                    }}
                  />
                  <input
                    type="number"
                    className="erp-doc-input col-span-2"
                    value={newCreditNote.items[0].quantity}
                    placeholder="Qty"
                    onChange={(e) => {
                      const items = [...newCreditNote.items];
                      items[0].quantity = Number(e.target.value);
                      setNewCreditNote({ ...newCreditNote, items });
                    }}
                  />
                  <input
                    type="number"
                    className="erp-doc-input col-span-4"
                    value={newCreditNote.items[0].unitPrice}
                    placeholder="Amount"
                    onChange={(e) => {
                      const items = [...newCreditNote.items];
                      items[0].unitPrice = Number(e.target.value);
                      setNewCreditNote({ ...newCreditNote, items });
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="erp-doc-label">Internal Note</label>
                <textarea
                  rows={2}
                  className="erp-doc-input"
                  value={newCreditNote.note}
                  onChange={(e) => setNewCreditNote({ ...newCreditNote, note: e.target.value })}
                />
              </div>
            </div>
            <div className="erp-doc-modal-footer">
              <button onClick={() => setShowCreditNoteModal(false)} className="erp-doc-btn erp-doc-btn-secondary text-xs">
                Cancel
              </button>
              <button onClick={handleCreateCreditNote} disabled={loading} className="erp-doc-btn erp-doc-btn-primary text-xs">
                Create Credit Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
