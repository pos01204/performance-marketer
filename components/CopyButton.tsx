
import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from './Icons';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  onCopy?: () => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, className = '', onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event when clicking the button
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      if (onCopy) onCopy();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-md text-gray-400 hover:bg-gray-600 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all ${className}`}
      aria-label="클립보드에 복사"
      title="클립보드에 복사"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
};