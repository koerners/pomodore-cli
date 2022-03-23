import { askClientForProject, showProgress } from "./interface";

export interface Project {
  id: string;
  name: string;
  actual_hours: number;
}

export const getClientProjects = async (toggl: any): Promise<any> => {
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

export const startTimeEntry = async (toggl: any, project: string) => {
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

export const stopTracking = async (
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

export const stopAllTracking = async (toggl: any) => {
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
