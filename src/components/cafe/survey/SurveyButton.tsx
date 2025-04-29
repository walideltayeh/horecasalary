
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, ClipboardList } from 'lucide-react';

interface SurveyButtonProps {
  isDisabled: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

const SurveyButton: React.FC<SurveyButtonProps> = ({
  isDisabled,
  isCompleted,
  onClick
}) => {
  return (
    <Button 
      type="button" 
      variant={isCompleted ? "outline" : "default"} 
      className={`w-full font-bold ${
        isDisabled 
          ? 'bg-gray-200 text-black cursor-not-allowed' 
          : isCompleted 
            ? 'border-green-500 text-green-500 hover:bg-green-50' 
            : 'bg-[#1a365d] text-white hover:bg-[#2a4365]'
      }`} 
      disabled={isDisabled} 
      onClick={onClick}
    >
      {isCompleted ? (
        <>
          <Check className="mr-2" />
          <span className="font-bold">Survey Completed</span>
        </>
      ) : (
        <>
          <ClipboardList className="mr-2" />
          <span className="font-bold">
            {isDisabled ? 'Survey Not Required' : 'Complete Brand Survey'}
          </span>
        </>
      )}
    </Button>
  );
};

export default SurveyButton;
