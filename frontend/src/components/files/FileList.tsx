import { useState } from "react";
import { useFiles } from "@/context/FileContext";
import { FileItem } from "@/types/file";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Share, 
  Trash2, 
  MoreVertical,
  File as FileIcon,
  FileText,
  FileImage
} from "lucide-react";
import { ShareFileDialog } from "./ShareFileDialog";

interface FileListProps {
  files: FileItem[];
  showOwner?: boolean;
  emptyMessage?: string;
}

const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileText className="h-5 w-5 text-green-500" />;
  if (fileType.includes('document') || fileType.includes('word')) return <FileText className="h-5 w-5 text-blue-500" />;
  if (fileType.includes('image')) return <FileImage className="h-5 w-5 text-purple-500" />;
  return <FileIcon className="h-5 w-5 text-gray-500" />;
};

export const FileList = ({ files, showOwner = false, emptyMessage = "No files found" }: FileListProps) => {
  const { downloadFile, deleteFile } = useFiles();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const handleDownload = async (fileId: string) => {
    try {
      await downloadFile(fileId);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await deleteFile(fileId);
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }
  };

  const openShareDialog = (file: FileItem) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
        <FileIcon className="h-12 w-12 mb-4" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {showOwner && <TableHead>Owner</TableHead>}
              <TableHead>Last Modified</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  {getFileIcon(file.type)}
                  <span className="truncate max-w-[200px]">{file.name}</span>
                </TableCell>
                {showOwner && (
                  <TableCell>{file.ownerName}</TableCell>
                )}
                <TableCell>
                  {new Date(file.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{formatFileSize(file.size)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openShareDialog(file)}>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(file.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedFile && (
        <ShareFileDialog 
          file={selectedFile}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </>
  );
};
