import { assertEquals, assertThrows } from "../../../dev_deps.ts";
import { parseFlags } from "../../flags.ts";
import type { IParseOptions } from "../../types.ts";
import { OptionType } from "../../types.ts";

const options = <IParseOptions> {
  flags: [{
    name: "bitrate.audio",
    aliases: ["b.a", "audio-bitrate"],
    type: OptionType.NUMBER,
    depends: ["bitrate.video"],
  }, {
    name: "bitrate.video",
    aliases: ["b.v", "video-bitrate"],
    type: OptionType.NUMBER,
    depends: ["bitrate.audio"],
  }],
};

Deno.test("flags: dotted short options", () => {
  const { flags, unknown, literal } = parseFlags(
    ["-b.a", "300", "-b.v", "900"],
    options,
  );

  assertEquals(flags, { bitrate: { audio: 300, video: 900 } });
  assertEquals(unknown, []);
  assertEquals(literal, []);
});

Deno.test("flags: dotted long options", () => {
  const { flags, unknown, literal } = parseFlags(
    ["--bitrate.audio", "300", "--bitrate.video", "900"],
    options,
  );

  assertEquals(flags, { bitrate: { audio: 300, video: 900 } });
  assertEquals(unknown, []);
  assertEquals(literal, []);
});

Deno.test("flags: dotted aliases", () => {
  const { flags, unknown, literal } = parseFlags(
    ["--audio-bitrate", "300", "--video-bitrate", "900"],
    options,
  );

  assertEquals(flags, { bitrate: { audio: 300, video: 900 } });
  assertEquals(unknown, []);
  assertEquals(literal, []);
});

Deno.test("flags: dotted aliases", () => {
  assertThrows(
    () => parseFlags(["--audio-bitrate", "300"], options),
    Error,
    `Option "--bitrate.audio" depends on option "--bitrate.video".`,
  );
});

Deno.test("flags: dotted option with invalid value", () => {
  assertThrows(
    () =>
      parseFlags(
        ["--bitrate.audio", "300", "--bitrate.video", "900k"],
        options,
      ),
    Error,
    `Option "--bitrate.video" must be of type "number", but got "900k".`,
  );
});
