'use client';

import React, { useState, useEffect, useCallback } from 'react';
import './ErpApprovalAuditView.css';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Users,
  Building,
  FileText,
  Search,
  RefreshCw,
  Plus,
  Eye,
  Check,
  X,
  Send,
  HelpCircle,
  UserCheck,
  Activity,
  Layers,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  FileCheck,
  FileSpreadsheet,
  Calendar,
  Lock,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { approvalService } from '../../services/approval.service';
import { organizationService } from '../../services/organization.service';
import {
  ApprovalRequestItem,
  ApprovalDashboardMetrics,
  ApprovalWorkflowItem,
  ApprovalDelegationItem,
  AuditLogItem,
  AuditReportMetrics,
  Organization,
} from '../../types';

export type ApprovalSubmodule =
  | 'approval-dashboard'
  | 'my-pending'
  | 'my-submitted'
  | 'all-requests'
  | 'workflow-config'
  | 'approval-levels'
  | 'approval-matrix'
  | 'delegation-management'
  | 'approval-history'
  | 'rejected-requests'
  | 'cancelled-requests'
  | 'audit-trail'
  | 'audit-reports'
  | 'approval-notifications'
  | 'approval-settings';

interface ErpApprovalAuditViewProps {
  initialSubmodule?: ApprovalSubmodule;
  onNavigateToSubmodule?: (submodule: ApprovalSubmodule) => void;
}

export const ErpApprovalAuditView: React.FC<ErpApprovalAuditViewProps> = ({
  initialSubmodule = 'approval-dashboard',
  onNavigateToSubmodule,
}) => {
  const { showToast } = useToast();
  const [activeSubmodule, setActiveSubmodule] = useState<ApprovalSubmodule>(initialSubmodule);

  // Core Data States
  const [dashboardMetrics, setDashboardMetrics] = useState<ApprovalDashboardMetrics | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequestItem[]>([]);
  const [submittedRequests, setSubmittedRequests] = useState<ApprovalRequestItem[]>([]);
  const [allRequests, setAllRequests] = useState<ApprovalRequestItem[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflowItem[]>([]);
  const [delegations, setDelegations] = useState<ApprovalDelegationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditReports, setAuditReports] = useState<AuditReportMetrics | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Selected Item States & Modals
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestItem | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflowItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Decision Modal States
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'RETURN' | 'REQUEST_INFO'>('APPROVE');
  const [actionComment, setActionComment] = useState('');

  // Delegation Modal States
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [newDelegation, setNewDelegation] = useState({
    originalApproverId: '',
    delegatedApproverId: '',
    organizationId: '',
    moduleScope: [] as string[],
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    if (!newDelegation.startDate) {
      setNewDelegation((prev) => ({
        ...prev,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 3600000).toISOString().split('T')[0],
      }));
    }
  }, [newDelegation.startDate]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  const handleSubmoduleChange = (submodule: ApprovalSubmodule) => {
    setActiveSubmodule(submodule);
    if (onNavigateToSubmodule) {
      onNavigateToSubmodule(submodule);
    }
  };

  // Load Dashboard Data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [metrics, orgs, pendings] = await Promise.all([
        approvalService.getDashboard({
          organizationId: selectedOrgFilter || undefined,
          module: selectedModuleFilter || undefined,
        }).catch(() => null),
        organizationService.getOrganizations().catch(() => []),
        approvalService.getMyPendingApprovals({
          organizationId: selectedOrgFilter || undefined,
        }).catch(() => ({ data: [] } as any)),
      ]);

      if (metrics) setDashboardMetrics(metrics);
      setOrganizations(orgs || []);
      setPendingRequests(pendings.data || []);
    } catch (err: any) {
      showToast(err.message || 'Error loading approval dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedOrgFilter, selectedModuleFilter, showToast]);

  // Load Requests based on current submodule
  const loadSubmoduleData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeSubmodule === 'my-pending') {
        const res = await approvalService.getMyPendingApprovals({
          organizationId: selectedOrgFilter || undefined,
        });
        setPendingRequests(res.data || []);
      } else if (activeSubmodule === 'my-submitted') {
        const res = await approvalService.getMySubmittedRequests();
        setSubmittedRequests(res.data || []);
      } else if (
        activeSubmodule === 'all-requests' ||
        activeSubmodule === 'approval-history' ||
        activeSubmodule === 'rejected-requests' ||
        activeSubmodule === 'cancelled-requests'
      ) {
        let statusFilter = selectedStatusFilter;
        if (activeSubmodule === 'rejected-requests') statusFilter = 'REJECTED';
        if (activeSubmodule === 'cancelled-requests') statusFilter = 'CANCELLED';
        if (activeSubmodule === 'approval-history') statusFilter = 'APPROVED';

        const res = await approvalService.getAllRequests({
          organizationId: selectedOrgFilter || undefined,
          module: selectedModuleFilter || undefined,
          currentStatus: statusFilter || undefined,
          search: searchQuery || undefined,
        });
        setAllRequests(res.data || []);
      } else if (activeSubmodule === 'workflow-config' || activeSubmodule === 'approval-matrix' || activeSubmodule === 'approval-levels') {
        const wfs = await approvalService.getWorkflows({
          organizationId: selectedOrgFilter || undefined,
          module: selectedModuleFilter || undefined,
        });
        setWorkflows(wfs || []);
        if (wfs && wfs.length > 0 && !selectedWorkflow) {
          setSelectedWorkflow(wfs[0]);
        }
      } else if (activeSubmodule === 'delegation-management') {
        const dels = await approvalService.getDelegations({
          organizationId: selectedOrgFilter || undefined,
        });
        setDelegations(dels || []);
      } else if (activeSubmodule === 'audit-trail') {
        const logs = await approvalService.getAuditLogs({
          organizationId: selectedOrgFilter || undefined,
          module: selectedModuleFilter || undefined,
          search: searchQuery || undefined,
        });
        setAuditLogs(logs.data || []);
      } else if (activeSubmodule === 'audit-reports') {
        const reports = await approvalService.getAuditReports(selectedOrgFilter || undefined);
        setAuditReports(reports);
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching approval data', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    activeSubmodule,
    selectedOrgFilter,
    selectedModuleFilter,
    selectedStatusFilter,
    searchQuery,
    selectedWorkflow,
    showToast,
  ]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadSubmoduleData();
  }, [loadSubmoduleData]);

  // Execute Action (Approve, Reject, Return, Request Info)
  const handleExecuteAction = async () => {
    if (!selectedRequest) return;
    if ((actionType === 'REJECT' || actionType === 'RETURN') && !actionComment.trim()) {
      showToast('A reason or comment is required for this action.', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (actionType === 'APPROVE') {
        await approvalService.approveRequest(selectedRequest._id, actionComment);
        showToast(`Request ${selectedRequest.requestCode} approved successfully!`, 'success');
      } else if (actionType === 'REJECT') {
        await approvalService.rejectRequest(selectedRequest._id, actionComment);
        showToast(`Request ${selectedRequest.requestCode} rejected.`, 'info');
      } else if (actionType === 'RETURN') {
        await approvalService.returnRequest(selectedRequest._id, actionComment);
        showToast(`Request ${selectedRequest.requestCode} returned for correction.`, 'info');
      } else if (actionType === 'REQUEST_INFO') {
        await approvalService.requestInformation(selectedRequest._id, actionComment);
        showToast(`Information requested for ${selectedRequest.requestCode}.`, 'info');
      }

      setShowActionModal(false);
      setActionComment('');
      loadDashboardData();
      loadSubmoduleData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Seed default workflows
  const handleSeedWorkflows = async () => {
    setLoading(true);
    try {
      const res = await approvalService.seedWorkflows();
      showToast(`Standard workflows seeded! Created: ${res.created?.length || 0}`, 'success');
      loadSubmoduleData();
    } catch (err: any) {
      showToast(err.message || 'Failed to seed workflows', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Overdue SLA Scan
  const handleCheckOverdue = async () => {
    setLoading(true);
    try {
      const res = await approvalService.checkOverdue();
      showToast(
        `Overdue scan complete. Expired: ${res.overdueCount}, Escalated: ${res.escalatedCount}`,
        'info'
      );
      loadDashboardData();
      loadSubmoduleData();
    } catch (err: any) {
      showToast(err.message || 'Overdue check failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create Delegation
  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDelegation.originalApproverId || !newDelegation.delegatedApproverId || !newDelegation.reason) {
      showToast('Please fill all mandatory delegation fields.', 'warning');
      return;
    }
    setLoading(true);
    try {
      await approvalService.createDelegation(newDelegation);
      showToast('Delegation authority granted successfully!', 'success');
      setShowDelegationModal(false);
      setNewDelegation({
        originalApproverId: '',
        delegatedApproverId: '',
        organizationId: '',
        moduleScope: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 3600000).toISOString().split('T')[0],
        reason: '',
      });
      loadSubmoduleData();
    } catch (err: any) {
      showToast(err.message || 'Failed to establish delegation', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Revoke Delegation
  const handleRevokeDelegation = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this delegation authority?')) return;
    try {
      await approvalService.revokeDelegation(id);
      showToast('Delegation revoked.', 'info');
      loadSubmoduleData();
    } catch (err: any) {
      showToast(err.message || 'Error revoking delegation', 'error');
    }
  };

  return (
    <div className="erp-approval-mgmt">
      {/* Module Header */}
      <header className="erp-approval-mgmt__header">
        <div className="erp-approval-mgmt__title-group">
          <div className="erp-approval-mgmt__icon-badge">
            <ShieldCheck className="w-6 h-6 text-emerald-800" />
          </div>
          <div>
            <h1 className="erp-approval-mgmt__title">
              Advanced Approval Workflow & Centralized Audit Management
            </h1>
            <p className="erp-approval-mgmt__subtitle">
              অনুমোদন ও অডিট ব্যবস্থাপনা • Enterprise Maker–Checker Governance & SLA Escalation
            </p>
          </div>
        </div>

        <div className="erp-approval-mgmt__header-actions">
          <button
            onClick={handleCheckOverdue}
            className="erp-btn erp-btn--secondary"
            title="Scan for overdue SLA deadlines and auto-escalate"
          >
            <Clock className="w-4 h-4 mr-1.5 inline text-amber-600" />
            Check Overdue SLA
          </button>
          <button
            onClick={handleSeedWorkflows}
            className="erp-btn erp-btn--outline"
            title="Seed 7 Standard Workflows"
          >
            <Sliders className="w-4 h-4 mr-1.5 inline text-slate-600" />
            Seed Workflows
          </button>
          <button
            onClick={() => {
              loadDashboardData();
              loadSubmoduleData();
            }}
            className="erp-btn erp-btn--outline"
            title="Refresh Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Submodule Navigation Tabs (15 Submodules) */}
      <nav className="erp-approval-mgmt__tabs">
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'approval-dashboard' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('approval-dashboard')}
        >
          <Activity className="w-3.5 h-3.5 mr-1.5" />
          1. Dashboard
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'my-pending' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('my-pending')}
        >
          <FileCheck className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
          2. My Pending ({pendingRequests.length})
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'my-submitted' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('my-submitted')}
        >
          <Send className="w-3.5 h-3.5 mr-1.5" />
          3. My Submitted
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'all-requests' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('all-requests')}
        >
          <Layers className="w-3.5 h-3.5 mr-1.5" />
          4. All Requests
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'workflow-config' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('workflow-config')}
        >
          <Sliders className="w-3.5 h-3.5 mr-1.5" />
          5. Workflows
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'approval-levels' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('approval-levels')}
        >
          <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
          6. Approval Levels
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'approval-matrix' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('approval-matrix')}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
          7. Approval Matrix
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'delegation-management' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('delegation-management')}
        >
          <UserCheck className="w-3.5 h-3.5 mr-1.5" />
          8. Delegations
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'approval-history' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('approval-history')}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
          9. Approved History
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'rejected-requests' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('rejected-requests')}
        >
          <XCircle className="w-3.5 h-3.5 mr-1.5 text-red-500" />
          10. Rejected
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'cancelled-requests' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('cancelled-requests')}
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          11. Cancelled
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'audit-trail' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('audit-trail')}
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
          12. Audit Trail
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'audit-reports' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('audit-reports')}
        >
          <Activity className="w-3.5 h-3.5 mr-1.5" />
          13. Audit Reports
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'approval-notifications' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('approval-notifications')}
        >
          <Clock className="w-3.5 h-3.5 mr-1.5" />
          14. Notifications
        </button>
        <button
          className={`erp-approval-mgmt__tab ${activeSubmodule === 'approval-settings' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('approval-settings')}
        >
          <Lock className="w-3.5 h-3.5 mr-1.5" />
          15. Settings
        </button>
      </nav>

      {/* Main Content Panes */}
      <main className="erp-approval-mgmt__content">
        {/* SUBMODULE 1: CENTRAL APPROVAL DASHBOARD */}
        {activeSubmodule === 'approval-dashboard' && (
          <div className="erp-approval-pane">
            <div className="erp-stats-grid">
              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--blue">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="erp-stat-card__label">Total Approval Requests</div>
                  <div className="erp-stat-card__value">{dashboardMetrics?.totalRequests || 0}</div>
                  <div className="erp-stat-card__sub">মোট অনুমোদন অনুরোধ</div>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--amber">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="erp-stat-card__label">Pending Checker Action</div>
                  <div className="erp-stat-card__value text-amber-600">
                    {dashboardMetrics?.pendingCount || 0}
                  </div>
                  <div className="erp-stat-card__sub text-amber-700 font-medium">বিবেচনাধীন অপেক্ষারত</div>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--emerald">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="erp-stat-card__label">Approved Transactions</div>
                  <div className="erp-stat-card__value text-emerald-700">
                    {dashboardMetrics?.approvedCount || 0}
                  </div>
                  <div className="erp-stat-card__sub text-emerald-700">অনুমোদিত ও সম্পন্ন</div>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--red">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="erp-stat-card__label">Rejected Requests</div>
                  <div className="erp-stat-card__value text-red-600">
                    {dashboardMetrics?.rejectedCount || 0}
                  </div>
                  <div className="erp-stat-card__sub text-red-600">বাতিলকৃত অনুরোধ</div>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--purple">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="erp-stat-card__label">Overdue Approvals</div>
                  <div className="erp-stat-card__value text-purple-700">
                    {dashboardMetrics?.overdueCount || 0}
                  </div>
                  <div className="erp-stat-card__sub text-purple-700">মেয়াদোত্তীর্ণ এসএলএ</div>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--green">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="erp-stat-card__label">Avg. Approval Time</div>
                  <div className="erp-stat-card__value">
                    {dashboardMetrics?.averageApprovalHours || 18.5}h
                  </div>
                  <div className="erp-stat-card__sub">গড় অনুমোদন সময়সীমা</div>
                </div>
              </div>
            </div>

            {/* Breakdowns & Distribution */}
            <div className="erp-grid-2-col mt-6">
              <div className="erp-card">
                <div className="erp-card__header">
                  <h3 className="erp-card__title">
                    <FileText className="w-4 h-4 mr-2 inline text-emerald-700" />
                    Module-wise Approval Volume (মডিউলভিত্তিক অনুরোধ)
                  </h3>
                </div>
                <div className="erp-card__body">
                  {dashboardMetrics?.moduleBreakdown && dashboardMetrics.moduleBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardMetrics.moduleBreakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                          <div>
                            <span className="font-bold text-slate-800">{item.module}</span>
                            <div className="text-xs text-slate-500">
                              Valuation: ৳{item.totalAmount.toLocaleString()} BDT
                            </div>
                          </div>
                          <span className="erp-badge erp-badge--primary">{item.count} Requests</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 py-4 text-center">No module requests logged yet.</p>
                  )}
                </div>
              </div>

              <div className="erp-card">
                <div className="erp-card__header">
                  <h3 className="erp-card__title">
                    <Building className="w-4 h-4 mr-2 inline text-emerald-700" />
                    Organization-wise Approvals (প্রতিষ্ঠানভিত্তিক পরিসংখ্যান)
                  </h3>
                </div>
                <div className="erp-card__body">
                  {dashboardMetrics?.orgBreakdown && dashboardMetrics.orgBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardMetrics.orgBreakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                          <div>
                            <span className="font-bold text-slate-800">{item.organizationName}</span>
                            <div className="text-xs text-amber-600 font-medium">
                              Pending: {item.pending}
                            </div>
                          </div>
                          <span className="erp-badge erp-badge--neutral">{item.count} Total</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 py-4 text-center">No organization records found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="erp-card mt-6">
              <div className="erp-card__header flex justify-between items-center">
                <h3 className="erp-card__title">
                  <Clock className="w-4 h-4 mr-2 inline text-emerald-700" />
                  Recent Approval Requests (সাম্প্রতিক অনুরোধসমূহ)
                </h3>
                <button
                  onClick={() => handleSubmoduleChange('all-requests')}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  View All Requests →
                </button>
              </div>

              <div className="erp-table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Request Code</th>
                      <th>Module & Ref</th>
                      <th>Organization</th>
                      <th>Amount</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Level</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardMetrics?.recentRequests && dashboardMetrics.recentRequests.length > 0 ? (
                      dashboardMetrics.recentRequests.map((req) => (
                        <tr key={req._id}>
                          <td className="font-mono font-bold text-slate-900">{req.requestCode}</td>
                          <td>
                            <div className="font-semibold text-slate-800">{req.documentRef}</div>
                            <div className="text-xs text-slate-500">{req.module} • {req.transactionType}</div>
                          </td>
                          <td className="text-slate-600 text-xs">
                            {req.organizationId?.displayName || 'Global'}
                          </td>
                          <td className="font-mono font-semibold text-slate-900">
                            ৳{req.transactionAmount ? req.transactionAmount.toLocaleString() : '0'}
                          </td>
                          <td>
                            <span className={`erp-badge erp-badge--${req.priority?.toLowerCase() || 'medium'}`}>
                              {req.priority || 'MEDIUM'}
                            </span>
                          </td>
                          <td>
                            <span className={`erp-status-badge erp-status-badge--${req.currentStatus?.toLowerCase()}`}>
                              {req.currentStatus}
                            </span>
                          </td>
                          <td className="text-xs font-bold text-slate-600">
                            Tier {req.currentLevel} of {req.totalLevels}
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setShowActionModal(true);
                              }}
                              className="erp-action-btn"
                              title="Process Action"
                            >
                              <Eye className="w-4 h-4 text-emerald-700" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">
                          No recent approval requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 2: MY PENDING APPROVALS (CHECKER QUEUE) */}
        {activeSubmodule === 'my-pending' && (
          <div className="erp-approval-pane">
            <div className="erp-filter-bar mb-4">
              <div className="erp-search-box">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search my pending queue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="erp-search-input"
                />
              </div>

              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="erp-select"
              >
                <option value="">All Modules (সকল মডিউল)</option>
                <option value="PURCHASE">Purchase</option>
                <option value="SALES">Sales</option>
                <option value="INVENTORY">Inventory</option>
                <option value="ACCOUNTING">Accounting</option>
                <option value="HRM">HRM & Payroll</option>
                <option value="ORGANIZATION">Organization</option>
                <option value="ECOMMERCE">E-commerce</option>
              </select>
            </div>

            <div className="erp-card">
              <div className="erp-table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Request Code</th>
                      <th>Transaction Details</th>
                      <th>Requester (Maker)</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th className="text-right">Checker Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-50" />
                          <div className="font-semibold text-slate-700">No Pending Approvals in Queue!</div>
                          <p className="text-xs text-slate-400 mt-1">
                            Your checker queue is completely clear.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      pendingRequests.map((req) => (
                        <tr key={req._id}>
                          <td className="font-mono font-bold text-slate-900">{req.requestCode}</td>
                          <td>
                            <div className="font-bold text-slate-800">{req.documentRef}</div>
                            <div className="text-xs text-slate-500">
                              {req.module} • {req.transactionType}
                            </div>
                          </td>
                          <td>
                            <div className="font-medium text-slate-800">
                              {req.makerName || req.requestedBy?.fullName}
                            </div>
                            <div className="text-xs text-slate-500">{req.requestedBy?.email}</div>
                          </td>
                          <td className="font-mono font-bold text-slate-900">
                            ৳{req.transactionAmount ? req.transactionAmount.toLocaleString() : '0'}
                          </td>
                          <td className="text-xs text-slate-600">
                            {req.dueDate ? new Date(req.dueDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>
                            <span className="erp-status-badge erp-status-badge--pending">
                              {req.currentStatus}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setActionType('APPROVE');
                                  setShowActionModal(true);
                                }}
                                className="erp-btn erp-btn--sm erp-btn--primary"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setActionType('REJECT');
                                  setShowActionModal(true);
                                }}
                                className="erp-btn erp-btn--sm erp-btn--outline text-red-600 hover:bg-red-50"
                              >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Reject
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setActionType('RETURN');
                                  setShowActionModal(true);
                                }}
                                className="erp-btn erp-btn--sm erp-btn--outline text-amber-600 hover:bg-amber-50"
                              >
                                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                Return
                              </button>
                            </div>
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

        {/* SUBMODULE 3: MY SUBMITTED REQUESTS (MAKER QUEUE) */}
        {activeSubmodule === 'my-submitted' && (
          <div className="erp-approval-pane">
            <div className="erp-card">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <Send className="w-4 h-4 mr-2 inline text-emerald-700" />
                  My Submitted Requests (আমার প্রস্তাবিত অনুরোধসমূহ)
                </h3>
              </div>

              <div className="erp-table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Request Code</th>
                      <th>Document Ref</th>
                      <th>Module</th>
                      <th>Amount</th>
                      <th>Current Level</th>
                      <th>Assigned Checker</th>
                      <th>Status</th>
                      <th>Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">
                          You have not submitted any approval requests.
                        </td>
                      </tr>
                    ) : (
                      submittedRequests.map((req) => (
                        <tr key={req._id}>
                          <td className="font-mono font-bold text-slate-900">{req.requestCode}</td>
                          <td className="font-semibold text-slate-800">{req.documentRef}</td>
                          <td className="text-xs text-slate-600">{req.module}</td>
                          <td className="font-mono font-bold text-slate-900">
                            ৳{req.transactionAmount ? req.transactionAmount.toLocaleString() : '0'}
                          </td>
                          <td className="text-xs font-bold text-slate-600">
                            Level {req.currentLevel} of {req.totalLevels}
                          </td>
                          <td className="text-xs text-slate-700">
                            {req.assignedApproverId?.fullName || req.assignedRoleId?.roleName || 'Designated Role'}
                          </td>
                          <td>
                            <span className={`erp-status-badge erp-status-badge--${req.currentStatus?.toLowerCase()}`}>
                              {req.currentStatus}
                            </span>
                          </td>
                          <td className="text-xs text-slate-500">
                            {new Date(req.createdAt).toLocaleDateString()}
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

        {/* SUBMODULE 4: ALL REQUESTS / HISTORY / REJECTED / CANCELLED */}
        {(activeSubmodule === 'all-requests' ||
          activeSubmodule === 'approval-history' ||
          activeSubmodule === 'rejected-requests' ||
          activeSubmodule === 'cancelled-requests') && (
          <div className="erp-approval-pane">
            <div className="erp-filter-bar mb-4">
              <div className="erp-search-box">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search by code, reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="erp-search-input"
                />
              </div>

              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="erp-select"
              >
                <option value="">All Modules</option>
                <option value="PURCHASE">Purchase</option>
                <option value="SALES">Sales</option>
                <option value="INVENTORY">Inventory</option>
                <option value="ACCOUNTING">Accounting</option>
                <option value="HRM">HRM</option>
                <option value="ORGANIZATION">Organization</option>
                <option value="ECOMMERCE">E-commerce</option>
              </select>

              {activeSubmodule === 'all-requests' && (
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="erp-select"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="RETURNED_FOR_CORRECTION">Returned</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              )}
            </div>

            <div className="erp-card">
              <div className="erp-table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Request Code</th>
                      <th>Document Ref</th>
                      <th>Module & Type</th>
                      <th>Maker</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                      <th className="text-right">History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">
                          No requests found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      allRequests.map((req) => (
                        <tr key={req._id}>
                          <td className="font-mono font-bold text-slate-900">{req.requestCode}</td>
                          <td className="font-bold text-slate-800">{req.documentRef}</td>
                          <td className="text-xs text-slate-600">
                            {req.module} • {req.transactionType}
                          </td>
                          <td className="text-xs text-slate-700">{req.makerName || 'Staff'}</td>
                          <td className="font-mono font-bold text-slate-900">
                            ৳{req.transactionAmount ? req.transactionAmount.toLocaleString() : '0'}
                          </td>
                          <td>
                            <span className={`erp-status-badge erp-status-badge--${req.currentStatus?.toLowerCase()}`}>
                              {req.currentStatus}
                            </span>
                          </td>
                          <td className="text-xs text-slate-500">
                            {new Date(req.createdAt).toLocaleString()}
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setActionType('APPROVE');
                                setShowActionModal(true);
                              }}
                              className="erp-action-btn"
                              title="Inspect Details"
                            >
                              <Eye className="w-4 h-4 text-slate-600" />
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

        {/* SUBMODULE 5, 6, 7: WORKFLOWS, LEVELS, & APPROVAL MATRIX */}
        {(activeSubmodule === 'workflow-config' ||
          activeSubmodule === 'approval-levels' ||
          activeSubmodule === 'approval-matrix') && (
          <div className="erp-approval-pane">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Approval Workflow Engine & Amount Matrix
                </h2>
                <p className="text-xs text-slate-500">
                  Configurable threshold tiers, sequential and parallel levels, SLA and auto-escalation.
                </p>
              </div>

              <button onClick={handleSeedWorkflows} className="erp-btn erp-btn--secondary">
                <Sliders className="w-4 h-4 mr-1.5 inline text-amber-600" />
                Reset Standard Workflows
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((wf) => (
                <div key={wf._id} className="erp-workflow-card p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-900 text-sm">{wf.workflowName}</h4>
                      <span className="erp-badge erp-badge--outline uppercase font-mono">{wf.module}</span>
                    </div>

                    <div className="text-xs font-mono text-emerald-800 mt-1">
                      Code: {wf.workflowCode}
                    </div>

                    <div className="p-3 my-3 bg-slate-50 rounded border border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Transaction Type:</span>
                        <strong className="text-slate-800">{wf.transactionType}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Amount Threshold:</span>
                        <strong className="font-mono text-slate-800">
                          ৳{wf.minAmount.toLocaleString()} – ৳{wf.maxAmount > 10000000 ? 'No Limit' : wf.maxAmount.toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Levels Sequence */}
                    <div className="space-y-2 mt-3">
                      <span className="text-xs font-semibold text-slate-700 block">Approval Sequence:</span>
                      {wf.approvalLevels.map((lvl) => (
                        <div key={lvl.levelNumber} className="flex items-center text-xs p-2 bg-emerald-50/50 rounded border border-emerald-100">
                          <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] mr-2 shrink-0">
                            {lvl.levelNumber}
                          </span>
                          <div className="truncate">
                            <span className="font-medium text-slate-800">{lvl.levelName}</span>
                            <span className="text-[10px] text-slate-500 block">SLA: {lvl.slaHours || 24} hours</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                    <span>Auto Escalation: <strong>{wf.autoEscalation ? 'Enabled' : 'Disabled'}</strong></span>
                    <span className="erp-badge erp-badge--green">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMODULE 8: DELEGATION MANAGEMENT */}
        {activeSubmodule === 'delegation-management' && (
          <div className="erp-approval-pane">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Approval Delegation Management</h2>
                <p className="text-xs text-slate-500">
                  Grant temporary signing authority with strict anti-circular delegation rules.
                </p>
              </div>

              <button
                onClick={() => setShowDelegationModal(true)}
                className="erp-btn erp-btn--primary"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Delegation
              </button>
            </div>

            <div className="erp-card">
              <div className="erp-table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Original Approver</th>
                      <th>Delegated Approver</th>
                      <th>Organization Scope</th>
                      <th>Module Scope</th>
                      <th>Period</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delegations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">
                          No active delegations found.
                        </td>
                      </tr>
                    ) : (
                      delegations.map((del) => (
                        <tr key={del._id}>
                          <td className="font-semibold text-slate-900">
                            {del.originalApproverId?.fullName || 'Approver'}
                          </td>
                          <td className="font-semibold text-emerald-800">
                            {del.delegatedApproverId?.fullName || 'Delegate'}
                          </td>
                          <td className="text-xs text-slate-600">
                            {del.organizationId?.displayName || 'Global'}
                          </td>
                          <td className="text-xs text-slate-600">
                            {del.moduleScope && del.moduleScope.length > 0 ? del.moduleScope.join(', ') : 'All Modules'}
                          </td>
                          <td className="text-xs text-slate-500 font-mono">
                            {new Date(del.startDate).toLocaleDateString()} – {new Date(del.endDate).toLocaleDateString()}
                          </td>
                          <td className="text-xs text-slate-700 max-w-xs truncate">{del.reason}</td>
                          <td>
                            <span className={`erp-status-badge ${del.isActive ? 'erp-status-badge--active' : 'erp-status-badge--inactive'}`}>
                              {del.isActive ? 'Active' : 'Revoked'}
                            </span>
                          </td>
                          <td className="text-right">
                            {del.isActive && (
                              <button
                                onClick={() => handleRevokeDelegation(del._id)}
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >
                                Revoke
                              </button>
                            )}
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

        {/* SUBMODULE 12: AUDIT TRAIL */}
        {activeSubmodule === 'audit-trail' && (
          <div className="erp-approval-pane">
            <div className="erp-filter-bar mb-4">
              <div className="erp-search-box">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search audit trail by actor, action, target..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="erp-search-input"
                />
              </div>
            </div>

            <div className="erp-card">
              <div className="erp-table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Actor</th>
                      <th>Target Resource</th>
                      <th>Notes / Diff</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          No audit logs found.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log._id}>
                          <td className="text-xs font-mono text-slate-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <span className="font-mono text-xs font-bold text-emerald-800 px-2 py-0.5 bg-emerald-50 rounded">
                              {log.action}
                            </span>
                          </td>
                          <td className="font-medium text-slate-800 text-xs">
                            {log.actorNameSnapshot || log.actorId?.fullName || log.actorRole}
                          </td>
                          <td className="text-xs text-slate-600">
                            {log.targetCollection}:{String(log.targetId).slice(-6)}
                          </td>
                          <td className="text-xs text-slate-700 max-w-sm truncate">
                            {log.notes || 'System action executed'}
                          </td>
                          <td className="text-xs font-mono text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 13: AUDIT REPORTS */}
        {activeSubmodule === 'audit-reports' && (
          <div className="erp-approval-pane">
            <div className="erp-grid-2-col">
              <div className="erp-card">
                <div className="erp-card__header">
                  <h3 className="erp-card__title">Top Audit Actions (অডিট অ্যাকশন পরিসংখ্যান)</h3>
                </div>
                <div className="erp-card__body">
                  {auditReports?.byAction && auditReports.byAction.length > 0 ? (
                    <div className="space-y-2">
                      {auditReports.byAction.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                          <span className="font-mono text-xs font-bold text-slate-800">{item.action}</span>
                          <span className="erp-badge erp-badge--primary">{item.count} events</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No report data.</p>
                  )}
                </div>
              </div>

              <div className="erp-card">
                <div className="erp-card__header">
                  <h3 className="erp-card__title">Top Active Actors (শীর্ষ কর্মকর্তা অডিট)</h3>
                </div>
                <div className="erp-card__body">
                  {auditReports?.byActor && auditReports.byActor.length > 0 ? (
                    <div className="space-y-2">
                      {auditReports.byActor.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                          <span className="font-medium text-slate-800 text-xs">{item.actorName}</span>
                          <span className="erp-badge erp-badge--neutral">{item.count} events</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No report data.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 14 & 15: NOTIFICATIONS & SETTINGS */}
        {(activeSubmodule === 'approval-notifications' || activeSubmodule === 'approval-settings') && (
          <div className="erp-approval-pane">
            <div className="erp-card max-w-3xl mx-auto">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <Lock className="w-5 h-5 mr-2 inline text-emerald-700" />
                  Approval & Maker–Checker System Governance Policies
                </h3>
              </div>
              <div className="erp-card__body space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-slate-900">Maker–Checker Separation Enforcement</h4>
                    <p className="text-xs text-slate-500">Strictly blocks creators from self-approving requests</p>
                  </div>
                  <span className="erp-badge erp-badge--green">Enforced</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-slate-900">Anti-Circular Delegation Prevention</h4>
                    <p className="text-xs text-slate-500">Blocks recursive delegation loops between users</p>
                  </div>
                  <span className="erp-badge erp-badge--green">Active</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-slate-900">Immutable Audit Trail Security</h4>
                    <p className="text-xs text-slate-500">Append-only write-once security model with pre-hook blockers</p>
                  </div>
                  <span className="erp-badge erp-badge--green">Protected</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CHECKER ACTION (APPROVE / REJECT / RETURN / DETAILS) */}
      {showActionModal && selectedRequest && (
        <div className="erp-modal-overlay">
          <div className="erp-modal max-w-xl">
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">
                {actionType === 'APPROVE' && <Check className="w-5 h-5 mr-2 inline text-emerald-600" />}
                {actionType === 'REJECT' && <X className="w-5 h-5 mr-2 inline text-red-600" />}
                {actionType === 'RETURN' && <RotateCcw className="w-5 h-5 mr-2 inline text-amber-600" />}
                Process Request: {selectedRequest.requestCode}
              </h3>
              <button onClick={() => setShowActionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="erp-modal__body space-y-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                <div>Document: <strong>{selectedRequest.documentRef}</strong></div>
                <div>Module: <strong>{selectedRequest.module} ({selectedRequest.transactionType})</strong></div>
                <div>Amount: <strong className="font-mono text-emerald-800">৳{selectedRequest.transactionAmount?.toLocaleString() || '0'} BDT</strong></div>
                <div>Current Tier: <strong>Level {selectedRequest.currentLevel} of {selectedRequest.totalLevels}</strong></div>
              </div>

              {/* Action Selector */}
              <div>
                <label className="erp-label">Select Checker Action</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setActionType('APPROVE')}
                    className={`flex-1 py-2 text-xs font-bold rounded border ${
                      actionType === 'APPROVE'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('REJECT')}
                    className={`flex-1 py-2 text-xs font-bold rounded border ${
                      actionType === 'REJECT'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('RETURN')}
                    className={`flex-1 py-2 text-xs font-bold rounded border ${
                      actionType === 'RETURN'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Return
                  </button>
                </div>
              </div>

              <div className="erp-form-group">
                <label className="erp-label">Comments / Justification (মন্তব্য)</label>
                <textarea
                  rows={3}
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder="Enter remarks or justification for this decision..."
                  className="erp-input text-xs"
                />
              </div>

              {/* Decision History Trail */}
              {selectedRequest.decisionHistory && selectedRequest.decisionHistory.length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-2">Previous Decision History:</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedRequest.decisionHistory.map((h, i) => (
                      <div key={i} className="text-[11px] p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                        <div>
                          <strong>{h.actorName}</strong> ({h.action}): {h.comment || 'No comment'}
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {new Date(h.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="erp-modal__footer">
              <button
                type="button"
                onClick={() => setShowActionModal(false)}
                className="erp-btn erp-btn--outline"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={loading}
                className="erp-btn erp-btn--primary"
              >
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD DELEGATION */}
      {showDelegationModal && (
        <div className="erp-modal-overlay">
          <div className="erp-modal">
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">
                <UserCheck className="w-5 h-5 mr-2 inline text-emerald-700" />
                Delegate Approval Authority
              </h3>
              <button onClick={() => setShowDelegationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelegation} className="erp-modal__body space-y-3">
              <div className="erp-form-group">
                <label className="erp-label">Original Approver User ID</label>
                <input
                  type="text"
                  required
                  placeholder="24-character User ObjectId..."
                  value={newDelegation.originalApproverId}
                  onChange={(e) => setNewDelegation({ ...newDelegation, originalApproverId: e.target.value })}
                  className="erp-input font-mono text-xs"
                />
              </div>

              <div className="erp-form-group">
                <label className="erp-label">Delegated Approver User ID</label>
                <input
                  type="text"
                  required
                  placeholder="24-character User ObjectId..."
                  value={newDelegation.delegatedApproverId}
                  onChange={(e) => setNewDelegation({ ...newDelegation, delegatedApproverId: e.target.value })}
                  className="erp-input font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="erp-form-group">
                  <label className="erp-label">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newDelegation.startDate}
                    onChange={(e) => setNewDelegation({ ...newDelegation, startDate: e.target.value })}
                    className="erp-input text-xs"
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-label">End Date</label>
                  <input
                    type="date"
                    required
                    value={newDelegation.endDate}
                    onChange={(e) => setNewDelegation({ ...newDelegation, endDate: e.target.value })}
                    className="erp-input text-xs"
                  />
                </div>
              </div>

              <div className="erp-form-group">
                <label className="erp-label">Delegation Reason (কারণ)</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Official foreign inspection tour"
                  value={newDelegation.reason}
                  onChange={(e) => setNewDelegation({ ...newDelegation, reason: e.target.value })}
                  className="erp-input text-xs"
                />
              </div>

              <div className="erp-modal__footer pt-4">
                <button
                  type="button"
                  onClick={() => setShowDelegationModal(false)}
                  className="erp-btn erp-btn--outline"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="erp-btn erp-btn--primary">
                  Grant Delegation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErpApprovalAuditView;

