import { assertEquals, assertRejects } from "../../../dev_deps.ts";
import { Command } from "../../command.ts";
import type { ITypeInfo } from "../../types.ts";
import { ValidationError } from "../../_errors.ts";

const cmd = () =>
  new Command()
    .noExit()
    .version("0.1.0")
    .option("-b, --base", "Only available on this command.")
    .type(
      "custom",
      ({ value }: ITypeInfo) => value.toUpperCase(),
      { global: true },
    )
    .option(
      "-g, --global [val:custom]",
      "Available on all commands.",
      { global: true },
    )
    .globalOption("-G, --global2 [val:string]", "Available on all commands.")
    .globalOption("-o, --global3 [val:string]", "Available on all commands.")
    .command(
      "cmd1",
      new Command()
        .option("-l, --level2 [val:custom]", "Only available on this command.")
        .description("Some sub command.")
        .command(
          "cmd2",
          new Command()
            .option(
              "-L, --level3 [val:custom]",
              "Only available on this command.",
            )
            .description("Some nested sub command."),
        )
        .command(
          "cmd3",
          new Command()
            .option(
              "-L, --level3 [val:custom]",
              "Only available on this command.",
            )
            .description("Some nested sub command.")
            .noGlobals(),
        )
        .reset(),
    );

Deno.test("[command] should parse global options", async () => {
  const { options, args } = await cmd().parse(["-g", "halo", "-G", "halo"]);

  assertEquals(options, { global: "HALO", global2: "halo" });
  assertEquals(args, []);
});

Deno.test("[command] should parse global options on sub command", async () => {
  const { options, args } = await cmd().parse([
    "cmd1",
    "-g",
    "foo",
    "-G",
    "bar",
    "-o",
    "baz",
  ]);

  assertEquals(options, { global: "FOO", global2: "bar", global3: "baz" });
  assertEquals(args, []);
});

Deno.test("[command] should parse global options on nested sub command", async () => {
  const { options, args } = await cmd().parse(
    ["cmd1", "cmd2", "-g", "foo", "-G", "bar", "-o", "baz"],
  );

  assertEquals(options, { global: "FOO", global2: "bar", global3: "baz" });
  assertEquals(args, []);
});

Deno.test("[command] should parse global options before sub commands", async () => {
  const { options, args } = await cmd().parse(
    ["-g", "foo", "cmd1", "-G", "bar", "cmd2", "-o", "baz"],
  );

  assertEquals(options, { global: "FOO", global2: "bar", global3: "baz" });
  assertEquals(args, []);
});

Deno.test("[command] should disable global options with noGlobals", async () => {
  await assertRejects(
    () =>
      cmd().parse(
        ["cmd1", "cmd3", "-g", "foo"],
      ),
    ValidationError,
    'Unknown option "-g". Did you mean option "-h"?',
  );
});

Deno.test("[command] should not disable global help command with noGlobals", async () => {
  await cmd().parse(
    ["cmd1", "cmd3", "-h"],
  );
});

Deno.test("[command] should not disable global help command with noGlobals", async () => {
  await cmd().parse(
    ["cmd1", "cmd3", "--help"],
  );
});
