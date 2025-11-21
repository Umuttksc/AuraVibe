import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, User, Video } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { motion } from "motion/react";

interface IncomingCallDialogProps {
  callId: Id<"videoCalls">;
  callerName: string;
  callerAvatar?: string | null;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallDialog({
  callId,
  callerName,
  callerAvatar,
  onAccept,
  onReject,
}: IncomingCallDialogProps) {
  const answerCall = useMutation(api.videoCalls.answerCall);

  const handleAccept = async () => {
    try {
      await answerCall({ callId, accept: true });
      onAccept();
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  const handleReject = async () => {
    try {
      await answerCall({ callId, accept: false });
      onReject();
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Gelen Arama</DialogTitle>
          <DialogDescription className="text-center">
            Görüntülü arama
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {/* Caller avatar */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {callerAvatar ? (
              <img
                src={callerAvatar}
                alt={callerName}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-500"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-purple-500 flex items-center justify-center ring-4 ring-purple-500">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
          </motion.div>

          {/* Caller name */}
          <div className="text-center">
            <h3 className="text-2xl font-semibold">{callerName}</h3>
            <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground">
              <Video className="w-4 h-4" />
              <span>Görüntülü arama yapıyor...</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 w-full">
            {/* Reject button */}
            <Button
              variant="destructive"
              size="lg"
              onClick={handleReject}
              className="flex-1 h-14 text-lg gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              Reddet
            </Button>

            {/* Accept button */}
            <Button
              variant="default"
              size="lg"
              onClick={handleAccept}
              className="flex-1 h-14 text-lg gap-2 bg-green-600 hover:bg-green-700"
            >
              <Phone className="w-5 h-5" />
              Cevapla
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
