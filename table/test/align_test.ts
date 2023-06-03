import { Table } from "../table.ts";
import { assertEquals } from "../../dev_deps.ts";
import { Row } from "../row.ts";
import { Cell } from "../cell.ts";

Deno.test("table - align - align table", () => {
  assertEquals(
    new Table()
      .header(["Foo", "Bar", "Baz"])
      .body([
        ["foo bar baz", "baz", "beep boop"],
        ["baz", "beep boop", "foo bar baz"],
        ["beep boop", "foo bar baz", "baz"],
      ])
      .border(true)
      .align("center")
      .toString(),
    `
┌─────────────┬─────────────┬─────────────┐
│     Foo     │     Bar     │     Baz     │
├─────────────┼─────────────┼─────────────┤
│ foo bar baz │     baz     │  beep boop  │
├─────────────┼─────────────┼─────────────┤
│     baz     │  beep boop  │ foo bar baz │
├─────────────┼─────────────┼─────────────┤
│  beep boop  │ foo bar baz │     baz     │
└─────────────┴─────────────┴─────────────┘`.slice(1),
  );
});

Deno.test("table - align - align row and cell", () => {
  assertEquals(
    new Table()
      .header(Row.from(["Foo", "Bar", "Baz"]).align("center"))
      .body([
        ["foo bar baz", "baz", "beep boop"],
        new Row("baz", "beep boop", "foo bar baz").align("right"),
        ["beep boop", "foo bar baz", new Cell("baz").align("center")],
      ])
      .border(true)
      .toString(),
    `
┌─────────────┬─────────────┬─────────────┐
│     Foo     │     Bar     │     Baz     │
├─────────────┼─────────────┼─────────────┤
│ foo bar baz │ baz         │ beep boop   │
├─────────────┼─────────────┼─────────────┤
│         baz │   beep boop │ foo bar baz │
├─────────────┼─────────────┼─────────────┤
│ beep boop   │ foo bar baz │     baz     │
└─────────────┴─────────────┴─────────────┘`.slice(1),
  );
});

Deno.test("table - align - default direction", () => {
  const cell = new Cell("foo");
  const row = new Row(cell);
  const table = new Table(row);
  assertEquals(cell.getAlign(), undefined);
  assertEquals(row.getAlign(), undefined);
  assertEquals(table.getAlign(), undefined);
  assertEquals(table[0][0].getAlign(), undefined);
  assertEquals(table[0].getAlign(), undefined);
});

Deno.test("table - align - override direction", () => {
  const cell = new Cell("foo").align("center");
  const row = new Row(cell).align("center");
  const table = new Table(row).align("center");
  assertEquals(cell.getAlign(), "center");
  assertEquals(row.getAlign(), "center");
  assertEquals(table.getAlign(), "center");
  assertEquals(table[0][0].getAlign(), "center");
  assertEquals(table[0].getAlign(), "center");
});

Deno.test("table - align - inherit direction", () => {
  const cell = new Cell("foo");
  const row = new Row(cell);
  const table = new Table(row).align("right");
  assertEquals(cell.getAlign(), undefined);
  assertEquals(row.getAlign(), undefined);
  assertEquals(table.getAlign(), "right");
  assertEquals(table[0][0].getAlign(), undefined);
  assertEquals(table[0].getAlign(), undefined);
});
