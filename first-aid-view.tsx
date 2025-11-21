import * as React from "react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { 
  Heart, Droplet, Flame, AlertTriangle, UserX, Wind, Zap, 
  Phone, Package, CheckCircle2, XCircle 
} from "lucide-react";

// Icon wrapper components to prevent DataCloneError
function HeartIcon({ className }: { className?: string }) {
  return <Heart className={className} />;
}

function DropletIcon({ className }: { className?: string }) {
  return <Droplet className={className} />;
}

function FlameIcon({ className }: { className?: string }) {
  return <Flame className={className} />;
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return <AlertTriangle className={className} />;
}

function UserXIcon({ className }: { className?: string }) {
  return <UserX className={className} />;
}

function WindIcon({ className }: { className?: string }) {
  return <Wind className={className} />;
}

function ZapIcon({ className }: { className?: string }) {
  return <Zap className={className} />;
}

function PhoneIcon({ className }: { className?: string }) {
  return <Phone className={className} />;
}

function PackageIcon({ className }: { className?: string }) {
  return <Package className={className} />;
}

function CheckCircle2Icon({ className }: { className?: string }) {
  return <CheckCircle2 className={className} />;
}

function XCircleIcon({ className }: { className?: string }) {
  return <XCircle className={className} />;
}

type SituationType = "emergency" | "situation" | "kit" | "rules" | null;

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "heart": HeartIcon,
  "droplet": DropletIcon,
  "flame": FlameIcon,
  "alert-triangle": AlertTriangleIcon,
  "user-x": UserXIcon,
  "wind": WindIcon,
  "zap": ZapIcon,
  "bone": AlertTriangleIcon, // Using AlertTriangle for bone
};

const colorMap: Record<string, string> = {
  "red": "from-red-50 via-rose-50 to-red-50 dark:from-red-950/20 dark:via-rose-950/20 dark:to-red-950/20 border-red-200 dark:border-red-900",
  "orange": "from-orange-50 via-amber-50 to-orange-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-orange-950/20 border-orange-200 dark:border-orange-900",
  "gray": "from-gray-50 via-slate-50 to-gray-50 dark:from-gray-950/20 dark:via-slate-950/20 dark:to-gray-950/20 border-gray-200 dark:border-gray-900",
  "purple": "from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-purple-200 dark:border-purple-900",
  "blue": "from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-950/20 dark:via-cyan-950/20 dark:to-blue-950/20 border-blue-200 dark:border-blue-900",
  "yellow": "from-yellow-50 via-amber-50 to-yellow-50 dark:from-yellow-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 border-yellow-200 dark:border-yellow-900",
  "green": "from-green-50 via-emerald-50 to-green-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-green-950/20 border-green-200 dark:border-green-900",
};

export default function FirstAidView() {
  const firstAidData = useQuery(api.firstAid.getFirstAidGuides);
  const [activeSection, setActiveSection] = useState<SituationType>(null);
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);

  if (!firstAidData) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 sm:h-20 w-full" />
          <Skeleton className="h-16 sm:h-20 w-full" />
          <Skeleton className="h-16 sm:h-20 w-full" />
          <Skeleton className="h-16 sm:h-20 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const situationToShow = selectedSituation 
    ? firstAidData.situations.find(s => s.id === selectedSituation)
    : null;

  return (
    <div className="space-y-4">
      {/* Main Section Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={activeSection === "emergency" ? "default" : "outline"}
          onClick={() => {
            setActiveSection(activeSection === "emergency" ? null : "emergency");
            setSelectedSituation(null);
          }}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Acil Numaralar</span>
        </Button>
        
        <Button
          variant={activeSection === "situation" ? "default" : "outline"}
          onClick={() => {
            setActiveSection(activeSection === "situation" ? null : "situation");
            setSelectedSituation(null);
          }}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <AlertTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Acil Durumlar</span>
        </Button>

        <Button
          variant={activeSection === "kit" ? "default" : "outline"}
          onClick={() => {
            setActiveSection(activeSection === "kit" ? null : "kit");
            setSelectedSituation(null);
          }}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <PackageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">İlk Yardım Çantası</span>
        </Button>

        <Button
          variant={activeSection === "rules" ? "default" : "outline"}
          onClick={() => {
            setActiveSection(activeSection === "rules" ? null : "rules");
            setSelectedSituation(null);
          }}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <CheckCircle2Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Genel Kurallar</span>
        </Button>
      </div>

      {/* Emergency Numbers */}
      {activeSection === "emergency" && (
        <Card className="overflow-hidden bg-gradient-to-br from-red-50 via-rose-50 to-red-50 dark:from-red-950/20 dark:via-rose-950/20 dark:to-red-950/20 border-red-200 dark:border-red-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-5 w-5 text-red-700 dark:text-red-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-red-900 dark:text-red-100">
                {firstAidData.emergencyNumbers.title}
              </h3>
            </div>

            <div className="grid gap-2">
              {firstAidData.emergencyNumbers.numbers.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-red-900 dark:text-red-100">{item.name}</span>
                    <a href={`tel:${item.number}`} className="font-bold text-xl text-red-700 dark:text-red-300">{item.number}</a>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Situation Selection */}
      {activeSection === "situation" && !selectedSituation && (
        <Card className="overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-orange-950/20 border-orange-200 dark:border-orange-900">
          <div className="p-4 sm:p-6 space-y-4">
            <h3 className="font-semibold text-lg sm:text-xl text-orange-900 dark:text-orange-100">
              Acil Durumlar
            </h3>
            <p className="text-sm text-muted-foreground">Bilgi almak istediğiniz durumu seçin:</p>

            <div className="grid gap-2">
              {firstAidData.situations.map((situation) => {
                const IconComponent = iconMap[situation.icon];
                return (
                  <button
                    key={situation.id}
                    onClick={() => setSelectedSituation(situation.id)}
                    className="p-3 rounded-lg bg-background hover:bg-accent border transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${situation.urgency === 'critical' ? 'from-red-500 to-rose-500' : situation.urgency === 'high' ? 'from-orange-500 to-amber-500' : 'from-blue-500 to-cyan-500'} text-white`}>
                        {IconComponent && <IconComponent className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{situation.title}</p>
                        {situation.urgency === "critical" && (
                          <Badge variant="destructive" className="text-xs mt-1">Kritik</Badge>
                        )}
                        {situation.urgency === "high" && (
                          <Badge variant="secondary" className="text-xs mt-1 bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100">Yüksek</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Situation Detail */}
      {activeSection === "situation" && situationToShow && (
        <Card className={`overflow-hidden bg-gradient-to-br ${colorMap[situationToShow.color]}`}>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {iconMap[situationToShow.icon] && React.createElement(iconMap[situationToShow.icon], { className: "h-5 w-5" })}
                <h3 className="font-semibold text-lg sm:text-xl">
                  {situationToShow.title}
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSituation(null)}>
                ← Geri
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-base">Yapılması Gerekenler:</h4>
              {situationToShow.steps.map((step, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-background/50 border">
                  <h5 className="font-medium text-sm mb-1">{step.title}</h5>
                  <p className="text-sm text-foreground">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4" />
                Önemli Uyarılar:
              </h4>
              <ul className="space-y-1">
                {situationToShow.warnings.map((warning, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                    <span>⚠️</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* First Aid Kit */}
      {activeSection === "kit" && (
        <Card className="overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-green-950/20 border-green-200 dark:border-green-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <PackageIcon className="h-5 w-5 text-green-700 dark:text-green-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-green-900 dark:text-green-100">
                {firstAidData.firstAidKit.title}
              </h3>
            </div>

            <div className="space-y-4">
              {firstAidData.firstAidKit.items.map((category, idx) => (
                <div key={idx}>
                  <h4 className="font-semibold text-base mb-2 text-green-900 dark:text-green-100">{category.category}:</h4>
                  <ul className="space-y-1">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex gap-2 text-sm text-foreground">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-sm mb-2 text-green-900 dark:text-green-100">Önemli Notlar:</h4>
              <ul className="space-y-1">
                {firstAidData.firstAidKit.notes.map((note, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                    <span>•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* General Rules */}
      {activeSection === "rules" && (
        <Card className="overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-950/20 dark:via-cyan-950/20 dark:to-blue-950/20 border-blue-200 dark:border-blue-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-blue-900 dark:text-blue-100">
                {firstAidData.generalRules.title}
              </h3>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                Yapılması Gerekenler:
              </h4>
              <ul className="space-y-1">
                {firstAidData.generalRules.dos.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-foreground">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-base mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <XCircleIcon className="h-4 w-4 text-red-600" />
                Yapılmaması Gerekenler:
              </h4>
              <ul className="space-y-1">
                {firstAidData.generalRules.donts.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-foreground">
                    <span className="text-red-600 dark:text-red-400">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {activeSection === null && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <AlertTriangleIcon className="h-12 w-12 opacity-50" />
            <p className="text-sm">Bilgi almak istediğiniz konuyu seçin</p>
          </div>
        </Card>
      )}
    </div>
  );
}
