import { bootstrapApplication } from "@angular/platform-browser";
import { launchConfig } from "./launch.config";
import { LaunchComponent } from "./launch.component";

bootstrapApplication(LaunchComponent, launchConfig).catch((err) =>
  console.error(err)
);
