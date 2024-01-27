import {
  assertStrictEquals,
  fail,
} from "https://deno.land/std@0.209.0/assert/mod.ts";
import { compareOpenApiSchemas } from "../src/main.ts";

Deno.test(function should_throw_source_schema_version_is_missing() {
  const source = { paths: {} };
  const target = { openapi: "1.0.0", paths: {} };

  try {
    compareOpenApiSchemas(source, target);
    fail("should throw");
  } catch (err) {
    assertStrictEquals(err.message, "source schema version must be a string");
  }
});

Deno.test(function should_throw_target_schema_version_is_missing() {
  const source = { openapi: "1.0.0", paths: {} };
  const target = { paths: {} };

  try {
    compareOpenApiSchemas(source, target);
    fail("should throw");
  } catch (err) {
    assertStrictEquals(err.message, "target schema version must be a string");
  }
});

Deno.test(function should_throw_if_major_version_does_not_equal() {
  const source = { openapi: "2.0.0", paths: {} };
  const target = { openapi: "1.0.0", paths: {} };

  try {
    compareOpenApiSchemas(source, target);
    fail("should throw");
  } catch (err) {
    assertStrictEquals(
      err.message,
      "source and target schemas must have the same major version",
    );
  }
});

Deno.test(function should_not_throw_if_minor_version_does_not_equal() {
  const source = { openapi: "1.1.0", paths: {} };
  const target = { openapi: "1.0.0", paths: {} };

  const { isEqual } = compareOpenApiSchemas(source, target);
  assertStrictEquals(isEqual, true);
});

Deno.test(function should_not_throw_if_path_version_does_not_equal() {
  const source = { openapi: "1.1.1", paths: {} };
  const target = { openapi: "1.1.0", paths: {} };

  const { isEqual } = compareOpenApiSchemas(source, target);
  assertStrictEquals(isEqual, true);
});
