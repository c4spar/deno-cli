import { getDefaultValue, getOption, paramCaseToCamelCase } from "./_utils.ts";
import {
  ConflictingOption,
  DependingOption,
  MissingOptionValue,
  MissingRequiredOption,
  OptionNotCombinable,
  UnknownOption,
} from "./_errors.ts";
import { IFlagsResult, IParseOptions } from "./types.ts";
import type { IFlagArgument, IFlagOptions } from "./types.ts";

/**
 * Flags post validation. Validations that are not already done by the parser.
 *
 * @param ctx     Parse context.
 * @param opts    Parse options.
 * @param options Option name mappings: propertyName -> option
 */
export function validateFlags<T extends IFlagOptions = IFlagOptions>(
  ctx: IFlagsResult<Record<string, unknown>>,
  opts: IParseOptions<T>,
  options: Map<string, IFlagOptions> = new Map(),
): void {
  if (!opts.flags) {
    return;
  }
  const defaultValues = setDefaultValues(ctx, opts, options);

  const optionNames = Object.keys(ctx.flags);
  if (!optionNames.length && opts.allowEmpty) {
    return;
  }

  for (const [name, option] of options) {
    if (!getOption(opts.flags!, option.name)) {
      throw new UnknownOption(name, opts.flags);
    }

    const isStandaloneOption = validateStandaloneOption(
      option,
      options,
      optionNames,
      defaultValues,
    );
    if (isStandaloneOption) {
      ctx.standalone = true;
      return;
    }

    validateConflictingOptions(ctx, option);
    validateDependingOptions(ctx, option, defaultValues);
    validateRequiredValues(ctx, option, name);
  }

  if (ctx.standalone) {
    return;
  }

  validateRequiredOptions(ctx, options, opts);
}

/**
 * Adds all default values on the values object and returns a new object with
 * only the default values.
 */
function setDefaultValues<T extends IFlagOptions = IFlagOptions>(
  ctx: IFlagsResult<Record<string, unknown>>,
  opts: IParseOptions<T>,
  _options: Map<string, IFlagOptions> = new Map(),
) {
  const defaultValues: Record<string, boolean> = {};
  if (!opts.flags?.length) {
    return defaultValues;
  }

  // Set default values
  for (const option of opts.flags) {
    let name: string | undefined;
    let defaultValue: unknown = undefined;

    // if --no-[flag] is present set --[flag] default value to true
    if (option.name.startsWith("no-")) {
      const propName = option.name.replace(/^no-/, "");
      if (propName in ctx.flags) {
        continue;
      }
      const positiveOption = getOption(opts.flags, propName);
      if (positiveOption) {
        continue;
      }
      name = paramCaseToCamelCase(propName);
      defaultValue = true;
    }

    if (!name) {
      name = paramCaseToCamelCase(option.name);
    }

    // @TODO: check if this is still required.
    // if (!options.has(name)) {
    //   options.set(name, option);
    // }

    const hasDefaultValue: boolean = (!opts.ignoreDefaults ||
      typeof opts.ignoreDefaults[name] === "undefined") &&
      typeof ctx.flags[name] === "undefined" && (
        typeof option.default !== "undefined" ||
        typeof defaultValue !== "undefined"
      );

    if (hasDefaultValue) {
      ctx.flags[name] = getDefaultValue(option) ?? defaultValue;
      defaultValues[option.name] = true;
      if (typeof option.value === "function") {
        ctx.flags[name] = option.value(ctx.flags[name]);
      }
    }
  }

  return defaultValues;
}

function validateStandaloneOption(
  option: IFlagOptions,
  options: Map<string, IFlagOptions>,
  optionNames: Array<string>,
  defaultValues: Record<string, boolean>,
): boolean {
  if (!option.standalone) {
    return false;
  }
  if (optionNames.length === 1) {
    return true;
  }

  // don't throw an error if all values are coming from the default option.
  for (const [_, opt] of options) {
    if (!defaultValues[opt.name] && opt !== option) {
      throw new OptionNotCombinable(option.name);
    }
  }

  return true;
}

function validateConflictingOptions(
  ctx: IFlagsResult<Record<string, unknown>>,
  option: IFlagOptions,
): void {
  if (!option.conflicts?.length) {
    return;
  }
  for (const flag of option.conflicts) {
    if (isset(flag, ctx.flags)) {
      throw new ConflictingOption(option.name, flag);
    }
  }
}

function validateDependingOptions(
  ctx: IFlagsResult<Record<string, unknown>>,
  option: IFlagOptions,
  defaultValues: Record<string, boolean>,
): void {
  if (!option.depends) {
    return;
  }
  for (const flag of option.depends) {
    // don't throw an error if the value is coming from the default option.
    if (!isset(flag, ctx.flags) && !defaultValues[option.name]) {
      throw new DependingOption(option.name, flag);
    }
  }
}

function validateRequiredValues(
  ctx: IFlagsResult<Record<string, unknown>>,
  option: IFlagOptions,
  name: string,
): void {
  if (!option.args) {
    return;
  }
  const isArray = option.args.length > 1;

  for (let i = 0; i < option.args.length; i++) {
    const arg: IFlagArgument = option.args[i];
    if (!arg.requiredValue) {
      continue;
    }
    const hasValue = isArray
      ? typeof (ctx.flags[name] as Array<unknown>)[i] !== "undefined"
      : typeof ctx.flags[name] !== "undefined";

    if (!hasValue) {
      throw new MissingOptionValue(option.name);
    }
  }
}

function validateRequiredOptions<T extends IFlagOptions = IFlagOptions>(
  ctx: IFlagsResult<Record<string, unknown>>,
  options: Map<string, IFlagOptions>,
  opts: IParseOptions<T>,
): void {
  if (!opts.flags?.length) {
    return;
  }
  const optionsValues = [...options.values()];

  for (const option of opts.flags) {
    if (!option.required || paramCaseToCamelCase(option.name) in ctx.flags) {
      continue;
    }
    const conflicts = option.conflicts ?? [];
    const hasConflict = conflicts.find((flag: string) => !!ctx.flags[flag]);
    const hasConflicts = hasConflict ||
      optionsValues.find((opt) =>
        opt.conflicts?.find((flag: string) => flag === option.name)
      );

    if (hasConflicts) {
      continue;
    }
    throw new MissingRequiredOption(option.name);
  }
}

/**
 * Check if value exists for flag.
 * @param flagName  Flag name.
 * @param flags     Parsed values.
 */
function isset(flagName: string, flags: Record<string, unknown>): boolean {
  const name = paramCaseToCamelCase(flagName);
  // return typeof values[ name ] !== 'undefined' && values[ name ] !== false;
  return typeof flags[name] !== "undefined";
}
