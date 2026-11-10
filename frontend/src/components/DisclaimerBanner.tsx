import React, { useState } from 'react';
import { AlertCircle, X, Shield, ExternalLink } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-mine-cardSec/90 via-[#18233a] to-mine-cardSec/90 border-b border-mine-info/20 px-4 py-2 text-xs text-mine-textSecondary flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 overflow-hidden">
        <Shield className="w-4 h-4 text-mine-info shrink-0" />
        <span className="truncate">
          <strong className="text-mine-textPrimary">Statutory Advisory Notice:</strong> Real-time atmospheric telemetry aligned with DGMS Coal Mines Regulations 2017 & OSHA Mining Standards. Certified flame safety lamps & methanometers remain mandatory for statutory shift sign-offs.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className="text-mine-textSecondary hover:text-white p-1 rounded hover:bg-white/10"
          title="Dismiss advisory notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
