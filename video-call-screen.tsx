import { useVideoCall } from "@/hooks/use-video-call.ts";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  User,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { motion } from "motion/react";

interface VideoCallScreenProps {
  callId: Id<"videoCalls">;
  isCaller: boolean;
  receiverName: string;
  receiverAvatar?: string | null;
  onEnd: () => void;
}

export default function VideoCallScreen({
  callId,
  isCaller,
  receiverName,
  receiverAvatar,
  onEnd,
}: VideoCallScreenProps) {
  const {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    error,
    toggleMute,
    toggleVideo,
    endCall,
  } = useVideoCall({
    callId,
    isCaller,
    onCallEnd: onEnd,
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Remote video (full screen) */}
      <div className="relative flex-1 bg-gray-900">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            {receiverAvatar ? (
              <img
                src={receiverAvatar}
                alt={receiverName}
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-purple-500 flex items-center justify-center">
                <User className="w-16 h-16 text-white" />
              </div>
            )}
            <div className="text-white text-center">
              <h2 className="text-2xl font-semibold">{receiverName}</h2>
              <p className="text-gray-400 mt-2">
                {isCaller ? "Arıyor..." : "Bağlanıyor..."}
              </p>
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        {localStream && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden shadow-2xl bg-gray-800"
          >
            {isVideoOff ? (
              <div className="w-full h-full flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            )}
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 px-6 py-8 flex items-center justify-center gap-4">
        {/* Mute button */}
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          onClick={toggleMute}
          className="w-16 h-16 rounded-full"
        >
          {isMuted ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>

        {/* End call button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={endCall}
          className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700"
        >
          <PhoneOff className="w-8 h-8" />
        </Button>

        {/* Video toggle button */}
        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="lg"
          onClick={toggleVideo}
          className="w-16 h-16 rounded-full"
        >
          {isVideoOff ? (
            <VideoOff className="w-6 h-6" />
          ) : (
            <Video className="w-6 h-6" />
          )}
        </Button>
      </div>
    </div>
  );
}
