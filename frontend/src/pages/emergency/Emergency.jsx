import { useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import CameraCapture from "../../components/emergency/CameraCapture";
import EmergencyProgress from "../../components/emergency/EmergencyProgress";
import AmbulanceFound from "../../components/emergency/AmbulanceFound";
import { useEmergency } from "../../context/EmergencyContext";

export default function Emergency() {
  const [step, setStep] = useState("start"); // start, capture, searching, accepted, timeout
  const [driverInfo, setDriverInfo] = useState(null);
  const { location, setLocation, photo } = useEmergency();
  const cameraRef = useRef(null);

  const startEmergency = () => {
    // fetch location silently
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });

    setStep("capture");
  };

  const handleSendEmergency = async () => {
    //stop camera NOW
    cameraRef.current?.stopCamera();
    setStep("searching");

    try {
      // Create request on backend
      const response = await axios.post("http://localhost:5000/api/emergency", {
        latitude: location?.lat || 0,
        longitude: location?.lng || 0,
        imageUrl: photo || ""
      });

      const requestId = response.data.data._id;

      // Connect to websocket for real-time tracking
      const socket = io("http://localhost:5000", { withCredentials: true });
      socket.emit("track_request", { requestId });

      // Timeout if no one accepts in 1 minute (60000 ms)
      const timer = setTimeout(() => {
        setStep("timeout");
        socket.disconnect(); // Stop listening for this request
      }, 60000);

      // Listen for acceptance
      socket.on("ambulance_assigned", (data) => {
        clearTimeout(timer);
        setDriverInfo(data);
        setStep("accepted");
      });

    } catch (error) {
      console.error("Failed to call ambulance", error);
      alert("Error reaching server. Trying again...");
      setStep("start");
    }
  };

  const resetEmergency = () => {
    setStep("start");
    setDriverInfo(null);
  };

  return (
    <>
      <Navbar />
      <Container>

        {/* STEP 1 — BIG BUTTON */}
        {step === "start" && (
          <div className="text-center mt-16 sm:mt-24">
            <h1 className="text-3xl sm:text-5xl font-bold">
              Emergency Ambulance
            </h1>

            <p className="mt-4 text-gray-500">
              Tap to alert nearby ambulances
            </p>

            <button
              onClick={startEmergency}
              className="
                mt-12 bg-red-600 hover:bg-red-700
                text-white font-bold
                px-10 py-6
                text-xl sm:text-2xl lg:text-3xl
                rounded-3xl shadow-xl
              "
            >
              CALL AMBULANCE
            </button>
          </div>
        )}

        {/* STEP 2 — CAMERA + LOCATION */}
        {step === "capture" && (
          <div className="mt-10 max-w-md mx-auto">
            <CameraCapture ref={cameraRef} onSend={handleSendEmergency} />
          </div>
        )}

        {/* STEP 3 */}
        {step === "searching" && <EmergencyProgress />}

        {/* STEP 4: TIMEOUT */}
        {step === "timeout" && (
          <div className="text-center mt-16 sm:mt-24 max-w-lg mx-auto p-6 bg-red-50 border border-red-100 rounded-3xl dark:bg-red-900/10 dark:border-red-900/30">
            <span className="text-5xl mb-4 block">⏳</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Ambulance Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Unfortunately, no ambulances accepted your request.
            </p>
            <button
              onClick={resetEmergency}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors text-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {step === "accepted" && <AmbulanceFound driverInfo={driverInfo} />}

      </Container>
    </>
  );
}
