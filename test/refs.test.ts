import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { diffSchemas, resolveRef, resolveRefDeep } from "../src/schema-diff.ts";

const info = {
  title: "test",
  version: "1.0.0",
};

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
  // @ts-expect-error Until we can magically remove nested $refs...
  assertEquals(resolvedRef, resolveRefDeep(simpleRef, simpleRef));
});

Deno.test(function modifying_routes_schema_through_ref() {
  const source = {
    openapi: "1.0.0",
    info,
    components: {
      schemas: {
        Bar: {
          type: "object",
          properties: {
            bar: {
              type: "integer",
            },
          },
        },
      },
    },
    paths: {
      "/foo": {
        get: {
          responses: {
            200: {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Bar",
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const target = {
    openapi: "1.0.0",
    info,
    components: {
      schemas: {
        Bar: {
          type: "object",
          properties: {
            bar: {
              type: "string",
            },
          },
        },
      },
    },
    paths: {
      "/foo": {
        get: {
          responses: {
            200: {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Bar",
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const diff = diffSchemas(source, target);
  assertEquals(diff, {
    isEqual: false,
    sameRoutes: [],
    addedRoutes: [],
    deletedRoutes: [],
    changedRoutes: [
      {
        method: "get",
        path: "/foo",
        sourceSchema: source.paths["/foo"].get,
        targetSchema: target.paths["/foo"].get,
        changes: [
          {
            type: "responseBody",
            action: "changed",
            statusCode: "200",
            mediaType: "application/json",
            sourceSchema: source.paths["/foo"].get.responses["200"].content[
              "application/json"
            ],
            targetSchema: target.paths["/foo"].get.responses["200"].content[
              "application/json"
            ],
            changes: [
              {
                keyword: "schema",
                changes: [
                  {
                    jsonPath: "#/properties/bar/type",
                    source: "integer",
                    target: "string",
                  },
                ],
                comment: "response body schema has been changed",
              },
            ],
            comment:
              'response body for "200" status code and "application/json" media type has been changed in GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test(function different_ref_property_values() {
  const source = {
    openapi: "1.0.0",
    info,
    components: {
      schemas: {
        Bar1: {
          type: "object",
          properties: {
            bar: {
              type: "integer",
            },
          },
        },
      },
    },
    paths: {
      "/foo": {
        get: {
          responses: {
            200: {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Bar1",
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const target = {
    openapi: "1.0.0",
    info,
    components: {
      schemas: {
        Bar2: {
          type: "object",
          properties: {
            bar: {
              type: "string",
            },
          },
        },
      },
    },
    paths: {
      "/foo": {
        get: {
          responses: {
            200: {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Bar2",
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const diff = diffSchemas(source, target);
  assertEquals(diff, {
    isEqual: false,
    sameRoutes: [],
    addedRoutes: [],
    deletedRoutes: [],
    changedRoutes: [
      {
        method: "get",
        path: "/foo",
        sourceSchema: source.paths["/foo"].get,
        targetSchema: target.paths["/foo"].get,
        changes: [
          {
            type: "responseBody",
            action: "changed",
            statusCode: "200",
            mediaType: "application/json",
            sourceSchema: source.paths["/foo"].get.responses["200"].content[
              "application/json"
            ],
            targetSchema: target.paths["/foo"].get.responses["200"].content[
              "application/json"
            ],
            changes: [
              {
                keyword: "schema",
                changes: [
                  {
                    jsonPath: "#/$ref",
                    source: "#/components/schemas/Bar1",
                    target: "#/components/schemas/Bar2",
                  },
                ],
                comment: "response body schema has been changed",
              },
            ],
            comment:
              'response body for "200" status code and "application/json" media type has been changed in GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test.ignore(function compare_two_equal_schemas_with_circular_refs() {
  const source = {
    openapi: "1.0.0",
    info,
    components: {
      schemas: {
        Bar: {
          type: "object",
          properties: {
            bar: {
              type: "integer",
            },
            self: {
              $ref: "#/components/schemas/Bar",
            },
          },
        },
      },
    },
    paths: {
      "/foo": {
        get: {
          responses: {
            200: {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Bar",
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

  const diff = diffSchemas(source, target);
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

Deno.test.ignore(function compare_two_different_schemas_with_circular_refs() {
  const source = {
    openapi: "1.0.0",
    info,
    components: {
      schemas: {
        Bar: {
          type: "object",
          properties: {
            bar: {
              type: "integer",
            },
            self: {
              $ref: "#/components/schemas/Bar",
            },
          },
        },
      },
    },
    paths: {
      "/foo": {
        get: {
          responses: {
            200: {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Bar",
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const target = {
    openapi: "1.0.0",
    info,
    components: {
      schemas: {
        Bar: {
          type: "object",
          properties: {
            bar: {
              type: "string",
            },
            self: {
              $ref: "#/components/schemas/Bar",
            },
          },
        },
      },
    },
    paths: {
      "/foo": {
        get: {
          responses: {
            200: {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Bar",
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const diff = diffSchemas(source, target);
  assertEquals(diff, {
    isEqual: false,
    sameRoutes: [],
    addedRoutes: [],
    deletedRoutes: [],
    changedRoutes: [
      {
        method: "get",
        path: "/foo",
        sourceSchema: source.paths["/foo"].get,
        targetSchema: target.paths["/foo"].get,
        changes: [
          {
            type: "responseBody",
            action: "changed",
            statusCode: "200",
            mediaType: "application/json",
            sourceSchema: source.paths["/foo"].get.responses["200"].content[
              "application/json"
            ],
            targetSchema: target.paths["/foo"].get.responses["200"].content[
              "application/json"
            ],
            changes: [
              {
                keyword: "schema",
                changes: [
                  {
                    jsonPath: "#/properties/bar/type",
                    source: "integer",
                    target: "string",
                  },
                ],
                comment: "response body schema has been changed",
              },
            ],
            comment:
              'response body for "200" status code and "application/json" media type has been changed in GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test.ignore(function compare_two_equal_schemas_with_cross_circular_refs() {
  const source = {
    openapi: "1.0.0",
    info,
    components: {
      schemas: {
        Bar1: {
          type: "object",
          properties: {
            self: {
              $ref: "#/components/schemas/Bar2",
            },
            bar: {
              type: "integer",
            },
          },
        },
        Bar2: {
          type: "object",
          properties: {
            self: {
              $ref: "#/components/schemas/Bar1",
            },
            bar: {
              type: "integer",
            },
          },
        },
      },
    },
    paths: {
      "/foo": {
        get: {
          responses: {
            200: {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Bar1",
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

  const diff = diffSchemas(source, target);
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

Deno.test.ignore(
  function compare_two_different_schemas_with_cross_circular_refs() {
    const source = {
      openapi: "1.0.0",
      info,
      components: {
        schemas: {
          Bar1: {
            type: "object",
            properties: {
              self: {
                $ref: "#/components/schemas/Bar2",
              },
              bar: {
                type: "integer",
              },
            },
          },
          Bar2: {
            type: "object",
            properties: {
              self: {
                $ref: "#/components/schemas/Bar1",
              },
              bar: {
                type: "integer",
              },
            },
          },
        },
      },
      paths: {
        "/foo": {
          get: {
            responses: {
              200: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Bar1",
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const target = {
      openapi: "1.0.0",
      info,
      components: {
        schemas: {
          Bar1: {
            type: "object",
            properties: {
              self: {
                $ref: "#/components/schemas/Bar2",
              },
              bar: {
                type: "string",
              },
            },
          },
          Bar2: {
            type: "object",
            properties: {
              self: {
                $ref: "#/components/schemas/Bar1",
              },
              bar: {
                type: "integer",
              },
            },
          },
        },
      },
      paths: {
        "/foo": {
          get: {
            responses: {
              200: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Bar1",
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const diff = diffSchemas(source, target);
    assertEquals(diff, {
      isEqual: false,
      sameRoutes: [],
      addedRoutes: [],
      deletedRoutes: [],
      changedRoutes: [
        {
          method: "get",
          path: "/foo",
          sourceSchema: source.paths["/foo"].get,
          targetSchema: target.paths["/foo"].get,
          changes: [
            {
              type: "responseBody",
              action: "changed",
              statusCode: "200",
              mediaType: "application/json",
              sourceSchema: source.paths["/foo"].get.responses["200"].content[
                "application/json"
              ],
              targetSchema: target.paths["/foo"].get.responses["200"].content[
                "application/json"
              ],
              changes: [
                {
                  keyword: "schema",
                  changes: [
                    {
                      jsonPath: "#/properties/bar/type",
                      source: "integer",
                      target: "string",
                    },
                  ],
                  comment: "response body schema has been changed",
                },
              ],
              comment:
                'response body for "200" status code and "application/json" media type has been changed in GET "/foo" route',
            },
          ],
        },
      ],
    });
  },
);
