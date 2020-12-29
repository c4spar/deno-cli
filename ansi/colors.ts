import * as stdColors from "https://deno.land/std@0.82.0/fmt/colors.ts";

type ExcludedColorMethods = "setColorEnabled" | "getColorEnabled";
type PropertyNames = keyof typeof stdColors;
type ColorMethod = (str: string, ...args: Array<unknown>) => string;
type ColorMethods = Exclude<PropertyNames, ExcludedColorMethods>;
type Chainable<T, E extends keyof T | null = null> = {
  [P in keyof T]: P extends E ? T[P] : Chainable<T, E> & T[P];
};

/** Chainable colors instance returned by all ansi escape properties. */
export type ColorsChain = Chainable<typeof stdColors, ExcludedColorMethods>;

/** Create new `Colors` instance. */
export type ColorsFactory = () => Colors;

/**
 * Chainable colors module.
 * If invoked as method, a new `Colors` instance will be returned.
 */
export type Colors = ColorsFactory & ColorsChain;

/**
 * Chainable colors module.
 * ```
 * console.log(colors.blue.bgRed.bold('Welcome to Deno.Land!'));
 * ```
 * If invoked as method, a new Ansi instance will be returned.
 * ```
 * const myColors: Colors = colors();
 * console.log(myColors.blue.bgRed.bold('Welcome to Deno.Land!'));
 * ```
 */
export const colors: Colors = factory();

function factory(): Colors {
  let stack: Array<ColorMethods> = [];

  const colors: Colors = function (
    this: ColorsChain | undefined,
    str: string,
    ...args: Array<unknown>
  ): string | ColorsChain {
    if (str) {
      const lastIndex = stack.length - 1;
      const tmp = stack;
      stack = [];
      return tmp.reduce(
        (str: string, name: PropertyNames, index: number) =>
          index === lastIndex
            ? (stdColors[name] as ColorMethod)(str, ...args)
            : (stdColors[name] as ColorMethod)(str),
        str,
      );
    }
    return factory();
  } as Colors;

  const methodNames = Object.keys(stdColors) as Array<PropertyNames>;

  for (const name of methodNames) {
    if (name === "setColorEnabled" || name === "getColorEnabled") {
      continue;
    }
    Object.defineProperty(colors, name, {
      get(this: ColorsChain) {
        stack.push(name);
        return this;
      },
    });
  }

  return colors;
}
