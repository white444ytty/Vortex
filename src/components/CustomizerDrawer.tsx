import React from 'react';
import ThemeCustomizer from './ThemeCustomizer';

interface CustomizerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomizerDrawer: React.FC<CustomizerDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <ThemeCustomizer onClose={onClose} />;
};

export default CustomizerDrawer;
