'use client';

import React, { useState, useEffect, useCallback } from 'react';
import './ErpUserManagementView.css';
import {
  Users,
  Shield,
  KeyRound,
  UserPlus,
  Lock,
  Unlock,
  Building,
  Activity,
  History,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Copy,
  Eye,
  Check,
  X,
  Plus,
  Sliders,
  Mail,
  Phone,
  Briefcase,
  IdCard,
  UserCheck,
  UserX,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { userManagementService } from '../../services/userManagement.service';
import { organizationService } from '../../services/organization.service';
import {
  ErpUser,
  ErpRole,
  UserDashboardMetrics,
  UserActiveSession,
  UserLoginHistoryItem,
  PermissionMatrixModuleDef,
  Organization,
} from '../../types';

export type UserSubmodule =
  | 'user-dashboard'
  | 'user-list'
  | 'create-user'
  | 'user-profile'
  | 'role-management'
  | 'permission-management'
  | 'organization-access'
  | 'module-access-control'
  | 'login-history'
  | 'active-sessions'
  | 'user-activity-logs'
  | 'security-policies';

interface ErpUserManagementViewProps {
  initialSubmodule?: UserSubmodule;
  onNavigateToSubmodule?: (submodule: UserSubmodule) => void;
}

export const ErpUserManagementView: React.FC<ErpUserManagementViewProps> = ({
  initialSubmodule = 'user-dashboard',
  onNavigateToSubmodule,
}) => {
  const { showToast } = useToast();
  const [activeSubmodule, setActiveSubmodule] = useState<UserSubmodule>(initialSubmodule);

  // Core Data States
  const [dashboardMetrics, setDashboardMetrics] = useState<UserDashboardMetrics | null>(null);
  const [users, setUsers] = useState<ErpUser[]>([]);
  const [roles, setRoles] = useState<ErpRole[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [permissionDefs, setPermissionDefs] = useState<PermissionMatrixModuleDef[]>([]);
  const [rolePresets, setRolePresets] = useState<any[]>([]);

  // Selected Item States
  const [selectedUser, setSelectedUser] = useState<ErpUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<ErpRole | null>(null);
  const [userSessions, setUserSessions] = useState<UserActiveSession[]>([]);
  const [loginHistory, setLoginHistory] = useState<UserLoginHistoryItem[]>([]);

  // Modals & Forms
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [forceChangeChecked, setForceChangeChecked] = useState(true);

  const [showDuplicateRoleModal, setShowDuplicateRoleModal] = useState(false);
  const [duplicateRoleName, setDuplicateRoleName] = useState('');
  const [duplicateRoleSlug, setDuplicateRoleSlug] = useState('');

  // Filtering & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
    employeeId: '',
    department: 'Sales & Marketing',
    designation: 'Officer',
    userType: 'STAFF',
    roleId: '',
    authorizedOrganizations: [] as string[],
    defaultOrganizationId: '',
    profileImage: '',
    status: 'ACTIVE',
  });

  // Permission Matrix Working State: Map<moduleId, Set<action>>
  const [editingPermissions, setEditingPermissions] = useState<Record<string, string[]>>({});

  const handleSubmoduleChange = (submodule: UserSubmodule) => {
    setActiveSubmodule(submodule);
    if (onNavigateToSubmodule) {
      onNavigateToSubmodule(submodule);
    }
  };

  // 1. Load Initial Core Data
  const loadCoreData = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsData, rolesData, orgsData, permRegistryData] = await Promise.all([
        userManagementService.getDashboardStats().catch(() => null),
        userManagementService.getRoles().catch(() => []),
        organizationService.getOrganizations().catch(() => []),
        userManagementService.getPermissionRegistry().catch(() => ({ registry: [], presets: [] })),
      ]);

      if (metricsData) setDashboardMetrics(metricsData);
      setRoles(rolesData || []);
      setOrganizations(orgsData || []);
      setPermissionDefs(permRegistryData.registry || []);
      setRolePresets(permRegistryData.presets || []);

      if (rolesData && rolesData.length > 0 && !selectedRole) {
        setSelectedRole(rolesData[0]);
        // initialize matrix
        const permMap: Record<string, string[]> = {};
        rolesData[0].permissions.forEach((p) => {
          permMap[p.module] = p.actions;
        });
        setEditingPermissions(permMap);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading user management data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, selectedRole]);

  // 2. Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userManagementService.getUsers({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        roleId: roleFilter || undefined,
      });
      setUsers(res.data || []);
      if (res.data && res.data.length > 0 && !selectedUser) {
        setSelectedUser(res.data[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, roleFilter, selectedUser, showToast]);

  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // When selected user changes, load their sessions and login history
  useEffect(() => {
    if (selectedUser) {
      userManagementService.getUserSessions(selectedUser._id)
        .then(setUserSessions)
        .catch(() => setUserSessions([]));

      userManagementService.getUserLoginHistory(selectedUser._id, 30)
        .then(setLoginHistory)
        .catch(() => setLoginHistory([]));
    }
  }, [selectedUser]);

  // When selected role changes, initialize matrix
  const handleSelectRoleForMatrix = (role: ErpRole) => {
    setSelectedRole(role);
    const permMap: Record<string, string[]> = {};
    role.permissions.forEach((p) => {
      permMap[p.module] = [...p.actions];
    });
    setEditingPermissions(permMap);
  };

  // Toggle permission in matrix
  const handleTogglePermission = (moduleId: string, action: string) => {
    const currentActions = editingPermissions[moduleId] || [];
    let updated: string[];
    if (currentActions.includes(action)) {
      updated = currentActions.filter((a) => a !== action);
    } else {
      updated = [...currentActions, action];
    }
    setEditingPermissions({
      ...editingPermissions,
      [moduleId]: updated,
    });
  };

  const handleSelectAllModule = (moduleId: string) => {
    const modDef = permissionDefs.find((m) => m.moduleId === moduleId);
    if (!modDef) return;
    setEditingPermissions({
      ...editingPermissions,
      [moduleId]: modDef.actions.map((a) => a.action),
    });
  };

  const handleDeselectAllModule = (moduleId: string) => {
    setEditingPermissions({
      ...editingPermissions,
      [moduleId]: [],
    });
  };

  const handleSavePermissionMatrix = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const payload = Object.entries(editingPermissions)
        .filter(([_, actions]) => actions.length > 0)
        .map(([module, actions]) => ({ module, actions }));

      const updated = await userManagementService.updateRolePermissions(selectedRole._id, payload);
      setSelectedRole(updated);
      showToast(`Permissions updated for role ${updated.roleName}`, 'success');
      loadCoreData();
    } catch (err: any) {
      showToast(err.message || 'Error updating permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create User Action
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.fullName || !newUserForm.email || !newUserForm.mobile || !newUserForm.password) {
      showToast('Please fill all mandatory user fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      const created = await userManagementService.createUser({
        fullName: newUserForm.fullName,
        username: newUserForm.username || undefined,
        email: newUserForm.email,
        mobile: newUserForm.mobile,
        password: newUserForm.password,
        employeeId: newUserForm.employeeId || undefined,
        department: newUserForm.department,
        designation: newUserForm.designation,
        userType: newUserForm.userType as any,
        roleId: newUserForm.roleId || undefined,
        authorizedOrganizations: newUserForm.authorizedOrganizations,
        defaultOrganizationId: newUserForm.defaultOrganizationId || undefined,
        profileImage: newUserForm.profileImage || undefined,
        status: newUserForm.status as any,
      });

      showToast(`User ${created.fullName} created successfully`, 'success');
      setNewUserForm({
        fullName: '',
        username: '',
        email: '',
        mobile: '',
        password: '',
        employeeId: '',
        department: 'Sales & Marketing',
        designation: 'Officer',
        userType: 'STAFF',
        roleId: '',
        authorizedOrganizations: [],
        defaultOrganizationId: '',
        profileImage: '',
        status: 'ACTIVE',
      });
      fetchUsers();
      loadCoreData();
      handleSubmoduleChange('user-list');
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Status Change Action
  const handleStatusChange = async (userId: string, status: string) => {
    try {
      const updated = await userManagementService.setUserStatus(userId, status);
      showToast(`User status updated to ${status}`, 'success');
      setUsers((prev) => prev.map((u) => (u._id === userId ? updated : u)));
      if (selectedUser?._id === userId) setSelectedUser(updated);
      loadCoreData();
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  // Unlock User
  const handleUnlockUser = async (userId: string) => {
    try {
      const updated = await userManagementService.unlockUser(userId);
      showToast(`User account unlocked successfully`, 'success');
      setUsers((prev) => prev.map((u) => (u._id === userId ? updated : u)));
      if (selectedUser?._id === userId) setSelectedUser(updated);
      loadCoreData();
    } catch (err: any) {
      showToast(err.message || 'Error unlocking user', 'error');
    }
  };

  // Password Reset Action
  const handleExecutePasswordReset = async () => {
    if (!selectedUser || !resetPasswordInput || resetPasswordInput.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }
    try {
      await userManagementService.resetPassword(
        selectedUser._id,
        resetPasswordInput,
        forceChangeChecked
      );
      showToast('Password reset successfully and active sessions revoked', 'success');
      setShowResetPasswordModal(false);
      setResetPasswordInput('');
      // refresh user sessions
      const s = await userManagementService.getUserSessions(selectedUser._id);
      setUserSessions(s);
    } catch (err: any) {
      showToast(err.message || 'Error resetting password', 'error');
    }
  };

  // Revoke Sessions
  const handleRevokeSessions = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke all active sessions for this user?')) return;
    try {
      const res = await userManagementService.revokeUserSessions(userId);
      showToast(`Revoked ${res.revokedCount} active session(s)`, 'success');
      setUserSessions([]);
      loadCoreData();
    } catch (err: any) {
      showToast(err.message || 'Error revoking sessions', 'error');
    }
  };

  // Duplicate Role
  const handleExecuteDuplicateRole = async () => {
    if (!selectedRole || !duplicateRoleName.trim()) {
      showToast('Role name is required', 'warning');
      return;
    }
    try {
      const duplicated = await userManagementService.duplicateRole(
        selectedRole._id,
        duplicateRoleName.trim(),
        duplicateRoleSlug.trim() || undefined
      );
      showToast(`Role duplicated as '${duplicated.roleName}'`, 'success');
      setShowDuplicateRoleModal(false);
      setDuplicateRoleName('');
      setDuplicateRoleSlug('');
      loadCoreData();
    } catch (err: any) {
      showToast(err.message || 'Error duplicating role', 'error');
    }
  };

  // Delete Role
  const handleDeleteRole = async (role: ErpRole) => {
    if (role.isSystemRole) {
      showToast(`System-critical role '${role.roleName}' cannot be deleted.`, 'error');
      return;
    }
    if ((role.assignedUsersCount || 0) > 0) {
      showToast(
        `Cannot delete role '${role.roleName}': ${role.assignedUsersCount} users are currently assigned to it.`,
        'warning'
      );
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete role '${role.roleName}'?`)) return;

    try {
      await userManagementService.deleteRole(role._id);
      showToast(`Role '${role.roleName}' deleted successfully`, 'success');
      loadCoreData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete role', 'error');
    }
  };

  // Seed standard roles
  const handleSeedStandardRoles = async () => {
    try {
      setLoading(true);
      const res = await userManagementService.seedStandardRoles();
      showToast(
        `Verified standard roles! Created: ${res.created?.length || 0}, Existing: ${res.existing?.length || 0}`,
        'success'
      );
      loadCoreData();
    } catch (err: any) {
      showToast(err.message || 'Error seeding standard roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-user-mgmt">
      {/* Module Header */}
      <header className="erp-user-mgmt__header">
        <div className="erp-user-mgmt__title-group">
          <div className="erp-user-mgmt__icon-badge">
            <Shield className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="erp-user-mgmt__title">
              User, Roles & Advanced Permission Management
            </h1>
            <p className="erp-user-mgmt__subtitle">
              ব্যবহারকারী, রোল ও পারমিশন কন্ট্রোল সিস্টেম • Multi-Organization RBAC Security
            </p>
          </div>
        </div>

        <div className="erp-user-mgmt__header-actions">
          <button
            onClick={() => handleSubmoduleChange('create-user')}
            className="erp-btn erp-btn--primary"
          >
            <UserPlus className="w-4 h-4 mr-2 inline" />
            New User (নতুন ব্যবহারকারী)
          </button>
          <button
            onClick={handleSeedStandardRoles}
            className="erp-btn erp-btn--secondary"
            title="Seed 17 Enterprise Standard Roles"
          >
            <Shield className="w-4 h-4 mr-2 inline text-amber-600" />
            Seed Roles
          </button>
          <button
            onClick={() => {
              loadCoreData();
              fetchUsers();
            }}
            className="erp-btn erp-btn--outline"
            title="Refresh Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Submodule Navigation Tabs */}
      <nav className="erp-user-mgmt__tabs">
        <button
          className={`erp-user-mgmt__tab ${activeSubmodule === 'user-dashboard' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('user-dashboard')}
        >
          <Activity className="w-4 h-4 mr-2" />
          1. Dashboard
        </button>
        <button
          className={`erp-user-mgmt__tab ${activeSubmodule === 'user-list' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('user-list')}
        >
          <Users className="w-4 h-4 mr-2" />
          2. User List
        </button>
        <button
          className={`erp-user-mgmt__tab ${activeSubmodule === 'create-user' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('create-user')}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          3. Create User
        </button>
        <button
          className={`erp-user-mgmt__tab ${activeSubmodule === 'user-profile' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('user-profile')}
        >
          <IdCard className="w-4 h-4 mr-2" />
          4. User Profile
        </button>
        <button
          className={`erp-user-mgmt__tab ${activeSubmodule === 'role-management' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('role-management')}
        >
          <Shield className="w-4 h-4 mr-2" />
          5. Role Management
        </button>
        <button
          className={`erp-user-mgmt__tab ${activeSubmodule === 'permission-management' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('permission-management')}
        >
          <KeyRound className="w-4 h-4 mr-2 text-amber-500" />
          6. Permission Matrix
        </button>
        <button
          className={`erp-user-mgmt__tab ${activeSubmodule === 'organization-access' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('organization-access')}
        >
          <Building className="w-4 h-4 mr-2" />
          7. Org Access
        </button>
        <button
          className={`erp-user-mgmt__tab ${activeSubmodule === 'module-access-control' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('module-access-control')}
        >
          <Sliders className="w-4 h-4 mr-2" />
          8. Module Access
        </button>
        <button
          className={`erp-user-mgmt__tab ${activeSubmodule === 'login-history' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('login-history')}
        >
          <History className="w-4 h-4 mr-2" />
          9. Login History
        </button>
        <button
          className={`erp-user-mgmt__tab ${activeSubmodule === 'active-sessions' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('active-sessions')}
        >
          <Laptop className="w-4 h-4 mr-2" />
          10. Active Sessions
        </button>
        <button
          className={`erp-user-mgmt__tab ${activeSubmodule === 'user-activity-logs' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('user-activity-logs')}
        >
          <Activity className="w-4 h-4 mr-2" />
          11. Activity Logs
        </button>
        <button
          className={`erp-user-mgmt__tab ${activeSubmodule === 'security-policies' ? 'active' : ''}`}
          onClick={() => handleSubmoduleChange('security-policies')}
        >
          <Lock className="w-4 h-4 mr-2" />
          12. Security Policies
        </button>
      </nav>

      {/* Main Submodule Content Panes */}
      <main className="erp-user-mgmt__content">
        {/* SUBMODULE 1: USER DASHBOARD */}
        {activeSubmodule === 'user-dashboard' && (
          <div className="erp-user-pane">
            <div className="erp-stats-grid">
              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--emerald">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="erp-stat-card__label">Total Staff & Users</div>
                  <div className="erp-stat-card__value">
                    {dashboardMetrics?.totalUsers || users.length}
                  </div>
                  <div className="erp-stat-card__sub">সিস্টেমের মোট ব্যবহারকারী</div>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--green">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="erp-stat-card__label">Active Users</div>
                  <div className="erp-stat-card__value">
                    {dashboardMetrics?.activeUsers ?? users.filter((u) => u.isActive).length}
                  </div>
                  <div className="erp-stat-card__sub text-emerald-600">অনুমোদিত ও সক্রিয়</div>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--amber">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="erp-stat-card__label">Suspended / Locked</div>
                  <div className="erp-stat-card__value">
                    {(dashboardMetrics?.suspendedUsers || 0) + (dashboardMetrics?.lockedUsers || 0)}
                  </div>
                  <div className="erp-stat-card__sub text-amber-600">স্থগিত / লক করা একাউন্ট</div>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--blue">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="erp-stat-card__label">Configured Roles</div>
                  <div className="erp-stat-card__value">
                    {dashboardMetrics?.totalRoles || roles.length}
                  </div>
                  <div className="erp-stat-card__sub">সংজ্ঞায়িত আরবেক রোলস</div>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--purple">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <div className="erp-stat-card__label">Active Sessions</div>
                  <div className="erp-stat-card__value">
                    {dashboardMetrics?.activeSessions ?? 1}
                  </div>
                  <div className="erp-stat-card__sub">লাইভ সাইন-ইন সেশন</div>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--red">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="erp-stat-card__label">Failed Logins</div>
                  <div className="erp-stat-card__value">
                    {dashboardMetrics?.failedLoginAttemptsCount || 0}
                  </div>
                  <div className="erp-stat-card__sub text-red-600">ব্যর্থ লগইন চেষ্টা</div>
                </div>
              </div>
            </div>

            {/* Department and Roles Breakdown */}
            <div className="erp-grid-2-col mt-6">
              <div className="erp-card">
                <h3 className="erp-card__title">
                  <Briefcase className="w-5 h-5 mr-2 inline text-emerald-700" />
                  Staff Distribution by Department (বিভাগভিত্তিক কর্মকর্তা)
                </h3>
                <div className="erp-card__body">
                  {dashboardMetrics?.usersByDepartment && dashboardMetrics.usersByDepartment.length > 0 ? (
                    <div className="erp-distribution-list">
                      {dashboardMetrics.usersByDepartment.map((dept, idx) => (
                        <div key={idx} className="erp-distribution-item">
                          <span className="font-medium text-slate-800">{dept.department}</span>
                          <span className="erp-badge erp-badge--neutral">{dept.count} users</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 py-4 text-center">
                      No departmental distribution data yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="erp-card">
                <h3 className="erp-card__title">
                  <Shield className="w-5 h-5 mr-2 inline text-emerald-700" />
                  Staff Distribution by Role (রোলভিত্তিক কর্মকর্তা)
                </h3>
                <div className="erp-card__body">
                  {dashboardMetrics?.usersByRole && dashboardMetrics.usersByRole.length > 0 ? (
                    <div className="erp-distribution-list">
                      {dashboardMetrics.usersByRole.map((r, idx) => (
                        <div key={idx} className="erp-distribution-item">
                          <span className="font-medium text-slate-800">{r.roleName}</span>
                          <span className="erp-badge erp-badge--primary">{r.count} users</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 py-4 text-center">
                      No role distribution data yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Recently Created Staff */}
            <div className="erp-card mt-6">
              <div className="erp-card__header flex justify-between items-center">
                <h3 className="erp-card__title">
                  <Users className="w-5 h-5 mr-2 inline text-emerald-700" />
                  Recently Onboarded Users (সম্প্রতি যুক্ত কর্মকর্তা)
                </h3>
                <button
                  onClick={() => handleSubmoduleChange('user-list')}
                  className="text-sm font-medium text-emerald-700 hover:underline"
                >
                  View All Users →
                </button>
              </div>
              <div className="erp-table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Email / Username</th>
                      <th>Mobile</th>
                      <th>User Type</th>
                      <th>Status</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((user) => (
                      <tr key={user._id}>
                        <td className="font-semibold text-slate-900">{user.fullName}</td>
                        <td className="text-slate-600">{user.email}</td>
                        <td className="text-slate-600">{user.mobile}</td>
                        <td>
                          <span className="erp-badge erp-badge--outline">{user.userType}</span>
                        </td>
                        <td>
                          <span className={`erp-status-badge erp-status-badge--${user.status.toLowerCase()}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="text-slate-500 text-sm">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 2: USER LIST */}
        {activeSubmodule === 'user-list' && (
          <div className="erp-user-pane">
            {/* Search & Filter Bar */}
            <div className="erp-filter-bar">
              <div className="erp-search-box">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search by name, email, employee ID, mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="erp-search-input"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="erp-select"
              >
                <option value="">All Statuses (সকল স্ট্যাটাস)</option>
                <option value="ACTIVE">Active (সক্রিয়)</option>
                <option value="INACTIVE">Inactive (নিষ্ক্রিয়)</option>
                <option value="SUSPENDED">Suspended (স্থগিত)</option>
                <option value="LOCKED">Locked (লক করা)</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="erp-select"
              >
                <option value="">All Roles (সকল রোল)</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.roleName}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleSubmoduleChange('create-user')}
                className="erp-btn erp-btn--primary"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add User
              </button>
            </div>

            {/* Users Table */}
            <div className="erp-card mt-4">
              <div className="erp-table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Employee ID & Dept</th>
                      <th>Role & Scope</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          No users found matching current filters.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => {
                        const roleObj = typeof user.roleId === 'object' ? user.roleId : null;
                        const roleName = roleObj?.roleName || 'Staff Member';

                        return (
                          <tr key={user._id}>
                            <td>
                              <div className="flex items-center space-x-3">
                                <div className="erp-avatar">
                                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900">{user.fullName}</div>
                                  <div className="text-xs text-slate-500">{user.email}</div>
                                  {user.username && (
                                    <div className="text-xs text-emerald-700">@{user.username}</div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="font-medium text-slate-800">
                                {user.employeeId || '—'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {user.department || 'General'} • {user.designation || 'Staff'}
                              </div>
                            </td>

                            <td>
                              <span className="erp-badge erp-badge--primary mb-1 inline-block">
                                {roleName}
                              </span>
                              <div className="text-xs text-slate-500">
                                {user.authorizedOrganizations?.length || 0} Org(s) Allowed
                              </div>
                            </td>

                            <td>
                              <span
                                className={`erp-status-badge erp-status-badge--${user.status?.toLowerCase() || (user.isActive ? 'active' : 'inactive')}`}
                              >
                                {user.status || (user.isActive ? 'ACTIVE' : 'INACTIVE')}
                              </span>
                              {user.status === 'LOCKED' && (
                                <button
                                  onClick={() => handleUnlockUser(user._id)}
                                  className="text-xs text-amber-600 block mt-1 hover:underline font-medium"
                                >
                                  Unlock Now
                                </button>
                              )}
                            </td>

                            <td className="text-sm text-slate-500">
                              {user.lastLogin
                                ? new Date(user.lastLogin).toLocaleDateString()
                                : 'Never'}
                            </td>

                            <td className="text-right">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    handleSubmoduleChange('user-profile');
                                  }}
                                  className="erp-action-btn"
                                  title="View User Profile"
                                >
                                  <Eye className="w-4 h-4 text-slate-600" />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowResetPasswordModal(true);
                                  }}
                                  className="erp-action-btn"
                                  title="Reset Password"
                                >
                                  <KeyRound className="w-4 h-4 text-amber-600" />
                                </button>

                                {user.status === 'ACTIVE' ? (
                                  <button
                                    onClick={() => handleStatusChange(user._id, 'SUSPENDED')}
                                    className="erp-action-btn"
                                    title="Suspend User"
                                  >
                                    <UserX className="w-4 h-4 text-orange-600" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusChange(user._id, 'ACTIVE')}
                                    className="erp-action-btn"
                                    title="Activate User"
                                  >
                                    <UserCheck className="w-4 h-4 text-emerald-600" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 3: CREATE USER */}
        {activeSubmodule === 'create-user' && (
          <div className="erp-user-pane">
            <div className="erp-card max-w-4xl mx-auto">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <UserPlus className="w-5 h-5 mr-2 inline text-emerald-700" />
                  Onboard New User / Staff Member (নতুন কর্মকর্তা নিবন্ধন)
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Create credentials, assign enterprise role, and define allowed company scopes.
                </p>
              </div>

              <form onSubmit={handleCreateUser} className="erp-card__body">
                <div className="erp-form-grid">
                  <div className="erp-form-group">
                    <label className="erp-label">
                      Full Name (পূর্ণ নাম) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserForm.fullName}
                      onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                      placeholder="e.g. Md. Ashraful Islam"
                      className="erp-input"
                    />
                  </div>

                  <div className="erp-form-group">
                    <label className="erp-label">Username (ইউজারনেম)</label>
                    <input
                      type="text"
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                      placeholder="e.g. ashraful_sales"
                      className="erp-input"
                    />
                  </div>

                  <div className="erp-form-group">
                    <label className="erp-label">
                      Official Email (ইমেইল) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      placeholder="ashraful@sunbird.com"
                      className="erp-input"
                    />
                  </div>

                  <div className="erp-form-group">
                    <label className="erp-label">
                      Mobile Number (মোবাইল নম্বর) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={newUserForm.mobile}
                      onChange={(e) => setNewUserForm({ ...newUserForm, mobile: e.target.value })}
                      placeholder="+8801700123456"
                      className="erp-input"
                    />
                  </div>

                  <div className="erp-form-group">
                    <label className="erp-label">
                      Temporary Password (প্রাথমিক পাসওয়ার্ড) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="erp-input"
                    />
                  </div>

                  <div className="erp-form-group">
                    <label className="erp-label">Employee ID (এমপ্লয়ি আইডি)</label>
                    <input
                      type="text"
                      value={newUserForm.employeeId}
                      onChange={(e) => setNewUserForm({ ...newUserForm, employeeId: e.target.value })}
                      placeholder="e.g. EMP-1042"
                      className="erp-input"
                    />
                  </div>

                  <div className="erp-form-group">
                    <label className="erp-label">Department (বিভাগ)</label>
                    <select
                      value={newUserForm.department}
                      onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                      className="erp-select"
                    >
                      <option value="Sales & Marketing">Sales & Marketing (বিক্রয় ও বিপণন)</option>
                      <option value="Accounts & Finance">Accounts & Finance (হিসাব ও অর্থ)</option>
                      <option value="Inventory & Warehouse">Inventory & Warehouse (গুদাম ও মজুদ)</option>
                      <option value="Procurement & Imports">Procurement & Imports (সংগ্রহ ও আমদানি)</option>
                      <option value="Biomedical Engineering">Biomedical Engineering (বায়োমেডিকেল)</option>
                      <option value="Human Resources">Human Resources (মানবসম্পদ)</option>
                      <option value="Administration">Administration (প্রশাসন)</option>
                      <option value="Customer Support">Customer Support (কাস্টমার সাপোর্ট)</option>
                    </select>
                  </div>

                  <div className="erp-form-group">
                    <label className="erp-label">Designation (পদবী)</label>
                    <input
                      type="text"
                      value={newUserForm.designation}
                      onChange={(e) => setNewUserForm({ ...newUserForm, designation: e.target.value })}
                      placeholder="e.g. Senior Medical Equipment Specialist"
                      className="erp-input"
                    />
                  </div>

                  <div className="erp-form-group">
                    <label className="erp-label">Assign RBAC Role (রোল নির্ধারণ)</label>
                    <select
                      value={newUserForm.roleId}
                      onChange={(e) => setNewUserForm({ ...newUserForm, roleId: e.target.value })}
                      className="erp-select"
                    >
                      <option value="">Select a Role...</option>
                      {roles.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.roleName} {r.isSystemRole ? '(System Role)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="erp-form-group">
                    <label className="erp-label">Default Organization (ডিফল্ট কোম্পানি)</label>
                    <select
                      value={newUserForm.defaultOrganizationId}
                      onChange={(e) =>
                        setNewUserForm({ ...newUserForm, defaultOrganizationId: e.target.value })
                      }
                      className="erp-select"
                    >
                      <option value="">Select Primary Organization...</option>
                      {organizations.map((org) => (
                        <option key={org._id} value={org._id}>
                          {org.displayName} ({org.organizationCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="erp-form-group mt-6">
                  <label className="erp-label">
                    Authorized Companies / Tenancy Scope (অনুমোদিত কোম্পানি সমূহ)
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Check the organizations this user is permitted to switch between:
                  </p>
                  <div className="erp-checkbox-grid">
                    {organizations.map((org) => {
                      const isChecked = newUserForm.authorizedOrganizations.includes(org._id);
                      return (
                        <label key={org._id} className="erp-checkbox-label">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let next: string[];
                              if (e.target.checked) {
                                next = [...newUserForm.authorizedOrganizations, org._id];
                              } else {
                                next = newUserForm.authorizedOrganizations.filter(
                                  (id) => id !== org._id
                                );
                              }
                              setNewUserForm({
                                ...newUserForm,
                                authorizedOrganizations: next,
                              });
                            }}
                          />
                          <span className="ml-2 font-medium text-slate-800">
                            {org.displayName}{' '}
                            <span className="text-xs text-slate-500">({org.organizationCode})</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleSubmoduleChange('user-list')}
                    className="erp-btn erp-btn--outline"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="erp-btn erp-btn--primary">
                    <UserPlus className="w-4 h-4 mr-2 inline" />
                    Save & Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUBMODULE 4: USER PROFILE */}
        {activeSubmodule === 'user-profile' && (
          <div className="erp-user-pane">
            {selectedUser ? (
              <div className="erp-grid-2-col">
                <div className="erp-card">
                  <div className="erp-card__header flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="erp-avatar erp-avatar--lg">
                        {selectedUser.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedUser.fullName}</h2>
                        <p className="text-sm text-slate-500">
                          {selectedUser.designation || 'Staff'} • {selectedUser.department || 'General'}
                        </p>
                        <span
                          className={`erp-status-badge erp-status-badge--${selectedUser.status.toLowerCase()} mt-2 inline-block`}
                        >
                          {selectedUser.status}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowResetPasswordModal(true)}
                      className="erp-btn erp-btn--outline text-amber-700"
                    >
                      <KeyRound className="w-4 h-4 mr-1 inline" />
                      Reset Password
                    </button>
                  </div>

                  <div className="erp-card__body">
                    <div className="erp-info-grid">
                      <div className="erp-info-item">
                        <span className="erp-info-label">Email Address</span>
                        <span className="erp-info-value">{selectedUser.email}</span>
                      </div>
                      <div className="erp-info-item">
                        <span className="erp-info-label">Mobile Number</span>
                        <span className="erp-info-value">{selectedUser.mobile}</span>
                      </div>
                      <div className="erp-info-item">
                        <span className="erp-info-label">Username</span>
                        <span className="erp-info-value">@{selectedUser.username || 'unassigned'}</span>
                      </div>
                      <div className="erp-info-item">
                        <span className="erp-info-label">Employee ID</span>
                        <span className="erp-info-value">{selectedUser.employeeId || 'N/A'}</span>
                      </div>
                      <div className="erp-info-item">
                        <span className="erp-info-label">User Type</span>
                        <span className="erp-info-value">{selectedUser.userType}</span>
                      </div>
                      <div className="erp-info-item">
                        <span className="erp-info-label">Failed Logins</span>
                        <span className="erp-info-value font-semibold text-red-600">
                          {selectedUser.failedLoginAttempts || 0} attempts
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2">
                        Assigned Organization Access (অনুমোদিত কোম্পানি)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.authorizedOrganizations && selectedUser.authorizedOrganizations.length > 0 ? (
                          selectedUser.authorizedOrganizations.map((o: any, idx: number) => (
                            <span key={idx} className="erp-badge erp-badge--outline">
                              <Building className="w-3 h-3 mr-1 inline" />
                              {typeof o === 'object' ? o.displayName || o.organizationCode : o}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">All / Default scope</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                      <button
                        onClick={() => handleRevokeSessions(selectedUser._id)}
                        className="erp-btn erp-btn--outline text-red-700 hover:bg-red-50"
                      >
                        <Lock className="w-4 h-4 mr-2 inline" />
                        Revoke All Sessions
                      </button>

                      {selectedUser.status === 'LOCKED' && (
                        <button
                          onClick={() => handleUnlockUser(selectedUser._id)}
                          className="erp-btn erp-btn--primary bg-amber-600 hover:bg-amber-700"
                        >
                          <Unlock className="w-4 h-4 mr-2 inline" />
                          Unlock Account
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Sessions & History for User */}
                <div className="erp-card">
                  <div className="erp-card__header">
                    <h3 className="erp-card__title">
                      <Laptop className="w-5 h-5 mr-2 inline text-emerald-700" />
                      Active Live Sessions ({userSessions.length})
                    </h3>
                  </div>
                  <div className="erp-card__body">
                    {userSessions.length === 0 ? (
                      <p className="text-sm text-slate-500 py-6 text-center">
                        No active token sessions currently logged in.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {userSessions.map((s) => (
                          <div key={s._id} className="p-3 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-slate-800">
                                IP: {s.ipAddress || '127.0.0.1'}
                              </div>
                              <div className="text-xs text-slate-500 truncate max-w-xs">
                                {s.userAgent || 'Web Browser'}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                Issued: {new Date(s.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <span className="erp-badge erp-badge--green">Active</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="erp-empty-state">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700">No User Selected</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Select a user from the User List to inspect their profile and active credentials.
                </p>
                <button
                  onClick={() => handleSubmoduleChange('user-list')}
                  className="erp-btn erp-btn--primary mt-4"
                >
                  Go to User List
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUBMODULE 5: ROLE MANAGEMENT */}
        {activeSubmodule === 'role-management' && (
          <div className="erp-user-pane">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Role Management & RBAC Definitions
                </h2>
                <p className="text-sm text-slate-500">
                  17 Enterprise standard roles and custom roles with granular permission assignments.
                </p>
              </div>
              <button
                onClick={handleSeedStandardRoles}
                className="erp-btn erp-btn--secondary"
              >
                <Shield className="w-4 h-4 mr-2 inline text-amber-600" />
                Seed Standard 17 Roles
              </button>
            </div>

            <div className="erp-grid-3-col">
              {roles.map((role) => (
                <div key={role._id} className="erp-role-card">
                  <div className="erp-role-card__header flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{role.roleName}</h3>
                      <div className="text-xs text-emerald-700 font-mono mt-0.5">@{role.slug}</div>
                    </div>
                    {role.isSystemRole ? (
                      <span className="erp-badge erp-badge--amber">System Role</span>
                    ) : (
                      <span className="erp-badge erp-badge--outline">Custom</span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 my-3 min-h-[40px] line-clamp-2">
                    {role.description || 'No description provided.'}
                  </p>

                  <div className="erp-role-card__meta flex justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <span>
                      <strong>{role.permissions?.length || 0}</strong> Modules Allowed
                    </span>
                    <span>
                      <strong>{role.assignedUsersCount || 0}</strong> Users Assigned
                    </span>
                  </div>

                  <div className="erp-role-card__actions flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        handleSelectRoleForMatrix(role);
                        handleSubmoduleChange('permission-management');
                      }}
                      className="erp-btn erp-btn--sm erp-btn--outline text-emerald-800"
                    >
                      <Sliders className="w-3.5 h-3.5 mr-1 inline" />
                      Permissions
                    </button>

                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setSelectedRole(role);
                          setDuplicateRoleName(`${role.roleName} (Copy)`);
                          setDuplicateRoleSlug(`${role.slug}_copy`);
                          setShowDuplicateRoleModal(true);
                        }}
                        className="erp-action-btn"
                        title="Duplicate Role"
                      >
                        <Copy className="w-4 h-4 text-slate-600" />
                      </button>

                      {!role.isSystemRole && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="erp-action-btn text-red-600"
                          title="Delete Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMODULE 6: PERMISSION MANAGEMENT (VISUAL MATRIX) */}
        {activeSubmodule === 'permission-management' && (
          <div className="erp-user-pane">
            <div className="erp-matrix-header flex flex-wrap justify-between items-center mb-6 p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="erp-label text-xs uppercase text-slate-400">Target Role</label>
                  <select
                    value={selectedRole?._id || ''}
                    onChange={(e) => {
                      const r = roles.find((item) => item._id === e.target.value);
                      if (r) handleSelectRoleForMatrix(r);
                    }}
                    className="erp-select font-semibold text-slate-900"
                  >
                    {roles.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.roleName} {r.isSystemRole ? '★ (System Protected)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRole && (
                  <div className="hidden md:block">
                    <div className="text-sm text-slate-600">{selectedRole.description}</div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-3 sm:mt-0">
                <button
                  onClick={handleSavePermissionMatrix}
                  disabled={loading}
                  className="erp-btn erp-btn--primary"
                >
                  <Check className="w-4 h-4 mr-1 inline" />
                  Save Permission Matrix
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="erp-card overflow-hidden">
              <div className="erp-table-responsive">
                <table className="erp-matrix-table">
                  <thead>
                    <tr>
                      <th className="w-72">Enterprise Module (মডিউল)</th>
                      <th>Granular Action Privileges (অনুমোদিত অ্যাকশনসমূহ)</th>
                      <th className="w-36 text-center">Quick Presets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissionDefs.map((mod) => {
                      const activeActions = editingPermissions[mod.moduleId] || [];

                      return (
                        <tr key={mod.moduleId}>
                          <td className="align-top font-medium text-slate-900">
                            <div className="font-bold text-slate-800">{mod.moduleNameEn}</div>
                            <div className="text-xs text-emerald-700">{mod.moduleNameBn}</div>
                            <div className="text-xs text-slate-500 mt-1 leading-snug">
                              {mod.description}
                            </div>
                          </td>

                          <td className="align-top">
                            <div className="flex flex-wrap gap-2 py-1">
                              {mod.actions.map((act) => {
                                const isChecked = activeActions.includes(act.action);

                                return (
                                  <button
                                    key={act.action}
                                    type="button"
                                    onClick={() => handleTogglePermission(mod.moduleId, act.action)}
                                    className={`erp-matrix-pill ${
                                      isChecked
                                        ? act.isDangerous
                                          ? 'erp-matrix-pill--danger-active'
                                          : 'erp-matrix-pill--active'
                                        : 'erp-matrix-pill--inactive'
                                    }`}
                                    title={`${act.actionLabelEn} (${act.actionLabelBn})`}
                                  >
                                    <span className="erp-matrix-pill__check">
                                      {isChecked ? <Check className="w-3 h-3" /> : null}
                                    </span>
                                    <span>{act.action}</span>
                                    <span className="text-[10px] opacity-70 ml-1">
                                      ({act.actionLabelBn})
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          <td className="align-top text-center">
                            <div className="flex flex-col space-y-1">
                              <button
                                type="button"
                                onClick={() => handleSelectAllModule(mod.moduleId)}
                                className="text-xs text-emerald-700 hover:underline font-medium"
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeselectAllModule(mod.moduleId)}
                                className="text-xs text-slate-400 hover:text-red-600"
                              >
                                Clear All
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 7: ORGANIZATION ACCESS */}
        {activeSubmodule === 'organization-access' && (
          <div className="erp-user-pane">
            <div className="erp-card max-w-3xl mx-auto">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <Building className="w-5 h-5 mr-2 inline text-emerald-700" />
                  Multi-Organization Tenancy & Scope Access
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Assign company access permissions and define primary login company for users.
                </p>
              </div>

              <div className="erp-card__body">
                <div className="erp-form-group mb-6">
                  <label className="erp-label">Select Staff Member</label>
                  <select
                    value={selectedUser?._id || ''}
                    onChange={(e) => {
                      const u = users.find((item) => item._id === e.target.value);
                      if (u) setSelectedUser(u);
                    }}
                    className="erp-select"
                  >
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUser && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800">
                      Authorized Organizations for {selectedUser.fullName}
                    </h4>

                    <div className="erp-org-select-list space-y-2">
                      {organizations.map((org) => {
                        const orgIds = selectedUser.authorizedOrganizations?.map((o: any) =>
                          typeof o === 'object' ? o._id : o
                        ) || [];
                        const isAuthorized = orgIds.includes(org._id);
                        const isDefault =
                          selectedUser.defaultOrganizationId === org._id ||
                          selectedUser.defaultOrganizationId?._id === org._id;

                        return (
                          <div
                            key={org._id}
                            className={`p-4 rounded border flex justify-between items-center ${
                              isAuthorized ? 'bg-emerald-50/40 border-emerald-300' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={isAuthorized}
                                onChange={async (e) => {
                                  let next: string[];
                                  if (e.target.checked) {
                                    next = [...orgIds, org._id];
                                  } else {
                                    next = orgIds.filter((id) => id !== org._id);
                                  }
                                  try {
                                    const updated = await userManagementService.assignOrganizations(
                                      selectedUser._id,
                                      next,
                                      selectedUser.defaultOrganizationId
                                    );
                                    setSelectedUser(updated);
                                    showToast('Updated organization authorization', 'success');
                                  } catch (err: any) {
                                    showToast(err.message || 'Error updating orgs', 'error');
                                  }
                                }}
                              />
                              <div>
                                <div className="font-semibold text-slate-900">{org.displayName}</div>
                                <div className="text-xs text-slate-500">
                                  Code: {org.organizationCode} • Legal: {org.legalName}
                                </div>
                              </div>
                            </div>

                            {isAuthorized && (
                              <div>
                                {isDefault ? (
                                  <span className="erp-badge erp-badge--primary">Primary Default</span>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const updated = await userManagementService.assignOrganizations(
                                          selectedUser._id,
                                          orgIds,
                                          org._id
                                        );
                                        setSelectedUser(updated);
                                        showToast(`Set ${org.displayName} as default`, 'success');
                                      } catch (err: any) {
                                        showToast(err.message || 'Error setting default', 'error');
                                      }
                                    }}
                                    className="text-xs text-emerald-700 hover:underline font-medium"
                                  >
                                    Set as Primary
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 8: MODULE ACCESS CONTROL */}
        {activeSubmodule === 'module-access-control' && (
          <div className="erp-user-pane">
            <div className="erp-card">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <Sliders className="w-5 h-5 mr-2 inline text-emerald-700" />
                  ERP Enterprise Modules Catalog & Coverage
                </h3>
                <p className="text-sm text-slate-500">
                  Comprehensive security boundaries protecting medical equipment, pharmacy batches, GL accounting & payroll.
                </p>
              </div>

              <div className="erp-card__body">
                <div className="erp-grid-2-col">
                  {permissionDefs.map((mod) => (
                    <div key={mod.moduleId} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900">{mod.moduleNameEn}</h4>
                          <span className="text-xs text-emerald-700 font-medium">
                            {mod.moduleNameBn}
                          </span>
                        </div>
                        <span className="erp-badge erp-badge--outline">
                          {mod.actions.length} actions
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">{mod.description}</p>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {mod.actions.map((act) => (
                          <span
                            key={act.action}
                            className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                              act.isDangerous ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {act.action}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 9: LOGIN HISTORY */}
        {activeSubmodule === 'login-history' && (
          <div className="erp-user-pane">
            <div className="erp-card">
              <div className="erp-card__header flex justify-between items-center">
                <h3 className="erp-card__title">
                  <History className="w-5 h-5 mr-2 inline text-emerald-700" />
                  Real-time Authentication Audit Trail (লগইন ইতিহাস)
                </h3>
                <span className="text-xs text-slate-500">
                  Showing last {loginHistory.length} events
                </span>
              </div>

              <div className="erp-table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Account / User</th>
                      <th>IP Address</th>
                      <th>Client / Device</th>
                      <th>Status</th>
                      <th>Reason / Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          No authentication attempts logged for this user yet.
                        </td>
                      </tr>
                    ) : (
                      loginHistory.map((log) => (
                        <tr key={log._id}>
                          <td className="text-sm text-slate-600">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="font-medium text-slate-800">
                            {log.email || selectedUser?.email}
                          </td>
                          <td className="font-mono text-xs text-slate-600">{log.ipAddress || '—'}</td>
                          <td className="text-xs text-slate-500 max-w-xs truncate">
                            {log.userAgent || 'Web Browser'}
                          </td>
                          <td>
                            <span
                              className={`erp-status-badge erp-status-badge--${
                                log.status === 'SUCCESS' ? 'active' : log.status === 'BLOCKED' ? 'suspended' : 'locked'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="text-xs text-slate-500">{log.failureReason || 'Authorized session'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 10: ACTIVE SESSIONS */}
        {activeSubmodule === 'active-sessions' && (
          <div className="erp-user-pane">
            <div className="erp-card">
              <div className="erp-card__header flex justify-between items-center">
                <div>
                  <h3 className="erp-card__title">
                    <Laptop className="w-5 h-5 mr-2 inline text-emerald-700" />
                    Active Token Sessions & Device Management
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage live JWT sessions and invalidate compromised browser sessions.
                  </p>
                </div>

                {selectedUser && (
                  <button
                    onClick={() => handleRevokeSessions(selectedUser._id)}
                    className="erp-btn erp-btn--outline text-red-700 hover:bg-red-50"
                  >
                    Revoke All Sessions for {selectedUser.fullName}
                  </button>
                )}
              </div>

              <div className="erp-card__body">
                {userSessions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No active sessions found for selected user.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userSessions.map((session) => (
                      <div
                        key={session._id}
                        className="p-4 border border-slate-200 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium text-slate-900">
                            Device: {session.userAgent || 'Mozilla Web Client'}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-1">
                            IP: {session.ipAddress || '127.0.0.1'} • Created:{' '}
                            {new Date(session.createdAt).toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-400">
                            Expires: {new Date(session.expiresAt).toLocaleString()}
                          </div>
                        </div>

                        <span className="erp-badge erp-badge--green">Live Active</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 11: USER ACTIVITY LOGS */}
        {activeSubmodule === 'user-activity-logs' && (
          <div className="erp-user-pane">
            <div className="erp-card">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <Activity className="w-5 h-5 mr-2 inline text-emerald-700" />
                  User Administration Audit Trail (কার্যক্রম অডিট)
                </h3>
              </div>
              <div className="p-6 text-sm text-slate-600">
                <p>
                  All mutations on User accounts, status changes, role assignments, password resets,
                  and permission matrix updates are permanently written to the immutable{' '}
                  <code className="text-emerald-800 font-mono">audit_logs</code> database collection.
                </p>
                <div className="mt-4 p-4 bg-slate-50 rounded border border-slate-200">
                  <div className="font-semibold text-slate-800">Security Guarantee:</div>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-slate-600">
                    <li>Passwords hashed with 12-round bcrypt salt before saving.</li>
                    <li>Account lockout automatically triggers after 5 consecutive failed login attempts.</li>
                    <li>Session revocation immediately invalidates all active JWT refresh tokens.</li>
                    <li>System roles (Super Administrator, System Administrator) cannot be deleted.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 12: PASSWORD & SECURITY POLICIES */}
        {activeSubmodule === 'security-policies' && (
          <div className="erp-user-pane">
            <div className="erp-card max-w-3xl mx-auto">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <Lock className="w-5 h-5 mr-2 inline text-emerald-700" />
                  Enterprise Password & Security Policies
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  System-wide authentication safeguards complying with enterprise standards.
                </p>
              </div>

              <div className="erp-card__body space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-slate-900">Password Hashing Algorithm</h4>
                    <p className="text-xs text-slate-500">Industry standard bcrypt with 12 salt rounds</p>
                  </div>
                  <span className="erp-badge erp-badge--green">Enforced</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-slate-900">Failed Login Lockout Threshold</h4>
                    <p className="text-xs text-slate-500">Locks account after 5 consecutive invalid attempts for 30 minutes</p>
                  </div>
                  <span className="erp-badge erp-badge--amber">5 Attempts / 30m</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-slate-900">Session Token Lifetime</h4>
                    <p className="text-xs text-slate-500">Short-lived access token + 7-day revolving refresh token</p>
                  </div>
                  <span className="erp-badge erp-badge--primary">7 Days</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-slate-900">Force Password Change on First Login</h4>
                    <p className="text-xs text-slate-500">Requires newly onboarded staff to change admin-generated passwords</p>
                  </div>
                  <span className="erp-badge erp-badge--green">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: RESET PASSWORD */}
      {showResetPasswordModal && selectedUser && (
        <div className="erp-modal-overlay">
          <div className="erp-modal">
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">
                <KeyRound className="w-5 h-5 mr-2 inline text-amber-600" />
                Reset Password for {selectedUser.fullName}
              </h3>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="erp-modal__body">
              <p className="text-sm text-slate-600 mb-4">
                Enter a new secure password. This action will immediately revoke all current active
                sessions for this user.
              </p>

              <div className="erp-form-group">
                <label className="erp-label">New Password (নতুন পাসওয়ার্ড)</label>
                <input
                  type="password"
                  minLength={6}
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  placeholder="Minimum 6 characters..."
                  className="erp-input"
                />
              </div>

              <label className="erp-checkbox-label mt-3">
                <input
                  type="checkbox"
                  checked={forceChangeChecked}
                  onChange={(e) => setForceChangeChecked(e.target.checked)}
                />
                <span className="ml-2 text-sm text-slate-700">
                  Force password change on next login (পরবর্তী লগইনে পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক)
                </span>
              </label>
            </div>

            <div className="erp-modal__footer">
              <button
                type="button"
                onClick={() => setShowResetPasswordModal(false)}
                className="erp-btn erp-btn--outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePasswordReset}
                className="erp-btn erp-btn--primary bg-amber-600 hover:bg-amber-700"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DUPLICATE ROLE */}
      {showDuplicateRoleModal && selectedRole && (
        <div className="erp-modal-overlay">
          <div className="erp-modal">
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">
                <Copy className="w-5 h-5 mr-2 inline text-emerald-700" />
                Duplicate Role: {selectedRole.roleName}
              </h3>
              <button
                onClick={() => setShowDuplicateRoleModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="erp-modal__body">
              <div className="erp-form-group">
                <label className="erp-label">New Role Name (নতুন রোলের নাম)</label>
                <input
                  type="text"
                  required
                  value={duplicateRoleName}
                  onChange={(e) => setDuplicateRoleName(e.target.value)}
                  className="erp-input"
                />
              </div>

              <div className="erp-form-group mt-3">
                <label className="erp-label">Role Slug / Identifier (রোল স্লাগ)</label>
                <input
                  type="text"
                  value={duplicateRoleSlug}
                  onChange={(e) => setDuplicateRoleSlug(e.target.value)}
                  className="erp-input font-mono"
                />
              </div>
            </div>

            <div className="erp-modal__footer">
              <button
                type="button"
                onClick={() => setShowDuplicateRoleModal(false)}
                className="erp-btn erp-btn--outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDuplicateRole}
                className="erp-btn erp-btn--primary"
              >
                Duplicate Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErpUserManagementView;

