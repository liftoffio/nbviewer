import { HttpClient } from "@angular/common/http";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { environment } from "./environments/environment";

interface PoolsResponse {
  pools: string[];
}

interface LaunchResponse {
  id: string;
}

interface CloudLinkResponse {
  url: string;
}

@Component({
  selector: "app-launch",
  templateUrl: "./launch.component.html",
  styleUrls: ["./launch.component.css"],
  imports: [FormsModule],
})
export class LaunchComponent {
  http = inject(HttpClient);
  firstOpen = false;
  open = signal<boolean>(false);
  pools = signal<string[]>([]);
  poolsError = signal<string>("");
  selectedPool = signal<string>("");
  launchStatus = signal<string>("");
  launchError = signal<string>("");
  launchUrl = signal<string>("");
  notebookUrl = signal<string>("");

  public toggleOpen() {
    if (!this.firstOpen) {
      this.fetchOptions();
      this.firstOpen = true;
    }
    this.open.update((prev) => !prev);
  }

  public fetchOptions() {
    this.poolsError.set("");
    this.http.get<PoolsResponse>("/.pools").subscribe({
      next: (res) => {
        this.selectedPool.set(res.pools[0]);
        this.pools.set(res.pools);
      },
      error: (err) => {
        this.poolsError.set(
          `Failed to fetch Rush pools: ${err.status} ${err.statusText}`,
        );
      },
    });
  }

  public launch() {
    this.launchError.set("");
    this.notebookUrl.set("");
    this.launchUrl.set("");
    this.launchStatus.set("loading");
    let launchOptions = { headers: {} };
    if (environment.development) {
      launchOptions.headers = { "X-User-Email": "kle@liftoff.io" };
    }
    const formData = new FormData();
    formData.append("pool", this.selectedPool());

    this.http
      .post<LaunchResponse>("/.launch", formData, launchOptions)
      .subscribe({
        next: (res) => {
          this.launchUrl.set(`https://rush.liftoff.io/jobs/${res.id}`);
          this.fetchJobStatusInerval(res.id);
        },
        error: (err) => {
          this.launchStatus.set("");
          this.launchError.set(
            `Failed to launch Rush job: ${err.status} ${err.statusText}`,
          );
        },
      });
  }

  private fetchJobStatusInerval(jobId: string) {
    const intervalId = setInterval(() => {
      this.http
        .get<CloudLinkResponse>(`/.cloud-link?id=${jobId}`)
        .subscribe((job) => {
          if (job.url === "") {
            return;
          }
          const url = new URL(job.url);
          const path = window.location.pathname.slice(1);
          url.pathname = `/lab/tree/RTC%3A${path}`;
          this.notebookUrl.set(url.toString());
          this.launchStatus.set("");
          clearInterval(intervalId);
        });
    });
  }
}
