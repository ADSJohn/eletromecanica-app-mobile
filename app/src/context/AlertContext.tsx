import React, { createContext, useContext, useState } from "react";

const AlertContext = createContext<any>(null);

export function AlertProvider({ children }: any) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <AlertContext.Provider value={{ acknowledged, setAcknowledged }}>
      {children}
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);
