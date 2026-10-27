import React from 'react';
import { Crop, Database, Sparkles, CheckCircle2 } from 'lucide-react';

export const Header = ({ isConnected = true, imageCount = 0 }) => {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="brand-icon-wrapper">
            <Crop size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="brand-title">Image Auto Crop & Aspect Ratio Viewer</h1>
            <p className="brand-subtitle">
              MERN Stack • MongoDB GridFS • HTML5 Canvas Distortion-Free Crop
            </p>
          </div>
        </div>

        <div className="header-badges">
          <span className="badge badge-cloud">
            <Database size={13} />
            <span>MongoDB GridFS</span>
          </span>
          <span className="badge badge-status">
            <span className="badge-pulse"></span>
            <span>{isConnected ? 'API Live' : 'Connecting...'}</span>
          </span>
        </div>
      </div>
    </header>
  );
};
