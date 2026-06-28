/**
 * GitHub Actions workflow parsing utilities for the doctor subsystem.
 *
 * Extracted from doctor.ts to keep the doctor module focused on
 * health-check orchestration rather than YAML workflow analysis.
 */

import path from "node:path";
import type { ProjectContext } from "../../core/context.js";
import { pathExists } from "../../util/fs.js";
import { globFiles } from "../../util/glob.js";

export interface WorkflowFile {
  path: string;
  relativePath: string;
}

interface WorkflowJob {
  permissions: unknown;
  steps: unknown[];
}

export async function discoverGerberOutputs(root: string, projects: ProjectContext[]): Promise<string[]> {
  const projectRoots = projects.length > 0 ? projects.map((project) => project.root) : [];
  const files = await Promise.all(
    projectRoots.map((projectRoot) => globFiles(path.resolve(root, projectRoot), ["**/*.gbr", "**/*.gbrjob"])),
  );
  return [...new Set(files.flat())].sort((left: string, right: string) => left.localeCompare(right));
}

export async function firstExisting(root: string, relativePaths: string[]): Promise<string | undefined> {
  for (const relativePath of relativePaths) {
    if (await pathExists(path.join(root, relativePath))) {
      return relativePath;
    }
  }
  return undefined;
}

export async function findBoardReadyWorkflow(root: string): Promise<WorkflowFile | undefined> {
  for (const relativePath of [".github/workflows/boardreadyops.yml", ".github/workflows/boardreadyops.yaml"]) {
    const workflowPath = path.join(root, relativePath);
    if (await pathExists(workflowPath)) {
      return { path: workflowPath, relativePath };
    }
  }
  return undefined;
}

export function workflowUses(workflow: unknown): string[] {
  return workflowJobs(workflow).flatMap((job) => jobUses(job));
}

function jobUses(job: WorkflowJob): string[] {
  return job.steps.flatMap((step) => {
    const stepRecord = asRecord(step);
    return typeof stepRecord?.uses === "string" ? [stepRecord.uses] : [];
  });
}

function workflowJobs(workflow: unknown): WorkflowJob[] {
  const jobs = asRecord(asRecord(workflow)?.jobs);
  if (!jobs) {
    return [];
  }
  return Object.values(jobs).map((job) => {
    const jobRecord = asRecord(job);
    const steps = jobRecord && Array.isArray(jobRecord.steps) ? jobRecord.steps : [];
    return { permissions: jobRecord?.permissions, steps };
  });
}

export function hasPullRequestCommentPermission(workflow: unknown): boolean {
  const workflowRecord = asRecord(workflow);
  if (!workflowRecord) {
    return false;
  }
  const jobs = workflowJobs(workflow).filter((job) => jobUses(job).some(isBoardReadyOpsActionUse));
  if (jobs.length === 0) {
    return false;
  }
  return jobs.every((job) => permissionsAllowIssueCommentWrite(job.permissions ?? workflowRecord.permissions));
}

function permissionsAllowIssueCommentWrite(permissions: unknown): boolean {
  if (permissions === "write-all") {
    return true;
  }
  const record = asRecord(permissions);
  return record?.["pull-requests"] === "write" || record?.issues === "write";
}

export function isCheckoutUse(uses: string): boolean {
  return /^actions\/checkout@/i.test(uses);
}

export function isPinnedCheckoutUse(uses: string): boolean {
  return /^actions\/checkout@[0-9a-f]{40}$/i.test(uses);
}

function isBoardReadyOpsActionUse(uses: string): boolean {
  return /^oaslananka\/boardreadyops(?:\/apps\/container)?@/i.test(uses);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
