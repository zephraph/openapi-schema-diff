import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { compareOpenApiSchemas } from "../src/main.ts";

const info = {
  title: "test",
  version: "1.0.0",
};

Deno.test(function removing_a_route() {
  const source = {
    openapi: "1.0.0",
    info,
    paths: {
      "/foo1": {
        get: {
          description: "source",
          responses: {},
        },
      },
      "/foo2": {
        get: {
          description: "source",
          responses: {},
        },
      },
    },
  } as const;

  const target = {
    openapi: "1.0.0",
    info,
    paths: {
      "/foo1": {
        get: {
          description: "source",
          responses: {},
        },
      },
    },
  } as const;

  const diff = compareOpenApiSchemas(source, target);
  assertEquals(diff, {
    isEqual: false,
    sameRoutes: [
      {
        method: "get",
        path: "/foo1",
        sourceSchema: source.paths["/foo1"].get,
        targetSchema: target.paths["/foo1"].get,
      },
    ],
    addedRoutes: [],
    deletedRoutes: [
      {
        method: "get",
        path: "/foo2",
        sourceSchema: source.paths["/foo2"].get,
      },
    ],
    changedRoutes: [],
  });
});

Deno.test(function removing_an_operation_object() {
  const source = {
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

  const target = {
    openapi: "1.0.0",
    info,
    paths: {
      "/foo": {
        description: "target",
      },
    },
  } as const;

  const diff = compareOpenApiSchemas(source, target);
  assertEquals(diff, {
    isEqual: false,
    sameRoutes: [],
    addedRoutes: [],
    deletedRoutes: [
      {
        method: "get",
        path: "/foo",
        sourceSchema: source.paths["/foo"].get,
      },
    ],
    changedRoutes: [],
  });
});
