export interface Setting {
  id: number;
  key: string;
  category: string;
  label: string;
  description: string;
  value: string;
  valueType: string;
  defaultValue: string;
  systemDefault: boolean;
  editable: boolean;
  updatedAt: string;
}

export interface UpdateSettingRequest {
  key: string;
  value: string;
}

export type SettingCategory =
  | 'general'
  | 'room'
  | 'booking'
  | 'billing'
  | 'notifications'
  | 'calendar'
  | 'audit';
