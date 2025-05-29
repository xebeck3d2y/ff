import { useEffect, useState } from "react";
import { useFiles } from "@/context/FileContext";
import { FileItem } from "@/types/file";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Share } from "lucide-react";

interface ShareFileDialogProps {
  file: FileItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare?: () => void;
}

export const ShareFileDialog = ({ file, open, onOpenChange, onShare }: ShareFileDialogProps) => {
  const { shareFile, loading } = useFiles();
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState({
    canView: true,
    canEdit: false,
    canDelete: false,
  });
  const [sharedUsers, setSharedUsers] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{ success?: boolean; message?: string }>({});

  const handleShare = async () => {
    if (!email) return;
    
    setIsSharing(true);
    setShareResult({});
    
    try {
      const result = await shareFile(file.id, email, permissions);
      
      if (result.success && result.sharedUsers) {
        setSharedUsers(result.sharedUsers);
        onShare?.();
        
        setShareResult({
          success: true,
          message: `File successfully shared with ${email}`,
        });

        // Reset form
        setEmail("");
        setPermissions({
          canView: true,
          canEdit: false,
          canDelete: false,
        });
      }
    } catch (error) {
      setShareResult({
        success: false,
        message: (error as Error).message || "Failed to share file"
      });
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    if (open) {
      // Use existing shared users from file if available
      if (file.sharedUsers) {
        setSharedUsers(file.sharedUsers);
      }
      // Fetch latest shared users
      fetch(`/api/files/${file.id}/shared-users`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Shared users:", data); // Debug log
          setSharedUsers(data.sharedUsers || []);
        })
        .catch((err) => console.error("Error fetching shared users:", err));
    }
  }, [open, file.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{file.name}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="Enter recipient's email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <h4 className="mb-2 font-medium">Permissions</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="view"
                  checked={permissions.canView} 
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, canView: Boolean(checked) }))
                  }
                />
                <Label htmlFor="view">Can View</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit"
                  checked={permissions.canEdit} 
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, canEdit: Boolean(checked) }))
                  }
                />
                <Label htmlFor="edit">Can Edit</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="delete"
                  checked={permissions.canDelete} 
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, canDelete: Boolean(checked) }))
                  }
                />
                <Label htmlFor="delete">Can Delete</Label>
              </div>
            </div>
          </div>
          
          {sharedUsers.length > 0 && (
            <div>
              <h4 className="mb-2 font-medium">Shared With</h4>
              <ul className="list-disc pl-5">
                {sharedUsers.map((user, index) => (
                  <li key={index}>
                    {user.email} (View: {user.canView ? "Yes" : "No"}, Edit: {user.canEdit ? "Yes" : "No"}, Delete: {user.canDelete ? "Yes" : "No"})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {shareResult.message && (
            <div className={`p-3 rounded-md text-sm ${
              shareResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}>
              {shareResult.message}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            onClick={handleShare}
            disabled={!email || isSharing || !permissions.canView}
            className="gap-1"
          >
            <Share className="h-4 w-4" />
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
