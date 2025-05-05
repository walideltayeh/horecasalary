
import React from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <Button 
      variant="ghost" 
      onClick={toggleLanguage} 
      className="text-white hover:text-white hover:bg-opacity-20 hover:bg-white"
    >
      {language === 'en' ? 'ES' : 'EN'}
    </Button>
  );
};

export default LanguageToggle;
