import { getOs } from "@cliffy/internal/runtime/get-os";
import { test } from "@cliffy/internal/testing/test";
import { assertEquals, assertRejects } from "@std/assert";
import { bold, red } from "@std/fmt/colors";
import { assertType, type IsExact } from "@std/testing/types";
import { Checkbox } from "../checkbox.ts";

test("prompt checkbox: valid value", async () => {
  Checkbox.inject(["value1", "value3"]);
  const result: string[] | undefined = await Checkbox.prompt({
    message: "message",
    options: [{ value: "value1" }, { value: "value2" }, "value3"],
  });
  assertEquals(result, ["value1", "value3"]);
});

test("prompt checkbox: empty value", async () => {
  Checkbox.inject([]);
  const result: string[] | undefined = await Checkbox.prompt({
    message: "message",
    options: [{ value: "value1" }, { value: "value2" }, "value3"],
  });

  assertEquals(result, []);
});

test("prompt checkbox: object value", async () => {
  Checkbox.inject([{ id: 1, name: "foo" }]);

  const books = [
    { id: 1, name: "foo" },
    { id: 2, name: "bar" },
  ];

  const result = await Checkbox.prompt({
    message: "please select a book",
    options: books.map((x) => ({ name: x.name, value: x })),
  });

  assertEquals(result, [{ id: 1, name: "foo" }]);
  assertType<IsExact<typeof result, Array<{ id: number; name: string }>>>(true);
});

test("prompt checkbox: invalid value", async () => {
  await assertRejects(
    async () => {
      Checkbox.inject(["value3", "value4"]);
      await Checkbox.prompt({
        message: "message",
        options: [{ value: "value1" }, { value: "value2" }, "value3"],
      });
    },
    Error,
    red(
      `${getOs() === "windows" ? bold("× ") : bold("✘ ")}Invalid answer.`,
    ),
  );
});

test("prompt checkbox: null value", async () => {
  await assertRejects(
    async () => {
      // deno-lint-ignore no-explicit-any
      Checkbox.inject(null as any);
      await Checkbox.prompt({
        message: "message",
        options: [{ value: "value1" }, { value: "value2" }, "value3"],
      });
    },
    Error,
    red(
      `${getOs() === "windows" ? bold("× ") : bold("✘ ")}Invalid answer.`,
    ),
  );
});

test("prompt checkbox: min options", async () => {
  await assertRejects(
    async () => {
      Checkbox.inject(["value1", "value2"]);
      await Checkbox.prompt({
        message: "message",
        minOptions: 3,
        options: [{ value: "value1" }, { value: "value2" }, "value3"],
      });
    },
    Error,
    red(
      `${
        getOs() === "windows" ? bold("× ") : bold("✘ ")
      }The minimum number of options is 3 but got 2.`,
    ),
  );
});

test("prompt checkbox: max options", async () => {
  await assertRejects(
    async () => {
      Checkbox.inject(["value1", "value2"]);
      await Checkbox.prompt({
        message: "message",
        maxOptions: 1,
        options: [{ value: "value1" }, { value: "value2" }, "value3"],
      });
    },
    Error,
    red(
      `${
        getOs() === "windows" ? bold("× ") : bold("✘ ")
      }The maximum number of options is 1 but got 2.`,
    ),
  );
});
