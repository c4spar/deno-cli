// deno-lint-ignore-file no-explicit-any

import type {
  ArgumentOptions,
  ArgumentValue,
  BaseFlagOptions,
  DefaultValue,
  TypeHandler as FlagTypeHandler,
  ValueHandler,
} from "../flags/types.ts";
import type { Type } from "./type.ts";
import type { Command } from "./command.ts";
import type { HelpOptions } from "./help/_help_generator.ts";

export type { DefaultValue };

type Merge<T, V> = T extends void ? V : V extends void ? T : T & V;

type Id<T> = T extends Record<string, unknown>
  ? T extends infer U ? { [K in keyof U]: Id<U[K]> } : never
  : T;

export type MapTypes<T> = T extends Record<string, unknown> | Array<unknown>
  ? { [K in keyof T]: MapTypes<T[K]> }
  : TypeValue<T>;

/* COMMAND TYPES */

/** Description handler. */
export type DescriptionHandler<
  O extends Record<string, any> | void = any,
  A extends Array<unknown> = O extends number ? any : [],
  G extends Record<string, any> | void = O extends number ? any : void,
  PG extends Record<string, any> | void = O extends number ? any : void,
  CT extends Record<string, any> | void = O extends number ? any : void,
  GT extends Record<string, any> | void = O extends number ? any : void,
  PT extends Record<string, any> | void = O extends number ? any : void,
  P extends Command<any> | undefined = O extends number ? any : undefined,
> = string | ((this: Command<PG, PT, O, A, G, CT, GT, P>) => string);

/** Action handler for commands and options. */
export type ActionHandler<
  O extends Record<string, any> | void = any,
  A extends Array<unknown> = O extends number ? any : [],
  G extends Record<string, any> | void = O extends number ? any : void,
  PG extends Record<string, any> | void = O extends number ? any : void,
  CT extends Record<string, any> | void = O extends number ? any : void,
  GT extends Record<string, any> | void = O extends number ? any : void,
  PT extends Record<string, any> | void = O extends number ? any : void,
  P extends Command<any> | undefined = O extends number ? any : undefined,
> = (
  this: Command<PG, PT, O, A, G, CT, GT, P>,
  options: MapTypes<Merge<PG, Merge<G, O>>>,
  ...args: MapTypes<A>
) => unknown | Promise<unknown>;

/** Argument details. */
export interface Argument<TType extends string = string>
  extends ArgumentOptions<TType> {
  /** Argument name. */
  name: string;
  /** Shell completion action. */
  action: string;
}

/** Result of `cmd.parse()` method. */
export interface CommandResult<
  O extends Record<string, any> | void = any,
  A extends Array<unknown> = O extends number ? any : [],
  G extends Record<string, any> | void = O extends number ? any : void,
  PG extends Record<string, any> | void = O extends number ? any : void,
  CT extends Record<string, any> | void = O extends number ? any : void,
  GT extends Record<string, any> | void = O extends number ? any : void,
  PT extends Record<string, any> | void = O extends number ? any : void,
  P extends Command<any> | undefined = O extends number ? any : undefined,
> {
  options: Id<Merge<Merge<PG, G>, O>>;
  args: A;
  literal: string[];
  cmd: Command<PG, PT, O, A, G, CT, GT, P>;
}

/* OPTION TYPES */

/** Command option options. */
export interface GlobalOptionOptions<
  O extends Record<string, any> | void = any,
  A extends Array<unknown> = O extends number ? any : [],
  G extends Record<string, any> | void = O extends number ? any : void,
  PG extends Record<string, any> | void = O extends number ? any : void,
  CT extends Record<string, any> | void = O extends number ? any : void,
  GT extends Record<string, any> | void = O extends number ? any : void,
  PT extends Record<string, any> | void = O extends number ? any : void,
  P extends Command<any> | undefined = O extends number ? any : undefined,
> extends Omit<BaseFlagOptions, "name" | "aliases" | "equalsSign"> {
  override?: boolean;
  hidden?: boolean;
  action?: ActionHandler<O, A, G, PG, CT, GT, PT, P>;
  prepend?: boolean;
  separator?: string;
}

export interface OptionOptions<
  O extends Record<string, any> | void = any,
  A extends Array<unknown> = O extends number ? any : [],
  G extends Record<string, any> | void = O extends number ? any : void,
  PG extends Record<string, any> | void = O extends number ? any : void,
  CT extends Record<string, any> | void = O extends number ? any : void,
  GT extends Record<string, any> | void = O extends number ? any : void,
  PT extends Record<string, any> | void = O extends number ? any : void,
  P extends Command<any> | undefined = O extends number ? any : undefined,
> extends GlobalOptionOptions<O, A, G, PG, CT, GT, PT, P> {
  global?: boolean;
}

/** Command option settings. */
export interface Option<
  O extends Record<string, any> | void = any,
  A extends Array<unknown> = O extends number ? any : [],
  G extends Record<string, any> | void = O extends number ? any : void,
  PG extends Record<string, any> | void = O extends number ? any : void,
  CT extends Record<string, any> | void = O extends number ? any : void,
  GT extends Record<string, any> | void = O extends number ? any : void,
  PT extends Record<string, any> | void = O extends number ? any : void,
  P extends Command<any> | undefined = O extends number ? any : undefined,
> extends OptionOptions<O, A, G, PG, CT, GT, PT, P>, BaseFlagOptions {
  description: string;
  flags: Array<string>;
  typeDefinition?: string;
  args: Array<Argument<Extract<keyof CT & keyof GT, string>>>;
  groupName?: string;
  separator?: string;
}

export type OptionValueHandler<TValue = any, TReturn = TValue> = ValueHandler<
  TValue,
  TReturn
>;

/* ENV VARS TYPES */

export type EnvVarValueHandler<T = any, V = unknown> = (val: T) => V;

/** Environment variable options */
export interface GlobalEnvVarOptions {
  hidden?: boolean;
  required?: boolean;
  prefix?: string | undefined;
  value?: EnvVarValueHandler;
}

/** Environment variable options */
export interface EnvVarOptions extends GlobalEnvVarOptions {
  global?: boolean;
}

/** Environment variable settings. */
export interface EnvVar<TType extends string = string> extends EnvVarOptions {
  name: string;
  names: string[];
  description: string;
  // @TODO: extend IEnvVar from IArgument
  type: TType;
  details: Argument<TType>;
}

/* TYPE TYPES */

/** Type options. */
export interface TypeOptions {
  override?: boolean;
  global?: boolean;
}

/** Type settings. */
export interface TypeDef<TType extends string = string, TReturn = unknown>
  extends TypeOptions {
  name: string;
  handler: TypeOrTypeHandler<TType, TReturn>;
}

export type TypeHandler<TType extends string, TReturn> = FlagTypeHandler<
  TType,
  TReturn
>;

export type TypeOrTypeHandler<TType extends string, TReturn> =
  | Type<TType, TReturn>
  | TypeHandler<TType, TReturn>;

export type TypeValue<TTypeHandler, TDefaultValue = TTypeHandler> =
  TTypeHandler extends TypeOrTypeHandler<any, infer Value> ? Value
    : TDefaultValue;

export type TypeInfo<TType extends string = string> = ArgumentValue<
  TType
>;

/* EXAMPLE TYPES */

/** Example settings. */
export interface Example {
  name: string;
  description: string;
}

/* COMPLETION TYPES */

/** Completion options. */
export interface CompleteOptions {
  override?: boolean;
  global?: boolean;
}

/** Completion settings. */
export interface Completion<
  O extends Record<string, any> | void = any,
  A extends Array<unknown> = O extends number ? any : [],
  G extends Record<string, any> | void = O extends number ? any : void,
  PG extends Record<string, any> | void = O extends number ? any : void,
  CT extends Record<string, any> | void = O extends number ? any : void,
  GT extends Record<string, any> | void = O extends number ? any : void,
  PT extends Record<string, any> | void = O extends number ? any : void,
  P extends Command<any> | undefined = O extends number ? any : undefined,
> extends CompleteOptions {
  name: string;
  complete: CompleteHandler<O, A, G, PG, CT, GT, PT, P>;
}

export type CompleteHandlerResult =
  | Array<string | number | boolean>
  | Promise<Array<string | number | boolean>>;

export type TypeValues = Array<string | number | boolean>;

/** Type parser method. */
export type CompleteHandler<
  O extends Record<string, any> | void = any,
  A extends Array<unknown> = O extends number ? any : [],
  G extends Record<string, any> | void = O extends number ? any : void,
  PG extends Record<string, any> | void = O extends number ? any : void,
  CT extends Record<string, any> | void = O extends number ? any : void,
  GT extends Record<string, any> | void = O extends number ? any : void,
  PT extends Record<string, any> | void = O extends number ? any : void,
  P extends Command<any> | undefined = O extends number ? any : undefined,
> = (
  cmd: Command<PG, PT, O, A, G, CT, GT, P>,
  parent?: Command<any>,
) => CompleteHandlerResult;

/* HELP */

/**
 * Help callback method to print the help.
 * Invoked by the `--help` option and `help` command and the `.getHelp()` and `.showHelp()` methods.
 */
export type HelpHandler<
  O extends Record<string, any> | void = any,
  A extends Array<unknown> = O extends number ? any : [],
  G extends Record<string, any> | void = O extends number ? any : void,
  PG extends Record<string, any> | void = O extends number ? any : void,
  CT extends Record<string, any> | void = O extends number ? any : void,
  GT extends Record<string, any> | void = O extends number ? any : void,
  PT extends Record<string, any> | void = O extends number ? any : void,
  P extends Command<any> | undefined = O extends number ? any : undefined,
  C extends Command<PG, PT, O, A, G, CT, GT, P> = Command<
    PG,
    PT,
    O,
    A,
    G,
    CT,
    GT,
    P
  >,
> = (this: C, cmd: C, options: HelpOptions) => string;

/**
 * Version callback method to print the version.
 * Invoked by the `--help` option command and the `.getVersion()` and `.showHelp()` methods.
 */
export type VersionHandler<
  O extends Record<string, any> | void = any,
  A extends Array<unknown> = O extends number ? any : [],
  G extends Record<string, any> | void = O extends number ? any : void,
  PG extends Record<string, any> | void = O extends number ? any : void,
  CT extends Record<string, any> | void = O extends number ? any : void,
  GT extends Record<string, any> | void = O extends number ? any : void,
  PT extends Record<string, any> | void = O extends number ? any : void,
  P extends Command<any> | undefined = O extends number ? any : undefined,
  C extends Command<PG, PT, O, A, G, CT, GT, P> = Command<
    PG,
    PT,
    O,
    A,
    G,
    CT,
    GT,
    P
  >,
> = (this: C, cmd: C) => string;
