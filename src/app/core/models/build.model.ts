// src/app/core/models/build.model.ts

export interface BuildHistory {
  id: number;
  application: number;
  build_id: string;  // UUID
  status: BuildStatus;
  build_start_time: string;
  build_end_time?: string;
  duration_seconds?: number;
  log_output?: string;
  error_message?: string;
  apk_file?: string;
  source_code_zip?: string;
  apk_size_mb?: number;
  build_type?: 'debug' | 'release';
  platform?: 'android' | 'ios' | 'both';
}

export type BuildStatus =
  | 'started' | 'generating_code' | 'code_generated'
  | 'code_generation_failed' | 'building_apk' | 'success' | 'failed'
  | 'cancelled' | 'queued' | 'uploading' | 'processing';

export interface BuildListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BuildHistory[];
}

export interface StartBuildRequest {
  application_id: number;
  build_type: 'debug' | 'release';
  platform: 'android' | 'ios' | 'both';
  clean_build?: boolean;
  version_code?: number;
  version_name?: string;
}

export interface BuildProgressUpdate {
  build_id: string;
  status: BuildStatus;
  progress: number;
  message: string;
  timestamp: string;
}

export interface BuildLogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: string;
}

export interface BuildOptions {
  buildType: 'debug' | 'release';
  platform: 'android' | 'ios' | 'both';
  cleanBuild: boolean;
  obfuscate?: boolean;
  splitPerAbi?: boolean;
  targetSdk?: number;
  minSdk?: number;
}
