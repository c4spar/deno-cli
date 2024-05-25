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
import { DenoLandProvider } from "./deno_land.ts";
import type { Versions } from "../provider.ts";

Deno.test("DenoLandProvider", async (ctx) => {
  mockGlobalFetch();
  mockGlobalCommand();

  const provider = new DenoLandProvider();

  await ctx.step({
    name: "should return registry url",
    fn() {
      assertEquals(
        provider.getRegistryUrl("foo", "1.0.0"),
        "https://deno.land/x/foo@1.0.0",
      );
    },
  });

  await ctx.step({
    name: "should return repository url",
    fn() {
      assertEquals(
        provider.getRepositoryUrl("foo"),
        "https://deno.land/x/foo",
      );
    },
  });

  await ctx.step({
    name: "should return versions",
    async fn() {
      const expectedVersions: Versions = {
        latest: "1.0.1",
        versions: ["1.0.1", "1.0.0"],
      };

      mockFetch("https://cdn.deno.land/foo/meta/versions.json", {
        body: JSON.stringify(expectedVersions),
      });
      const versions = await provider.getVersions("foo");

      assertEquals(versions, expectedVersions);

      resetFetch();
    },
  });

  await ctx.step({
    name: "should check if version is outdated",
    async fn() {
      const mock = {
        body: JSON.stringify({
          latest: "1.0.1",
          versions: ["1.0.1", "1.0.0"],
        }),
      };

      mockFetch("https://cdn.deno.land/foo/meta/versions.json", mock);
      const isOutdated = await provider.isOutdated("foo", "1.0.0", "latest");
      assert(isOutdated);

      mockFetch("https://cdn.deno.land/foo/meta/versions.json", mock);
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
      mockFetch("https://cdn.deno.land/foo/meta/versions.json", {
        body: JSON.stringify({
          latest: "1.0.1",
          versions: ["1.0.1", "1.0.0"],
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
          "https://deno.land/x/foo@1.0.1/foo.ts",
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
