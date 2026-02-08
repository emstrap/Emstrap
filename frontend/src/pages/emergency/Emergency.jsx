import { useState, useRef } from "react";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import CameraCapture from "../../components/emergency/CameraCapture";
//import LocationPreview from "../../components/emergency/LocationPreview";
import EmergencyProgress from "../../components/emergency/EmergencyProgress";
import AmbulanceFound from "../../components/emergency/AmbulanceFound";
import { useEmergency } from "../../context/EmergencyContext";

export default function Emergency() {
  const [step, setStep] = useState("start");
  const { setLocation } = useEmergency();
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

  const handleSendEmergency = () => {
    // 🔴 stop camera NOW
    cameraRef.current?.stopCamera();

     setTimeout(() => {
    setStep("searching");
  }, 200);

    setTimeout(() => {
      setStep("accepted");
    }, 4000);
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
              🚨 CALL AMBULANCE
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
        {step === "accepted" && <AmbulanceFound />}

      </Container>
    </>
  );
}
