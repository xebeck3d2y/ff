import MainLayout from "../components/common/MainLayout";
import { FileList } from "@/components/files/FileList";
import { FileUploader } from "@/components/files/FileUploader";
import { useFiles } from "@/context/FileContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const Files = () => {
  const { files } = useFiles();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Files</h1>
          <p className="text-muted-foreground">
            Manage your uploaded files securely.
          </p>
        </div>

        <Separator />

        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all">All Files</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="others">Others</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-4">
            <FileList 
              files={files} 
              emptyMessage="You haven't uploaded any files yet." 
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <FileList 
              files={files.filter(file => 
                file.type.includes('pdf') || 
                file.type.includes('document') || 
                file.type.includes('text')
              )} 
              emptyMessage="No document files found." 
            />
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <FileList 
              files={files.filter(file => file.type.includes('image'))} 
              emptyMessage="No image files found." 
            />
          </TabsContent>

          <TabsContent value="others" className="space-y-4">
            <FileList 
              files={files.filter(file => 
                !file.type.includes('pdf') && 
                !file.type.includes('document') && 
                !file.type.includes('text') &&
                !file.type.includes('image')
              )} 
              emptyMessage="No other files found." 
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Files;
