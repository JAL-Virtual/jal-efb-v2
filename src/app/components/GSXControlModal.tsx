"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";

interface GSXControlModalProps {
  show: boolean;
  onClose: () => void;
}

interface GSXService {
  id: string;
  name: string;
  icon: string;
  description: string;
  menuChoice: number;
  stateParam: string;
  available: boolean;
}

const GSX_SERVICES: GSXService[] = [
  {
    id: "deboarding",
    name: "Deboarding",
    icon: "mdi:escalator-down",
    description: "Request passenger deboarding",
    menuChoice: 0,
    stateParam: "L:FSDT_GSX_DEBOARDING_STATE",
    available: true,
  },
  {
    id: "catering",
    name: "Catering",
    icon: "mdi:silverware-fork-knife",
    description: "Request catering service",
    menuChoice: 1,
    stateParam: "L:FSDT_GSX_CATERING_STATE",
    available: true,
  },
  {
    id: "refueling",
    name: "Refueling",
    icon: "mdi:gas-station",
    description: "Request refueling service",
    menuChoice: 2,
    stateParam: "L:FSDT_GSX_REFUELING_STATE",
    available: true,
  },
  {
    id: "boarding",
    name: "Boarding",
    icon: "mdi:escalator-up",
    description: "Request passenger boarding",
    menuChoice: 3,
    stateParam: "L:FSDT_GSX_BOARDING_STATE",
    available: true,
  },
  {
    id: "departure",
    name: "Departure",
    icon: "mdi:airplane",
    description: "Request departure services",
    menuChoice: 4,
    stateParam: "L:FSDT_GSX_DEPARTURE_STATE",
    available: true,
  },
  {
    id: "gpu",
    name: "GPU",
    icon: "mdi:ev-station",
    description: "Request Ground Power Unit",
    menuChoice: 0,
    stateParam: "L:FSDT_GSX_GPU_STATE",
    available: true,
  },
  {
    id: "water",
    name: "Water",
    icon: "mdi:water",
    description: "Request water service",
    menuChoice: 3,
    stateParam: "L:FSDT_GSX_WATER_STATE",
    available: true,
  },
  {
    id: "lavatory",
    name: "Lavatory",
    icon: "mdi:toilet",
    description: "Request lavatory service",
    menuChoice: 2,
    stateParam: "L:FSDT_GSX_LAVATORY_STATE",
    available: true,
  },
  {
    id: "simbrief",
    name: "SimBrief Status",
    icon: "mdi:file-document-edit",
    description: "Check SimBrief sync status",
    menuChoice: 14,
    stateParam: "L:FSDT_GSX_SIMBRIEF_SUCCESS",
    available: true,
  },
];

const GSX_STATES = {
  AVAILABLE: 1,
  NOT_AVAILABLE: 2,
  BYPASSED: 3,
  REQUESTED: 4,
  PERFORMING: 5,
  COMPLETED: 6,
};

export default function GSXControlModal({ show, onClose }: GSXControlModalProps) {
  const [serviceStates, setServiceStates] = useState<Record<string, number>>({});
  const [isOnGround, setIsOnGround] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [gsxAvailable, setGsxAvailable] = useState(false);
  const [communityAddonInstalled, setCommunityAddonInstalled] = useState(false);

  // Check for community addon and fetch real data
  useEffect(() => {
    if (!show) return;

    const checkCommunityAddon = async () => {
      try {
        // Try to fetch data from community addon
        const response = await fetch('/api/efb-data/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCommunityAddonInstalled(true);
          setIsConnected(data.connected || false);
          setGsxAvailable(data.gsxAvailable || false);
          
          // Fetch aircraft state
          const aircraftResponse = await fetch('/api/efb-data/aircraft-state');
          if (aircraftResponse.ok) {
            const aircraftData = await aircraftResponse.json();
            setIsOnGround(aircraftData.isOnGround || false);
          }

          // Fetch GSX states
          const gsxResponse = await fetch('/api/efb-data/gsx-states');
          if (gsxResponse.ok) {
            const gsxData = await gsxResponse.json();
            setServiceStates(gsxData.states || {});
          }
        } else {
          // Community addon not installed
          setCommunityAddonInstalled(false);
          setIsConnected(false);
          setGsxAvailable(false);
          setIsOnGround(false);
          setServiceStates({});
        }
      } catch (error) {
        // Community addon not available
        setCommunityAddonInstalled(false);
        setIsConnected(false);
        setGsxAvailable(false);
        setIsOnGround(false);
        setServiceStates({});
      }
    };

    // Initial check
    checkCommunityAddon();

    // Update every 2 seconds if community addon is installed
    const interval = setInterval(() => {
      if (communityAddonInstalled) {
        checkCommunityAddon();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [show, communityAddonInstalled]);

  const getServiceStatus = (serviceId: string) => {
    const state = serviceStates[serviceId];
    if (!isOnGround) return { status: "ground", text: "Not on Ground", color: "gray" };
    
    switch (state) {
      case GSX_STATES.AVAILABLE:
        return { status: "available", text: "Available", color: "green" };
      case GSX_STATES.NOT_AVAILABLE:
        return { status: "unavailable", text: "Not Available", color: "red" };
      case GSX_STATES.REQUESTED:
        return { status: "requested", text: "Requested", color: "yellow" };
      case GSX_STATES.PERFORMING:
        return { status: "performing", text: "In Progress", color: "blue" };
      case GSX_STATES.COMPLETED:
        return { status: "completed", text: "Completed", color: "green" };
      default:
        return { status: "unknown", text: "Unknown", color: "gray" };
    }
  };

  const handleServiceRequest = async (service: GSXService) => {
    if (isLoading || !communityAddonInstalled) return;
    
    setIsLoading(true);
    
    try {
      // Send request to community addon
      const response = await fetch('/api/efb-data/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: service.id,
          action: 'request',
          menuChoice: service.menuChoice,
        }),
      });

      if (response.ok) {
        toast.success(`${service.name} service requested!`, {
          icon: "✈️",
          style: {
            background: "#1f2937",
            color: "#ffffff",
            border: "1px solid #374151",
            boxShadow: "0 4px 20px rgba(182, 12, 24, 0.15)",
          },
        });
        
        // Update state to requested
        setServiceStates(prev => ({
          ...prev,
          [service.id]: GSX_STATES.REQUESTED,
        }));
      } else {
        throw new Error('Failed to request service');
      }
    } catch (error) {
      toast.error(`Failed to request ${service.name} service`, {
        icon: "❌",
        style: {
          background: "#1f2937",
          color: "#ffffff",
          border: "1px solid #374151",
          boxShadow: "0 4px 20px rgba(182, 12, 24, 0.15)",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-500/20 border-green-500/30 text-green-400";
      case "red":
        return "bg-red-500/20 border-red-500/30 text-red-400";
      case "yellow":
        return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
      case "blue":
        return "bg-blue-500/20 border-blue-500/30 text-blue-400";
      default:
        return "bg-gray-500/20 border-gray-500/30 text-gray-400";
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-pink-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <Icon icon="mdi:airplane-settings" className="text-xl text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">GSX Ground Services</h2>
                  <p className="text-sm text-gray-400">Control ground services and operations</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Icon icon="mdi:close" className="text-lg text-white" />
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="px-6 py-3 bg-white/5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Community Addon Status */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  communityAddonInstalled 
                    ? "bg-green-500/20 border border-green-500/30 text-green-400" 
                    : "bg-red-500/20 border border-red-500/30 text-red-400"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    communityAddonInstalled ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`} />
                  <span className="text-xs font-medium">
                    {communityAddonInstalled ? "Community Addon Active" : "Community Addon Not Installed"}
                  </span>
                </div>
                
                {/* MSFS Connection Status */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  isConnected 
                    ? "bg-blue-500/20 border border-blue-500/30 text-blue-400" 
                    : "bg-gray-500/20 border border-gray-500/30 text-gray-400"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-blue-500 animate-pulse" : "bg-gray-500"
                  }`} />
                  <span className="text-xs font-medium">
                    {isConnected ? "MSFS Connected" : "MSFS Disconnected"}
                  </span>
                </div>
                
                {/* GSX Status */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  gsxAvailable 
                    ? "bg-green-500/20 border border-green-500/30 text-green-400" 
                    : "bg-yellow-500/20 border border-yellow-500/30 text-yellow-400"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    gsxAvailable ? "bg-green-500" : "bg-yellow-500"
                  }`} />
                  <span className="text-xs font-medium">
                    {gsxAvailable ? "GSX Available" : "GSX Not Detected"}
                  </span>
                </div>
                
                {/* Ground Status */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  isOnGround 
                    ? "bg-green-500/20 border border-green-500/30 text-green-400" 
                    : "bg-red-500/20 border border-red-500/30 text-red-400"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isOnGround ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`} />
                  <span className="text-xs font-medium">
                    {isOnGround ? "On Ground" : "Not on Ground"}
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-gray-400">
                {communityAddonInstalled ? "Real-time data from MSFS" : "Community addon not installed"}
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {!communityAddonInstalled ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
                  <Icon icon="mdi:alert-circle" className="text-2xl text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Community Addon Required</h3>
                <p className="text-gray-400 mb-4 max-w-md">
                  To use GSX Control, you need to install the JAL EFB Community Addon in your MSFS Community folder.
                </p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-md">
                  <h4 className="text-sm font-semibold text-white mb-2">Installation Steps:</h4>
                  <ol className="text-sm text-gray-400 space-y-1 text-left">
                    <li>1. Copy the community-addon folder to your MSFS Community directory</li>
                    <li>2. Run npm install in the community-addon folder</li>
                    <li>3. Start the data sync service</li>
                    <li>4. Launch MSFS and login in the game panel</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GSX_SERVICES.map((service, index) => {
                const status = getServiceStatus(service.id);
                const isAvailable = status.status === "available";
                
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative group p-4 rounded-2xl border transition-all duration-300 ${
                      isAvailable
                        ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-red-500/10"
                        : "bg-white/5 border-white/5 opacity-60"
                    }`}
                  >
                    {/* Service Icon */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                      isAvailable 
                        ? "bg-red-500/20 group-hover:bg-red-500/30" 
                        : "bg-gray-500/20"
                    }`}>
                      <Icon 
                        icon={service.icon} 
                        className={`text-xl ${
                          isAvailable ? "text-red-400 group-hover:text-red-300" : "text-gray-500"
                        }`} 
                      />
                    </div>

                    {/* Service Info */}
                    <div className="mb-3">
                      <h3 className={`font-semibold mb-1 ${
                        isAvailable ? "text-white" : "text-gray-500"
                      }`}>
                        {service.name}
                      </h3>
                      <p className={`text-xs ${
                        isAvailable ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {service.description}
                      </p>
                    </div>

                    {/* Status */}
                    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium mb-3 ${getStatusColor(status.color)}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        status.status === "performing" ? "animate-pulse" : ""
                      }`} style={{ backgroundColor: `var(--${status.color}-500)` }} />
                      {status.text}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleServiceRequest(service)}
                      disabled={!isAvailable || isLoading}
                      className={`w-full py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isAvailable && !isLoading
                          ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50"
                          : "bg-gray-500/20 text-gray-600 cursor-not-allowed border border-gray-500/30"
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Requesting...
                        </div>
                      ) : (
                        isAvailable ? "Request Service" : "Not Available"
                      )}
                    </button>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-red-500/5 group-hover:via-pink-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none" />
                  </motion.div>
                );
              })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                GSX Ground Services Control Panel
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Icon icon="mdi:information-outline" className="text-sm" />
                Services require aircraft to be on ground
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
