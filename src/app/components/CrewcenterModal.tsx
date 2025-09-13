'use client'
import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import { Icon } from "@iconify/react"

type Props = {
  show: boolean;
  onClose: () => void;
};

const NavigraphModal = ({ show, onClose }: Props) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [lastPath, setLastPath] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!show) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://crew.jalvirtual.com/') return;
      
      if (event.data.type === 'pathChange') {
        localStorage.setItem('navigraphLastPath', event.data.path);
        setLastPath(event.data.path);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [show]);

  useEffect(() => {
    if (show) {
      const savedPath = localStorage.getItem('navigraphLastPath') || '';
      setLastPath(savedPath);
    }
  }, [show]);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const iframeSrc = lastPath 
    ? `https://crew.jalvirtual.com${lastPath}`
    : 'https://crew.jalvirtual.com/';

  return (
    <Modal onClose={onClose} wide>
      {/* Centered content */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="relative w-[90vw] max-w-[1800px] h-[90vh] bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Icon icon="mdi:map" className="text-xl text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Crew Center</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleRefresh}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-blue-400"
                title="Refresh Charts"
              >
                <Icon icon="mdi:refresh" width={20} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
              >
                <Icon icon="mdi:close" width={24} />
              </button>
            </div>
          </div>
          
          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-0">
              <div className="flex items-center space-x-2 text-blue-400">
                <Icon icon="line-md:loading-twotone-loop" className="text-2xl" />
                <span>Loading Crew Center...</span>
              </div>
            </div>
          )}

          {/* Iframe */}
          <iframe
            key={iframeKey}
            src={iframeSrc}
            className={`w-full h-full border-0 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            allow="fullscreen"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
          
          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-4 py-2 text-center text-xs text-gray-400">
            <div className="truncate">
              Current chart: {lastPath || 'Navigraph Home'}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NavigraphModal;
