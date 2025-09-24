'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';

interface ActivationModalProps {
  show: boolean;
  onClose: () => void;
  onActivated: (apiKey: string) => void;
}

const ActivationModal: React.FC<ActivationModalProps> = ({ show, onClose, onActivated }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Check if already activated
  useEffect(() => {
    if (show) {
      const savedKey = localStorage.getItem('jal-efb-api-key');
      if (savedKey) {
        setApiKey(savedKey);
      }
    }
  }, [show]);

  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      // Validate against JAL Virtual phpVMS API
      const response = await fetch('https://crew.jalvirtual.com/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: key,
          pilot_id: key // phpVMS often uses pilot_id as API key
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Check if response indicates valid authentication
        return data.status === 'success' || data.authenticated === true || data.valid === true;
      }
      
      return false;
    } catch (error) {
      console.error('API validation error:', error);
      // Fallback validation for offline/development
      return key.startsWith('JAL') && key.length >= 8;
    }
  };

  const handleActivate = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your JAL Virtual Pilot ID', {
        icon: "🔑",
        style: {
          background: "#1f2937",
          color: "#ffffff",
          border: "1px solid #374151",
          boxShadow: "0 4px 20px rgba(182, 12, 24, 0.15)",
        },
      });
      return;
    }

    setIsLoading(true);
    setIsValidating(true);

    try {
      const isValid = await validateApiKey(apiKey);
      
      if (isValid) {
        // Save to localStorage for future use
        localStorage.setItem('jal-efb-api-key', apiKey);
        localStorage.setItem('jal-efb-activated', 'true');
        localStorage.setItem('jal-efb-activation-date', new Date().toISOString());
        
        // Also save to legacy key for backward compatibility
        localStorage.setItem('jalApiKey', apiKey);
        
        toast.success('JAL EFB Activated Successfully!', {
          icon: "✅",
          style: {
            background: "#1f2937",
            color: "#ffffff",
            border: "1px solid #374151",
            boxShadow: "0 4px 20px rgba(16, 185, 129, 0.15)",
          },
        });
        
        onActivated(apiKey);
        onClose();
      } else {
        toast.error('Invalid Pilot ID. Please check your JAL Virtual Pilot ID.', {
          icon: "❌",
          style: {
            background: "#1f2937",
            color: "#ffffff",
            border: "1px solid #374151",
            boxShadow: "0 4px 20px rgba(239, 68, 68, 0.15)",
          },
        });
      }
    } catch (error) {
      toast.error('Activation failed. Please try again.', {
        icon: "⚠️",
        style: {
          background: "#1f2937",
          color: "#ffffff",
          border: "1px solid #374151",
          boxShadow: "0 4px 20px rgba(245, 158, 11, 0.15)",
        },
      });
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleActivate();
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:airplane" className="text-2xl text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">JAL EFB Activation</h2>
            <p className="text-gray-400 text-sm">
              Enter your JAL Virtual Pilot ID to activate the EFB
            </p>
          </div>

          {/* API Key Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                JAL Virtual Pilot ID
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your JAL Virtual Pilot ID"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <Icon 
                  icon="mdi:key" 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
              </div>
            </div>

            {/* Validation Status */}
            {isValidating && (
              <div className="flex items-center justify-center space-x-2 text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                <span className="text-sm">Validating API Key...</span>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Icon icon="mdi:information" className="text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-medium mb-1">How to get your API Key:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Log in to <a href="https://crew.jalvirtual.com" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-blue-100 underline">crew.jalvirtual.com</a></li>
                    <li>• Go to your pilot profile settings</li>
                    <li>• Find your Pilot ID or API Key</li>
                    <li>• Use your Pilot ID as the API Key</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleActivate}
              disabled={isLoading || !apiKey.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Activating...</span>
                </>
              ) : (
                <>
                  <Icon icon="mdi:check" />
                  <span>Activate EFB</span>
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-xs text-gray-500">
            <p>JAL Virtual EFB • Exclusive Access</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActivationModal;
