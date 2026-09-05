/**
 * النوع التطبيقي (Domain Type) لنسخة ملف البحث — camelCase، مطابق لجدول paper_versions.
 * يُبنى من PaperVersionRow عبر submissionService (mapRowToPaperVersion).
 */
export interface PaperVersion {
  id: string;
  paperId: string;
  versionNumber: number;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string | null;
  createdAt: string;
}
