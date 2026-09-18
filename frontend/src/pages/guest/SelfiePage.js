import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Camera, Upload, RefreshCw, ArrowLeft, Zap, AlertCircle } from 'lucide-react';
import { publicAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATES = { IDLE: 'idle', CAMERA: 'camera', PREVIEW: 'preview', SEARCHING: 'searching' };

const SelfiePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const consentGiven = location.state?.consentGiven;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [uiState, setUiState] = useState(STATES.IDLE);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');

  // Redirect if consent wasn't given
  useEffect(() => {
    if (!consentGiven) {
      navigate(`/e/${slug}`, { replace: true });
    }
  }, [consentGiven, slug, navigate]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setUiState(STATES.CAMERA);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera access was denied. Please allow camera access in your browser settings, or upload a selfie instead.'
        : 'Unable to access your camera. Please upload a selfie instead.';
      setCameraError(msg);
      setUiState(STATES.IDLE);
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Mirror the image (selfie mode)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    canvas.toBlob(
      (blob) => {
        setSelfieBlob(blob);
        setSelfiePreview(URL.createObjectURL(blob));
        setUiState(STATES.PREVIEW);
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      return toast.error('Please upload a JPG, PNG, or WEBP image.');
    }
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File too large. Maximum 10MB.');
    }
    setSelfieBlob(file);
    setSelfiePreview(URL.createObjectURL(file));
    setUiState(STATES.PREVIEW);
    stopCamera();
  };

  const handleRetake = () => {
    setSelfieBlob(null);
    setSelfiePreview(null);
    setError(null);
    setUiState(STATES.IDLE);
  };

  const handleSearch = async () => {
    if (!selfieBlob) return;
    setUiState(STATES.SEARCHING);
    setError(null);
    setProgress(10);
    setProgressMsg('Uploading selfie…');

    try {
      const fd = new FormData();
      fd.append('selfie', selfieBlob, 'selfie.jpg');
      fd.append('consentGiven', 'true');

      setProgress(30);
      setProgressMsg('Detecting face…');

      const res = await publicAPI.searchPhotos(slug, fd, (pct) => {
        setProgress(30 + Math.round(pct * 0.5));
      });

      setProgress(90);
      setProgressMsg('Matching photos…');

      await new Promise((r) => setTimeout(r, 400)); // small UX delay

      setProgress(100);
      setProgressMsg('Done!');

      const { searchId, matchCount, photos } = res.data;

      navigate(`/e/${slug}/photos`, {
        state: { searchId, matchCount, photos, consentGiven: true },
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      setUiState(STATES.PREVIEW);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <button
          onClick={() => {
            stopCamera();
            navigate(`/e/${slug}`);
          }}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold">Take Your Selfie</span>
        <div className="w-9" /> {/* spacer */}
      </div>

      <div className="flex-1 flex flex-col">
        {/* ── IDLE STATE ───────────────────────────────────────────────────── */}
        {uiState === STATES.IDLE && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-6">
            <div className="w-24 h-24 rounded-full bg-violet-600/20 border-2 border-violet-500/50 flex items-center justify-center">
              <Camera className="w-10 h-10 text-violet-400" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Ready for your selfie?</h2>
              <p className="text-gray-400 text-sm">Take a clear photo of your face to find your event photos</p>
            </div>

            {cameraError && (
              <div className="w-full max-w-sm bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-sm text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{cameraError}</p>
              </div>
            )}

            <div className="flex flex-col w-full max-w-xs gap-3">
              <button onClick={startCamera} className="btn-primary justify-center py-4 text-base">
                <Camera className="w-5 h-5" /> Open Camera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary justify-center py-4 text-base text-gray-700"
              >
                <Upload className="w-5 h-5" /> Upload a Selfie
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <p className="text-xs text-gray-600 text-center max-w-xs">
              Tips: Use a well-lit photo with just your face visible. Avoid sunglasses or face masks.
            </p>
          </div>
        )}

        {/* ── CAMERA STATE ─────────────────────────────────────────────────── */}
        {uiState === STATES.CAMERA && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative bg-black overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-72 border-2 border-white/50 rounded-full" />
              </div>
              <p className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                Centre your face in the circle
              </p>
            </div>

            {/* Capture button */}
            <div className="bg-gray-900 p-6 flex items-center justify-center gap-6">
              <button onClick={stopCamera} className="p-3 text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 hover:border-violet-400 transition-colors flex items-center justify-center shadow-lg"
                aria-label="Take photo"
              >
                <div className="w-12 h-12 rounded-full bg-white" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-white"
                aria-label="Upload instead"
              >
                <Upload className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        )}

        {/* ── PREVIEW STATE ─────────────────────────────────────────────────── */}
        {uiState === STATES.PREVIEW && selfiePreview && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
              <img
                src={selfiePreview}
                alt="Your selfie"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {error && (
              <div className="mx-4 my-3 bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-sm text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="bg-gray-900 p-4 flex gap-3">
              <button onClick={handleRetake} className="flex-1 btn-secondary text-gray-700 justify-center py-3.5">
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button onClick={handleSearch} className="flex-1 btn-primary justify-center py-3.5">
                <Zap className="w-4 h-4" /> Find My Photos
              </button>
            </div>
          </div>
        )}

        {/* ── SEARCHING STATE ───────────────────────────────────────────────── */}
        {uiState === STATES.SEARCHING && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
            {/* Preview thumbnail */}
            {selfiePreview && (
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-violet-500 shadow-lg shadow-violet-500/30">
                <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Progress */}
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300 font-medium">{progressMsg}</span>
                <span className="text-violet-400 font-bold">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-sm">AI is scanning {progress > 50 ? 'event photos' : 'your face'}…</p>
              <p className="text-gray-600 text-xs mt-1">This usually takes 5–15 seconds</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default SelfiePage;
