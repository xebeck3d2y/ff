export interface FileItem {
    id: string;
    name: string;
    type: string;
    size: number;
    ownerId: string;
    ownerName: string;
    createdAt: string;
    updatedAt: string;
    isShared: boolean;
  }
  
  export interface FilePermission {
    userId: string;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }
  