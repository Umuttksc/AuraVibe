import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel";

interface UseVideoCallProps {
  callId: Id<"videoCalls"> | null;
  isCaller: boolean;
  onCallEnd?: () => void;
}

export function useVideoCall({ callId, isCaller, onCallEnd }: UseVideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const processedCandidatesRef = useRef<Set<string>>(new Set());
  
  const setOffer = useMutation(api.videoCalls.setOffer);
  const setAnswer = useMutation(api.videoCalls.setAnswer);
  const addIceCandidate = useMutation(api.videoCalls.addIceCandidate);
  const endCall = useMutation(api.videoCalls.endCall);
  const signaling = useQuery(
    api.videoCalls.getCallSignaling,
    callId ? { callId } : "skip"
  );

  // ICE servers configuration (memo to prevent recreation)
  const iceServers = useMemo(
    () => ({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    }),
    []
  );

  // Initialize local media stream
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      setError("Kamera veya mikrofon erişimi reddedildi");
      console.error("Error accessing media devices:", err);
      return null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(iceServers);

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && callId) {
        addIceCandidate({
          callId,
          candidate: JSON.stringify(event.candidate),
          isCaller,
        }).catch(console.error);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setError("Bağlantı kesildi");
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [callId, isCaller, addIceCandidate, iceServers]);

  // Initialize call (for caller)
  useEffect(() => {
    if (!callId || !isCaller) return;

    const initCall = async () => {
      const stream = await initializeMedia();
      if (!stream) return;

      const pc = createPeerConnection(stream);

      try {
        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send offer to backend
        await setOffer({
          callId,
          offer: JSON.stringify(offer),
        });
      } catch (err) {
        setError("Arama başlatılamadı");
        console.error("Error creating offer:", err);
      }
    };

    initCall();
  }, [callId, isCaller, initializeMedia, createPeerConnection, setOffer]);

  // Handle incoming call (for receiver)
  useEffect(() => {
    if (!callId || isCaller || !signaling?.offer) return;

    const handleIncomingCall = async () => {
      const stream = await initializeMedia();
      if (!stream || !signaling.offer) return;

      const pc = createPeerConnection(stream);

      try {
        // Set remote description (offer from caller)
        await pc.setRemoteDescription(JSON.parse(signaling.offer));

        // Create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Send answer to backend
        await setAnswer({
          callId,
          answer: JSON.stringify(answer),
        });
      } catch (err) {
        setError("Arama cevaplanamadı");
        console.error("Error handling incoming call:", err);
      }
    };

    handleIncomingCall();
  }, [callId, isCaller, signaling?.offer, initializeMedia, createPeerConnection, setAnswer]);

  // Handle answer (for caller)
  useEffect(() => {
    if (!isCaller || !signaling?.answer || !peerConnectionRef.current) return;

    const handleAnswer = async () => {
      if (!signaling.answer) return;
      
      try {
        await peerConnectionRef.current!.setRemoteDescription(
          JSON.parse(signaling.answer)
        );
      } catch (err) {
        console.error("Error setting remote description:", err);
      }
    };

    handleAnswer();
  }, [isCaller, signaling?.answer]);

  // Handle ICE candidates
  useEffect(() => {
    if (!signaling || !peerConnectionRef.current) return;

    const candidates = isCaller
      ? signaling.receiverIceCandidates
      : signaling.callerIceCandidates;

    candidates.forEach(async (candidateStr) => {
      // Skip if already processed
      if (processedCandidatesRef.current.has(candidateStr)) return;

      try {
        const candidate = JSON.parse(candidateStr);
        await peerConnectionRef.current!.addIceCandidate(candidate);
        processedCandidatesRef.current.add(candidateStr);
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });
  }, [signaling, isCaller]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted(!isMuted);
  }, [localStream, isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsVideoOff(!isVideoOff);
  }, [localStream, isVideoOff]);

  // End call
  const handleEndCall = useCallback(async () => {
    // Stop all tracks
    localStream?.getTracks().forEach((track) => track.stop());
    remoteStream?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    peerConnectionRef.current?.close();

    // End call in backend
    if (callId) {
      await endCall({ callId });
    }

    // Cleanup
    setLocalStream(null);
    setRemoteStream(null);
    peerConnectionRef.current = null;
    processedCandidatesRef.current.clear();

    // Callback
    onCallEnd?.();
  }, [localStream, remoteStream, callId, endCall, onCallEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
      remoteStream?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
    };
  }, [localStream, remoteStream]);

  return {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    error,
    toggleMute,
    toggleVideo,
    endCall: handleEndCall,
  };
}
