import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Cloud,
  Code2,
  ExternalLink,
  FileCode2,
  FileText,
  Folder,
  Github,
  HardDrive,
  HelpCircle,
  Import,
  Laptop,
  LoaderCircle,
  Package,
  Play,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TestTube2,
  TriangleAlert,
  WandSparkles,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { usePrototype } from "./prototype";
import type {
  CodePlatform,
  CodingAgent,
  ConnectionStatus,
  IssueTracker,
  ModelProfile,
  Project,
  ProjectMetadata,
  SetupMode,
} from "./types";

type ValidationStatus = "idle" | "validating" | "valid" | "invalid";
type SetupState = {
  mode: SetupMode;
  localPath: string;
  repositoryDetected: boolean;
  existingConfigurationDetected: boolean;
  environmentReady: boolean;
  codePlatform: CodePlatform;
  codePlatformStatus: ConnectionStatus;
  issueTracker: IssueTracker;
  issueTrackerStatus: ConnectionStatus;
  codingAgent: CodingAgent;
  agentStates: Record<CodingAgent, { installed: boolean; authenticated: boolean }>;
  modelProfile: ModelProfile;
  metadata: ProjectMetadata;
  validationStatus: ValidationStatus;
  validationMessage?: string;
};

const repositoryOptions = [
  "/Users/stefan/work/healthcare-app-angular",
  "/Users/stefan/work/project-nia",
  "/Users/stefan/work/new-project",
];

const initialState = (): SetupState => ({
  mode: "new",
  localPath: repositoryOptions[0],
  repositoryDetected: true,
  existingConfigurationDetected: false,
  environmentReady: true,
  codePlatform: "github",
  codePlatformStatus: "connected",
  issueTracker: "github_issues",
  issueTrackerStatus: "connected",
  codingAgent: "github_copilot",
  agentStates: {
    github_copilot: { installed: true, authenticated: true },
    claude_code: { installed: true, authenticated: false },
    opencode: { installed: false, authenticated: false },
  },
  modelProfile: "stable",
  metadata: {
    name: "healthcare-app-angular",
    description: "Healthcare sample application",
    language: "TypeScript",
    frameworks: ["Angular", "RxJS"],
    testingFramework: "Jest",
    packageManager: "npm",
  },
  validationStatus: "idle",
});

const steps = [
  { path: "project", label: "Project" },
  { path: "code-platform", label: "Code platform" },
  { path: "issue-tracker", label: "Issue tracker" },
  { path: "coding-agent", label: "Coding agent" },
  { path: "model-profile", label: "Model profile" },
  { path: "project-details", label: "Project details" },
  { path: "review", label: "Review" },
];

const platformLabels: Record<CodePlatform, string> = {
  github: "GitHub",
  bitbucket: "Bitbucket",
  local: "Local only",
  other: "Other / Not connected",
};
const trackerLabels: Record<IssueTracker, string> = {
  github_issues: "GitHub Issues",
  jira: "Jira",
  azure_devops: "Azure DevOps",
  shortcut: "Shortcut",
  local: "Local only",
  other: "Other integrations",
};
const agentLabels: Record<CodingAgent, string> = {
  github_copilot: "GitHub Copilot",
  claude_code: "Claude Code",
  opencode: "OpenCode",
};
const modelLabels: Record<ModelProfile, string> = {
  stable: "Stable",
  balanced: "Balanced",
  lite: "Lite",
};

export function SetupFlow() {
  const { projects, loadDemoWorkspace, addProject } = usePrototype();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<SetupState>(initialState);
  const [guidance, setGuidance] = useState<string | null>(null);
  const [pendingProject, setPendingProject] = useState<Project | null>(null);
  const returnTo = searchParams.get("returnTo") ?? projects[0]?.id;
  const isReturning = projects.length > 0;

  const update = <K extends keyof SetupState>(key: K, value: SetupState[K]) =>
    setState((current) => ({ ...current, [key]: value }));

  const startImport = () => {
    setState((current) => ({
      ...current,
      mode: "import",
      existingConfigurationDetected: true,
      localPath: "/Users/stefan/work/project-nia",
      codePlatform: "github",
      issueTracker: "github_issues",
      codingAgent: "github_copilot",
      modelProfile: "stable",
      metadata: {
        name: "project-nia",
        description: "Nia workflow orchestration project",
        language: "TypeScript",
        frameworks: ["React", "Node.js"],
        testingFramework: "Vitest",
        packageManager: "npm",
      },
    }));
    navigate(`/setup/project${returnTo ? `?returnTo=${returnTo}` : ""}`);
  };

  const cancel = () => {
    if (!window.confirm("Discard the setup information entered so far?")) return;
    navigate(isReturning && returnTo ? `/projects/${returnTo}` : "/setup/welcome");
  };

  const openProject = () => {
    if (!pendingProject) return;
    addProject(pendingProject);
    navigate(`/projects/${pendingProject.id}`);
  };

  const currentPath = location.pathname.split("/").pop() ?? "welcome";
  const currentIndex = steps.findIndex((step) => step.path === currentPath);
  const wizardVisible = currentIndex >= 0;

  return (
    <div className="setup-shell">
      <header className="setup-topbar">
        <div className="setup-brand">
          <span className="setup-brand-mark">n</span>
          <span><strong>nia</strong><small>Control Center</small></span>
        </div>
        <span className="setup-mode-label">{isReturning ? "Add project" : "First-time setup"}</span>
      </header>
      {wizardVisible && <SetupStepper current={currentIndex} />}
      <main className={wizardVisible ? "setup-main" : "setup-main welcome-main"}>
        <Routes>
          <Route
            path="welcome"
            element={
              projects.length ? (
                <Navigate to={`/projects/${projects[0].id}`} replace />
              ) : (
                <WelcomePage
                  onStart={() => navigate("/setup/project")}
                  onImport={startImport}
                  onLoadDemo={() => {
                    loadDemoWorkspace();
                    navigate("/projects/nia-core");
                  }}
                />
              )
            }
          />
          <Route
            path="project"
            element={
              <ProjectSourceStep
                state={state}
                setState={setState}
                onGuidance={() => setGuidance("environment")}
                footer={
                  <SetupFooter
                    onCancel={cancel}
                    onContinue={() => navigate(withReturn("/setup/code-platform", returnTo))}
                    continueLabel="Continue"
                  />
                }
              />
            }
          />
          <Route
            path="code-platform"
            element={
              <CodePlatformStep
                state={state}
                setState={setState}
                footer={
                  <SetupFooter
                    onBack={() => navigate(withReturn("/setup/project", returnTo))}
                    onCancel={cancel}
                    onContinue={() => {
                      if (state.codePlatform === "github" && state.issueTracker === "local") {
                        update("issueTracker", "github_issues");
                        update("issueTrackerStatus", "connected");
                      }
                      navigate(withReturn("/setup/issue-tracker", returnTo));
                    }}
                  />
                }
              />
            }
          />
          <Route
            path="issue-tracker"
            element={
              <IssueTrackerStep
                state={state}
                setState={setState}
                footer={
                  <SetupFooter
                    onBack={() => navigate(withReturn("/setup/code-platform", returnTo))}
                    onCancel={cancel}
                    onContinue={() => navigate(withReturn("/setup/coding-agent", returnTo))}
                  />
                }
              />
            }
          />
          <Route
            path="coding-agent"
            element={
              <CodingAgentStep
                state={state}
                setState={setState}
                onGuidance={(agent) => setGuidance(agent)}
                footer={
                  <SetupFooter
                    onBack={() => navigate(withReturn("/setup/issue-tracker", returnTo))}
                    onCancel={cancel}
                    onContinue={() => navigate(withReturn("/setup/model-profile", returnTo))}
                  />
                }
              />
            }
          />
          <Route
            path="model-profile"
            element={
              <ModelProfileStep
                state={state}
                setState={setState}
                footer={
                  <SetupFooter
                    onBack={() => navigate(withReturn("/setup/coding-agent", returnTo))}
                    onCancel={cancel}
                    onContinue={() => navigate(withReturn("/setup/project-details", returnTo))}
                  />
                }
              />
            }
          />
          <Route
            path="project-details"
            element={
              <ProjectDetailsStep
                state={state}
                setState={setState}
                footer={
                  <SetupFooter
                    onBack={() => navigate(withReturn("/setup/model-profile", returnTo))}
                    onCancel={cancel}
                    onContinue={() => navigate(withReturn("/setup/review", returnTo))}
                    disabled={!metadataValid(state.metadata)}
                  />
                }
              />
            }
          />
          <Route
            path="review"
            element={
              <ReviewStep
                state={state}
                setState={setState}
                returnTo={returnTo}
                onValidated={(project) => {
                  setPendingProject(project);
                  navigate(withReturn("/setup/complete", returnTo));
                }}
                footer={
                  <SetupFooter
                    onBack={() => navigate(withReturn("/setup/project-details", returnTo))}
                    onCancel={cancel}
                    hideContinue
                  />
                }
              />
            }
          />
          <Route
            path="complete"
            element={
              pendingProject ? (
                <CompletePage
                  project={pendingProject}
                  onOpen={openProject}
                  onReview={() => navigate(withReturn("/setup/review", returnTo))}
                />
              ) : (
                <Navigate to={withReturn("/setup/review", returnTo)} replace />
              )
            }
          />
          <Route
            index
            element={<Navigate to={projects.length ? "/setup/project" : "/setup/welcome"} replace />}
          />
          <Route path="*" element={<Navigate to="/setup/welcome" replace />} />
        </Routes>
      </main>
      {guidance && <GuidanceDrawer topic={guidance} onClose={() => setGuidance(null)} />}
    </div>
  );
}

function withReturn(path: string, returnTo?: string) {
  return returnTo ? `${path}?returnTo=${returnTo}` : path;
}

function SetupStepper({ current }: { current: number }) {
  return (
    <nav className="setup-stepper" aria-label="Setup progress">
      {steps.map((step, index) => (
        <div
          key={step.path}
          className={`setup-step ${index === current ? "current" : ""} ${index < current ? "complete" : ""}`}
        >
          <span>{index < current ? <Check size={13} /> : index + 1}</span>
          <strong>{step.label}</strong>
          {index < steps.length - 1 && <i />}
        </div>
      ))}
    </nav>
  );
}

function WelcomePage({
  onStart,
  onImport,
  onLoadDemo,
}: {
  onStart: () => void;
  onImport: () => void;
  onLoadDemo: () => void;
}) {
  return (
    <div className="welcome-card">
      <div className="welcome-visual">
        <span className="welcome-logo">n</span>
        <div className="welcome-orbit one"><Folder size={18} /></div>
        <div className="welcome-orbit two"><Github size={18} /></div>
        <div className="welcome-orbit three"><Bot size={18} /></div>
      </div>
      <span className="setup-eyebrow">Get started</span>
      <h1>Welcome to Nia</h1>
      <p>
        Set up your first project to connect its repository, issue tracker, coding agent,
        and project context.
      </p>
      <button className="setup-button primary large" onClick={onStart}>
        <Folder size={17} /> Add your first project <ArrowRight size={16} />
      </button>
      <button className="setup-button secondary large" onClick={onImport}>
        <Import size={17} /> Import existing configuration
      </button>
      <div className="welcome-demo">
        <span>Prototype only</span>
        <button onClick={onLoadDemo}><Play size={14} /> Load demo workspace</button>
      </div>
    </div>
  );
}

function StepHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="setup-page-header">
      <span className="setup-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function ProjectSourceStep({
  state,
  setState,
  onGuidance,
  footer,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  onGuidance: () => void;
  footer: ReactNode;
}) {
  const setMode = (mode: SetupMode) =>
    setState((current) => ({
      ...current,
      mode,
      existingConfigurationDetected: mode === "import",
      localPath: mode === "import" ? "/Users/stefan/work/project-nia" : repositoryOptions[0],
    }));
  return (
    <>
      <StepHeader
        eyebrow="Step 1 of 7"
        title="Choose the project source"
        description="Select a local repository and confirm that the mocked setup prerequisites are available."
      />
      <SetupSection title="Environment check" description="These checks are simulated for the prototype. No commands are executed.">
        <div className={`environment-card ${state.environmentReady ? "ready" : "warning"}`}>
          <div className="environment-heading">
            <span>{state.environmentReady ? <CheckCircle2 size={20} /> : <TriangleAlert size={20} />}</span>
            <div>
              <strong>{state.environmentReady ? "Environment is ready" : "Coding agent prerequisite not detected"}</strong>
              <p>{state.environmentReady ? "Nia can configure and run local project workflows." : "You can continue, but setup guidance should be reviewed before running workflows."}</p>
            </div>
          </div>
          <div className="check-grid">
            <CheckItem label="Nia installed" ok />
            <CheckItem label="Local Git support" ok />
            <CheckItem label="GitHub CLI available" ok />
            <CheckItem label="Node.js available" ok={state.environmentReady} />
          </div>
          <div className="setup-inline-actions">
            {!state.environmentReady && <button className="setup-link-button" onClick={onGuidance}><HelpCircle size={14} /> View setup guidance</button>}
            <button className="setup-link-button" onClick={() => setState((current) => ({ ...current, environmentReady: true }))}><RefreshCcw size={14} /> Run check again</button>
            {state.environmentReady && <button className="setup-demo-link" onClick={() => setState((current) => ({ ...current, environmentReady: false }))}>Show missing prerequisite</button>}
          </div>
        </div>
      </SetupSection>
      <SetupSection title="Project setup mode">
        <div className="setup-choice-grid two">
          <ChoiceCard selected={state.mode === "new"} icon={Folder} title="Use a local repository" description="Select a repository already cloned on this machine." onClick={() => setMode("new")} />
          <ChoiceCard selected={state.mode === "import"} icon={Import} title="Import existing Nia configuration" description="Use a repository that already contains .nia/config." onClick={() => setMode("import")} />
        </div>
      </SetupSection>
      <SetupSection title="Project folder">
        <label className="setup-field">
          <span>Local repository</span>
          <div className="folder-picker">
            <Folder size={16} />
            <select value={state.localPath} onChange={(event) => setState((current) => ({ ...current, localPath: event.target.value, repositoryDetected: true }))}>
              {repositoryOptions.map((path) => <option key={path}>{path}</option>)}
            </select>
            <button>Browse</button>
          </div>
        </label>
        <div className="detected-panel">
          <span className="detected-title"><Search size={14} /> Detected</span>
          <CheckItem label="Git repository" ok />
          <CheckItem label={`Repository name: ${state.localPath.split("/").pop()}`} ok />
          <CheckItem label="Remote: GitHub" ok />
          {state.mode === "import" && <>
            <div className="detected-divider" />
            <CheckItem label=".nia/config/agents.toml" ok />
            <CheckItem label=".nia/config/project.toml" ok />
            <CheckItem label=".nia/config/toolchain.toml" ok />
          </>}
        </div>
      </SetupSection>
      {footer}
    </>
  );
}

function CodePlatformStep({
  state,
  setState,
  footer,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  footer: ReactNode;
}) {
  const select = (codePlatform: CodePlatform) =>
    setState((current) => ({
      ...current,
      codePlatform,
      codePlatformStatus: codePlatform === "github" ? "connected" : codePlatform === "local" ? "connected" : "not_checked",
    }));
  return (
    <>
      <StepHeader eyebrow="Step 2 of 7" title="Where is your source code hosted?" description="The local repository and its external code platform are configured independently." />
      <div className="setup-choice-grid four">
        <ChoiceCard selected={state.codePlatform === "github"} icon={Github} title="GitHub" description="Connect a GitHub repository." onClick={() => select("github")} />
        <ChoiceCard selected={state.codePlatform === "bitbucket"} icon={Code2} title="Bitbucket" description="Connect a Bitbucket workspace." onClick={() => select("bitbucket")} />
        <ChoiceCard selected={state.codePlatform === "local"} icon={HardDrive} title="Local only" description="Use the selected local repository." onClick={() => select("local")} />
        <ChoiceCard selected={state.codePlatform === "other"} icon={Cloud} title="Other" description="Continue without a connection." onClick={() => select("other")} />
      </div>
      <ConnectionPanel
        title={platformLabels[state.codePlatform]}
        icon={state.codePlatform === "github" ? Github : state.codePlatform === "local" ? HardDrive : Code2}
        status={state.codePlatformStatus}
        connectedText={state.codePlatform === "github" ? "Connected as Stefan" : state.codePlatform === "local" ? "Local repository available" : "Connection available"}
        details={state.codePlatform === "github" ? "telerik/healthcare-app-angular" : state.codePlatform === "local" ? state.localPath : "Representative connection settings"}
        onStatus={(status) => setState((current) => ({ ...current, codePlatformStatus: status }))}
      />
      {footer}
    </>
  );
}

function IssueTrackerStep({
  state,
  setState,
  footer,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  footer: ReactNode;
}) {
  const options: Array<{ value: IssueTracker; icon: LucideIcon; description: string }> = [
    { value: "github_issues", icon: Github, description: "Use issues from the connected repository." },
    { value: "jira", icon: Settings2, description: "Connect a Jira site and project." },
    { value: "azure_devops", icon: Cloud, description: "Connect an Azure DevOps project." },
    { value: "shortcut", icon: Sparkles, description: "Connect a Shortcut workspace." },
    { value: "local", icon: HardDrive, description: "Use local issue context only." },
    { value: "other", icon: Package, description: "Explore another integration." },
  ];
  const select = (issueTracker: IssueTracker) =>
    setState((current) => ({
      ...current,
      issueTracker,
      issueTrackerStatus: ["github_issues", "local"].includes(issueTracker) ? "connected" : "not_checked",
    }));
  return (
    <>
      <StepHeader eyebrow="Step 3 of 7" title="Choose an issue tracker" description="Nia uses issue context to understand and start project work." />
      <div className="setup-choice-grid three compact">
        {options.map((option) => <ChoiceCard key={option.value} selected={state.issueTracker === option.value} icon={option.icon} title={trackerLabels[option.value]} description={option.description} onClick={() => select(option.value)} />)}
      </div>
      {state.issueTracker === "jira" ? (
        <div className="connection-detail-card">
          <div className="connection-detail-heading"><Settings2 size={19} /><div><strong>Jira</strong><p>Representative fields only. No external connection is made.</p></div></div>
          <div className="setup-form-grid"><label className="setup-field"><span>Site URL</span><input defaultValue="https://example.atlassian.net" /></label><label className="setup-field"><span>Project key</span><input defaultValue="NIA" /></label></div>
          <ConnectionStatusLine status={state.issueTrackerStatus} connectedText="Connected to NIA" />
          <StatusControls status={state.issueTrackerStatus} onStatus={(status) => setState((current) => ({ ...current, issueTrackerStatus: status }))} />
        </div>
      ) : (
        <ConnectionPanel
          title={trackerLabels[state.issueTracker]}
          icon={state.issueTracker === "github_issues" ? Github : state.issueTracker === "local" ? HardDrive : Settings2}
          status={state.issueTrackerStatus}
          connectedText={state.issueTracker === "github_issues" ? "Issues available" : state.issueTracker === "local" ? "Local issue context ready" : "Integration connected"}
          details={state.issueTracker === "github_issues" ? "telerik/healthcare-app-angular" : "Issue tracker connection"}
          onStatus={(status) => setState((current) => ({ ...current, issueTrackerStatus: status }))}
        />
      )}
      {footer}
    </>
  );
}

function CodingAgentStep({
  state,
  setState,
  onGuidance,
  footer,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  onGuidance: (agent: string) => void;
  footer: ReactNode;
}) {
  const descriptions: Record<CodingAgent, string> = {
    github_copilot: "GitHub-native coding agent for repository tasks.",
    claude_code: "Terminal-oriented agent for codebase implementation.",
    opencode: "Open-source coding agent with local execution.",
  };
  return (
    <>
      <StepHeader eyebrow="Step 4 of 7" title="Select a coding agent" description="Choose the agent Nia will use when workflows reach implementation steps." />
      <div className="agent-grid">
        {(Object.keys(agentLabels) as CodingAgent[]).map((agent) => {
          const agentState = state.agentStates[agent];
          return (
            <button key={agent} className={`agent-card ${state.codingAgent === agent ? "selected" : ""}`} onClick={() => setState((current) => ({ ...current, codingAgent: agent }))}>
              <div className="agent-card-heading"><span><Bot size={20} /></span>{state.codingAgent === agent && <CheckCircle2 size={17} />}</div>
              <strong>{agentLabels[agent]}</strong>
              <p>{descriptions[agent]}</p>
              <div className="agent-statuses">
                <span className={agentState.installed ? "ok" : "warn"}>{agentState.installed ? <Check size={12} /> : <AlertCircle size={12} />}{agentState.installed ? "Installed" : "Not detected"}</span>
                <span className={agentState.authenticated ? "ok" : "warn"}>{agentState.authenticated ? <Check size={12} /> : <AlertCircle size={12} />}{agentState.authenticated ? "Authenticated" : "Authentication required"}</span>
              </div>
            </button>
          );
        })}
      </div>
      {(!state.agentStates[state.codingAgent].installed || !state.agentStates[state.codingAgent].authenticated) && (
        <div className="setup-warning-card">
          <TriangleAlert size={19} />
          <div><strong>Agent setup needs attention</strong><p>Authentication or installation must be completed before workflows can run.</p><div className="setup-inline-actions"><button className="setup-link-button" onClick={() => onGuidance(state.codingAgent)}><HelpCircle size={14} /> View setup guidance</button><button className="setup-link-button" onClick={() => setState((current) => ({ ...current, agentStates: { ...current.agentStates, [current.codingAgent]: { installed: true, authenticated: true } } }))}><RefreshCcw size={14} /> Check again</button></div></div>
        </div>
      )}
      {footer}
    </>
  );
}

function ModelProfileStep({
  state,
  setState,
  footer,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  footer: ReactNode;
}) {
  const profiles: Array<{ value: ModelProfile; icon: LucideIcon; subtitle: string; description: string; tag?: string }> = [
    { value: "stable", icon: ShieldCheck, subtitle: "Default profile", description: "Reliable capability for day-to-day project workflows.", tag: "Recommended" },
    { value: "balanced", icon: Sparkles, subtitle: "Balanced capability and usage", description: "A flexible profile for broader workflow experimentation." },
    { value: "lite", icon: WandSparkles, subtitle: "Lower-cost experimentation", description: "Fast, lightweight behavior for early exploration." },
  ];
  return (
    <>
      <StepHeader eyebrow="Step 5 of 7" title="Choose a model profile" description="Select a simple project-level profile. Detailed model configuration can happen later." />
      <div className="profile-grid">
        {profiles.map((profile) => <button key={profile.value} className={`profile-card ${state.modelProfile === profile.value ? "selected" : ""}`} onClick={() => setState((current) => ({ ...current, modelProfile: profile.value }))}><div className="profile-card-icon"><profile.icon size={20} /></div><div><span className="profile-title"><strong>{modelLabels[profile.value]}</strong>{profile.tag && <small>{profile.tag}</small>}</span><b>{profile.subtitle}</b><p>{profile.description}</p></div>{state.modelProfile === profile.value ? <CheckCircle2 className="profile-check" size={18} /> : <Circle className="profile-check muted-check" size={18} />}</button>)}
      </div>
      <div className="profile-note"><Sparkles size={17} /><div><strong>Profiles keep setup simple</strong><p>Nia will use the selected profile as a preference rather than exposing individual models during onboarding.</p></div></div>
      {footer}
    </>
  );
}

function ProjectDetailsStep({
  state,
  setState,
  footer,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  footer: ReactNode;
}) {
  const setMetadata = <K extends keyof ProjectMetadata>(key: K, value: ProjectMetadata[K]) =>
    setState((current) => ({ ...current, metadata: { ...current.metadata, [key]: value } }));
  return (
    <>
      <StepHeader eyebrow="Step 6 of 7" title="Tell Nia about this project" description="Review the synthetic repository suggestions and edit the context Nia will provide to agents." />
      <div className="suggestion-banner"><Search size={16} /><div><strong>Suggested from repository</strong><p>These values are mock detections for the visual prototype and remain fully editable.</p></div></div>
      <div className="metadata-form">
        <label className="setup-field"><span>Project name *</span><input value={state.metadata.name} onChange={(event) => setMetadata("name", event.target.value)} />{!state.metadata.name.trim() && <small className="field-error">Project name is required.</small>}</label>
        <label className="setup-field full"><span>Description *</span><textarea rows={3} value={state.metadata.description} onChange={(event) => setMetadata("description", event.target.value)} />{!state.metadata.description.trim() && <small className="field-error">Description is required.</small>}</label>
        <label className="setup-field"><span>Primary language *</span><select value={state.metadata.language} onChange={(event) => setMetadata("language", event.target.value)}><option>TypeScript</option><option>JavaScript</option><option>C#</option><option>Python</option><option>Go</option></select></label>
        <label className="setup-field"><span>Frameworks *</span><input value={state.metadata.frameworks.join(", ")} onChange={(event) => setMetadata("frameworks", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></label>
        <label className="setup-field"><span>Testing framework *</span><input value={state.metadata.testingFramework} onChange={(event) => setMetadata("testingFramework", event.target.value)} /></label>
        <label className="setup-field"><span>Package manager *</span><select value={state.metadata.packageManager} onChange={(event) => setMetadata("packageManager", event.target.value)}><option>npm</option><option>pnpm</option><option>yarn</option><option>NuGet</option><option>pip</option></select></label>
      </div>
      {footer}
    </>
  );
}

function ReviewStep({
  state,
  setState,
  returnTo,
  onValidated,
  footer,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  returnTo?: string;
  onValidated: (project: Project) => void;
  footer: ReactNode;
}) {
  const navigate = useNavigate();
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [validationIndex, setValidationIndex] = useState(0);
  const validationSteps = ["Validating repository", "Validating integrations", "Validating coding agent", "Validating project metadata"];
  useEffect(() => {
    if (state.validationStatus !== "validating") return;
    const interval = window.setInterval(() => {
      setValidationIndex((index) => {
        if (index < validationSteps.length - 1) return index + 1;
        window.clearInterval(interval);
        if (simulateFailure) {
          setState((current) => ({ ...current, validationStatus: "invalid", validationMessage: "GitHub Issues connection could not be validated." }));
        } else {
          setState((current) => ({ ...current, validationStatus: "valid", validationMessage: undefined }));
          window.setTimeout(() => onValidated(toProject(state)), 350);
        }
        return index;
      });
    }, 650);
    return () => window.clearInterval(interval);
  }, [onValidated, setState, simulateFailure, state, state.validationStatus, validationSteps.length]);

  const edit = (path: string) => navigate(withReturn(`/setup/${path}`, returnTo));
  const rows = [
    { title: "Project", value: state.metadata.name, detail: state.localPath, path: "project" },
    { title: "Code platform", value: platformLabels[state.codePlatform], detail: state.codePlatform === "github" ? "telerik/healthcare-app-angular · Connected" : connectionLabel(state.codePlatformStatus), path: "code-platform" },
    { title: "Issue tracker", value: trackerLabels[state.issueTracker], detail: connectionLabel(state.issueTrackerStatus), path: "issue-tracker" },
    { title: "Coding agent", value: agentLabels[state.codingAgent], detail: state.agentStates[state.codingAgent].authenticated ? "Installed · Authenticated" : "Setup required", path: "coding-agent" },
    { title: "Model profile", value: modelLabels[state.modelProfile], detail: "Project execution preference", path: "model-profile" },
    { title: "Project details", value: `${state.metadata.language} · ${state.metadata.frameworks.join(", ")}`, detail: `${state.metadata.testingFramework} · ${state.metadata.packageManager}`, path: "project-details" },
  ];
  return (
    <>
      <StepHeader eyebrow="Step 7 of 7" title="Review project setup" description="Confirm every setup decision before Nia validates and adds the project." />
      <div className="review-layout">
        <div className="review-card">
          {rows.map((row) => <div className="review-row" key={row.title}><span className="review-row-icon"><ReviewIcon title={row.title} /></span><div><small>{row.title}</small><strong>{row.value}</strong><p>{row.detail}</p></div><button onClick={() => edit(row.path)}>Edit</button></div>)}
        </div>
        <aside className="config-preview-card">
          <FileCode2 size={20} />
          <h3>Conceptual configuration</h3>
          <p>Nia would represent this setup across project configuration files.</p>
          <code>.nia/config/agents.toml</code>
          <code>.nia/config/project.toml</code>
          <code>.nia/config/toolchain.toml</code>
          <button><FileText size={14} /> Preview configuration</button>
        </aside>
      </div>
      {state.validationStatus === "invalid" && <div className="validation-error"><XCircle size={20} /><div><strong>Setup needs attention</strong><p>{state.validationMessage}</p><div className="setup-inline-actions"><button className="setup-link-button" onClick={() => edit("issue-tracker")}>Back to Issue tracker</button><button className="setup-link-button" onClick={() => { setValidationIndex(0); setState((current) => ({ ...current, validationStatus: "validating" })); }}>Try again</button></div></div></div>}
      {state.validationStatus === "validating" && <div className="validation-progress"><LoaderCircle size={22} /><div><strong>Validating project setup…</strong><p>{validationSteps[validationIndex]}…</p><div className="validation-track"><span style={{ width: `${((validationIndex + 1) / validationSteps.length) * 100}%` }} /></div></div></div>}
      <label className="setup-demo-toggle"><input type="checkbox" checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)} /><span>Prototype control: simulate validation failure</span></label>
      <div className="setup-review-footer">
        {footer}
        <button className="setup-button primary" disabled={state.validationStatus === "validating"} onClick={() => { setValidationIndex(0); setState((current) => ({ ...current, validationStatus: "validating", validationMessage: undefined })); }}><ShieldCheck size={16} /> Validate and add project</button>
      </div>
    </>
  );
}

function CompletePage({ project, onOpen, onReview }: { project: Project; onOpen: () => void; onReview: () => void }) {
  return (
    <div className="complete-card">
      <div className="complete-mark"><Check size={31} /></div>
      <span className="setup-eyebrow">Setup complete</span>
      <h1>Your project is ready</h1>
      <p><strong>{project.name}</strong> has been configured and is ready to open in Nia.</p>
      <div className="complete-checks">
        <CheckItem label="Repository configured" ok />
        <CheckItem label="Issue tracker configured" ok />
        <CheckItem label="Coding agent selected" ok />
        <CheckItem label="Project context complete" ok />
      </div>
      <button className="setup-button primary large" onClick={onOpen}>Open project <ArrowRight size={16} /></button>
      <button className="setup-link-button centered" onClick={onReview}>Review configuration</button>
    </div>
  );
}

function SetupSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="setup-section"><div className="setup-section-heading"><h2>{title}</h2>{description && <p>{description}</p>}</div>{children}</section>;
}

function ChoiceCard({ selected, icon: Icon, title, description, onClick }: { selected: boolean; icon: LucideIcon; title: string; description: string; onClick: () => void }) {
  return <button type="button" className={`setup-choice-card ${selected ? "selected" : ""}`} onClick={onClick}><span className="setup-choice-icon"><Icon size={20} /></span><div><strong>{title}</strong><p>{description}</p></div>{selected ? <CheckCircle2 className="setup-choice-check" size={17} /> : <Circle className="setup-choice-check empty" size={17} />}</button>;
}

function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return <span className={`check-item ${ok ? "ok" : "warn"}`}>{ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{label}</span>;
}

function SetupFooter({ onBack, onCancel, onContinue, continueLabel = "Continue", disabled, hideContinue = false }: { onBack?: () => void; onCancel: () => void; onContinue?: () => void; continueLabel?: string; disabled?: boolean; hideContinue?: boolean }) {
  return <div className="setup-footer"><button className="setup-button ghost" onClick={onCancel}>Cancel</button><div>{onBack && <button className="setup-button secondary" onClick={onBack}><ArrowLeft size={15} /> Back</button>}{!hideContinue && <button className="setup-button primary" onClick={onContinue} disabled={disabled}>{continueLabel} <ArrowRight size={15} /></button>}</div></div>;
}

function ConnectionPanel({ title, icon: Icon, status, connectedText, details, onStatus }: { title: string; icon: LucideIcon; status: ConnectionStatus; connectedText: string; details: string; onStatus: (status: ConnectionStatus) => void }) {
  return <div className="connection-detail-card"><div className="connection-detail-heading"><span><Icon size={20} /></span><div><strong>{title}</strong><p>{details}</p></div></div><ConnectionStatusLine status={status} connectedText={connectedText} /><StatusControls status={status} onStatus={onStatus} /></div>;
}

function ConnectionStatusLine({ status, connectedText }: { status: ConnectionStatus; connectedText: string }) {
  const content: Record<ConnectionStatus, { icon: LucideIcon; text: string; tone: string }> = {
    not_checked: { icon: Circle, text: "Not connected", tone: "muted" },
    checking: { icon: LoaderCircle, text: "Checking connection…", tone: "blue" },
    connected: { icon: CheckCircle2, text: connectedText, tone: "green" },
    needs_authentication: { icon: AlertCircle, text: "Authentication required", tone: "amber" },
    failed: { icon: XCircle, text: "Connection failed", tone: "red" },
  };
  const item = content[status];
  const Icon = item.icon;
  return <div className={`connection-status-line ${item.tone}`}><Icon size={16} /><div><strong>{item.text}</strong><p>{status === "failed" ? "Check the representative connection settings and try again." : status === "needs_authentication" ? "Complete authentication before workflows can run." : "Mock connection state for this prototype."}</p></div></div>;
}

function StatusControls({ status, onStatus }: { status: ConnectionStatus; onStatus: (status: ConnectionStatus) => void }) {
  const check = () => {
    onStatus("checking");
    window.setTimeout(() => onStatus("connected"), 650);
  };
  return <div className="status-controls"><button className="setup-link-button" onClick={check}><RefreshCcw size={14} /> {status === "connected" ? "Test connection" : "Check again"}</button><span>Prototype states:</span><button className="setup-demo-link" onClick={() => onStatus("needs_authentication")}>Authentication required</button><button className="setup-demo-link" onClick={() => onStatus("failed")}>Failed</button></div>;
}

function GuidanceDrawer({ topic, onClose }: { topic: string; onClose: () => void }) {
  const label = topic === "environment" ? "Environment prerequisite" : agentLabels[topic as CodingAgent] ?? "Coding agent";
  return <><div className="setup-drawer-scrim" onClick={onClose} /><aside className="setup-guidance-drawer"><div className="guidance-header"><div><span className="setup-eyebrow">Static guidance</span><h2>{label}</h2></div><button onClick={onClose}><X size={18} /></button></div><div className="guidance-body"><div className="guidance-icon"><HelpCircle size={24} /></div><h3>Complete setup outside this prototype</h3><p>This screen demonstrates where Nia would explain a missing prerequisite. It does not install software, run commands, or authenticate an account.</p><ol><li>Review the prerequisite documentation.</li><li>Complete installation or authentication in the supported tool.</li><li>Return to Nia and select <strong>Check again</strong>.</li></ol><a href="https://docs.github.com/en/copilot" target="_blank" rel="noreferrer">Open documentation <ExternalLink size={14} /></a></div></aside></>;
}

function ReviewIcon({ title }: { title: string }) {
  const icons: Record<string, LucideIcon> = { Project: Folder, "Code platform": Github, "Issue tracker": FileText, "Coding agent": Bot, "Model profile": Sparkles, "Project details": Settings2 };
  const Icon = icons[title] ?? FileText;
  return <Icon size={17} />;
}

function connectionLabel(status: ConnectionStatus) {
  return status === "connected" ? "Connected" : status === "needs_authentication" ? "Authentication required" : status === "failed" ? "Connection failed" : "Not connected";
}

function metadataValid(metadata: ProjectMetadata) {
  return Boolean(metadata.name.trim() && metadata.description.trim() && metadata.language && metadata.frameworks.length && metadata.testingFramework.trim() && metadata.packageManager);
}

function toProject(state: SetupState): Project {
  const id = state.metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `project-${Date.now()}`;
  const initials = state.metadata.name.split(/[\s-]+/).map((item) => item[0]).join("").slice(0, 2).toUpperCase();
  return {
    id,
    name: state.metadata.name,
    shortName: initials || "NP",
    repository: state.codePlatform === "github" ? `github.com/telerik/${state.metadata.name}` : state.localPath,
    description: state.metadata.description,
  };
}
