import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Search,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Settings,
  BarChart3,
  Truck,
  Calculator,
  Receipt,
  UserPlus,
  PackagePlus,
  FileSpreadsheet,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const commands = [
    {
      group: 'Navigation',
      items: [
        {
          id: 'dashboard',
          label: t('nav.dashboard'),
          icon: BarChart3,
          action: () => navigate('/'),
          keywords: ['tableau', 'bord', 'dashboard', 'home', 'accueil'],
        },
        {
          id: 'pos',
          label: t('nav.pos'),
          icon: Calculator,
          action: () => navigate('/pos'),
          keywords: ['pos', 'vente', 'caisse', 'point', 'sale'],
        },
        {
          id: 'inventory',
          label: t('nav.inventory'),
          icon: Package,
          action: () => navigate('/inventory'),
          keywords: ['stock', 'inventaire', 'produits', 'inventory'],
        },
        {
          id: 'sales',
          label: t('nav.sales'),
          icon: ShoppingCart,
          action: () => navigate('/sales'),
          keywords: ['ventes', 'sales', 'commandes'],
        },
        {
          id: 'suppliers',
          label: t('nav.suppliers'),
          icon: Truck,
          action: () => navigate('/suppliers'),
          keywords: ['fournisseurs', 'suppliers', 'vendors'],
        },
        {
          id: 'employees',
          label: t('nav.employees'),
          icon: Users,
          action: () => navigate('/employees'),
          keywords: ['employés', 'employees', 'staff', 'équipe'],
        },
        {
          id: 'reports',
          label: t('nav.reports'),
          icon: FileSpreadsheet,
          action: () => navigate('/reports'),
          keywords: ['rapports', 'reports', 'analytics', 'statistiques'],
        },
        {
          id: 'settings',
          label: t('nav.settings'),
          icon: Settings,
          action: () => navigate('/settings'),
          keywords: ['paramètres', 'settings', 'configuration'],
        },
      ],
    },
    {
      group: 'Actions Rapides',
      items: [
        {
          id: 'new-sale',
          label: 'Nouvelle Vente',
          icon: ShoppingCart,
          action: () => navigate('/pos'),
          keywords: ['vente', 'sale', 'caisse', 'nouveau'],
        },
        {
          id: 'add-product',
          label: 'Ajouter Produit',
          icon: PackagePlus,
          action: () => navigate('/inventory'),
          keywords: ['produit', 'product', 'ajouter', 'nouveau', 'add'],
        },
        {
          id: 'add-employee',
          label: 'Ajouter Employé',
          icon: UserPlus,
          action: () => navigate('/employees'),
          keywords: ['employé', 'employee', 'staff', 'ajouter', 'nouveau'],
        },
        {
          id: 'create-invoice',
          label: 'Créer Facture',
          icon: FileText,
          action: () => navigate('/invoicing'),
          keywords: ['facture', 'invoice', 'créer', 'nouveau'],
        },
      ],
    },
  ];

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Tapez une commande ou recherchez..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        {commands.map((group) => (
          <div key={group.group}>
            <CommandGroup heading={group.group}>
              {group.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.keywords.join(' ')}`}
                    onSelect={() => runCommand(item.action)}
                    className="flex items-center gap-2 px-2 py-1.5"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

// Hook pour utiliser la palette de commandes
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return { open, setOpen };
}