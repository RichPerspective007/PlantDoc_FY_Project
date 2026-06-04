import { useState, useRef, useEffect } from "react";

export function CameraModal({ isOpen, onClose, onCapture }) {
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(null);
  const [flashActive, setFlashActive] = useState(false);

  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    setCamError(null);
    setCamReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCamReady(true);
      }
    } catch (err) {
      setCamError("Camera access denied. Please allow camera permission and try again.");
      console.error(err);
    }
  };

  // Automatically start the camera when the modal opens, and kill it when it closes
  useEffect(() => {
    if (isOpen) {
      openCamera();
    } else {
      stopStream();
    }
    return () => stopStream();
  }, [isOpen]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const capturedFile = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
      onCapture(capturedFile); // Send the file back to DetectPage
      onClose(); // Close the modal
    }, "image/jpeg", 0.92);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="flex flex-col w-full max-w-lg overflow-hidden bg-slate-900 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
        
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-800/50 border-white/10">
          <span className="text-sm font-bold text-white">📷 Camera</span>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 text-sm transition-colors rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white">✕</button>
        </div>

        <div className="relative flex items-center justify-center min-h-[300px] bg-black">
          {camError ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center text-slate-300">
              <div className="text-4xl">🚫</div>
              <p className="text-sm">{camError}</p>
              <button onClick={openCamera} className="px-5 py-2 mt-2 text-sm text-white transition-colors border rounded-full bg-white/10 border-white/20 hover:bg-white/20">Retry</button>
            </div>
          ) : (
            <>
              {flashActive && <div className="absolute inset-0 z-10 bg-white opacity-90 animate-out fade-out" />}
              {!camReady && (
                <div className="flex flex-col items-center gap-3 text-sm text-slate-400">
                  <div className="w-8 h-8 border-4 rounded-full border-white/20 border-t-white/80 animate-spin" />
                  <p>Starting camera...</p>
                </div>
              )}
              <video ref={videoRef} autoPlay playsInline muted className={`w-full max-h-[450px] object-cover ${camReady ? "block" : "hidden"}`} />
              
              {camReady && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-sm" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-sm" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-sm" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-sm" />
                </div>
              )}
            </>
          )}
        </div>

        {camReady && !camError && (
          <div className="flex flex-col items-center gap-3 px-6 py-5 border-t bg-slate-800/50 border-white/5">
            <p className="text-xs tracking-wider text-slate-400">Point at the leaf and capture</p>
            <button onClick={capturePhoto} className="flex items-center justify-center w-16 h-16 transition-transform border-4 border-white/70 rounded-full hover:border-white active:scale-95 group">
              <div className="w-12 h-12 transition-colors bg-white rounded-full group-hover:bg-slate-200" />
            </button>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}