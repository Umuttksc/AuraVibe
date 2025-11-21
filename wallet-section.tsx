import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Wallet, Settings, TrendingUp, ArrowRight } from "lucide-react";

interface WalletSectionProps {
  userId: Id<"users">;
  isOwnProfile: boolean;
}

export default function WalletSection({ userId, isOwnProfile }: WalletSectionProps) {
  const navigate = useNavigate();
  const wallet = useQuery(api.wallets.getWallet);
  const transactions = useQuery(api.wallets.getWalletTransactions, {});
  const walletSettings = useQuery(api.walletSettings.getWalletSettings);
  const getOrCreateWallet = useMutation(api.wallets.getOrCreateWallet);

  // Create wallet on first load
  useEffect(() => {
    if (isOwnProfile && wallet === null) {
      getOrCreateWallet().catch(() => {});
    }
  }, [isOwnProfile, wallet, getOrCreateWallet]);

  if (!isOwnProfile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Cüzdan bilgileri gizlidir</p>
      </div>
    );
  }

  if (!wallet || !transactions) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const balanceInTL = (wallet.balance / 100).toFixed(2);
  const totalEarnedInTL = (wallet.totalEarned / 100).toFixed(2);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Balance Summary Card */}
      <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Cüzdan Özeti
            </span>
            <TrendingUp className="h-5 w-5 opacity-80" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-4">₺{balanceInTL}</div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-80">Toplam Kazanç</p>
              <p className="text-xl font-semibold">₺{totalEarnedInTL}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/wallet")}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Yönet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Button
        onClick={() => navigate("/wallet")}
        className="w-full"
        size="lg"
        variant="outline"
      >
        Cüzdan Yönetimi
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      {/* Recent Transactions Preview */}
      {recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Son İşlemler</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/wallet")}
                className="text-xs"
              >
                Tümünü Gör
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between p-2 text-sm hover:bg-accent rounded-lg transition-colors cursor-pointer"
                onClick={() => navigate("/wallet")}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {transaction.type === "gift_received"
                      ? "🎁"
                      : transaction.type === "withdrawal"
                        ? "💸"
                        : transaction.type === "bonus"
                          ? "🎉"
                          : "💰"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {transaction.notes || "İşlem"}
                  </span>
                </div>
                <span
                  className={`font-semibold ${
                    transaction.type === "withdrawal"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {transaction.type === "withdrawal" ? "-" : "+"}₺
                  {(transaction.amount / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
