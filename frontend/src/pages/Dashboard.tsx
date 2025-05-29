import MainLayout from "../components/common/MainLayout";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/files/FileUploader";
import { FileList } from "@/components/files/FileList";
import { useFiles } from "@/context/FileContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Upload, Files, Share } from "lucide-react";
import { useState } from "react";

const Dashboard = () => {
  const { files, sharedFiles } = useFiles();
  const [activeTab, setActiveTab] = useState("my-files");

  const handleQuickUpload = () => {
    setActiveTab("upload");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Securely manage and share your files.
          </p>
        </div>

        <Separator />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2">
              <Files className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium">My Files</h3>
            </div>
            <p className="text-3xl font-bold mt-2">{files.length}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Total files in your storage
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2">
              <Share className="h-5 w-5 text-purple-500" />
              <h3 className="font-medium">Shared Files</h3>
            </div>
            <p className="text-3xl font-bold mt-2">{sharedFiles.length}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Files others have shared with you
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between">
            <h3 className="font-medium">Quick Actions</h3>
            <div className="mt-4">
              <Button className="w-full" onClick={handleQuickUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload New File
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="my-files">My Files</TabsTrigger>
              <TabsTrigger value="shared">Shared with Me</TabsTrigger>
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
            </TabsList>

            <TabsContent value="my-files">
              <FileList 
                files={files} 
                emptyMessage="You haven't uploaded any files yet." 
              />
            </TabsContent>

            <TabsContent value="shared">
              <FileList 
                files={sharedFiles} 
                showOwner
                emptyMessage="No files have been shared with you yet." 
              />
            </TabsContent>

            <TabsContent value="upload" className="max-w-2xl">
              <FileUploader />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
