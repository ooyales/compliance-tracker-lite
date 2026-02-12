export interface User {
  id: string;
  username: string;
  role: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setAuth: (token: string, user: User) => void;
}

export interface Framework {
  id: string;
  name: string;
  version: string;
  description: string;
  total_controls: number;
  total_objectives: number;
}

export interface ControlFamily {
  id: string;
  framework_id: string;
  family_code: string;
  name: string;
  description: string;
  control_count: number;
  sort_order: number;
}

export interface Control {
  id: string;
  family_id: string;
  family_code?: string;
  family_name?: string;
  control_number: string;
  title: string;
  requirement_text: string;
  plain_english: string;
  guidance_text: string;
  control_type: string;
  implementation_status: string;
  weight: number;
  sprs_points_if_not_met: number;
  implementation_notes: string | null;
  assessor_notes: string | null;
  last_assessed_date: string | null;
  assessed_by: string | null;
  sort_order: number;
  objectives?: AssessmentObjective[];
  evidence?: Evidence[];
  poam_items?: POAMItem[];
}

export interface AssessmentObjective {
  id: string;
  control_id: string;
  objective_number: string;
  objective_text: string;
  status: string;
  notes: string | null;
}

export interface Evidence {
  id: string;
  control_id: string;
  control_number?: string;
  evidence_type: string;
  title: string;
  description: string | null;
  file_path: string | null;
  external_url: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

export interface POAMItem {
  id: string;
  control_id: string;
  control_number?: string;
  weakness_description: string | null;
  remediation_plan: string | null;
  risk_level: string;
  responsible_person: string | null;
  responsible_team: string | null;
  planned_start_date: string | null;
  planned_completion_date: string | null;
  actual_completion_date: string | null;
  estimated_cost: number | null;
  cost_notes: string | null;
  status: string;
  milestones: string;
  created_at: string;
  updated_at: string;
}

export interface BoundaryAsset {
  id: string;
  boundary_name: string | null;
  asset_tracker_id: string | null;
  asset_name: string | null;
  asset_type: string | null;
  data_classification: string | null;
  in_scope: number;
  notes: string | null;
}

export interface DashboardData {
  sprs_score: number;
  total_controls: number;
  assessed_controls: number;
  implementation_breakdown: Array<{ name: string; value: number; color: string }>;
  family_heatmap: Array<{
    name: string;
    code: string;
    total: number;
    implemented: number;
    percentage: number;
    color: string;
  }>;
  poam_summary: {
    total: number;
    open: number;
    in_progress: number;
    overdue: number;
    by_risk: Array<{ name: string; value: number; color: string }>;
  };
  boundary_count: number;
  score_trend: Array<{ name: string; value: number }>;
}
