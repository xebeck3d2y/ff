import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FileItem, FilePermission } from "@/types/file";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

interface FileContextType {
  files: FileItem[];
  sharedFiles: FileItem[];
  uploadFile: (file: globalThis.File) => Promise<void>;
  downloadFile: (fileId: string) => Promise<void>;
  shareFile: (fileId: string, email: string, permissions: Omit<FilePermission, 'userId'>) => Promise<void>;
  revokeShare: (fileId: string, userId: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  refreshFiles: () => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFiles must be used within a FileProvider");
  }
  return context;
};

interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider = ({ children }: FileProviderProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [sharedFiles, setSharedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const refreshFiles = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.files.list);
      setFiles(response.data.files || []);
      setSharedFiles(response.data.sharedFiles || []);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshFiles();
    } else {
      setFiles([]);
      setSharedFiles([]);
    }
  }, [currentUser]);

  const uploadFile = async (file: globalThis.File) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await axiosInstance.post(API_ENDPOINTS.files.upload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      await refreshFiles();
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance({
        url: API_ENDPOINTS.files.download(fileId),
        method: 'GET',
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const file = files.find(f => f.id === fileId) || sharedFiles.find(f => f.id === fileId);
      
      if (file) {
        link.href = url;
        link.setAttribute('download', file.name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Fichier téléchargé",
          description: `${file.name} a été téléchargé avec succès.`,
        });
      }
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const shareFile = async (fileId: string, email: string, permissions: Omit<FilePermission, 'userId'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.files.share(fileId), 
        { email, ...permissions }
      );
      
      const sharedUsers = response.data.sharedUsers;
      
      // Update files list with new shared status
      setFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          return { 
            ...file, 
            isShared: true,
            sharedUsers: sharedUsers
          };
        }
        return file;
      }));
      
      return { success: true, sharedUsers };
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async (fileId: string, userId: string) => {
    setLoading(true);
    setError(null);
  
    try {
      await axiosInstance.delete(API_ENDPOINTS.files.revokeShare(fileId, userId));
  
      // Update files list to reflect the revoked access
      setFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          return {
            ...file,
            sharedUsers: file.sharedUsers?.filter(user => user.id !== userId) || []
          };
        }
        return file;
      }));
  
      return { success: true };
    } catch (err) {
      const errorMsg = (err as Error).message || "Failed to revoke access";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await axiosInstance.delete(API_ENDPOINTS.files.delete(fileId));
      
      setFiles(prev => prev.filter(file => file.id !== fileId));
      setSharedFiles(prev => prev.filter(file => file.id !== fileId));
      
      toast({
        title: "Fichier supprimé",
        description: "Le fichier a été supprimé avec succès.",
      });
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    files,
    sharedFiles,
    uploadFile,
    downloadFile,
    shareFile,
    revokeShare,
    deleteFile,
    loading,
    error,
    refreshFiles
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};