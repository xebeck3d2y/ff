import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Permet l'accès depuis le réseau local
    port: 8080, // Port personnalisé
    open: true // Ouvre le navigateur automatiquement
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src") // Alias pour les imports
    }
  },
  optimizeDeps: {
    include: ["react", "react-dom"] // Optimisations pour React
  },
  build: {
    outDir: "dist", // Dossier de build
    sourcemap: mode === 'development' // Sourcemaps en dev seulement
  }
}));
