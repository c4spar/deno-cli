import { dim } from "@std/fmt/colors";
import type { Logger } from "../logger.ts";
import { NodeRuntime } from "./node_runtime.ts";

export class BunRuntime extends NodeRuntime {
  protected override async execute(
    cmdArgs: string[],
    isJsr: boolean,
    logger?: Logger,
  ): Promise<void> {
    // deno-lint-ignore no-explicit-any
    const Bun = (globalThis as any).Bun;
    // deno-lint-ignore no-explicit-any
    const process = (globalThis as any).process;

    cmdArgs = isJsr
      ? [`${process.execPath}x`, "jsr", ...cmdArgs]
      : [process.execPath, ...cmdArgs];

    logger?.log(
      dim("$ %s"),
      cmdArgs.join(" "),
    );

    const proc = Bun.spawn(cmdArgs, { stdout: "pipe", stderr: "pipe" });
    await proc.exited;

    if (proc.exitCode) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(stderr.trim());
    }
  }
}
