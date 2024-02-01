import {
  assertStrictEquals,
  fail,
} from "https://deno.land/std@0.209.0/assert/mod.ts";
import { compareOpenApiSchemas } from "../src/main.ts";
import { assertThrows } from "https://deno.land/std@0.209.0/assert/assert_throws.ts";

const info = {
  title: "test",
  version: "1.0.0",
};

Deno.test(function should_throw_source_schema_version_is_missing() {
  const source = { paths: {}, info };
  const target = { openapi: "1.0.0", paths: {}, info };

  assertThrows(() => compareOpenApiSchemas(source, target));
});

Deno.test(function should_throw_target_schema_version_is_missing() {
  const source = { openapi: "1.0.0", paths: {}, info };
  const target = { paths: {}, info };

  assertThrows(() => compareOpenApiSchemas(source, target));
});

Deno.test(function should_throw_if_major_version_does_not_equal() {
  const source = { openapi: "2.0.0", paths: {}, info };
  const target = { openapi: "1.0.0", paths: {}, info };

  assertThrows(() => compareOpenApiSchemas(source, target));
});

Deno.test(function should_not_throw_if_minor_version_does_not_equal() {
  const source = { openapi: "1.1.0", paths: {}, info };
  const target = { openapi: "1.0.0", paths: {}, info };

  const { isEqual } = compareOpenApiSchemas(source, target);
  assertStrictEquals(isEqual, true);
});

Deno.test(function should_not_throw_if_path_version_does_not_equal() {
  const source = { openapi: "1.1.1", paths: {}, info };
  const target = { openapi: "1.1.0", paths: {}, info };

  const { isEqual } = compareOpenApiSchemas(source, target);
  assertStrictEquals(isEqual, true);
});
