import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { compareOpenApiSchemas } from "../src/main.ts";

Deno.test(function should_throw_if_source_schema_is_not_an_object() {
  const source = 3;
  const target = { openapi: "1.0.0", paths: {} };

  try {
    compareOpenApiSchemas(source, target);
    fail("should throw");
  } catch (err) {
    assertStrictEquals(err.message, "source schema must be an object");
  }
});

Deno.test(function should_throw_if_target_schema_is_not_an_object() {
  const source = { openapi: "1.0.0", paths: {} };
  const target = 3;

  try {
    compareOpenApiSchemas(source, target);
    fail("should throw");
  } catch (err) {
    assertStrictEquals(err.message, "target schema must be an object");
  }
});

Deno.test(function should_throw_if_source_schema_is_null() {
  const source = null;
  const target = { openapi: "1.0.0", paths: {} };

  try {
    compareOpenApiSchemas(source, target);
    fail("should throw");
  } catch (err) {
    assertStrictEquals(err.message, "source schema must be an object");
  }
});

Deno.test(function should_throw_if_target_schema_is_null() {
  const source = { openapi: "1.0.0", paths: {} };
  const target = null;

  try {
    compareOpenApiSchemas(source, target);
    fail("should throw");
  } catch (err) {
    assertStrictEquals(err.message, "target schema must be an object");
  }
});
