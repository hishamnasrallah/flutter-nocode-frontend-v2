// src/app/core/models/application.model.ts

export interface Application {
  id: number;
  name: string;
  description: string;
  package_name: string;
  version: string;
  theme: number;
  theme_name?: string;
  build_status: 'not_built' | 'building' | 'success' | 'failed';
  apk_file?: string;
  source_code_zip?: string;
  screens?: Screen[];
  data_sources?: DataSource[];
  actions?: Action[];
  screens_count?: number;
  last_build?: {
    id: number;
    status: string;
    date: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationRequest {
  name: string;
  description: string;
  package_name: string;
  version?: string;
  theme?: number;
}

export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
  package_name?: string;
  version?: string;
  theme?: number;
}

export interface ApplicationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Application[];
}

import { Screen } from './screen.model';
import { DataSource } from './data-source.model';
import { Action } from './action.model';
