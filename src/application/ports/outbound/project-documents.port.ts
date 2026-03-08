export interface ProjectDocumentRecord {
  docType: string;
  slug: string;
  content: string;
  updatedAt: Date;
}

export interface ProjectDocumentsPort {
  upsert(
    projectId: string,
    docType: string,
    slug: string,
    content: string,
    createdBy?: string,
  ): Promise<void>;

  list(projectId: string): Promise<ProjectDocumentRecord[]>;
}
