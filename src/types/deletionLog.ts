
export interface DeletionLog {
  id: string;
  entity_type: string;
  entity_id: string;
  deleted_by: string;
  deleted_at: string;
  entity_data: Record<string, any>;
}
