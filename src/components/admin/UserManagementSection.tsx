
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import UserManagementForm from './UserManagementForm';

interface UserManagementSectionProps {
  onAddUser: (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => Promise<void>;
  isAddingUser: boolean;
}

const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  onAddUser,
  isAddingUser
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Add and manage users</CardDescription>
      </CardHeader>
      <CardContent>
        <UserManagementForm
          onAddUser={onAddUser}
          isAddingUser={isAddingUser}
        />
      </CardContent>
    </Card>
  );
};

export default UserManagementSection;
