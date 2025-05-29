import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useFiles } from "@/context/FileContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const FileUploader = () => {
  const { uploadFile, loading } = useFiles();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});
  const [uploadSuccess, setUploadSuccess] = useState<string[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Reset states for new uploads
    setUploadErrors({});
    
    // Filter out .exe files
    const filteredFiles = acceptedFiles.filter(file => {
      if (file.name.endsWith('.exe')) {
        setUploadErrors(prev => ({
          ...prev,
          [file.name]: "Uploading .exe files is not allowed."
        }));
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: `${file.name} is not allowed for upload.`,
        });
        return false;
      }
      return true;
    });

    for (const file of filteredFiles) {
      const fileId = `${file.name}-${Date.now()}`;
      
      try {
        // Start with 0 progress
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        
        // Simulate progress updates (since we can't get real progress from the backend easily)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[fileId] || 0;
            if (currentProgress < 90) {
              return { ...prev, [fileId]: currentProgress + 10 };
            }
            return prev;
          });
        }, 300);
        
        // Upload the file to the backend
        await uploadFile(file);
        
        // Clear interval and set to 100%
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        
        // Add to success list
        setUploadSuccess(prev => [...prev, fileId]);
        
        // Show success toast
        toast({
          title: "Fichier téléchargé",
          description: `${file.name} a été téléchargé avec succès.`,
        });
        
        // Remove from lists after delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newState = { ...prev };
            delete newState[fileId];
            return newState;
          });
          setUploadSuccess(prev => prev.filter(id => id !== fileId));
        }, 3000);
        
      } catch (error) {
        setUploadErrors(prev => ({ 
          ...prev, 
          [fileId]: (error as Error).message || "Upload failed" 
        }));
        setUploadProgress(prev => {
          const newState = { ...prev };
          delete newState[fileId];
          return newState;
        });
        
        // Show error toast
        toast({
          variant: "destructive",
          title: "Échec du téléchargement",
          description: (error as Error).message || "Une erreur s'est produite lors du téléchargement du fichier.",
        });
      }
    }
  }, [uploadFile, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeUpload = (fileId: string) => {
    setUploadProgress(prev => {
      const newState = { ...prev };
      delete newState[fileId];
      return newState;
    });
    setUploadErrors(prev => {
      const newState = { ...prev };
      delete newState[fileId];
      return newState;
    });
  };

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-8 
          text-center cursor-pointer transition-colors
          ${isDragActive 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}
        `}
      >
        <input {...getInputProps()} disabled={loading} />
        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-lg font-medium">Glissez des fichiers ici ou cliquez pour sélectionner</p>
        <p className="text-sm text-gray-500 mt-1">
          Téléchargez des fichiers pour les stocker et les partager en toute sécurité
        </p>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Téléchargement en cours</h3>
          
          {Object.entries(uploadProgress).map(([fileId, progress]) => {
            const fileName = fileId.split('-')[0]; // Extract filename from the fileId
            const isError = uploadErrors[fileId];
            const isSuccess = uploadSuccess.includes(fileId);
            
            return (
              <div key={fileId} className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    {isSuccess && <FileCheck className="h-4 w-4 text-green-500" />}
                    <span className="text-sm truncate max-w-[200px]">
                      {fileName}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeUpload(fileId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {isError ? (
                  <p className="text-xs text-destructive">{isError}</p>
                ) : (
                  <Progress value={progress} className="h-1" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
