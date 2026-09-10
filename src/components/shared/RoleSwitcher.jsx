import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, ROLE_DEFINITIONS } from '../../utils/rbac';

export default function RoleSwitcher() {
  const { currentRole, isSuperAdmin } = useAuth();

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-400">Current Role:</span>
      <span className="px-2 py-0.5 rounded font-bold bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 uppercase">
        {currentRole}
      </span>
    </div>
  );
}
