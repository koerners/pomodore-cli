#!/usr/bin/env node
require("dotenv").config();
import process from "process";

const inquirer = require("inquirer");
const cliProgress = require("cli-progress");
const notifier = require("node-notifier");
var chalk = require("chalk");
var clear = require("clear");
var figlet = require("figlet");

const main = async () => {
  var TogglClient = require("toggl-api");

  showWelcomeMessage();

  var toggl = new TogglClient({ apiToken: process.env.TOGGL_API_TOKEN });

  process.stdin.resume();

  process.on("SIGINT", function () {
    stopAllTracking(toggl);
  });

  getClientProjects(toggl);
};

const askClientForProject = async (projects: Project[], toggl: any) => {
  if (process.env.DEFAULT_PROJEKT !== "") {
    projects.sort((a, _b) => {
      return a.name === process.env.DEFAULT_PROJEKT ? -1 : 1;
    });
  }
  inquirer
    .prompt([
      {
        type: "list",
        name: "projects",
        message: "Which project would you like to start?",
        choices: projects.map((project: Project) => project.name),
      },
    ])
    .then(async (answers: { projects: any }) => {
      console.info("Answer:", answers.projects);
      const projectId = projects.find(
        (project: Project) => project.name === answers.projects
      )?.id;
      if (projectId) {
        clear();
        console.log(
          chalk.blue(
            figlet.textSync(answers.projects, { horizontalLayout: "full" })
          )
        );
        await startTimeEntry(toggl, projectId);
      }
    });
};

const showProgress = async (toggl: any, timeEntryId: string) => {
  const bar1 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );

  const duration = Number(process.env.POMODORE_TIME);
  bar1.start(duration, 0);

  for (let i = 0; i < duration; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
    bar1.update(i + 1);
  }
  // stop the progress bar
  bar1.stop();
  await askClientToPauseTimeEntry(toggl, timeEntryId);
};

const askClientToPauseTimeEntry = async (
  toggl: any,
  timeEntryId: string
) => {
  // Object
  notifier.notify({
    title: "Break",
    message: "It's time for a break!",
    sound: true, // Case Sensitive string for location of sound file, or use one of macOS' native sounds (see below)
  });

  inquirer
    .prompt([
      {
        type: "list",
        name: "pause",
        message: "Would you like to take a break?",
        choices: ["Yes", "No"],
      },
    ])
    .then(async (answers: { pause: string }) => {
      console.info("Answer:", answers.pause);
      if (answers.pause === "Yes") {
        await stopTracking(toggl, timeEntryId);
        clear();
        await showBreakProgress(toggl);
      }
      if (answers.pause === "No") {
        clear();
        await showProgress(toggl, timeEntryId);
      }
    });
};

async function showBreakProgress(toggl: any) {
  console.log(
    chalk.green(figlet.textSync("Pause!", { horizontalLayout: "full" }))
  );

  const bar2 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );

  const duration = Number(process.env.POMODORE_BREAK_TIME);

  bar2.start(duration, 0);

  for (let i = 0; i < duration; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
    bar2.update(i + 1);
  }
  // stop the progress bar
  bar2.stop();
  showWelcomeMessage();
  getClientProjects(toggl);
}

const showWelcomeMessage = () => {
  clear();
  console.log(
    chalk.red(figlet.textSync("Timetracker", { horizontalLayout: "full" }))
  );
};

interface Project {
  id: string;
  name: string;
  actual_hours: number;
}

const getClientProjects = async (toggl: any): Promise<any> => {
  toggl.getWorkspaces(function (err: any, workspaces: any) {
    if (err) {
      console.log(err);
    } else {
      toggl.getWorkspaceProjects(
        workspaces[0].id,
        {},
        async function (err: any, projects: Project[]) {
          if (err) {
            console.log(err);
          } else {
            await askClientForProject(projects, toggl);
          }
        }
      );
    }
  });
};

const startTimeEntry = async (toggl: any, project: string) => {
  toggl.startTimeEntry(
    {
      description: "",
      pid: project,
      billable: false,
    },
    async function (_err: any, timeEntry: { id: any }) {
      await showProgress(toggl, timeEntry.id);
    }
  );
};

const stopTracking = async (
  toggl: any,
  timeEntryId: string,
  closeProgramm = false
) => {
  toggl.stopTimeEntry(timeEntryId, function (err: any) {
    if (err) {
      console.log(err);
    } else {
      console.log("Time entry stopped");
      if (closeProgramm) {
        process.exit();
      }
    }
  });
};

const stopAllTracking = async (toggl: any) => {
  toggl.getCurrentTimeEntry(async function (
    err: any,
    timeEntry: { id: string }
  ) {
    if (err) {
      console.log(err);
    } else {
      if (timeEntry) {
        await stopTracking(toggl, timeEntry.id, true);
      }
    }
  });
};

main();
