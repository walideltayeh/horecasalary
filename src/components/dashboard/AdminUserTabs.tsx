
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { User } from '@/types';
import UserDashboard from '../UserDashboard';

interface AdminUserTabsProps {
  users: User[];
}

const AdminUserTabs: React.FC<AdminUserTabsProps> = ({ users }) => {
  return (
    <>
      {users.filter(u => u.role === 'user').map((u) => (
        <TabsContent key={u.id} value={u.id}>
          <UserDashboard userId={u.id} userName={u.name} />
        </TabsContent>
      ))}
    </>
  );
};

export default AdminUserTabs;
