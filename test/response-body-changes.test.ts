import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
const compareOpenApiSchemas = require("../index.js");

Deno.test(function adding_response_body_schema() {
  const source = {
    openapi: "1.0.0",
    paths: {
      "/foo": {
        get: {},
      },
    },
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
  assert.deepStrictEqual(diff, {
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
            action: "added",
            statusCode: "200",
            mediaType: "application/json",
            sourceSchema: undefined,
            targetSchema: target.paths["/foo"].get.responses["200"].content[
              "application/json"
            ],
            comment:
              'response body for "200" status code and "application/json" media type has been added to GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test(function adding_response_body_schema_for_status_code() {
  const source = {
    openapi: "1.0.0",
    paths: {
      "/foo": {
        get: {
          responses: {
            200: {},
          },
        },
      },
    },
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
  assert.deepStrictEqual(diff, {
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
            action: "added",
            statusCode: "200",
            mediaType: "application/json",
            sourceSchema: undefined,
            targetSchema: target.paths["/foo"].get.responses["200"].content[
              "application/json"
            ],
            comment:
              'response body for "200" status code and "application/json" media type has been added to GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test(function removing_response_body_schemas() {
  const source = {
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

  const target = {
    openapi: "1.0.0",
    paths: {
      "/foo": {
        get: {},
      },
    },
  };

  const diff = compareOpenApiSchemas(source, target);
  assert.deepStrictEqual(diff, {
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
            action: "deleted",
            statusCode: "200",
            mediaType: "application/json",
            sourceSchema: source.paths["/foo"].get.responses["200"].content[
              "application/json"
            ],
            targetSchema: undefined,
            comment:
              'response body for "200" status code and "application/json" media type has been deleted from GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test(function removing_response_body_schema_for_status_code() {
  const source = {
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

  const target = {
    openapi: "1.0.0",
    paths: {
      "/foo": {
        get: {
          responses: {
            200: {},
          },
        },
      },
    },
  };

  const diff = compareOpenApiSchemas(source, target);
  assert.deepStrictEqual(diff, {
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
            statusCode: "200",
            mediaType: "application/json",
            action: "deleted",
            sourceSchema: source.paths["/foo"].get.responses["200"].content[
              "application/json"
            ],
            targetSchema: undefined,
            comment:
              'response body for "200" status code and "application/json" media type has been deleted from GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test(function adding_response_body_schema_property() {
  const source = {
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
  assert.deepStrictEqual(diff, {
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
                    jsonPath: "#/properties",
                    source: undefined,
                    target: {
                      bar: {
                        type: "integer",
                      },
                    },
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

Deno.test(function removing_schema_property() {
  const source = {
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
  assert.deepStrictEqual(diff, {
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
            statusCode: "200",
            mediaType: "application/json",
            action: "changed",
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
                    jsonPath: "#/properties",
                    source: {
                      bar: {
                        type: "integer",
                      },
                    },
                    target: undefined,
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

Deno.test(function adding_schema_property() {
  const source = {
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
  assert.deepStrictEqual(diff, {
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
                    jsonPath: "#/properties",
                    source: {
                      bar: {
                        type: "integer",
                      },
                    },
                    target: undefined,
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
