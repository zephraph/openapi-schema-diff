import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { compareOpenApiSchemas } from "../src/main.ts";

Deno.test(function adding_request_body_schema_property_value() {
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
          requestBody: {
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
            type: "requestBody",
            mediaType: "application/json",
            action: "added",
            sourceSchema: undefined,
            targetSchema:
              target.paths["/foo"].get.requestBody.content["application/json"],
            comment:
              'request body for "application/json" media type has been added to GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test(function changing_request_body_schema_property_value() {
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

  const target = {
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
            type: "requestBody",
            mediaType: "application/json",
            action: "changed",
            sourceSchema:
              source.paths["/foo"].get.requestBody.content["application/json"],
            targetSchema:
              target.paths["/foo"].get.requestBody.content["application/json"],
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
                comment: "request body schema has been changed",
              },
            ],
            comment:
              'request body for "application/json" media type has been changed in GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test(function removing_request_body_schema_property_value() {
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
            type: "requestBody",
            action: "deleted",
            mediaType: "application/json",
            sourceSchema:
              source.paths["/foo"].get.requestBody.content["application/json"],
            targetSchema: undefined,
            comment:
              'request body for "application/json" media type has been deleted from GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test(
  function making_request_body_required_should_count_as_a_breaking_change() {
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
                  },
                  required: false,
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
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                  },
                  required: true,
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
              type: "requestBody",
              mediaType: "application/json",
              action: "changed",
              sourceSchema: source.paths["/foo"].get.requestBody.content[
                "application/json"
              ],
              targetSchema: target.paths["/foo"].get.requestBody.content[
                "application/json"
              ],
              changes: [
                {
                  keyword: "required",
                  source: false,
                  target: true,
                  comment: "request body has been made required",
                },
              ],
              comment:
                'request body for "application/json" media type has been changed in GET "/foo" route',
            },
          ],
        },
      ],
    });
  },
);

Deno.test(
  function making_request_body_optional_should_count_as_a_breaking_change() {
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
                  },
                  required: true,
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
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                  },
                  required: false,
                },
              },
            },
          },
        },
      },
    };

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
  },
);
