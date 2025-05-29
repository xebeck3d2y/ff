import MainLayout from "../components/common/MainLayout";
import { FileList } from "@/components/files/FileList";
import { useFiles } from "@/context/FileContext";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShareFileDialog } from "@/components/files/ShareFileDialog";

const Shared = () => {
  const { files, sharedFiles, revokeShare, shareFile } = useFiles();
  const [sharedUsers, setSharedUsers] = useState<{ [fileId: string]: any[] }>({});
  const [isRevoking, setIsRevoking] = useState<string>(''); // Track which share is being revoked
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Files that the user has shared with others
  const mySharedFiles = files.filter(file => file.isShared);

  const fetchSharedUsers = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/shared-users`);
      if (!response.ok) {
        console.error(`Failed to fetch shared users for file ${fileId}`);
        return;
      }
      const data = await response.json();
      setSharedUsers(prev => ({ ...prev, [fileId]: data.sharedUsers || [] }));
    } catch (error) {
      console.error("Error fetching shared users:", error);
    }
  };

  const handleRevokeAccess = async (fileId: string, userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${userEmail}?`)) return;

    setIsRevoking(`${fileId}-${userId}`); // Set loading state for specific share

    try {
      await revokeShare(fileId, userId);
      
      // Update the shared users list
      setSharedUsers(prev => ({
        ...prev,
        [fileId]: prev[fileId]?.filter(user => user.id !== userId) || []
      }));

      toast({
        title: "Access Revoked",
        description: `Access revoked for ${userEmail}`,
      });
    } catch (error) {
      console.error("Error revoking access:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to revoke access. Please try again.",
      });
    } finally {
      setIsRevoking(''); // Clear loading state
    }
  };

  const handleShare = async (fileId: string, email: string, permissions: any) => {
    try {
      await shareFile(fileId, email, permissions);
      // Immediately fetch updated shared users
      await fetchSharedUsers(fileId);
    } catch (error) {
      console.error("Error sharing file:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to share file. Please try again.",
      });
    }
  };

  useEffect(() => {
    // Load shared users for all shared files immediately
    mySharedFiles.forEach(file => {
      if (file.sharedUsers) {
        // Use existing shared users from file first
        setSharedUsers(prev => ({ ...prev, [file.id]: file.sharedUsers }));
      }
      // Then fetch latest
      fetchSharedUsers(file.id);
    });
  }, [mySharedFiles]);

  useEffect(() => {
    mySharedFiles.forEach(file => fetchSharedUsers(file.id));
  }, [mySharedFiles, files]); // Add files dependency to refresh when file sharing status changes

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shared Files</h1>
          <p className="text-muted-foreground">
            Files shared with you and files you've shared with others.
          </p>
        </div>

        <Separator />

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Shared with Me</h2>
            <FileList 
              files={sharedFiles} 
              showOwner
              emptyMessage="No files have been shared with you yet." 
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Shared by Me</h2>
            {mySharedFiles.length === 0 ? (
              <p className="text-muted-foreground">You haven't shared any files yet.</p>
            ) : (
              mySharedFiles.map(file => (
                <div key={file.id} className="border rounded-md p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">{file.name}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(file);
                        setShareDialogOpen(true);
                      }}
                    >
                      Share
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Shared with:
                  </p>
                  {sharedUsers[file.id]?.length > 0 ? (
                    <ul className="divide-y">
                      {sharedUsers[file.id].map(user => (
                        <li key={user.id} className="flex justify-between items-center py-2">
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Can {[
                                user.canView && 'view',
                                user.canEdit && 'edit',
                                user.canDelete && 'delete'
                              ].filter(Boolean).join(', ')}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevokeAccess(file.id, user.id, user.email)}
                            disabled={isRevoking === `${file.id}-${user.id}`}
                          >
                            {isRevoking === `${file.id}-${user.id}` ? (
                              <span>Revoking...</span>
                            ) : (
                              <span>Revoke Access</span>
                            )}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No users currently have access.</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {selectedFile && (
        <ShareFileDialog
          file={selectedFile}
          open={shareDialogOpen}
          onOpenChange={(open) => {
            setShareDialogOpen(open);
            if (!open) {
              // Refresh the users list when dialog closes
              fetchSharedUsers(selectedFile.id);
            }
          }}
          onShare={() => fetchSharedUsers(selectedFile.id)}
        />
      )}
    </MainLayout>
  );
};

export default Shared;
