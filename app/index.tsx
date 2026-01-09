import React from "react";
import Dashboard from "./src/screens/Dashboard";
import { AlertProvider } from "./src/context/AlertContext";

export default function Index() {
  return (
    <AlertProvider>
      <Dashboard />
    </AlertProvider>
  );
}
