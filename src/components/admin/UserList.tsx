
import React from 'react';
import { User } from '@/types';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from 'lucide-react';

interface UserListProps {
  users: User[];
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  isDeletingUser: string | null;
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  onEditUser, 
  onDeleteUser,
  isDeletingUser 
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                No users found. Add some users to see them here.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>
                  <span className={user.role === 'admin' ? 'text-custom-red' : 'text-gray-600'}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEditUser(user)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    
                    {!(user.name === 'Admin' && user.role === 'admin') && (
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => onDeleteUser(user.id, user.name)}
                        disabled={isDeletingUser === user.id}
                        className="text-red-600 hover:text-red-800 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserList;
