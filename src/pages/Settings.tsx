import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Globe,
  Database,
  User,
  Shield,
  Bell,
  Download,
  Upload,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Printer,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase, getUserProfile, getSystemInfo, getStores, updateUserProfile } from '@/lib/supabaseClient';

export default function Settings() {
  const { toast } = useToast();
  const { language, setLanguage, t, isRTL } = useLanguage();

  const [settings, setSettings] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: true,
    autoBackup: true,
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState({ message: '', percent: 0 });

  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    database: 'local',
    lastBackup: '',
    diskSpace: 'N/A',
    uptime: 'N/A',
    networkStatus: 'disconnected'
  });

  const [fetchError, setFetchError] = useState<string | null>(null);

  const [storeSettings, setStoreSettings] = useState({
    id: '',
    name: '',
    display_name: '',
    logo_data: ''
  });

  const [stores, setStores] = useState<{id: string; name: string; display_name?: string; logo_data?: string}[]>([]);

  // Remove API_URL since we're using Supabase

  useEffect(() => {
    fetchSystemInfo();
    fetchBackupHistory();
    fetchUserInfo();
    fetchStoreSettings();
  }, []);

  const fetchStoreSettings = async () => {
    try {
      const data = await getStores();
      setStores(data || []);

      if (data && data.length > 0) {
        const selected = data[0];
        setStoreSettings({
          id: selected.id,
          name: selected.name,
          display_name: selected.display_name || selected.name,
          logo_data: selected.logo_data || ''
        });
      }
      setFetchError(null);
    } catch (err) {
      console.error('Failed to fetch store settings:', err);
      setFetchError('Impossible de récupérer la liste des magasins. Utilisation des paramètres locaux.');
      const localName = localStorage.getItem('storeName') || 'Auto Parts';
      setStoreSettings(prev => ({
        ...prev,
        name: localName,
        display_name: localStorage.getItem('storeDisplayName') || localName,
        logo_data: localStorage.getItem('storeLogoData') || ''
      }));
    }
  };

  const fetchUserInfo = async () => {
    try {
      const userData = await getUserProfile();
      if (userData) {
        setSettings(prev => ({
          ...prev,
          username: userData.username || '',
          email: userData.email || '',
        }));
      }
      setFetchError(null);
    } catch (err) {
      console.error("❌ Failed to fetch user info:", err);
      setFetchError('Impossible de charger le profil utilisateur.');
      const savedName = localStorage.getItem('username');
      const savedEmail = localStorage.getItem('userEmail');
      if (savedName || savedEmail) {
        setSettings(prev => ({
          ...prev,
          username: savedName || prev.username,
          email: savedEmail || prev.email,
        }));
      }
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations du compte.",
        variant: "destructive"
      });
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const systemData = await getSystemInfo();
      setSystemInfo(prev => ({
        ...prev,
        ...systemData
      }));
      setFetchError(null);
    } catch (err) {
      console.error('Failed to fetch system info:', err);
      setFetchError('Impossible de charger les informations système. Mode offline activé.');
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations système.",
        variant: "destructive"
      });
      setSystemInfo(prev => ({
        ...prev,
        database: 'Supabase',
        diskSpace: 'N/A',
        uptime: 'N/A',
        networkStatus: 'disconnected'
      }));
    }
  };

  const fetchBackupHistory = async () => {
    // This would require a new backend endpoint to list backup files
    // For now, we'll use a placeholder
    setBackupHistory([]);
  };
  
  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const handleLanguageChange = (value) => {
    setLanguage(value);
    setSettings(prev => ({ ...prev, language: value }));
    toast({
      title: value === 'ar' ? "تم تغيير اللغة" : "Langue modifiée",
      description: value === 'ar' ? "تم تبديل الواجهة إلى العربية" : "Interface basculée en Français",
    });
  };

  const handleBackup = async () => {
    toast({
      title: "Sauvegarde en cours...",
      description: "Récupération des données depuis la base de données...",
    });

    try {
      const tables = [
        'products', 'suppliers', 'categories', 'stores',
        'invoices', 'invoice_items', 'employees', 'shelvings',
        'worker_permissions', 'payments'
      ];

      const escapeSQL = (val: any): string => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'number') return String(val);
        return `'${String(val).replace(/'/g, "''")}'`;
      };

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const sqlLines: string[] = [
        `-- AutoParts Database Backup`,
        `-- Generated: ${now.toISOString()}`,
        `-- Version: 1.0`,
        ``,
      ];

      for (const table of tables) {
        const { data, error } = await supabase.from(table as any).select('*');
        if (error) {
          sqlLines.push(`-- Table: ${table} (ERREUR: ${error.message})`);
          sqlLines.push('');
          continue;
        }
        if (!data || data.length === 0) {
          sqlLines.push(`-- Table: ${table} (aucune donnée)`);
          sqlLines.push('');
          continue;
        }

        sqlLines.push(`-- Table: ${table} (${data.length} enregistrements)`);
        const columns = Object.keys(data[0]);
        for (const row of data) {
          const values = columns.map(col => escapeSQL((row as any)[col]));
          sqlLines.push(
            `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`
          );
        }
        sqlLines.push('');
      }

      const sqlContent = sqlLines.join('\n');
      const blob = new Blob([sqlContent], { type: 'text/sql' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${dateStr}.sql`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      const newBackup = {
        date: now.toLocaleString(),
        size: `${(sqlContent.length / 1024).toFixed(1)} KB`,
        status: 'success'
      };
      setBackupHistory(prev => [newBackup, ...prev]);

      toast({
        title: "Sauvegarde terminée",
        description: `Fichier backup-${dateStr}.sql téléchargé avec succès`,
      });
    } catch (err) {
      console.error("Backup failed:", err);
      toast({
        title: "Erreur de sauvegarde",
        description: "Échec de la création de la sauvegarde.",
        variant: "destructive"
      });
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreProgress({ message: 'Lecture du fichier de sauvegarde...', percent: 5 });

    try {
      // ── 1. Check auth state ──
      const { data: authData } = await supabase.auth.getSession();
      console.log('🔐 [RESTORE] Auth session:', authData.session ? `User ${authData.session.user.id} (${authData.session.user.email})` : 'NO SESSION');
      
      if (!authData.session) {
        throw new Error("Vous devez être connecté pour restaurer les données. Veuillez vous reconnecter.");
      }

      const fileText = await file.text();
      setRestoreProgress({ message: 'Analyse des données...', percent: 15 });

      let dataByTable: Record<string, Record<string, any>[]> = {};

      if (file.name.endsWith('.json') || fileText.trim().startsWith('{')) {
        dataByTable = parseJSONBackup(fileText);
      }
      if (Object.keys(dataByTable).length === 0) {
        dataByTable = parseSQLBackup(fileText);
      }

      const tableNames = Object.keys(dataByTable);
      if (tableNames.length === 0) {
        throw new Error("Le fichier téléversé ne contient aucune instruction d'insertion ou donnée valide.");
      }

      // ── 2. Log parsed data summary ──
      console.log('📊 [RESTORE] Parsed data summary:');
      for (const [table, rows] of Object.entries(dataByTable)) {
        console.log(`  - ${table}: ${rows.length} rows, columns: ${rows.length > 0 ? Object.keys(rows[0]).join(', ') : '(empty)'}`);
      }

      const TABLE_RESTORE_ORDER = [
        'stores', 'categories', 'suppliers', 'customers', 'shelvings',
        'products', 'employees', 'employee_stores', 'worker_permissions',
        'payments', 'invoices', 'invoice_items', 'users'
      ];

      const orderedTables = [
        ...TABLE_RESTORE_ORDER.filter(t => tableNames.includes(t)),
        ...tableNames.filter(t => !TABLE_RESTORE_ORDER.includes(t))
      ];

      // ── 3. Auto-discover actual DB columns for each table ──
      setRestoreProgress({ message: 'Vérification du schéma de la base de données...', percent: 18 });
      const dbColumnsByTable: Record<string, string[]> = {};
      const failedTables = new Set<string>();

      for (const tableName of orderedTables) {
        try {
          const { data: probeData, error: probeErr } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (probeErr) {
            console.warn(`⚠️ [RESTORE] Cannot probe table '${tableName}': ${probeErr.message}`);
            // Try an empty insert to discover columns from the error
            failedTables.add(tableName);
            continue;
          }

          if (probeData && probeData.length > 0) {
            dbColumnsByTable[tableName] = Object.keys(probeData[0]);
          } else {
            // Table is empty, try inserting a minimal row to discover columns
            // Use the columns from the backup data but filter via test upsert
            const backupCols = Object.keys(dataByTable[tableName]?.[0] || {});
            dbColumnsByTable[tableName] = backupCols; // Will be refined during upsert
          }
          console.log(`📋 [RESTORE] Table '${tableName}' DB columns: ${dbColumnsByTable[tableName]?.join(', ') || '(unknown)'}`);
        } catch (e) {
          console.warn(`⚠️ [RESTORE] Probe failed for '${tableName}'`);
          failedTables.add(tableName);
        }
      }

      // ── 4. Filter backup data to only include columns that exist in DB ──
      for (const tableName of orderedTables) {
        if (failedTables.has(tableName)) continue;
        const dbCols = dbColumnsByTable[tableName];
        if (!dbCols || dbCols.length === 0) continue;

        const backupRows = dataByTable[tableName];
        if (!backupRows || backupRows.length === 0) continue;

        const backupCols = Object.keys(backupRows[0]);
        const extraCols = backupCols.filter(c => !dbCols.includes(c));
        const missingCols = dbCols.filter(c => !backupCols.includes(c));

        if (extraCols.length > 0) {
          console.log(`🔧 [RESTORE] Table '${tableName}': Stripping ${extraCols.length} columns not in DB: ${extraCols.join(', ')}`);
          dataByTable[tableName] = backupRows.map(row => {
            const filtered: Record<string, any> = {};
            for (const col of backupCols) {
              if (!extraCols.includes(col)) {
                filtered[col] = row[col];
              }
            }
            return filtered;
          });
        }
        if (missingCols.length > 0) {
          console.log(`ℹ️ [RESTORE] Table '${tableName}': DB has ${missingCols.length} extra columns not in backup: ${missingCols.join(', ')}`);
        }
      }

      let totalRows = 0;
      orderedTables.forEach(t => { totalRows += (dataByTable[t]?.length || 0); });

      let restoredRows = 0;
      let errorCount = 0;
      const errorDetails: string[] = [];
      const succeededTables = new Set<string>();

      // ── 5. Clear existing data (reverse FK order: children first) ──
      setRestoreProgress({ message: 'Nettoyage des données existantes...', percent: 20 });
      const reversedTables = [...orderedTables].reverse();
      for (const tableName of reversedTables) {
        if (failedTables.has(tableName)) continue;
        try {
          // Delete all rows — neq filter on id with impossible value triggers full delete
          const { error: delErr } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (delErr) {
            console.warn(`⚠️ [RESTORE] Could not clear '${tableName}': ${delErr.message}`);
          } else {
            console.log(`🗑️ [RESTORE] Cleared table '${tableName}'`);
          }
        } catch (e) {
          console.warn(`⚠️ [RESTORE] Error clearing '${tableName}'`);
        }
      }

      // ── 6. Restore each table ──
      for (let tIndex = 0; tIndex < orderedTables.length; tIndex++) {
        const tableName = orderedTables[tIndex];
        const rows = dataByTable[tableName];
        if (!rows || rows.length === 0) continue;
        if (failedTables.has(tableName)) {
          console.warn(`⏭️ [RESTORE] Skipping '${tableName}' (probe failed)`);
          errorCount += rows.length;
          continue;
        }

        console.log(`\n🔄 [RESTORE] Starting table '${tableName}' (${rows.length} rows)...`);

        // Iterative test upsert — strip bad columns and null FKs in a loop
        let testPassed = false;
        for (let attempt = 0; attempt < 15; attempt++) {
          const currentRows = dataByTable[tableName];
          const testRow = { ...currentRows[0] };
          if ('created_by' in testRow) testRow.created_by = null;
          if (tableName === 'employees' && 'user_id' in testRow) testRow.user_id = null;

          const { error: testErr } = await supabase
            .from(tableName)
            .upsert([testRow], { onConflict: 'id' })
            .select('id');

          if (!testErr) {
            console.log(`✅ [RESTORE] Test upsert passed for '${tableName}' (attempt ${attempt + 1})`);
            testPassed = true;
            break;
          }

          console.warn(`⚠️ [RESTORE] Test attempt ${attempt + 1} failed for '${tableName}': ${testErr.message} (code: ${testErr.code})`);

          if (testErr.code === 'PGRST204') {
            // Column doesn't exist — strip it
            const colMatch = testErr.message.match(/Could not find the '(\w+)' column/);
            if (colMatch) {
              const badCol = colMatch[1];
              console.log(`🔧 [RESTORE] Stripping missing column '${badCol}' from '${tableName}'`);
              dataByTable[tableName] = currentRows.map(row => {
                const filtered = { ...row };
                delete filtered[badCol];
                return filtered;
              });
              continue; // Try again
            }
          } else if (testErr.code === '23503') {
            // FK violation — null out the FK column
            const fkMatch = testErr.message.match(/foreign key constraint "(\w+)_(\w+)_fkey"/);
            if (fkMatch) {
              const fkCol = fkMatch[2];
              console.log(`🔧 [RESTORE] Nulling FK column '${fkCol}' in '${tableName}'`);
              dataByTable[tableName] = currentRows.map(row => ({ ...row, [fkCol]: null }));
              continue; // Try again
            }
          }

          // Unknown/unrecoverable error
          errorDetails.push(`Table '${tableName}': ${testErr.message}`);
          errorCount += currentRows.length;
          break;
        }

        if (!testPassed) {
          console.error(`❌ [RESTORE] Giving up on table '${tableName}' after iterative fixes`);
          continue;
        }

        // Deduplicate rows by unique constraints before inserting
        let finalRows = dataByTable[tableName].map(row => {
          const cleaned = { ...row };
          if ('created_by' in cleaned) cleaned.created_by = null;
          if (tableName === 'employees' && 'user_id' in cleaned) cleaned.user_id = null;
          return cleaned;
        });

        // Deduplicate by 'id' (keep last)
        const seenIds = new Map<string, number>();
        finalRows.forEach((row, idx) => { if (row.id) seenIds.set(row.id, idx); });
        if (seenIds.size < finalRows.length) {
          const uniqueIndices = new Set(seenIds.values());
          const before = finalRows.length;
          finalRows = finalRows.filter((_, idx) => uniqueIndices.has(idx));
          console.log(`🔧 [RESTORE] '${tableName}': Deduplicated by id: ${before} → ${finalRows.length}`);
        }

        // For products, also deduplicate by barcode (keep last occurrence)
        if (tableName === 'products') {
          const seenBarcodes = new Map<string, number>();
          finalRows.forEach((row, idx) => {
            const bc = row.barcode;
            if (bc !== null && bc !== undefined && bc !== '') {
              seenBarcodes.set(String(bc), idx);
            }
          });
          const uniqueBcIndices = new Set(seenBarcodes.values());
          // Include rows with null/empty barcode + unique barcode rows
          const deduped = finalRows.filter((row, idx) => {
            const bc = row.barcode;
            if (bc === null || bc === undefined || bc === '') return true;
            return uniqueBcIndices.has(idx);
          });
          if (deduped.length < finalRows.length) {
            console.log(`🔧 [RESTORE] '${tableName}': Deduplicated by barcode: ${finalRows.length} → ${deduped.length}`);
            finalRows = deduped;
          }
        }

        // Batch inserts (tables were cleared, so use insert)
        const chunkSize = 50;
        let tableErrors = 0;

        for (let i = 0; i < finalRows.length; i += chunkSize) {
          const chunk = finalRows.slice(i, i + chunkSize);

          const percent = Math.min(95, Math.round(22 + (restoredRows / (totalRows || 1)) * 73));
          setRestoreProgress({
            message: `Restauration de '${tableName}' (${Math.min(i + chunkSize, finalRows.length)}/${finalRows.length})...`,
            percent
          });

          const { data: chunkData, error: chunkErr } = await supabase
            .from(tableName)
            .insert(chunk)
            .select('id');

          if (chunkErr) {
            console.warn(`⚠️ [RESTORE] Batch error in '${tableName}': ${chunkErr.message}, trying row-by-row...`);
            for (const row of chunk) {
              const { error: rowErr } = await supabase.from(tableName).upsert([row], { onConflict: 'id' }).select('id');
              if (rowErr) {
                // Last resort: try insert ignoring this row
                tableErrors++;
                errorCount++;
              } else {
                restoredRows++;
              }
            }
          } else {
            restoredRows += chunk.length;
          }
        }

        // Verify
        const { count } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
        console.log(`✅ [RESTORE] Table '${tableName}' done: ${finalRows.length - tableErrors} restored, DB has ${count ?? '?'} total rows.`);
        if (tableErrors === 0) succeededTables.add(tableName);
      }

      setRestoreProgress({ message: 'Restauration terminée !', percent: 100 });

      if (errorDetails.length > 0) {
        console.error('📋 [RESTORE] Error summary:', errorDetails);
      }

      const newBackupRecord = {
        date: new Date().toLocaleString(),
        size: `${(file.size / 1024).toFixed(1)} KB`,
        status: errorCount === 0 ? 'success' : 'partial'
      };
      setBackupHistory(prev => [newBackupRecord, ...prev]);

      if (errorCount > 0 && errorDetails.length > 0) {
        toast({
          title: "Restauration partielle",
          description: `${restoredRows} restaurés, ${errorCount} erreurs. Vérifiez la console (F12).`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Restauration terminée",
          description: `${restoredRows} enregistrements restaurés à travers ${succeededTables.size} tables.`,
        });
      }

      await fetchStoreSettings();

    } catch (err: any) {
      console.error("❌ [RESTORE] Fatal error:", err);
      toast({
        title: "Erreur de restauration",
        description: err.message || "Une erreur est survenue lors de la restauration.",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleAccountUpdate = async () => {
    try {
      // Only update username (email is managed by Supabase Auth)
      await updateUserProfile({
        username: settings.username
      });

      // Save to localStorage as backup
      localStorage.setItem('username', settings.username);
      localStorage.setItem('userEmail', settings.email);

      toast({
        title: "Informations sauvegardées",
        description: "Vos informations de compte ont été mises à jour.",
      });
    } catch (err) {
      console.error("Account update failed:", err);
      toast({
        title: "Erreur de mise à jour",
        description: "Échec de la mise à jour de votre compte.",
        variant: "destructive"
      });
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'Le fichier est trop volumineux. Taille maximale: 2MB',
        variant: 'destructive'
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier image valide',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setStoreSettings(prev => ({ ...prev, logo_data: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleStoreUpdate = async () => {
    if (!storeSettings.id) {
      toast({
        title: 'Erreur',
        description: 'Aucun magasin sélectionné',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Try to update with display_name and logo_data first
      const { error } = await supabase
        .from('stores')
        .update({
          name: storeSettings.name,
          display_name: storeSettings.display_name,
          logo_data: storeSettings.logo_data
        })
        .eq('id', storeSettings.id);

      if (error) {
        // If columns don't exist, try updating just the name
        console.warn('Display name/logo columns not found, updating name only:', error);
        const { error: fallbackError } = await supabase
          .from('stores')
          .update({
            name: storeSettings.name
          })
          .eq('id', storeSettings.id);

        if (fallbackError) throw fallbackError;

        toast({
          title: 'Magasin partiellement mis à jour',
          description: 'Nom mis à jour. Pour logo/affichage personnalisé, exécutez ADD_STORE_DISPLAY_LOGO.sql',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Magasin mis à jour',
          description: 'Nom et logo du magasin sauvegardés.',
        });
      }

      localStorage.setItem('storeName', storeSettings.name);
      localStorage.setItem('storeDisplayName', storeSettings.display_name || storeSettings.name);
      localStorage.setItem('storeLogoData', storeSettings.logo_data || '');

      await fetchStoreSettings();
    } catch (err) {
      console.error('Store update failed:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le magasin.',
        variant: 'destructive'
      });
    }
  };

  const handlePasswordChange = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (settings.newPassword.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: settings.newPassword
      });
      if (error) throw error;
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès",
      });
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error("Password change failed:", err);
      toast({
        title: "Erreur",
        description: "Échec de la modification du mot de passe.",
        variant: "destructive"
      });
    }
  };

  const handleTogglePassword = (key) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  function handleDownloadBackup(date: any): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            ⚙️ {t('settings_title')}
          </h1>
          <p className="text-slate-600">
            {language === 'ar'
              ? 'إدارة إعدادات التطبيق والحساب'
              : 'Gérez les paramètres de votre application et compte'}
          </p>
        </motion.div>
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <Button
            variant="outline"
            onClick={handleBackup}
            disabled={isRestoring}
            className="h-11 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            💾 {language === 'ar' ? 'نسخ احتياطي' : 'Sauvegarde'}
          </Button>
          <Button
            variant="outline"
            disabled={isRestoring}
            className="h-11 bg-white hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300 text-emerald-700 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <label htmlFor="file-upload" className="cursor-pointer flex items-center">
              📁 {language === 'ar' ? 'استعادة' : 'Restaurer'}
            </label>
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleRestore}
              accept=".sql,.json,.sqlite,.db,.backup"
              disabled={isRestoring}
            />
          </Button>
        </motion.div>

        {isRestoring && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-amber-600 animate-spin" />
                <span className="font-semibold text-amber-900">
                  {restoreProgress.message}
                </span>
              </div>
              <span className="font-bold text-amber-700">{restoreProgress.percent}%</span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-amber-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${restoreProgress.percent}%` }}
              />
            </div>
          </motion.div>
        )}

        {fetchError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6"
          >
            ⚠️ {fetchError}
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-12 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <TabsTrigger
                value="general"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all"
              >
                🌐 {language === 'ar' ? 'عام' : 'Général'}
              </TabsTrigger>
              <TabsTrigger
                value="account"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all"
              >
                👤 {language === 'ar' ? 'الحساب' : 'Compte'}
              </TabsTrigger>
              <TabsTrigger
                value="backup"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all"
              >
                💽 {language === 'ar' ? 'النسخ الاحتياطي' : 'Sauvegarde'}
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all"
              >
                ℹ️ {language === 'ar' ? 'حول' : 'À Propos'}
              </TabsTrigger>
            </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Language Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  🌐 {language === 'ar' ? 'إعدادات اللغة' : 'Paramètres de Langue'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-slate-700">
                      {language === 'ar' ? 'لغة الواجهة' : 'Langue de l\'interface'}
                    </Label>
                    <p className="text-sm text-slate-600">
                      {language === 'ar'
                        ? 'اختر لغة عرض التطبيق'
                        : 'Choisissez la langue d\'affichage de l\'application'}
                    </p>
                  </div>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-full md:w-[200px] h-12 bg-white border-slate-200 rounded-xl hover:border-blue-300 focus:border-blue-500 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="fr" className="cursor-pointer">
                        🇫🇷 Français
                      </SelectItem>
                      <SelectItem value="ar" className="cursor-pointer">
                        🇲🇦 العربية
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  🔔 {language === 'ar' ? 'إعدادات الإشعارات' : 'Paramètres de Notifications'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold text-slate-700 cursor-pointer">
                      📢 {language === 'ar' ? 'إشعارات النظام' : 'Notifications système'}
                    </Label>
                    <p className="text-sm text-slate-600">
                      {language === 'ar'
                        ? 'تنبيهات المخزون، المبيعات، إلخ'
                        : 'Alertes de stock, ventes, etc.'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold text-slate-700 cursor-pointer">
                      🔄 {language === 'ar' ? 'النسخ الاحتياطي التلقائي' : 'Sauvegarde automatique'}
                    </Label>
                    <p className="text-sm text-slate-600">
                      {language === 'ar'
                        ? 'نسخ احتياطي يومي تلقائي'
                        : 'Sauvegarde quotidienne automatique'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  👤 {language === 'ar' ? 'معلومات الحساب' : 'Informations du Compte'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold text-slate-700">
                      🏷️ {language === 'ar' ? 'اسم المستخدم' : 'Nom d\'utilisateur'}
                    </Label>
                    <Input
                      id="username"
                      value={settings.username}
                      onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                      className="h-12 bg-white border-slate-200 rounded-xl hover:border-blue-300 focus:border-blue-500 transition-colors"
                      placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Entrez votre nom d\'utilisateur'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      📧 {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      readOnly
                      className="h-12 bg-slate-50 border-slate-200 rounded-xl cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      🔒 {language === 'ar'
                        ? 'البريد الإلكتروني مُدار بواسطة Supabase Auth'
                        : 'L\'email est géré par Supabase Auth'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleAccountUpdate}
                  className="h-12 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  💾 {language === 'ar' ? 'حفظ المعلومات' : 'Sauvegarder les informations'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Store Branding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  🏪 {language === 'ar' ? 'إعدادات المتجر' : 'Configuration du Magasin'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="storeSelect" className="text-sm font-semibold text-slate-700">
                      🏬 {language === 'ar' ? 'المتجر النشط' : 'Magasin actif'}
                    </Label>
                    <Select
                      value={storeSettings.id || undefined}
                      onValueChange={(value) => {
                        const selectedStore = stores.find(store => store.id === value);
                        if (selectedStore) {
                          setStoreSettings({
                            id: selectedStore.id,
                            name: selectedStore.name,
                            display_name: selectedStore.display_name || selectedStore.name,
                            logo_data: selectedStore.logo_data || ''
                          });
                        }
                      }}
                    >
                      <SelectTrigger id="storeSelect" className="h-12 bg-white border-slate-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                        <SelectValue placeholder={language === 'ar' ? 'اختر متجر' : 'Sélectionner un magasin'} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {stores.length === 0 ? (
                          <SelectItem value="__no_store__" disabled>
                            {language === 'ar' ? 'لا توجد متاجر' : 'Aucun magasin'}
                          </SelectItem>
                        ) : (
                          stores.map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                              {store.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="text-sm font-semibold text-slate-700">
                      🏷️ {language === 'ar' ? 'اسم المتجر' : 'Nom du magasin'}
                    </Label>
                    <Input
                      id="storeName"
                      value={storeSettings.name}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, name: e.target.value }))}
                      className="h-12 bg-white border-slate-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors"
                      placeholder={language === 'ar' ? 'أدخل اسم المتجر' : 'Entrez le nom du magasin'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-sm font-semibold text-slate-700">
                      ✨ {language === 'ar' ? 'الاسم المعروض' : 'Nom d\'affichage'}
                    </Label>
                    <Input
                      id="displayName"
                      value={storeSettings.display_name}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, display_name: e.target.value }))}
                      className="h-12 bg-white border-slate-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors"
                      placeholder={language === 'ar' ? 'أدخل الاسم المعروض' : 'Entrez le nom d\'affichage'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoData" className="text-sm font-semibold text-slate-700">
                      🖼️ {language === 'ar' ? 'شعار المتجر' : 'Logo du magasin'}
                    </Label>
                    <Input
                      id="logoData"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="h-12 bg-white border-slate-200 rounded-xl hover:border-indigo-300 focus:border-indigo-500 transition-colors cursor-pointer file:bg-indigo-50 file:text-indigo-700 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:font-semibold"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      📎 {language === 'ar'
                        ? 'التنسيقات المدعومة: JPG, PNG, GIF. الحد الأقصى: 2 ميجابايت'
                        : 'Formats acceptés: JPG, PNG, GIF. Taille max: 2MB'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl mb-6">
                  {storeSettings.logo_data ? (
                    <motion.img
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      src={storeSettings.logo_data}
                      alt="Logo du magasin"
                      className="w-20 h-20 rounded-xl object-cover shadow-md border-2 border-white"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-indigo-100 flex items-center justify-center text-3xl border-2 border-dashed border-indigo-300">
                      📷
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="font-bold text-lg text-slate-800">
                      {storeSettings.display_name || (language === 'ar' ? 'لم يتم اختيار متجر' : 'Aucun magasin sélectionné')}
                    </p>
                    <p className="text-sm text-slate-600">
                      🆔 {language === 'ar' ? 'المعرف' : 'Identifiant'}: {storeSettings.id || 'N/A'}
                    </p>
                    {storeSettings.logo_data && (
                      <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1">
                        ✅ {language === 'ar' ? 'تم تحميل الشعار' : 'Logo chargé'}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleStoreUpdate}
                  className="h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold w-full"
                >
                  💾 {language === 'ar' ? 'تحديث المتجر' : 'Mettre à jour le magasin'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Password Change */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  🔐 {language === 'ar' ? 'تغيير كلمة المرور' : 'Changer le Mot de Passe'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-semibold text-slate-700">
                      🔑 {language === 'ar' ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={settings.currentPassword}
                        onChange={(e) => setSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="h-12 bg-white border-slate-200 rounded-xl hover:border-red-300 focus:border-red-500 transition-colors pr-12"
                        placeholder={language === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Entrez votre mot de passe actuel'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 hover:bg-slate-100 rounded-lg"
                        onClick={() => handleTogglePassword('current')}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-semibold text-slate-700">
                        ✨ {language === 'ar' ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={settings.newPassword}
                          onChange={(e) => setSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="h-12 bg-white border-slate-200 rounded-xl hover:border-red-300 focus:border-red-500 transition-colors pr-12"
                          placeholder={language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Entrez le nouveau mot de passe'}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8 hover:bg-slate-100 rounded-lg"
                          onClick={() => handleTogglePassword('new')}
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                        🔄 {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={settings.confirmPassword}
                          onChange={(e) => setSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="h-12 bg-white border-slate-200 rounded-xl hover:border-red-300 focus:border-red-500 transition-colors pr-12"
                          placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور الجديدة' : 'Confirmez le nouveau mot de passe'}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8 hover:bg-slate-100 rounded-lg"
                          onClick={() => handleTogglePassword('confirm')}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    className="h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold w-full"
                  >
                    🔐 {language === 'ar' ? 'تغيير كلمة المرور' : 'Changer le Mot de Passe'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          {/* Backup Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  💽 {language === 'ar' ? 'إدارة النسخ الاحتياطية' : 'Gestion des Sauvegardes'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Download className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-3 text-slate-800">
                          {language === 'ar' ? 'إنشاء نسخة احتياطية' : 'Créer une Sauvegarde'}
                        </h3>
                        <p className="text-sm text-slate-600 mb-6">
                          {language === 'ar'
                            ? 'احفظ جميع بياناتك بأمان'
                            : 'Sauvegardez toutes vos données en sécurité'}
                        </p>
                        <Button
                          onClick={handleBackup}
                          className="h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold w-full"
                        >
                          💾 {language === 'ar' ? 'إنشاء نسخة احتياطية' : 'Créer Sauvegarde'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Upload className="h-8 w-8 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-3 text-slate-800">
                          {language === 'ar' ? 'استعادة' : 'Restaurer'}
                        </h3>
                        <p className="text-sm text-slate-600 mb-6">
                          {language === 'ar'
                            ? 'استعادة من نسخة احتياطية'
                            : 'Restaurer depuis une sauvegarde'}
                        </p>
                        <Button
                          variant="outline"
                          disabled={isRestoring}
                          className="h-12 bg-white hover:bg-amber-50 border-amber-200 hover:border-amber-300 text-amber-700 rounded-xl shadow-sm hover:shadow-md transition-all font-semibold w-full"
                          onClick={() => document.getElementById('file-upload-restore')?.click()}
                        >
                          📁 {language === 'ar' ? 'اختر ملف' : 'Choisir Fichier'}
                        </Button>
                        <Input
                          id="file-upload-restore"
                          type="file"
                          className="hidden"
                          onChange={handleRestore}
                          accept=".sql,.json,.sqlite,.db,.backup"
                          disabled={isRestoring}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                <div className="border-t border-slate-200 pt-8">
                  <h3 className="font-bold text-xl mb-6 text-slate-800 flex items-center gap-2">
                    📚 {language === 'ar' ? 'سجل النسخ الاحتياطية' : 'Historique des Sauvegardes'}
                  </h3>
                  <div className="space-y-4">
                    {backupHistory.length > 0 ? (
                      backupHistory.map((backup, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${backup.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            <div>
                              <div className="font-semibold text-slate-800">{backup.date}</div>
                              <div className="text-sm text-slate-600">{backup.size}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 hover:bg-emerald-100 text-emerald-700"
                              onClick={() => handleDownloadBackup(backup.date)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 hover:bg-blue-100 text-blue-700"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          📂
                        </div>
                        <p className="text-slate-600 font-medium">
                          {language === 'ar' ? 'لا توجد نسخ احتياطية' : 'Aucune sauvegarde trouvée.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center space-y-8">
                  {/* Logo and Title */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <span className="text-3xl">🚗</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        🚀 Auto Parts Kouba
                      </h2>
                      <p className="text-slate-600 text-lg">
                        {language === 'ar' ? 'نظام إدارة تجاري شامل' : 'Système de Gestion Commercial'}
                      </p>
                      <Badge variant="outline" className="mt-3 px-4 py-1 text-sm font-semibold bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
                        📱 {language === 'ar' ? 'الإصدار' : 'Version'} {systemInfo.version}
                      </Badge>
                    </div>
                  </motion.div>

                  <Separator className="my-8" />

                  {/* System Info and Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="space-y-4"
                    >
                      <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                        💻 {language === 'ar' ? 'معلومات النظام' : 'Informations Système'}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-600">🗄️ {language === 'ar' ? 'قاعدة البيانات' : 'Base de données'}:</span>
                          <Badge className="bg-blue-100 text-blue-800">{systemInfo.database}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-600">💾 {language === 'ar' ? 'حجم الملف' : 'Taille du fichier'}:</span>
                          <Badge className="bg-emerald-100 text-emerald-800">{systemInfo.diskSpace}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-600">⏱️ {language === 'ar' ? 'وقت التشغيل' : 'Temps de fonctionnement'}:</span>
                          <Badge className="bg-purple-100 text-purple-800">{systemInfo.uptime}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-600">🌐 {language === 'ar' ? 'حالة الشبكة' : 'Statut du réseau'}:</span>
                          <Badge variant={systemInfo.networkStatus === 'connected' ? "default" : "destructive"} className={systemInfo.networkStatus === 'connected' ? 'bg-emerald-100 text-emerald-800' : ''}>
                            {systemInfo.networkStatus === 'connected' ? '✅ Connecté' : '❌ Déconnecté'}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="space-y-4"
                    >
                      <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                        📞 {language === 'ar' ? 'معلومات الاتصال' : 'Détails de Contact'}
                      </h3>
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                          <p className="text-slate-700 font-semibold">👨‍💻 {language === 'ar' ? 'مطور بواسطة' : 'Développé par'}: Youssef Abdouni</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                          <p className="text-slate-700">📧 {language === 'ar' ? 'الدعم' : 'Support'}: youssefabdouni44@gmail.com</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                          <p className="text-slate-700">📱 WhatsApp: 0791366612</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <Separator className="my-8" />

                  {/* Features */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="space-y-4"
                  >
                    <h3 className="font-bold text-xl text-slate-800 flex items-center justify-center gap-2">
                      ✨ {language === 'ar' ? 'الميزات' : 'Fonctionnalités'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { icon: '📦', text: language === 'ar' ? 'إدارة المخزون' : 'Gestion des stocks' },
                        { icon: '🧾', text: language === 'ar' ? 'الفوترة الكاملة' : 'Facturation complète' },
                        { icon: '📊', text: language === 'ar' ? 'تتبع المبيعات' : 'Suivi des ventes' },
                        { icon: '🚚', text: language === 'ar' ? 'إدارة الموردين' : 'Gestion fournisseurs' },
                        { icon: '📈', text: language === 'ar' ? 'تقارير مفصلة' : 'Rapports détaillés' },
                        { icon: '📱', text: language === 'ar' ? 'رموز الباركود' : 'Codes-barres' },
                        { icon: '💰', text: language === 'ar' ? 'نقطة البيع' : 'Caisse POS' },
                        { icon: '🔒', text: language === 'ar' ? 'نسخ احتياطي آمن' : 'Sauvegarde sécurisée' }
                      ].map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                          className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl text-center hover:shadow-md transition-all"
                        >
                          <div className="text-2xl mb-2">{feature.icon}</div>
                          <div className="text-sm font-medium text-slate-700">{feature.text}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      </motion.div>
    </motion.div>
  </div>
);
}

const parseJSONBackup = (jsonText: string): Record<string, Record<string, any>[]> => {
  try {
    const parsed = JSON.parse(jsonText);
    const result: Record<string, Record<string, any>[]> = {};
    if (typeof parsed === 'object' && parsed !== null) {
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key])) {
          result[key.toLowerCase()] = parsed[key];
        }
      }
    }
    return result;
  } catch {
    return {};
  }
};

const castSQLValue = (str: string): any => {
  if (str === '' || str.toUpperCase() === 'NULL') {
    return null;
  }
  if (str.toUpperCase() === 'TRUE') {
    return true;
  }
  if (str.toUpperCase() === 'FALSE') {
    return false;
  }
  if (!isNaN(Number(str)) && !str.startsWith('0x') && str.trim() !== '') {
    return Number(str);
  }
  return str;
};

const parseSQLTupleValues = (tupleStr: string): any[] => {
  const values: any[] = [];
  let currentVal = '';
  let inString = false;
  let i = 0;

  while (i < tupleStr.length) {
    const char = tupleStr[i];

    if (inString) {
      if (char === "'") {
        if (i + 1 < tupleStr.length && tupleStr[i + 1] === "'") {
          currentVal += "'";
          i += 2;
          continue;
        } else {
          inString = false;
          i++;
          continue;
        }
      } else {
        currentVal += char;
        i++;
        continue;
      }
    } else {
      if (char === "'") {
        inString = true;
        i++;
        continue;
      } else if (char === ',') {
        values.push(castSQLValue(currentVal.trim()));
        currentVal = '';
        i++;
        continue;
      } else {
        currentVal += char;
        i++;
        continue;
      }
    }
  }

  if (currentVal.trim() !== '' || tupleStr.trim().endsWith(',')) {
    values.push(castSQLValue(currentVal.trim()));
  }

  return values;
};

const extractValueTuples = (valuesSection: string): string[] => {
  const tuples: string[] = [];
  let inString = false;
  let inTuple = false;
  let tupleStart = -1;

  for (let i = 0; i < valuesSection.length; i++) {
    const char = valuesSection[i];

    if (inString) {
      if (char === "'") {
        if (i + 1 < valuesSection.length && valuesSection[i + 1] === "'") {
          i++; // Skip escaped quote ''
        } else {
          inString = false;
        }
      }
    } else {
      if (char === "'") {
        inString = true;
      } else if (char === '(' && !inTuple) {
        inTuple = true;
        tupleStart = i + 1;
      } else if (char === ')' && inTuple) {
        inTuple = false;
        tuples.push(valuesSection.substring(tupleStart, i));
      }
    }
  }

  return tuples;
};

const removeSQLComments = (sql: string): string => {
  let result = '';
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let i = 0;

  while (i < sql.length) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
        result += '\n';
      }
      i++;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    if (inString) {
      result += char;
      if (char === "'") {
        if (nextChar === "'") {
          result += "'";
          i += 2;
          continue;
        } else {
          inString = false;
        }
      }
      i++;
      continue;
    }

    if (char === '-' && nextChar === '-') {
      inLineComment = true;
      i += 2;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (char === "'") {
      inString = true;
      result += char;
      i++;
      continue;
    }

    result += char;
    i++;
  }

  return result;
};

const splitSQLStatements = (sql: string): string[] => {
  const cleanSql = removeSQLComments(sql);
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let i = 0;

  while (i < cleanSql.length) {
    const char = cleanSql[i];

    if (inString) {
      current += char;
      if (char === "'") {
        if (i + 1 < cleanSql.length && cleanSql[i + 1] === "'") {
          current += "'";
          i += 2;
          continue;
        } else {
          inString = false;
        }
      }
    } else {
      if (char === "'") {
        inString = true;
        current += char;
      } else if (char === ';') {
        if (current.trim()) {
          statements.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }
    i++;
  }
  if (current.trim()) {
    statements.push(current.trim());
  }
  return statements;
};

const parseSQLBackup = (sqlText: string): Record<string, Record<string, any>[]> => {
  const result: Record<string, Record<string, any>[]> = {};
  const statements = splitSQLStatements(sqlText);

  for (const stmt of statements) {
    if (!stmt.trim()) continue;

    const match = /^INSERT\s+INTO\s+(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+|["][^"]+["]|[`][^`]+[`])\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*)$/i.exec(stmt.trim());
    if (!match) continue;

    const rawTable = match[1].trim().replace(/^["`']|["`']$/g, '').toLowerCase();
    const columnsStr = match[2];
    let valuesSection = match[3].trim();

    const onConflictIdx = valuesSection.search(/\s+ON\s+CONFLICT/i);
    if (onConflictIdx !== -1) {
      valuesSection = valuesSection.substring(0, onConflictIdx).trim();
    }

    const columns = columnsStr.split(',').map(c => c.trim().replace(/^["`']|["`']$/g, ''));
    const tuples = extractValueTuples(valuesSection);

    for (const tupleStr of tuples) {
      const values = parseSQLTupleValues(tupleStr);
      if (columns.length > 0 && values.length === columns.length) {
        const rowObj: Record<string, any> = {};
        for (let i = 0; i < columns.length; i++) {
          rowObj[columns[i]] = values[i];
        }
        if (!result[rawTable]) {
          result[rawTable] = [];
        }
        result[rawTable].push(rowObj);
      }
    }
  }

  return result;
};