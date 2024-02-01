import { compareOpenApiSchemas } from "../src/main.ts";
import { assertThrows } from "https://deno.land/std@0.209.0/assert/assert_throws.ts";

Deno.test(function should_throw_if_source_schema_is_not_an_object() {
  const source = 3;
  const target = { openapi: "1.0.0", paths: {} };

  // @ts-expect-error just passing bad types for testing
  assertThrows(() => compareOpenApiSchemas(source, target));
});

Deno.test(function should_throw_if_target_schema_is_not_an_object() {
  const source = { openapi: "1.0.0", paths: {} };
  const target = "3";

  assertThrows(() => compareOpenApiSchemas(source, target));
});

Deno.test(function should_throw_if_source_schema_is_null() {
  const source = null;
  const target = { openapi: "1.0.0", paths: {} };

  // @ts-expect-error just passing bad types for testing
  assertThrows(() => compareOpenApiSchemas(source, target));
});

Deno.test(function should_throw_if_target_schema_is_null() {
  const source = { openapi: "1.0.0", paths: {} };
  const target = null;

  // @ts-expect-error just passing bad types for testing
  assertThrows(() => compareOpenApiSchemas(source, target));
});
