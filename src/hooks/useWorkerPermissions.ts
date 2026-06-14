import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Permissions = Record<string, boolean>;

export function useWorkerPermissions(employeeId: string | null) {
  const [permissions, setPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) { setLoading(false); return; }

    supabase
      .from('worker_permissions')
      .select('permissions')
      .eq('employee_id', employeeId)
      .single()
      .then(({ data }) => {
        setPermissions(data?.permissions || {});
        setLoading(false);
      });
  }, [employeeId]);

  const can = (permission: string): boolean => {
    if (permission === 'create_sale') return permissions['create_sale'] !== false;
    if (permission === 'view_inventory') return permissions['view_inventory'] !== false;
    return !!permissions[permission];
  };

  return { permissions, can, loading };
}
