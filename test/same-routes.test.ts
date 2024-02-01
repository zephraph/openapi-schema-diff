import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { compareOpenApiSchemas } from "../src/main.ts";

Deno.test(function compare_two_equal_schemas() {
  const source = {
    openapi: "1.0.0",
    info: {
      title: "test",
      version: "1.0.0",
    },
    paths: {
      "/foo": {
        get: {
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    bar: {
                      type: "integer",
                    },
                  },
                },
              },
            },
          },
          responses: {},
        },
      },
    },
  } as const;

  const target = JSON.parse(JSON.stringify(source));

  const diff = compareOpenApiSchemas(source, target);
  assertEquals(diff, {
    isEqual: true,
    sameRoutes: [
      {
        method: "get",
        path: "/foo",
        sourceSchema: source.paths["/foo"].get,
        targetSchema: target.paths["/foo"].get,
      },
    ],
    addedRoutes: [],
    deletedRoutes: [],
    changedRoutes: [],
  });
});
