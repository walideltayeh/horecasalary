
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LocationDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  isCapturing: boolean;
}

export const LocationDialog = ({ showDialog, setShowDialog, isCapturing }: LocationDialogProps) => {
  return (
    <Dialog 
      open={showDialog} 
      onOpenChange={(open) => {
        setShowDialog(open);
        if (!open && isCapturing) {
          console.log("Dialog closed manually during location capture");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capturing Location</DialogTitle>
          <DialogDescription>
            {isCapturing ? (
              <div className="flex flex-col items-center py-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-custom-red mb-4"></div>
                <p className="text-center">Please allow location access when prompted by your browser.</p>
                <p className="mt-2 text-sm text-gray-500 text-center">Make sure location services are enabled on your device.</p>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-center">Location access was denied or encountered an error.</p>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Please check your browser settings and ensure that location access is enabled for this site.
                </p>
                <Button 
                  className="mt-4 w-full" 
                  onClick={() => setShowDialog(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
