import { createContext, useContext, useState } from "react";

const EmergencyContext = createContext();

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error("useEmergency must be used inside EmergencyProvider");
  }
  return context;
};

export function EmergencyProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);

  return (
    <EmergencyContext.Provider value={{
      location,
      setLocation,
      photo,
      setPhoto
    }}>
      {children}
    </EmergencyContext.Provider>
  );
}
