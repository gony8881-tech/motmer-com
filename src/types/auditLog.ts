export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedById: string;
  performedAt: string;
  metadata?: Record<string, unknown>;
}
