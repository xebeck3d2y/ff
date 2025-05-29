import { createContext, useContext, useState, ReactNode } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface UserContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  searchUsers: (query: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  deleteUser: (email: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async (query?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.users.search, {
        params: query ? { query } : {}
      });
      setUsers(response.data.users);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to fetch users";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    await fetchUsers(query);
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  const deleteUser = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await axiosInstance.delete(API_ENDPOINTS.auth.deleteUser, {
        data: { email },
      });
      toast({
        title: "User deleted",
        description: `User ${email} has been deleted.`,
      });
      await fetchUsers();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to delete user";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    users,
    loading,
    error,
    searchUsers,
    refreshUsers,
    deleteUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}; 