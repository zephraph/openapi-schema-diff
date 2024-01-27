import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { compareOpenApiSchemas } from "../src/main.ts";

Deno.test(function modifying_routes_schema_through_ref() {
  const source = {
    openapi: "1.0.0",
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

  const diff = compareOpenApiSchemas(source, target);
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

Deno.test(function different__ref_property_values() {
  const source = {
    openapi: "1.0.0",
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

  const diff = compareOpenApiSchemas(source, target);
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

Deno.test(function compare_two_equal_schemas_with_circular_refs() {
  const source = {
    openapi: "1.0.0",
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

Deno.test(function compare_two_different_schemas_with_circular_refs() {
  const source = {
    openapi: "1.0.0",
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

  const diff = compareOpenApiSchemas(source, target);
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

Deno.test(function compare_two_equal_schemas_with_cross_circular_refs() {
  const source = {
    openapi: "1.0.0",
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

Deno.test(function compare_two_different_schemas_with_cross_circular_refs() {
  const source = {
    openapi: "1.0.0",
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

  const diff = compareOpenApiSchemas(source, target);
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
