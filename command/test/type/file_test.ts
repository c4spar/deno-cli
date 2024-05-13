import { assertType, type IsExact } from "@std/testing/types";
import { assertEquals } from "@std/assert";
import { Command } from "../../command.ts";

function cmd() {
  return new Command()
    .throwErrors()
    .globalOption("-p, --path <path:file>", "description ...")
    .arguments("[path:file]")
    .action((options, ...args) => {
      assertType<IsExact<typeof options, { path?: string }>>(true);
      assertType<IsExact<typeof args, [string?]>>(true);
    });
}

Deno.test("command - type - file - with option", async () => {
  const { options, args } = await cmd().parse(["--path", "foo/bar/baz"]);

  assertType<IsExact<typeof options, { path?: string }>>(true);
  assertType<IsExact<typeof args, [string?]>>(true);

  assertEquals(options, { path: "foo/bar/baz" });
  assertEquals(args, []);
});

Deno.test("command - type - file - sub-command with option", async () => {
  const { options, args } = await cmd()
    .command("foo")
    .action((options, ...args) => {
      assertType<IsExact<typeof options, { path?: string }>>(true);
      assertType<IsExact<typeof args, []>>(true);
    })
    .parse(["foo", "--path", "foo/bar/baz"]);

  assertType<IsExact<typeof options, Record<string, unknown>>>(true);
  assertType<IsExact<typeof args, Array<unknown>>>(true);

  assertEquals(options, { path: "foo/bar/baz" });
  assertEquals(args, []);
});

Deno.test("command - type - file - with argument", async () => {
  const { options, args } = await cmd().parse(["foo/bar/baz"]);

  assertType<IsExact<typeof options, { path?: string }>>(true);
  assertType<IsExact<typeof args, [string?]>>(true);

  assertEquals(options, {});
  assertEquals(args, ["foo/bar/baz"]);
});
