import { useState } from "react";
import { Card } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Calculator } from "lucide-react";

function CalculatorIcon() {
  return <Calculator className="h-5 w-5" />;
}

export default function ZakatCalculator() {
  const [gold, setGold] = useState("");
  const [silver, setSilver] = useState("");
  const [cash, setCash] = useState("");
  const [investments, setInvestments] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const calculateZakat = () => {
    const totalGold = Number(gold) || 0;
    const totalSilver = Number(silver) || 0;
    const totalCash = Number(cash) || 0;
    const totalInvestments = Number(investments) || 0;

    const totalWealth = totalGold + totalSilver + totalCash + totalInvestments;
    
    // Zekat nisap: 85 gram altın değeri (ortalama 50,000 TL olarak kabul ediyoruz)
    const nisapThreshold = 50000;
    
    if (totalWealth >= nisapThreshold) {
      // Zekat oranı %2.5
      const zakatAmount = totalWealth * 0.025;
      setResult(zakatAmount);
    } else {
      setResult(0);
    }
  };

  const handleReset = () => {
    setGold("");
    setSilver("");
    setCash("");
    setInvestments("");
    setResult(null);
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-50 dark:from-yellow-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 border-yellow-200 dark:border-yellow-900">
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <CalculatorIcon />
          <h3 className="font-semibold text-lg sm:text-xl text-yellow-900 dark:text-yellow-100">
            Zekat Hesaplayıcı
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="gold" className="text-sm font-medium">Altın (TL cinsinden değer)</Label>
            <Input
              id="gold"
              type="number"
              placeholder="0"
              value={gold}
              onChange={(e) => setGold(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="silver" className="text-sm font-medium">Gümüş (TL cinsinden değer)</Label>
            <Input
              id="silver"
              type="number"
              placeholder="0"
              value={silver}
              onChange={(e) => setSilver(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="cash" className="text-sm font-medium">Nakit Para & Banka</Label>
            <Input
              id="cash"
              type="number"
              placeholder="0"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="investments" className="text-sm font-medium">Yatırımlar & Ticari Mallar</Label>
            <Input
              id="investments"
              type="number"
              placeholder="0"
              value={investments}
              onChange={(e) => setInvestments(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={calculateZakat} className="flex-1">
              Hesapla
            </Button>
            <Button onClick={handleReset} variant="outline">
              Sıfırla
            </Button>
          </div>
        </div>

        {result !== null && (
          <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Zekat Miktarı:
            </h4>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {result.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
            </p>
            {result === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Toplam mal varlığınız nisap miktarının (yaklaşık 50,000 TL) altında olduğu için zekat vermek farz değildir.
              </p>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-yellow-200 dark:border-yellow-800">
          <h4 className="font-semibold text-sm mb-2 text-yellow-900 dark:text-yellow-100">Önemli Bilgiler:</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Zekat, mal varlığının %2.5'idir</li>
            <li>• Nisap miktarı: 85 gram altın değeri (yakl. 50,000 TL)</li>
            <li>• Mal varlığının üzerinden 1 kameri yıl geçmeli</li>
            <li>• Borçlar düşüldükten sonraki net varlık hesaplanır</li>
            <li>• Zekat, muhtaç ve fakir Müslümanlara verilir</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
