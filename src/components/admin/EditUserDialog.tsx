
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editUser: {
    id: string;
    name: string;
    password: string;
    role: 'admin' | 'user';
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRoleChange: (value: string) => void;
  onSave: () => void;
  isEditing: boolean;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onOpenChange,
  editUser,
  onInputChange,
  onRoleChange,
  onSave,
  isEditing
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Leave password blank to keep the current password.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input 
              id="edit-name" 
              name="name"
              value={editUser.name}
              onChange={onInputChange}
              placeholder="Enter user name" 
              className="input-with-red-outline"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-password">Password</Label>
            <Input 
              id="edit-password" 
              name="password"
              type="password"
              value={editUser.password}
              onChange={onInputChange}
              placeholder="Enter new password (or leave blank)" 
              className="input-with-red-outline"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select
              value={editUser.role}
              onValueChange={onRoleChange}
              disabled={editUser.id === 'admin'}
            >
              <SelectTrigger id="edit-role" className="input-with-red-outline">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-custom-red hover:bg-red-700"
            onClick={onSave}
            disabled={isEditing}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
