// src/app/core/models/screen.model.ts

import { Widget } from './widget.model';

export interface Screen {
  id: number;
  application: number;
  name: string;
  route_name: string;  // Must start with /
  is_home_screen: boolean;
  app_bar_title: string;
  show_app_bar: boolean;
  show_back_button: boolean;
  background_color?: string;
  widgets?: Widget[];
  created_at: string;
  updated_at: string;
}

export interface CreateScreenRequest {
  application: number;
  name: string;
  route_name: string;
  is_home_screen?: boolean;
  app_bar_title?: string;
  show_app_bar?: boolean;
  show_back_button?: boolean;
  background_color?: string;
}

export interface UpdateScreenRequest {
  name?: string;
  route_name?: string;
  is_home_screen?: boolean;
  app_bar_title?: string;
  show_app_bar?: boolean;
  show_back_button?: boolean;
  background_color?: string;
}

export interface ScreenListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Screen[];
}

export interface SetHomeScreenRequest {
  screen_id: number;
}
