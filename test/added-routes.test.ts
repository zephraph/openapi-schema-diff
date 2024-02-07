import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { diffSchemas } from "../src/schema-diff.ts";

const info = {
  title: "test",
  version: "1.0.0",
};

Deno.test(function adding_new_route() {
  const source = {
    openapi: "1.0.0",
    info,
    paths: {},
  };

  const target = {
    openapi: "1.0.0",
    info,
    paths: {
      "/foo": {
        get: {
          responses: {
            200: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      bar: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  } as const;

  const diff = diffSchemas(source, target);
  assertEquals(diff, {
    isEqual: false,
    sameRoutes: [],
    addedRoutes: [
      {
        method: "get",
        path: "/foo",
        targetSchema: target.paths["/foo"].get,
      },
    ],
    deletedRoutes: [],
    changedRoutes: [],
  });
});

Deno.test(function adding_new_operation_object() {
  const source = {
    openapi: "1.0.0",
    info,
    paths: {
      "/foo": {
        description: "target",
      },
    },
  };

  const target = {
    openapi: "1.0.0",
    info,
    paths: {
      "/foo": {
        description: "source",
        get: {
          responses: {
            200: {
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
    },
  } as const;

  const diff = diffSchemas(source, target);
  assertEquals(diff, {
    isEqual: false,
    sameRoutes: [],
    addedRoutes: [
      {
        method: "get",
        path: "/foo",
        targetSchema: target.paths["/foo"].get,
      },
    ],
    deletedRoutes: [],
    changedRoutes: [],
  });
});
