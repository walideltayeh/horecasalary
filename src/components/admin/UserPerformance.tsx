
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Cafe } from '@/types';
import UserDashboard from '@/components/UserDashboard';
import { StatsOverview } from './StatsOverview';

interface UserPerformanceProps {
  users: User[];
  cafes: Cafe[];
}

export const UserPerformance: React.FC<UserPerformanceProps> = ({ users, cafes }) => {
  const [selectedTab, setSelectedTab] = React.useState<string>("all");

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Performance Dashboard</CardTitle>
        <CardDescription>View performance metrics by user</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="all">All Users</TabsTrigger>
            {users.filter(u => u.role === 'user').map((user) => (
              <TabsTrigger key={user.id} value={user.id}>{user.name}</TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <StatsOverview cafes={cafes} />
          </TabsContent>
          
          {users.filter(u => u.role === 'user').map((user) => (
            <TabsContent key={user.id} value={user.id}>
              <UserDashboard userId={user.id} userName={user.name} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
