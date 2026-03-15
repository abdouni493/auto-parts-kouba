import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export interface ProductFormData {
  id?: number;
  name: string;
  barcode: string;
  brand: string;
  category_id: number | null;
  buying_price: number;
  selling_price: number;
  margin_percent: number;
  initial_quantity: number;
  current_quantity: number;
  min_quantity: number;
  supplier_id: number | null;
  shelving_id: number | null;
  shelving_line: number | null;
  store_id: number | null;
}

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Shelving {
  id: number;
  name: string;
  number_of_lines: number;
}

interface Store {
  id: number;
  name: string;
  address: string;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<ProductFormData>;
  onSave: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  isLoading = false,
}: ProductFormDialogProps) {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    barcode: "",
    brand: "",
    category_id: null,
    buying_price: 0,
    selling_price: 0,
    margin_percent: 0,
    initial_quantity: 0,
    current_quantity: 0,
    min_quantity: 0,
    supplier_id: null,
    shelving_id: null,
    shelving_line: null,
    store_id: null,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [shelving, setShelving] = useState<Shelving[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // New item dialogs
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addShelvingOpen, setAddShelvingOpen] = useState(false);
  const [newShelvingData, setNewShelvingData] = useState({
    name: "",
    number_of_lines: 0,
  });
  const [addStoreOpen, setAddStoreOpen] = useState(false);
  const [newStoreData, setNewStoreData] = useState({ name: "", address: "" });

  // Load initial data
  useEffect(() => {
    if (open) {
      loadDependencies();
      if (initialData) {
        setFormData({ ...formData, ...initialData });
      }
    }
  }, [open]);

  async function loadDependencies() {
    try {
      const [catRes, supRes, shelRes, storeRes] = await Promise.all([
        fetch("http://localhost:5000/api/categories"),
        fetch("http://localhost:5000/api/suppliers"),
        fetch("http://localhost:5000/api/shelving"),
        fetch("http://localhost:5000/api/stores"),
      ]);

      if (catRes.ok) setCategories(await catRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
      if (shelRes.ok) setShelving(await shelRes.json());
      if (storeRes.ok) setStores(await storeRes.json());
    } catch (err) {
      console.error("Error loading dependencies:", err);
      toast({
        title: language === "ar" ? "خطأ" : "Erreur",
        description: language === "ar" ? "فشل تحميل البيانات" : "Impossible de charger les données",
        variant: "destructive",
      });
    }
  }

  const handleBuyingPriceChange = (price: number) => {
    setFormData({ ...formData, buying_price: price });
    if (formData.margin_percent > 0) {
      const selling = price * (1 + formData.margin_percent / 100);
      setFormData((prev) => ({ ...prev, selling_price: Math.round(selling * 100) / 100 }));
    }
  };

  const handleMarginChange = (margin: number) => {
    setFormData({ ...formData, margin_percent: margin });
    const selling = formData.buying_price * (1 + margin / 100);
    setFormData((prev) => ({ ...prev, selling_price: Math.round(selling * 100) / 100 }));
  };

  const handleSellingPriceChange = (price: number) => {
    setFormData({ ...formData, selling_price: price });
    if (formData.buying_price > 0) {
      const margin = ((price - formData.buying_price) / formData.buying_price) * 100;
      setFormData((prev) => ({ ...prev, margin_percent: Math.round(margin * 100) / 100 }));
    }
  };

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch("http://localhost:5000/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        setFormData({ ...formData, category_id: newCat.id });
        setAddCategoryOpen(false);
        setNewCategoryName("");
        toast({
          title: language === "ar" ? "✅ تم" : "✅ Succès",
          description: language === "ar" ? "تم إضافة الفئة" : "Catégorie ajoutée",
        });
      }
    } catch (err) {
      console.error("Error adding category:", err);
      toast({
        title: language === "ar" ? "خطأ" : "Erreur",
        description: language === "ar" ? "فشل الإضافة" : "Ajout impossible",
        variant: "destructive",
      });
    }
  }

  async function addShelving() {
    if (!newShelvingData.name.trim()) return;
    try {
      const res = await fetch("http://localhost:5000/api/shelving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShelvingData),
      });
      if (res.ok) {
        const newShelf = await res.json();
        setShelving([...shelving, newShelf]);
        setFormData({ ...formData, shelving_id: newShelf.id });
        setAddShelvingOpen(false);
        setNewShelvingData({ name: "", number_of_lines: 0 });
        toast({
          title: language === "ar" ? "✅ تم" : "✅ Succès",
          description: language === "ar" ? "تم إضافة الرف" : "Étagère ajoutée",
        });
      }
    } catch (err) {
      console.error("Error adding shelving:", err);
      toast({
        title: language === "ar" ? "خطأ" : "Erreur",
        description: language === "ar" ? "فشل الإضافة" : "Ajout impossible",
        variant: "destructive",
      });
    }
  }

  async function addStore() {
    if (!newStoreData.name.trim()) return;
    try {
      const res = await fetch("http://localhost:5000/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStoreData),
      });
      if (res.ok) {
        const newStore = await res.json();
        setStores([...stores, newStore]);
        setFormData({ ...formData, store_id: newStore.id });
        setAddStoreOpen(false);
        setNewStoreData({ name: "", address: "" });
        toast({
          title: language === "ar" ? "✅ تم" : "✅ Succès",
          description: language === "ar" ? "تم إضافة المتجر" : "Magasin ajouté",
        });
      }
    } catch (err) {
      console.error("Error adding store:", err);
      toast({
        title: language === "ar" ? "خطأ" : "Erreur",
        description: language === "ar" ? "فشل الإضافة" : "Ajout impossible",
        variant: "destructive",
      });
    }
  }

  async function handleSave() {
    if (!formData.name || !formData.barcode || !formData.brand) {
      toast({
        title: language === "ar" ? "خطأ" : "Erreur",
        description: language === "ar"
          ? "الرجاء إدخال المعلومات المطلوبة"
          : "Veuillez remplir les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSave(formData);
      onOpenChange(false);
      setFormData({
        name: "",
        barcode: "",
        brand: "",
        category_id: null,
        buying_price: 0,
        selling_price: 0,
        margin_percent: 0,
        initial_quantity: 0,
        current_quantity: 0,
        min_quantity: 0,
        supplier_id: null,
        shelving_id: null,
        shelving_line: null,
        store_id: null,
      });
    } catch (err) {
      console.error("Error saving product:", err);
    }
  }

  const shelvingLines = formData.shelving_id
    ? shelving.find((s) => s.id === formData.shelving_id)?.number_of_lines || 0
    : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {initialData?.id
                ? language === "ar"
                  ? "تعديل المنتج"
                  : "Modifier le produit"
                : language === "ar"
                ? "إضافة منتج جديد"
                : "Ajouter un produit"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Product Identity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === "ar" ? "بيانات المنتج" : "Informations générales"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === "ar" ? "الاسم *" : "Nom *"}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={language === "ar" ? "اسم المنتج" : "Nom du produit"}
                    />
                  </div>
                  <div>
                    <Label>{language === "ar" ? "الرمز الشريطي *" : "Code-barres *"}</Label>
                    <Input
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder={language === "ar" ? "رمز شريطي" : "Code-barres"}
                    />
                  </div>
                  <div>
                    <Label>{language === "ar" ? "العلامة التجارية *" : "Marque *"}</Label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder={language === "ar" ? "العلامة التجارية" : "Marque"}
                    />
                  </div>
                  <div>
                    <Label>{language === "ar" ? "الفئة" : "Catégorie"}</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.category_id?.toString() || ""}
                        onValueChange={(v) =>
                          setFormData({ ...formData, category_id: v ? Number(v) : null })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={language === "ar" ? "اختر فئة" : "Choisir..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setAddCategoryOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === "ar" ? "التسعير" : "Tarification"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{language === "ar" ? "سعر الشراء" : "Prix achat"}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.buying_price}
                      onChange={(e) => handleBuyingPriceChange(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>{language === "ar" ? "هامش %" : "Marge %"}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.margin_percent}
                      onChange={(e) => handleMarginChange(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>{language === "ar" ? "سعر البيع" : "Prix vente"}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => handleSellingPriceChange(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === "ar" ? "المخزون" : "Stock"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{language === "ar" ? "الكمية الأولية" : "Qté initiale"}</Label>
                    <Input
                      type="number"
                      value={formData.initial_quantity}
                      onChange={(e) => {
                        const qty = Number(e.target.value);
                        setFormData({
                          ...formData,
                          initial_quantity: qty,
                          current_quantity: !initialData?.id ? qty : formData.current_quantity,
                        });
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>{language === "ar" ? "الكمية الحالية" : "Qté actuelle"}</Label>
                    <Input
                      type="number"
                      value={formData.current_quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, current_quantity: Number(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>{language === "ar" ? "الحد الأدنى" : "Qté minimale"}</Label>
                    <Input
                      type="number"
                      value={formData.min_quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, min_quantity: Number(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supplier & Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === "ar" ? "المورد والموقع" : "Fournisseur et Localisation"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{language === "ar" ? "المورد" : "Fournisseur"}</Label>
                  <Select
                    value={formData.supplier_id?.toString() || ""}
                    onValueChange={(v) =>
                      setFormData({ ...formData, supplier_id: v ? Number(v) : null })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === "ar" ? "اختر مورد" : "Choisir..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id.toString()}>
                          {sup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === "ar" ? "الرف" : "Étagère"}</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.shelving_id?.toString() || ""}
                        onValueChange={(v) =>
                          setFormData({ ...formData, shelving_id: v ? Number(v) : null })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={language === "ar" ? "اختر" : "Choisir..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {shelving.map((shelf) => (
                            <SelectItem key={shelf.id} value={shelf.id.toString()}>
                              {shelf.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setAddShelvingOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {shelvingLines > 0 && (
                    <div>
                      <Label>{language === "ar" ? "رقم الخط" : "Numéro de ligne"}</Label>
                      <Select
                        value={formData.shelving_line?.toString() || ""}
                        onValueChange={(v) =>
                          setFormData({ ...formData, shelving_line: v ? Number(v) : null })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ar" ? "اختر" : "Choisir..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: shelvingLines }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {language === "ar" ? `الخط ${i + 1}` : `Ligne ${i + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div>
                  <Label>{language === "ar" ? "المتجر" : "Magasin"}</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.store_id?.toString() || ""}
                      onValueChange={(v) =>
                        setFormData({ ...formData, store_id: v ? Number(v) : null })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={language === "ar" ? "اختر" : "Choisir..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setAddStoreOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {language === "ar" ? "إلغاء" : "Annuler"}
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="gradient-primary text-white">
              {isLoading
                ? language === "ar"
                  ? "جاري..."
                  : "Chargement..."
                : initialData?.id
                ? language === "ar"
                  ? "تحديث"
                  : "Mettre à jour"
                : language === "ar"
                ? "إضافة"
                : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "إضافة فئة" : "Ajouter une catégorie"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === "ar" ? "اسم الفئة" : "Nom de la catégorie"}</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={language === "ar" ? "أدخل الاسم" : "Entrez le nom"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCategoryOpen(false)}>
              {language === "ar" ? "إلغاء" : "Annuler"}
            </Button>
            <Button onClick={addCategory} className="gradient-primary text-white">
              {language === "ar" ? "إضافة" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Shelving Dialog */}
      <Dialog open={addShelvingOpen} onOpenChange={setAddShelvingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "إضافة رف" : "Ajouter une étagère"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === "ar" ? "اسم الرف" : "Nom de l'étagère"}</Label>
              <Input
                value={newShelvingData.name}
                onChange={(e) =>
                  setNewShelvingData({ ...newShelvingData, name: e.target.value })
                }
                placeholder={language === "ar" ? "مثال: رف A" : "Ex: Étagère A"}
              />
            </div>
            <div>
              <Label>{language === "ar" ? "عدد الخطوط" : "Nombre de lignes"}</Label>
              <Input
                type="number"
                value={newShelvingData.number_of_lines}
                onChange={(e) =>
                  setNewShelvingData({
                    ...newShelvingData,
                    number_of_lines: Number(e.target.value),
                  })
                }
                placeholder="5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddShelvingOpen(false)}>
              {language === "ar" ? "إلغاء" : "Annuler"}
            </Button>
            <Button onClick={addShelving} className="gradient-primary text-white">
              {language === "ar" ? "إضافة" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Store Dialog */}
      <Dialog open={addStoreOpen} onOpenChange={setAddStoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "إضافة متجر" : "Ajouter un magasin"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === "ar" ? "اسم المتجر" : "Nom du magasin"}</Label>
              <Input
                value={newStoreData.name}
                onChange={(e) => setNewStoreData({ ...newStoreData, name: e.target.value })}
                placeholder={language === "ar" ? "اسم المتجر" : "Nom du magasin"}
              />
            </div>
            <div>
              <Label>{language === "ar" ? "العنوان" : "Adresse"}</Label>
              <Input
                value={newStoreData.address}
                onChange={(e) => setNewStoreData({ ...newStoreData, address: e.target.value })}
                placeholder={language === "ar" ? "العنوان" : "Adresse"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStoreOpen(false)}>
              {language === "ar" ? "إلغاء" : "Annuler"}
            </Button>
            <Button onClick={addStore} className="gradient-primary text-white">
              {language === "ar" ? "إضافة" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
