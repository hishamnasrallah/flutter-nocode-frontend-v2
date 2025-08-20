// src/app/core/models/theme.model.ts

export interface Theme {
  id: number;
  name: string;
  primary_color: string;  // Hex format #RRGGBB
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  is_dark_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateThemeRequest {
  name: string;
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  is_dark_mode: boolean;
}

export interface UpdateThemeRequest {
  name?: string;
  primary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  is_dark_mode?: boolean;
}

export interface ThemeListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Theme[];
}

export interface ThemeTemplate {
  id: string;
  name: string;
  preview_url: string;
  theme_data: Partial<Theme>;
}
