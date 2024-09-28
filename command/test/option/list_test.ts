import { test } from "@cliffy/internal/testing/test";
import { assertEquals } from "@std/assert";
import { Command } from "../../command.ts";

const cmd = new Command()
  .throwErrors()
  // comma separated list
  .option("-l, --list <items:number[]>", "comma separated list of numbers.")
  // space separated list
  .option(
    "-o, --other-list <items:string[]>",
    "space separated list of strings.",
    { separator: " " },
  );

test("command: list option", async () => {
  const { options, args } = await cmd.parse(["-l", "1,2,3"]);

  assertEquals(options, { list: [1, 2, 3] });
  assertEquals(args, []);
});

test("command: list option separator", async () => {
  const { options, args } = await cmd.parse(["-o", "1 2 3"]);

  assertEquals(options, { otherList: ["1", "2", "3"] });
  assertEquals(args, []);
});
