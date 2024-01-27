import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { compareOpenApiSchemas } from "../src/main.ts";

Deno.test(function adding_new_route() {
  const source = {
    openapi: "1.0.0",
    paths: {},
  };

  const target = {
    openapi: "1.0.0",
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
  };

  const diff = compareOpenApiSchemas(source, target);
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
    paths: {
      "/foo": {
        description: "target",
      },
    },
  };

  const target = {
    openapi: "1.0.0",
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
  };

  const diff = compareOpenApiSchemas(source, target);
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
