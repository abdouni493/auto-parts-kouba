// src/workers/WorkerLayout.tsx
import { WorkerHeader } from "@/components/Layout/WorkerHeader";
import WorkerSidebar from "@/workers/WorkerSidebar";
import { useState } from "react";
import { Outlet } from "react-router-dom"; // Add Outlet to render nested routes

export const WorkerLayout = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <WorkerHeader onMenuClick={() => setIsOpen(!isOpen)} sidebarOpen={isOpen} />

      <div className="flex flex-1">
        <WorkerSidebar isOpen={isOpen} />
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Outlet is a crucial component that renders the content of the current nested route. */}
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};