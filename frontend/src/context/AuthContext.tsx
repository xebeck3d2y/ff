import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

interface User {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  status: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<{ user: User; token: string } | undefined>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const location = useLocation();

  // Check if current route is public
  const isPublicRoute = () => {
    const publicRoutes = ['/', '/login', '/register'];
    return publicRoutes.includes(location.pathname);
  };

  // Vérification du token au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token && !isPublicRoute()) {
        setLoading(true);
        try {
          const response = await axiosInstance.get(API_ENDPOINTS.auth.me);
          setCurrentUser(response.data.user);
        } catch (err) {
          console.error("Auth check failed:", err);
          localStorage.removeItem('token');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.auth.login, {
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setCurrentUser(user);
      
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté à votre compte."
      });
    } catch (err: any) {
      const message = err.response?.data?.message || "Échec de la connexion";
      setError(message);
      toast({
        title: "Erreur de connexion",
        description: message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Envoyer la requête d'inscription
      const registerResponse = await axiosInstance.post(API_ENDPOINTS.auth.register, {
        email,
        password,
        displayName
      });

      if (!registerResponse.data.user) {
        throw new Error(registerResponse.data.message || "Erreur lors de l'inscription");
      }
      
      // Dans un deuxième temps, effectuer la connexion
      const loginResponse = await axiosInstance.post(API_ENDPOINTS.auth.login, {
        email,
        password
      });
      
      const { token, user } = loginResponse.data;
      
      // S'assurer que le token est bien enregistré avant de continuer
      localStorage.setItem('token', token);
      
      // Mettre à jour l'état de l'utilisateur
      setCurrentUser(user);
      
      // Ajouter le token aux en-têtes par défaut d'axios
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès."
      });

      // Retourner les données pour que le composant puisse rediriger
      return { user, token };
      
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Échec de l'inscription";
      setError(message);
      toast({
        title: "Erreur d'inscription",
        description: message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    
    try {
      localStorage.removeItem('token');
      setCurrentUser(null);
      
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès."
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


