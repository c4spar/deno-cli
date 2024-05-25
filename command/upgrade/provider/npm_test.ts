import { assert, assertEquals } from "@std/assert";
import {
  mockFetch,
  mockGlobalFetch,
  resetFetch,
  resetGlobalFetch,
} from "@c4spar/mock-fetch";
import {
  mockCommand,
  mockGlobalCommand,
  resetCommand,
  resetGlobalCommand,
} from "@c4spar/mock-command";
import { NpmProvider } from "./npm.ts";

Deno.test("NpmProvider", async (ctx) => {
  mockGlobalFetch();
  mockGlobalCommand();

  const provider = new NpmProvider({
    scope: "example",
  });

  await ctx.step({
    name: "should return registry url",
    fn() {
      assertEquals(
        provider.getRegistryUrl("foo", "1.0.0"),
        "npm:@example/foo@1.0.0",
      );
    },
  });

  await ctx.step({
    name: "should return repository url",
    fn() {
      assertEquals(
        provider.getRepositoryUrl("foo"),
        "https://registry.npmjs.org/@example/foo",
      );
    },
  });

  await ctx.step({
    name: "should return versions",
    async fn() {
      mockFetch("https://registry.npmjs.org/@example/foo", {
        body: JSON.stringify({
          "dist-tags": {
            latest: "1.0.1",
          },
          versions: {
            "1.0.0": null,
            "1.0.1": null,
          },
        }),
      });
      const versions = await provider.getVersions("foo");

      assertEquals(versions, {
        latest: "1.0.1",
        versions: ["1.0.1", "1.0.0"],
      });

      resetFetch();
    },
  });

  await ctx.step({
    name: "should check if version is outdated",
    async fn() {
      const mock = {
        body: JSON.stringify({
          "dist-tags": {
            latest: "1.0.1",
          },
          versions: {
            "1.0.1": null,
            "1.0.0": null,
          },
        }),
      };

      mockFetch("https://registry.npmjs.org/@example/foo", mock);
      const isOutdated = await provider.isOutdated("foo", "1.0.0", "latest");
      assert(isOutdated);

      mockFetch("https://registry.npmjs.org/@example/foo", mock);
      const isNotOutdated = !await provider.isOutdated(
        "foo",
        "1.0.1",
        "latest",
      );
      assert(isNotOutdated);

      resetFetch();
    },
  });

  await ctx.step({
    name: "should upgrade to latest version",
    async fn() {
      mockFetch("https://registry.npmjs.org/@example/foo", {
        body: JSON.stringify({
          "dist-tags": {
            latest: "1.0.1",
          },
          versions: {
            "1.0.0": null,
            "1.0.1": null,
          },
        }),
      });

      mockCommand({
        command: Deno.execPath(),
        args: [
          "install",
          "--no-check",
          "--quiet",
          "--force",
          "--name",
          "foo",
          "npm:@example/foo@1.0.1",
        ],
        stdout: "piped",
        stderr: "piped",
      });

      await provider.upgrade({
        name: "foo",
        from: "1.0.1",
        to: "latest",
      });

      resetFetch();
      resetCommand();
    },
  });

  resetGlobalFetch();
  resetGlobalCommand();
});
