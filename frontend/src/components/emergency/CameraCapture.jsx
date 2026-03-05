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

const CameraCaptureComponent = ({ onSend }, ref) => {
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
              <video ref={videoRef} autoPlay className="rounded-xl w-full" />

              <button
                onClick={capturePhoto}
                className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg"
              >
                Capture Photo
              </button>
            </>
          ) : (
            /* 💻 DESKTOP UPLOAD */
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full border dark:border-gray-700 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </>
          )}
        </>
      ) : (
        <>
          <img src={image} className="rounded-xl w-full" />

          <div className="flex gap-3 mt-4">
            <button
              onClick={retakePhoto}
              className="w-1/2 bg-gray-500 text-white py-3 rounded-lg"
            >
              Retake
            </button>

            <button
              onClick={onSend}
              className="w-1/2 bg-red-600 text-white py-3 rounded-lg"
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
