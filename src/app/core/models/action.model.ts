// src/app/core/models/action.model.ts

export interface Action {
  id: number;
  application: number;
  name: string;
  action_type: ActionType;
  target_screen?: number;
  api_data_source?: number;
  parameters?: string;  // JSON string
  dialog_title?: string;
  dialog_message?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

export type ActionType =
  | 'navigate' | 'navigate_back' | 'api_call' | 'show_dialog'
  | 'show_snackbar' | 'open_url' | 'send_email' | 'make_phone_call'
  | 'share_content' | 'take_photo' | 'pick_image' | 'save_data'
  | 'load_data' | 'refresh_data' | 'submit_form' | 'validate_form'
  | 'clear_form' | 'toggle_visibility' | 'play_sound' | 'vibrate'
  | 'copy_to_clipboard' | 'show_toast' | 'logout' | 'refresh_page'
  | 'print' | 'download_file' | 'upload_file' | 'scan_qr_code';

export interface CreateActionRequest {
  application: number;
  name: string;
  action_type: ActionType;
  target_screen?: number;
  api_data_source?: number;
  parameters?: string;
  dialog_title?: string;
  dialog_message?: string;
  url?: string;
}

export interface UpdateActionRequest {
  name?: string;
  action_type?: ActionType;
  target_screen?: number;
  api_data_source?: number;
  parameters?: string;
  dialog_title?: string;
  dialog_message?: string;
  url?: string;
}

export interface ActionListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Action[];
}

export interface ActionTypeInfo {
  type: ActionType;
  label: string;
  icon: string;
  category: string;
  requiredFields: string[];
  optionalFields: string[];
  description: string;
}
