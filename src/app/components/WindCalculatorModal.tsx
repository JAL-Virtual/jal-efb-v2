"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useLanguage } from "../../lib/LanguageContext";

interface WindCalculatorModalProps {
  show: boolean;
  onClose: () => void;
}

interface WindCalcState {
  windDir: string;
  windSpeed: string;
  runway: string;
  headwind: number;
  tailwind: number;
  crosswind: number;
  crosswindLimit: number;
}

export default function WindCalculatorModal({ show, onClose }: WindCalculatorModalProps) {
  const { t } = useLanguage();
  const [windCalc, setWindCalc] = useState<WindCalcState>({
    windDir: '',
    windSpeed: '',
    runway: '',
    headwind: 0,
    tailwind: 0,
    crosswind: 0,
    crosswindLimit: 15 // Default crosswind limit in knots
  });

  // Wind Component Calculator function
  const calculateWindComponents = useCallback(() => {
    const windDir = parseFloat(windCalc.windDir);
    const windSpeed = parseFloat(windCalc.windSpeed);
    const runwayHeading = parseFloat(windCalc.runway) * 10; // Convert runway number to heading

    if (isNaN(windDir) || isNaN(windSpeed) || isNaN(runwayHeading) || windSpeed < 0) {
      setWindCalc(prev => ({ ...prev, headwind: 0, tailwind: 0, crosswind: 0 }));
      return;
    }

    // Calculate wind components
    const windAngleRad = (windDir - runwayHeading) * Math.PI / 180;
    const headwind = Math.round(windSpeed * Math.cos(windAngleRad));
    const crosswind = Math.round(Math.abs(windSpeed * Math.sin(windAngleRad)));

    setWindCalc(prev => ({
      ...prev,
      headwind: headwind,
      tailwind: headwind < 0 ? Math.abs(headwind) : 0,
      crosswind: crosswind
    }));
  }, [windCalc.windDir, windCalc.windSpeed, windCalc.runway]);

  // Auto-calculate when inputs change
  useEffect(() => {
    calculateWindComponents();
  }, [calculateWindComponents]);

  if (!show) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Icon icon="mdi:weather-windy" className="text-2xl" />
          {t.windCalculator.title}
        </h2>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-full bg-[#b60c18] hover:bg-[#ea4256] text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400/60"
        >
          {t.windCalculator.close}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">{t.windCalculator.inputValues}</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t.windCalculator.windDirection}</label>
            <input
              type="number"
              min="0"
              max="360"
              step="1"
              value={windCalc.windDir}
              onChange={(e) => setWindCalc(prev => ({ ...prev, windDir: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent"
              placeholder="e.g., 240"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.windCalculator.windDirectionHint}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t.windCalculator.windSpeed}</label>
            <input
              type="number"
              min="0"
              step="1"
              value={windCalc.windSpeed}
              onChange={(e) => setWindCalc(prev => ({ ...prev, windSpeed: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent"
              placeholder="e.g., 15"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t.windCalculator.runwayNumber}</label>
            <input
              type="number"
              min="1"
              max="36"
              step="1"
              value={windCalc.runway}
              onChange={(e) => setWindCalc(prev => ({ ...prev, runway: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent"
              placeholder="e.g., 24"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.windCalculator.runwayHint}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t.windCalculator.crosswindLimit}</label>
            <input
              type="number"
              min="0"
              value={windCalc.crosswindLimit}
              onChange={(e) => setWindCalc(prev => ({ ...prev, crosswindLimit: parseFloat(e.target.value) || 15 }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent"
              placeholder="e.g., 15"
            />
          </div>
        </div>
        
        {/* Results Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">{t.windCalculator.windComponents}</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className={`p-4 rounded-lg ${windCalc.headwind > 0 ? 'bg-green-100 dark:bg-green-900/30' : windCalc.headwind < 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.windCalculator.headwind}</span>
                <span className="text-2xl font-bold">{windCalc.headwind}</span>
              </div>
              <div className="text-sm opacity-70">{t.windCalculator.knots}</div>
            </div>
            
            <div className={`p-4 rounded-lg ${windCalc.tailwind > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.windCalculator.tailwind}</span>
                <span className="text-2xl font-bold">{windCalc.tailwind}</span>
              </div>
              <div className="text-sm opacity-70">{t.windCalculator.knots}</div>
            </div>
            
            <div className={`p-4 rounded-lg ${windCalc.crosswind > windCalc.crosswindLimit ? 'bg-red-100 dark:bg-red-900/30' : windCalc.crosswind > windCalc.crosswindLimit * 0.8 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.windCalculator.crosswind}</span>
                <span className="text-2xl font-bold">{windCalc.crosswind}</span>
              </div>
              <div className="text-sm opacity-70">{t.windCalculator.knots}</div>
            </div>
          </div>
          
          {/* Warning Messages */}
          {windCalc.crosswind > windCalc.crosswindLimit && (
            <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <Icon icon="mdi:alert-circle" className="text-xl" />
                <span className="font-semibold">{t.windCalculator.crosswindExceeded}</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {t.windCalculator.crosswind} ({windCalc.crosswind} {t.windCalculator.knots}) exceeds limit ({windCalc.crosswindLimit} {t.windCalculator.knots})
              </p>
            </div>
          )}
          
          {windCalc.crosswind > windCalc.crosswindLimit * 0.8 && windCalc.crosswind <= windCalc.crosswindLimit && (
            <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <Icon icon="mdi:alert" className="text-xl" />
                <span className="font-semibold">{t.windCalculator.approachingLimit}</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {t.windCalculator.crosswind} ({windCalc.crosswind} {t.windCalculator.knots}) is close to limit ({windCalc.crosswindLimit} {t.windCalculator.knots})
              </p>
            </div>
          )}
          
          {windCalc.tailwind > 0 && (
            <div className="p-4 rounded-lg bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <Icon icon="mdi:information" className="text-xl" />
                <span className="font-semibold">{t.windCalculator.tailwindPresent}</span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Consider runway performance with {windCalc.tailwind} {t.windCalculator.knots} {t.windCalculator.tailwind.toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
