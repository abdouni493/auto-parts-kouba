import { useState, useRef } from "react";
import JsBarcode from "jsbarcode"; // ✅ offline import
import { Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from "@/hooks/use-toast";

// --- Language Mapping ---
const texts = {
  fr: {
    headerTitle: "Générateur de Codes-Barres",
    headerSubtitle: "Générez un code-barres et imprimez-le",
    generateCardTitle: "Générer un Code-Barres",
    barcodeLabel: "Numéro du Code-Barres",
    placeholder: "Entrez un numéro",
    randomButton: "Aléatoire",
    generateButton: "Générer & Voir l'Aperçu",
    previewTitle: "Aperçu et Impression",
    printDocumentTitle: "Impression Codes-Barres",
    noCode: "Aucun code généré",
    closeButton: "Fermer",
    printButton: "Lancer l'impression",
    toastErrorTitle: "Erreur",
    toastErrorMessage: "Veuillez saisir ou générer un code-barres.",
  },
  ar: {
    headerTitle: "مولد الرموز الشريطية",
    headerSubtitle: "قم بإنشاء وطباعة رمز شريطي",
    generateCardTitle: "إنشاء رمز شريطي",
    barcodeLabel: "رقم الرمز الشريطي",
    placeholder: "أدخل رقمًا",
    randomButton: "عشوائي",
    generateButton: "إنشاء ومعاينة",
    previewTitle: "معاينة وطباعة",
    printDocumentTitle: "طباعة الرموز الشريطية",
    noCode: "لم يتم إنشاء رمز",
    closeButton: "إغلاق",
    printButton: "بدء الطباعة",
    toastErrorTitle: "خطأ",
    toastErrorMessage: "يرجى إدخال أو إنشاء رمز شريطي.",
  },
};

export default function Barcodes() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();

  const [barcodeText, setBarcodeText] = useState("");
  const [barcodeImage, setBarcodeImage] = useState<string | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Generate random 12-digit code
  const generateRandomBarcodeText = () => {
    let result = "";
    for (let i = 0; i < 12; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    setBarcodeText(result);
  };

  // Generate barcode as image
  const generateBarcode = () => {
    if (!barcodeText) {
      toast({
        title: texts[language].toastErrorTitle,
        description: texts[language].toastErrorMessage,
        variant: "destructive",
      });
      return;
    }

    // Create a hidden canvas
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcodeText, {
      format: "CODE128",
      displayValue: true,
      fontSize: 18,
      width: 2,
      height: 80,
      margin: 10,
    });

    // Convert canvas to Data URL (base64 PNG)
    const imgData = canvas.toDataURL("image/png");
    setBarcodeImage(imgData);
    setPrintDialogOpen(true);
  };

  // Print barcode
  const handlePrint = () => {
    const printContent = printAreaRef.current;
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${texts[language].printDocumentTitle}</title>
              <style>
                body { margin: 0; padding: 10mm; font-family: sans-serif; display: flex; justify-content: center; align-items: center; }
                img { max-width: 100%; }
              </style>
            </head>
            <body>${printContent.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();

        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => printWindow.close();
        }, 300);
      }
    }
  };

  return (
    <div
      className={`space-y-6 p-4 md:p-8 max-w-xl mx-auto animate-fade-in ${
        isRTL ? "rtl" : "ltr"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500">
            🔐 {texts[language].headerTitle}
          </h1>
          <p className="text-muted-foreground text-lg">
            {texts[language].headerSubtitle}
          </p>
        </div>
      </div>

      {/* Input */}
      <Card className="shadow-lg rounded-xl border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-xl p-4">
          <CardTitle className="text-xl font-semibold">
            📝 {texts[language].generateCardTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div>
            <Label htmlFor="barcodeText" className="font-medium text-gray-700">
              {texts[language].barcodeLabel}
            </Label>
            <div className="flex mt-1">
              <Input
                id="barcodeText"
                type="text"
                value={barcodeText}
                onChange={(e) =>
                  setBarcodeText(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder={texts[language].placeholder}
                className="block w-full rounded-l-md"
              />
              <Button
                onClick={generateRandomBarcodeText}
                className="rounded-r-md bg-gray-200 text-gray-800"
              >
                {texts[language].randomButton}
              </Button>
            </div>
          </div>
          <Button
            onClick={generateBarcode}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg rounded-lg py-3"
            disabled={!barcodeText}
          >
            <Printer className="mr-2 h-5 w-5" /> {texts[language].generateButton}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {texts[language].previewTitle}
            </DialogTitle>
          </DialogHeader>

          <div
            ref={printAreaRef}
            className="flex justify-center items-center p-4 border rounded bg-gray-50"
          >
            {barcodeImage ? (
              <img src={barcodeImage} alt="Generated Barcode" />
            ) : (
              <p className="text-gray-400">{texts[language].noCode}</p>
            )}
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              {texts[language].closeButton}
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-primary text-white"
              disabled={!barcodeImage}
            >
              <Printer className="mr-2 h-4 w-4" />{" "}
              {texts[language].printButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
