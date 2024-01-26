import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
const compareOpenApiSchemas = require("../index.js");

test("compare two equal schemas", () => {
  const source = {
    openapi: "1.0.0",
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
        },
      },
    },
  };

  const target = JSON.parse(JSON.stringify(source));

  const diff = compareOpenApiSchemas(source, target);
  assert.deepStrictEqual(diff, {
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
