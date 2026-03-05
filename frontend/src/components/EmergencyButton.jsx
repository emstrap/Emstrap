import { startEmergency } from "../services/emergency.service";
import toast from "react-hot-toast";

export default function EmergencyButton() {
  const handleClick = async () => {
    const result = await startEmergency();
    toast.success(result.message);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: "20px 40px",
        fontSize: 20,
        background: "red",
        color: "#fff",
        borderRadius: 10,
        border: "none"
      }}
    >
      CALL AMBULANCE
    </button>
  );
}
