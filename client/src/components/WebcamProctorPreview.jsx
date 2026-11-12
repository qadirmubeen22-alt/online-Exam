import React, { useEffect, useRef, useState } from 'react';
import { Camera, Eye, VideoOff, Activity, ShieldCheck } from 'lucide-react';

export const WebcamProctorPreview = () => {
  const videoRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: 'user' },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasCamera(true);
          }
        }
      } catch (err) {
        // Camera access denied or not present; fallback to AI HUD simulation
        setHasCamera(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-30 flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-lg backdrop-blur-md hover:bg-slate-800 transition-all"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <Camera className="w-4 h-4" />
        <span>AI Proctor Feed</span>
      </button>
    );
  }

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-300">Live AI Proctor Feed</span>
        </div>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          REC
        </span>
      </div>

      {/* Video Viewport / Biometric HUD */}
      <div className="relative w-full h-36 sm:h-40 bg-slate-950 flex items-center justify-center overflow-hidden">
        {hasCamera ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        ) : (
          /* Simulated AI Facial Tracker View */
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
            {/* Grid background lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:1rem_1rem]" />

            {/* Simulated Bounding Box */}
            <div className="relative w-24 h-24 border border-dashed border-emerald-500/60 rounded-2xl flex items-center justify-center animate-pulse">
              <Eye className="w-8 h-8 text-emerald-400/80" />
              <div className="absolute -top-2 left-2 text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1 rounded">
                Face [99.4%]
              </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-mono text-center">
              AI Vision Engine Active
            </div>
          </div>
        )}

        {/* HUD Overlay telemetry */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none text-[10px] font-mono text-emerald-400 bg-slate-950/70 backdrop-blur-sm px-2 py-1 rounded">
          <span className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Gaze: Centered</span>
          </span>
          <span className="text-slate-400">1 Subject</span>
        </div>
      </div>

      {/* Footer Status */}
      <div className="px-3 py-1.5 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60">
        <span className="flex items-center space-x-1 text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Integrity Guard</span>
        </span>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          Minimize
        </button>
      </div>
    </div>
  );
};
