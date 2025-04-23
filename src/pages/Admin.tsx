
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Navigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const { cafes, getCafeSize } = useData();
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Monitor user activity and cafe data</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Cafe Database</CardTitle>
          <CardDescription>All cafes in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Date Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cafes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No cafes found. Add some cafes to see them here.
                    </TableCell>
                  </TableRow>
                ) : (
                  cafes.map((cafe) => (
                    <TableRow key={cafe.id}>
                      <TableCell className="font-medium">{cafe.name}</TableCell>
                      <TableCell>
                        <span className={getCafeSize(cafe.numberOfHookahs) === 'In Negotiation' ? 'text-orange-500' : 
                                         getCafeSize(cafe.numberOfHookahs) === 'Small' ? 'text-blue-500' : 
                                         getCafeSize(cafe.numberOfHookahs) === 'Medium' ? 'text-green-500' : 
                                         'text-purple-500'}>
                          {getCafeSize(cafe.numberOfHookahs)}
                        </span>
                      </TableCell>
                      <TableCell>{cafe.governorate}, {cafe.city}</TableCell>
                      <TableCell>
                        <span className={cafe.status === 'Contracted' ? 'text-green-500' : 
                                         cafe.status === 'Visited' ? 'text-blue-500' : 
                                         'text-gray-500'}>
                          {cafe.status}
                        </span>
                      </TableCell>
                      <TableCell>{cafe.ownerName}</TableCell>
                      <TableCell>{new Date(cafe.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-500">Total Cafes</div>
              <div className="text-2xl font-bold mt-1">{cafes.length}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-500">Visited Cafes</div>
              <div className="text-2xl font-bold mt-1">{cafes.filter(c => c.status === 'Visited' || c.status === 'Contracted').length}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-500">Contracted Cafes</div>
              <div className="text-2xl font-bold mt-1">{cafes.filter(c => c.status === 'Contracted').length}</div>
            </div>
          </div>
          
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>HoReCa Salary App - Admin Panel</p>
            <p>Version 1.0.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
