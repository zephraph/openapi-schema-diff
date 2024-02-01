# openapi-schema-diff

This is a fork of [openapi-schema-diff](https://github.com/fastify/openapi-schema-diff) by [
Ivan Tymoshenko](https://github.com/ivan-tymoshenko) of [Fastify](https://github.com/fastify). It has been modified to be typescript first, adds a Zod schema for the API spec, and uses [Deno](https://deno.land) for development instead of Node.

Note that this was designed for use at [Oxide Computer Company](https://oxide.computer) which currently uses OpenAPI version 3.0.3 for their schema. As such, the types and schema validation are designed for that version of the OpenAPI spec.

**openapi-schema-diff** is a TypeScript library that compares two OpenAPI
schemas and finds breaking changes.

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [compare(sourceSchema, targetSchema)](#comparesourceSchema-targetSchema)
- [License](#license)

<a name="installation"></a>

## Installation

TODO: update

<a name="usage"></a>

## Usage

```javascript
const compareOpenApiSchemas = require("openapi-schema-diff");

const sourceSchema = {
  openapi: "3.0.0",
  info: {
    title: "My API",
    version: "1.0.0",
  },
  paths: {
    "/pets": {
      get: {
        summary: "Returns all pets",
        responses: {
          200: {
            description: "A list of pets.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                      },
                      age: {
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
  },
};

const targetSchema = {
  openapi: "3.0.0",
  info: {
    title: "My API",
    version: "1.0.0",
  },
  paths: {
    "/pets": {
      get: {
        summary: "Returns all pets",
        responses: {
          200: {
            description: "A list of pets.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                      },
                      age: {
                        type: "integer",
                      },
                      breed: {
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
  },
};

const differences = compareOpenApiSchemas(sourceSchema, targetSchema);
assert.deepEqual(differences, {
  isEqual: false,
  sameRoutes: [],
  addedRoutes: [],
  deletedRoutes: [],
  changedRoutes: [
    {
      method: "get",
      path: "/pets",
      sourceSchema: sourceSchema.paths["/pets"].get,
      targetSchema: targetSchema.paths["/pets"].get,
      changes: [
        {
          type: "responseBody",
          statusCode: "200",
          mediaType: "application/json",
          action: "changed",
          sourceSchema:
            sourceSchema.paths["/pets"].get.responses["200"].content[
              "application/json"
            ],
          targetSchema:
            targetSchema.paths["/pets"].get.responses["200"].content[
              "application/json"
            ],
          changes: [
            {
              keyword: "schema",
              changes: [
                {
                  jsonPath: "#/items/properties/breed",
                  source: undefined,
                  target: {
                    type: "string",
                  },
                },
              ],
              comment: "response header schema has been changed",
            },
          ],
          comment:
            'response body for "200" status code and "application/json" media type has been changed in GET "/pets" route',
        },
      ],
    },
  ],
});
```

<a name="api"></a>

## API

<a name="compare-openapi-schemas"></a>

#### compare(sourceSchema, targetSchema)

Compares two OpenAPI schemas and returns and finds breaking changes. Source and
target schemas must have the same OpenAPI major version.

- `sourceSchema` **\<object\>** - source OpenAPI schema.
- `targetSchema` **\<object\>** - target OpenAPI schema.
- **Returns** - an object with schema differences.
  - `isEqual` **\<boolean\>** - `true` if target schema does not have breaking
    changes, `false` otherwise.
  - `sameRoutes` **\<array\>** - an array of routes that are present in both
    schemas and do not have breaking changes. See
    [same route](#same-route-object).
  - `addedRoutes` **\<array\>** - an array of routes that are present in target
    schema but not in source schema. See [added route](#added-route-object).
  - `deletedRoutes` **\<array\>** - an array of routes that are present in
    source schema but not in target schema. See
    [deleted route](#deleted-route-object).
  - `changedRoutes` **\<array\>** - an array of routes that are present in both
    schemas and have breaking changes. See
    [changed route](#changed-route-object).

##### Same route object

- `method` **\<string\>** - HTTP method name of the route.
- `path` **\<string\>** - path of the route.
- `sourceSchema` **\<object\>** - source OpenAPI schema of the route.
- `targetSchema` **\<object\>** - target OpenAPI schema of the route.

##### Added route object

- `method` **\<string\>** - HTTP method name of the route.
- `path` **\<string\>** - path of the route.
- `targetSchema` **\<object\>** - target OpenAPI schema of the route.

##### Deleted route object

- `method` **\<string\>** - HTTP method name of the route.
- `path` **\<string\>** - path of the route.
- `sourceSchema` **\<object\>** - source OpenAPI schema of the route.

##### Changed route object

- `method` **\<string\>** - HTTP method name of the route.
- `path` **\<string\>** - path of the route.
- `sourceSchema` **\<object\>** - source OpenAPI schema of the route.
- `targetSchema` **\<object\>** - target OpenAPI schema of the route.
- `changes` **\<array\>** - a list of route components (header, querystring,
  body, ...) that have breaking changes. See
  [change object](#route-change-object)

##### Route change object

- `type` **\<string\>** - type of the component. One of `parameter`,
  `requestBody`, `responseBody`, `responseHeader`.
- `action` **\<string\>** - action that was performed on the component. One of
  `added`, `deleted`, `changed`.
- `sourceSchema` **\<object\>** - source OpenAPI schema of the component.
- `targetSchema` **\<object\>** - target OpenAPI schema of the component.
- `comment` **\<string\>** - a comment describing the change.
- `changes` **\<array\>** - a list of changes in a component json schema. Exist
  only if `action` equals to `changed`. Each schema keyword has it's own change
  object. See
  [list of change objects](#list-schema-keywords-and-their-change-objects).

Each of the route components has it's own unique properties that identify it.
For more details look at the component change object:
[parameter](#parameter-change-object),
[request body](#request-body-change-object),
[response body](#response-body-change-object),
[response header](#response-header-change-object).

##### Parameter change object

- `type` **\<string\>** - type of the component. Equals to `parameter`.
- `name` **\<string\>** - name of the parameter.
- `in` **\<string\>** - location of the parameter. One of `query`, `header`,
  `path`, `cookie`.
- `schemaChanges` - a list of changes in a component json schema. See
  [schema change object](#schema-change-object).
- `comment` **\<string\>** - a comment describing the change.

##### Request body change object

- `type` **\<string\>** - type of the component. Equals to `requestBody`.
- `mediaType` **\<string\>** - media type of the component.
- `schemaChanges` - a list of changes in a component json schema. See
  [schema change object](#schema-change-object).
- `comment` **\<string\>** - a comment describing the change.

##### Response body change object

- `type` **\<string\>** - type of the component. Equals to `responseBody`.
- `statusCode` **\<string\>** - HTTP status code of the component.
- `mediaType` **\<string\>** - media type of the component.
- `schemaChanges` - a list of changes in a component json schema. See
  [schema change object](#schema-change-object).
- `comment` **\<string\>** - a comment describing the change.

##### Response header change object

- `type` **\<string\>** - type of the component. Equals to `responseHeader`.
- `header` **\<string\>** - name of the header.
- `statusCode` **\<string\>** - HTTP status code of the component.
- `schemaChanges` - a list of changes in a component json schema. See
  [schema change object](#schema-change-object).
- `comment` **\<string\>** - a comment describing the change.

#### List schema keywords and their change objects

- [schema change object](#schema-keyword-change-object)
- [required keyword change object](#required-keyword-change-object)

##### schema keyword change object

- `keyword` **\<string\>** - keyword name. Equals to `schema`.
- `comment` **\<string\>** - a comment describing the change.
- `changes` **\<array\>** - a list of changes in a component json schema.
  - `jsonPath` **\<string\>** - JSON path of the changed schema.
  - `source` **\<object\>** - source subschema placed at the `jsonPath`.
  - `target` **\<object\>** - target subschema placed at the `jsonPath`.

##### required keyword change object

- `keyword` **\<string\>** - keyword name. Equals to `required`.
- `source` **\<boolean\>** - source value of the keyword.
- `target` **\<boolean\>** - target value of the keyword.
- `comment` **\<string\>** - a comment describing the change.

<a name="license"></a>

## License

MIT
