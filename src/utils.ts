export type Object = { [key: string]: unknown };

export function compareObjectKeys(sourceObject: Object, targetObject: Object) {
  const sameKeys = [];
  const addedKeys = [];
  const removedKeys = [];

  for (const key of Object.keys(targetObject)) {
    if (sourceObject[key] === undefined) {
      addedKeys.push(key);
    } else {
      sameKeys.push(key);
    }
  }

  for (const key of Object.keys(sourceObject)) {
    if (targetObject[key] === undefined) {
      removedKeys.push(key);
    }
  }

  return { sameKeys, addedKeys, removedKeys };
}

// Rust like monads

const Never = undefined as never;

export class Result<T extends "ok" | "error", D, E extends Error> {
  private constructor(
    public readonly type: T,
    public readonly data: T extends "ok" ? D : never = Never,
    public readonly error: T extends "error" ? E : never = Never
  ) {}

  static ok<T>(value: T): Result<"ok", T, never> {
    return new Result("ok", value);
  }

  static err<E extends Error>(error: E): Result<"error", never, E> {
    return new Result("error", Never, error);
  }

  static fromPromise<T>(promise: Promise<T>) {
    return promise.then(Result.ok).catch(Result.err);
  }

  static from<T>(fn: () => T) {
    try {
      return Result.ok(fn());
    } catch (e) {
      return Result.err(e);
    }
  }

  isOk(): this is { type: "ok"; data: T } {
    return this.type === "ok";
  }

  isErr(): this is { type: "error"; error: E } {
    return this.type === "error";
  }

  unwrap() {
    if (this.isOk()) {
      return this.data;
    } else {
      throw this.error;
    }
  }

  unwrapErr() {
    if (this.isErr()) {
      return this.error;
    } else {
      throw new Error("Cannot unwrapErr an Ok result");
    }
  }

  map<U>(fn: (value: T) => U) {
    if (this.isOk()) {
      return Result.ok(fn(this.data));
    } else {
      return Result.err(this.error);
    }
  }

  mapErr<F extends Error>(fn: (error: E) => F) {
    if (this.isErr()) {
      return Result.err(fn(this.error));
    } else {
      return Result.ok(this.data);
    }
  }
}

export class Option<T extends "some" | "none", V> {
  private constructor(
    public readonly type: T,
    public readonly value: T extends "some" ? V : never = Never
  ) {}

  static some<T>(value: T): Option<"some", T> {
    return new Option("some", value);
  }

  static none(): Option<"none", never> {
    return new Option("none");
  }

  isSome(): this is { type: "some"; value: V } {
    return this.type === "some";
  }

  isNone(): this is { type: "none" } {
    return this.type === "none";
  }

  unwrap(): V {
    if (this.isSome()) {
      return this.value;
    } else {
      throw new Error("Cannot unwrap a None option");
    }
  }

  map<U>(fn: (value: V) => U) {
    if (this.isSome()) {
      return Option.some(fn(this.value as V));
    } else {
      return Option.none();
    }
  }
}
