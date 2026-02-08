import { startEmergency } from "../services/emergency.service";

export default function EmergencyButton() {
  const handleClick = async () => {
    const result = await startEmergency();
    alert(result.message);
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
