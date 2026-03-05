import {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useEmergency } from "../../context/EmergencyContext";
import toast from "react-hot-toast";

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const CameraCaptureComponent = ({ onSend, onCancel }, ref) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const { setPhoto } = useEmergency();

  // 📷 Start camera only on mobile
  const startCamera = async () => {
    if (!isMobile) return;

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" } // back camera 📷
        }
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    } catch {
      toast.error("Camera permission denied");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useImperativeHandle(ref, () => ({ stopCamera }));

  // 📷 Capture from camera (mobile)
  const capturePhoto = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 300, 220);
    const data = canvasRef.current.toDataURL("image/png");

    setImage(data);
    setPhoto(data);
  };

  // 💻 Upload from desktop
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      setImage(reader.result);
      setPhoto(reader.result);
    };

    if (file) reader.readAsDataURL(file);
  };

  const retakePhoto = () => {
    setImage(null);
    if (isMobile) startCamera();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700">
      <h3 className="font-bold mb-3 text-center text-gray-900 dark:text-white">
        {isMobile ? "Take Patient Photo" : "Upload Patient Photo"}
      </h3>

      {!image ? (
        <>
          {/* 📱 MOBILE CAMERA */}
          {isMobile ? (
            <>
              <video ref={videoRef} autoPlay className="rounded-xl w-full object-cover" />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={onCancel}
                  className="w-1/3 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="w-2/3 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Capture Photo
                </button>
              </div>
            </>
          ) : (
            /* 💻 DESKTOP UPLOAD */
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full border dark:border-gray-700 p-3 rounded-xl mb-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={onCancel}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Go Back
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <img src={image} className="rounded-xl w-full" />

          <div className="flex gap-3 mt-4">
            <button
              onClick={retakePhoto}
              className="w-1/2 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Retake
            </button>

            <button
              onClick={onSend}
              className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Send Emergency
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} width="300" height="220" hidden />
    </div>
  );
};

const CameraCapture = forwardRef(CameraCaptureComponent);
export default CameraCapture;
