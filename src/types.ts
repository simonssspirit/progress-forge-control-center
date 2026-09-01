export type Role = "read-only" | "active" | "admin";
export type WorkflowStatus =
  | "running"
  | "paused"
  | "waiting"
  | "failed"
  | "completed"
  | "cancelled";
export type StepStatus =
  | "pending"
  | "running"
  | "paused"
  | "waiting"
  | "failed"
  | "completed"
  | "cancelled";

export type ArtifactVersion = {
  version: number;
  label: string;
  content: string;
  createdAt: string;
};

export type Artifact = {
  id: string;
  name: string;
  type: "markdown";
  versions: ArtifactVersion[];
};

export type WorkflowStep = {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  progress?: number;
  duration?: string;
  activity?: string;
  message?: string;
  artifacts: Artifact[];
};

export type WorkflowRun = {
  id: string;
  projectId: string;
  issueId: string;
  workflowName: string;
  startedBy: string;
  execution: "local" | "cloud";
  agent: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  startedAt: string;
  simulated?: boolean;
  validationRetried?: boolean;
};

export type Issue = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "open" | "closed";
  assignee?: string;
  labels: string[];
};

export type Project = {
  id: string;
  name: string;
  shortName: string;
  repository: string;
  description: string;
};
