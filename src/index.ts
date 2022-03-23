#!/usr/bin/env node
require("dotenv").config();
import process from "process";
import { showWelcomeMessage } from "./modules/interface";
import {
  getClientProjects as startTimetracker,
  stopAllTracking,
} from "./modules/toogl";
var TogglClient = require("toggl-api");

showWelcomeMessage();

var toggl = new TogglClient({ apiToken: process.env.TOGGL_API_TOKEN });

process.stdin.resume();

process.on("SIGINT", function () {
  stopAllTracking(toggl);
});

startTimetracker(toggl);
