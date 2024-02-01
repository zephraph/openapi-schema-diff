import { assertEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { compareOpenApiSchemas } from "../src/main.ts";

const info = {
  title: "test",
  version: "1.0.0",
};

Deno.test(function adding_request_query_schema_property_value() {
  const source = {
    openapi: "1.0.0",
    info,
    paths: {
      "/foo": {
        get: {
          responses: {},
        },
      },
    },
  } as const;

  const target = {
    openapi: "1.0.0",
    info,
    paths: {
      "/foo": {
        get: {
          responses: {},
          parameters: [
            {
              name: "bar",
              in: "query" as const,
              schema: {
                type: "string" as const,
              },
            },
          ],
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
            type: "parameter",
            name: "bar",
            in: "query",
            action: "added",
            sourceSchema: undefined,
            targetSchema: target.paths["/foo"].get.parameters[0],
            comment: 'query parameter "bar" has been added to GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test(function changing_request_header_schema_property_value() {
  const source = {
    openapi: "1.0.0",
    info,
    paths: {
      "/foo": {
        get: {
          responses: {},
          parameters: [
            {
              name: "bar",
              in: "header" as const,
              schema: {
                type: "integer" as const,
              },
            },
          ],
        },
      },
    },
  };

  const target = {
    openapi: "1.0.0",
    info,
    paths: {
      "/foo": {
        get: {
          responses: {},
          parameters: [
            {
              name: "bar",
              in: "header" as const,
              schema: {
                type: "string" as const,
              },
            },
          ],
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
            type: "parameter",
            name: "bar",
            in: "header",
            action: "changed",
            sourceSchema: source.paths["/foo"].get.parameters[0],
            targetSchema: target.paths["/foo"].get.parameters[0],
            changes: [
              {
                keyword: "schema",
                changes: [
                  {
                    jsonPath: "#/type",
                    source: "integer",
                    target: "string",
                  },
                ],
                comment: "parameter schema has been changed",
              },
            ],
            comment:
              'header parameter "bar" has been changed in GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test(function removing_request_path_param_schema_property_value() {
  const source = {
    openapi: "1.0.0",
    info,
    paths: {
      "/foo": {
        get: {
          responses: {},
          parameters: [
            {
              name: "bar",
              in: "path" as const,
              schema: {
                type: "string" as const,
              },
            },
          ],
        },
      },
    },
  };

  const target = {
    openapi: "1.0.0",
    info,
    paths: {
      "/foo": {
        get: {
          responses: {},
        },
      },
    },
  } as const;

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
            type: "parameter",
            name: "bar",
            in: "path",
            action: "deleted",
            sourceSchema: source.paths["/foo"].get.parameters[0],
            targetSchema: undefined,
            comment:
              'path parameter "bar" has been deleted from GET "/foo" route',
          },
        ],
      },
    ],
  });
});

Deno.test(
  function making_parameter_required_should_count_as_a_breaking_change() {
    const source = {
      openapi: "1.0.0",
      info,
      paths: {
        "/foo": {
          get: {
            responses: {},
            parameters: [
              {
                name: "bar",
                in: "header" as const,
                schema: {
                  type: "integer" as const,
                },
              },
            ],
          },
        },
      },
    };

    const target = {
      openapi: "1.0.0",
      info,
      paths: {
        "/foo": {
          get: {
            responses: {},
            parameters: [
              {
                name: "bar",
                in: "header" as const,
                schema: {
                  type: "integer" as const,
                },
                required: true,
              },
            ],
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
              type: "parameter",
              name: "bar",
              in: "header",
              action: "changed",
              sourceSchema: source.paths["/foo"].get.parameters[0],
              targetSchema: target.paths["/foo"].get.parameters[0],
              changes: [
                {
                  keyword: "required",
                  source: undefined,
                  target: true,
                  comment: "parameter has been made required",
                },
              ],
              comment:
                'header parameter "bar" has been changed in GET "/foo" route',
            },
          ],
        },
      ],
    });
  },
);

Deno.test(
  function making_parameter_optional_should_not_count_as_a_breaking_change() {
    const source = {
      openapi: "1.0.0",
      info,
      paths: {
        "/foo": {
          get: {
            responses: {},
            parameters: [
              {
                name: "bar",
                in: "header" as const,
                schema: {
                  type: "integer" as const,
                },
                required: true,
              },
            ],
          },
        },
      },
    };

    const target = {
      openapi: "1.0.0",
      info,
      paths: {
        "/foo": {
          get: {
            responses: {},
            parameters: [
              {
                name: "bar",
                in: "header" as const,
                schema: {
                  type: "integer" as const,
                },
                required: false,
              },
            ],
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
