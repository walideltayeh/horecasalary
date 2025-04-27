
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CafeFormLayoutProps {
  children: React.ReactNode;
  isSubmitting: boolean;
  hasHookahs: boolean;
  surveyCompleted: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const CafeFormLayout = ({
  children,
  isSubmitting,
  hasHookahs,
  surveyCompleted,
  onSubmit
}: CafeFormLayoutProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Cafe</CardTitle>
        <CardDescription>Enter cafe details to add to your database</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-6">
          {children}
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button 
            type="submit" 
            className="w-full bg-custom-red hover:bg-red-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Add Cafe"}
          </Button>
          
          {hasHookahs && !surveyCompleted && (
            <div className="mt-2 text-sm text-amber-600 font-medium">
              A brand survey will appear after submission for cafes with hookahs
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};
