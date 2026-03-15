import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations = {
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de Bord',
    'nav.inventory': 'Gestion du Stock',
    'nav.sales': 'Ventes',
    'nav.pos': 'Point de Vente',
    'nav.invoicing': 'Facturation',
    'nav.suppliers': 'Fournisseurs',
    'nav.employees': 'Employés',
    'nav.reports': 'Rapports',
  'nav.stock_invoice': 'Facture du Stock',
    'nav.barcodes': 'Codes Barres',
    'nav.settings': 'Paramètres',
    
    // Common
    'common.search': 'Rechercher',
    'common.add': 'Ajouter',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.save': 'Sauvegarder',
    'common.cancel': 'Annuler',
    'common.loading': 'Chargement...',
    'common.total': 'Total',
    'common.subtotal': 'Sous-total',
    'common.currency': 'DZD',
    
    // Inventory
    'inventory.title': 'Gestion du Stock',
    'inventory.subtitle': 'Gérez votre inventaire de pièces détachées',
    'inventory.add_product': 'Ajouter un Produit',
    'inventory.search_placeholder': 'Rechercher par nom, marque, code-barres...',
    'inventory.categories.all': 'Tous',
    'inventory.low_stock': 'Stock bas',
    'inventory.in_stock': 'en stock',
    'inventory.supplier': 'Fournisseur',
    'inventory.location': 'Emplacement',
    'inventory.barcode': 'Code-barres',
    'inventory.no_products': 'Aucun produit trouvé',
    'inventory.modify_search': 'Essayez de modifier vos critères de recherche ou ajoutez un nouveau produit.',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.subtitle': 'Configurez votre application',
    'settings.backup': 'Sauvegarde',
    'settings.restore': 'Restaurer',
    'settings.language': 'Langue de l\'interface',
    'settings.language_desc': 'Choisissez la langue d\'affichage',
    'settings.theme': 'Thème',
    'settings.theme_desc': 'Mode d\'affichage de l\'interface',
    'settings.light': 'Clair',
    'settings.dark': 'Sombre',
    'settings.system': 'Système',
    
    // User
    'user.administrator': 'Administrateur',
    'user.logout': 'Déconnexion',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.mark_read': 'Marquer comme lu',
    'notifications.view_all': 'Voir toutes',
  },
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.inventory': 'إدارة المخزون',
    'nav.sales': 'المبيعات',
    'nav.pos': 'نقطة البيع',
    'nav.suppliers': 'الموردين',
    'nav.employees': 'الموظفين',
    'nav.reports': 'التقارير',
  'nav.stock_invoice': 'فاتورة المخزون',
    'nav.barcodes': 'الباركود',
    'nav.settings': 'الإعدادات',
    
    // Common
    'common.search': 'بحث',
    'common.add': 'إضافة',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.loading': 'جاري التحميل...',
    'common.total': 'المجموع',
    'common.subtotal': 'المجموع الفرعي',
    'common.currency': 'DZD',
    
    // Inventory
    'inventory.title': 'إدارة المخزون',
    'inventory.subtitle': 'قم بإدارة مخزون قطع الغيار الخاصة بك',
    'inventory.add_product': 'إضافة منتج',
    'inventory.search_placeholder': 'البحث بالاسم، العلامة التجارية، الباركود...',
    'inventory.categories.all': 'الكل',
    'inventory.low_stock': 'مخزون منخفض',
    'inventory.in_stock': 'في المخزون',
    'inventory.supplier': 'المورد',
    'inventory.location': 'الموقع',
    'inventory.barcode': 'الباركود',
    'inventory.no_products': 'لم يتم العثور على منتجات',
    'inventory.modify_search': 'حاول تعديل معايير البحث أو إضافة منتج جديد.',
    
    // Settings
    'settings.title': 'الإعدادات',
    'settings.subtitle': 'قم بتكوين التطبيق الخاص بك',
    'settings.backup': 'نسخ احتياطي',
    'settings.restore': 'استعادة',
    'settings.language': 'لغة الواجهة',
    'settings.language_desc': 'اختر لغة العرض',
    'settings.theme': 'المظهر',
    'settings.theme_desc': 'وضع عرض الواجهة',
    'settings.light': 'فاتح',
    'settings.dark': 'داكن',
    'settings.system': 'النظام',
    
    // User
    'user.administrator': 'مدير',
    'user.logout': 'تسجيل الخروج',
    
    // Notifications
    'notifications.title': 'الإشعارات',
    'notifications.mark_read': 'تعليم كمقروء',
    'notifications.view_all': 'عرض الكل',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('language') || 'fr';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  }, [language, isRTL]);

  const t = (key: string): string => {
    return translations[language as keyof typeof translations]?.[key as keyof typeof translations['fr']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};