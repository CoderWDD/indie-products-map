import { spawn } from "node:child_process";

type Step = {
  name: string;
  command: string;
  args: string[];
};

const steps: Step[] = [
  {
    name: "Fetch source README",
    command: "npm",
    args: ["run", "fetch"],
  },
  {
    name: "Merge project data",
    command: "npm",
    args: ["run", "update-projects"],
  },
  {
    name: "Analyze new projects",
    command: "npm",
    args: ["run", "analyze"],
  },
  {
    name: "Classify product patterns",
    command: "npm",
    args: ["run", "cluster"],
  },
  {
    name: "Cluster new patterns",
    command: "npm",
    args: ["run", "cluster:new"],
  },
  {
    name: "Check all links",
    command: "npm",
    args: ["run", "check-links"],
  },
  {
    name: "Validate data",
    command: "npm",
    args: ["run", "validate-data"],
  },
  {
    name: "Run tests",
    command: "npm",
    args: ["test"],
  },
  {
    name: "Build site",
    command: "npm",
    args: ["run", "build"],
  },
];

async function main() {
  for (const step of steps) {
    console.log(`\n==> ${step.name}`);
    await runStep(step);
  }
}

function runStep(step: Step) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(step.command, step.args, {
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const suffix = signal ? `signal ${signal}` : `exit code ${code}`;
      reject(new Error(`${step.name} failed with ${suffix}.`));
    });
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
