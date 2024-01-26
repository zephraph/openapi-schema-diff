import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { resolveRef, resolveRefDeep } from "./main.ts";

const simpleRef = {
  foo: {
    $ref: "#/bar",
  },
  feh: {
    fickle: {
      $ref: "#/baz/bak",
    },
  },
  bar: {
    blue: true,
  },
  baz: {
    bak: {
      blah: true,
    },
  },
};

const resolvedRef = {
  foo: {
    blue: true,
  },
  feh: {
    fickle: {
      blah: true,
    },
  },
  bar: {
    blue: true,
  },
  baz: {
    bak: {
      blah: true,
    },
  },
};

Deno.test(function resolveRefShallowTest() {
  // Should replace a shallow ref
  assertEquals(
    simpleRef.bar,
    resolveRef<typeof simpleRef.bar>(simpleRef.foo, simpleRef),
  );
  // Shouldn't affect a non-ref
  assertEquals(simpleRef.bar, resolveRef(simpleRef.bar, simpleRef));
});

Deno.test(function resolveRefDeepTest() {
  assertEquals(resolvedRef, resolveRefDeep(simpleRef, simpleRef));
});
