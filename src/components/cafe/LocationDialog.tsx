
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
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Capturing Location</DialogTitle>
          <DialogDescription>
            {isCapturing ? (
              <div className="flex flex-col items-center py-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-custom-red mb-4"></div>
                <p>Please allow location access when prompted by your browser.</p>
                <p className="mt-2 text-sm text-gray-500">Make sure location services are enabled on your device.</p>
              </div>
            ) : (
              <div className="py-4">
                <p>Location access was denied or encountered an error.</p>
                <p className="mt-2 text-sm text-gray-500">
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
