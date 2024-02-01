import { compareObjectKeys } from "./utils.ts";
import type { Object } from "./utils.ts";
import {
  HeaderObject,
  MediaTypeObject,
  Method,
  OpenAPISchema,
  OperationObject,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
} from "./schema.ts";

const HTTP_METHODS: Method[] = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

type JSONObject = { [x: string]: JSONValue };
type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

function recurseJsonTransform(
  value: JSONValue,
  fn: (jv: JSONValue) => JSONValue,
): JSONValue {
  const jv = fn(value);
  if (
    typeof jv === "string" ||
    typeof jv === "number" ||
    typeof jv === "boolean"
  ) {
    return jv;
  }
  if (Array.isArray(jv)) {
    return jv.map((x) => recurseJsonTransform(x, fn));
  }
  for (const key in jv) {
    jv[key] = recurseJsonTransform(jv[key], fn);
  }
  return jv;
}

function isReferenceObject(object: unknown): object is ReferenceObject {
  return typeof object === "object" && object !== null && "$ref" in object;
}

const recurseRef = (schema: JSONObject) => (jv: JSONValue): JSONValue =>
  jv && typeof jv === "object" && !Array.isArray(jv)
    ? resolveRef(jv, schema)
    : jv;

export function resolveRefDeep(jv: JSONValue, schema: JSONObject) {
  return recurseJsonTransform(jv, recurseRef(schema));
}

export function resolveRef<T extends JSONValue>(
  maybeRef: T | ReferenceObject,
  schema: JSONObject,
): T {
  if (isReferenceObject(maybeRef)) {
    const path = maybeRef.$ref.replace(/^#\//, "").split("/");
    const result = path.reduce<JSONObject>((acc, key) => {
      if (!acc || typeof acc !== "object" || Array.isArray(acc)) {
        throw new Error(`invalid ref: ${maybeRef.$ref}`);
      }
      return acc[key] as JSONObject;
    }, schema) as unknown as T;
    return result;
  }
  return maybeRef;
}

const resolveMapRef = (
  maybeRef: Record<string, JSONValue>,
  schema: OpenAPISchema,
) =>
  Object.fromEntries(
    Object.entries(maybeRef).map(([k, v]) => [k, resolveRefDeep(v, schema)]),
  );

interface JsonSchemaChanges {
  jsonPath: string;
  source: unknown;
  target: unknown;
}

function compareJsonSchemas(
  ctx: Ctx,
  sourceSchema: Object,
  targetSchema: Object,
  jsonPath: string,
  derefJsonPath: string,
  changes?: JsonSchemaChanges[],
) {
  changes ??= [];
  if (!sourceSchema && !targetSchema) {
    return changes;
  }

  if (ctx.changesCache[jsonPath]) {
    return ctx.changesCache[jsonPath];
  }
  ctx.changesCache[jsonPath] = changes;

  const { sameKeys, addedKeys, removedKeys } = compareObjectKeys(
    sourceSchema,
    targetSchema,
  );

  for (const key of addedKeys) {
    changes.push({
      jsonPath: derefJsonPath + `/${key}`,
      source: undefined,
      target: targetSchema[key],
    });
  }

  for (const key of removedKeys) {
    changes.push({
      jsonPath: derefJsonPath + `/${key}`,
      source: sourceSchema[key],
      target: undefined,
    });
  }

  for (const key of sameKeys) {
    const sourceValue = sourceSchema[key];
    const targetValue = targetSchema[key];

    if (sourceValue === targetValue) continue;

    if (
      typeof sourceValue === "object" &&
      typeof targetValue === "object" &&
      sourceValue !== null &&
      targetValue !== null
    ) {
      const newJsonPath = key === "$ref" ? jsonPath : jsonPath + `/${key}`;
      const newDerefJsonPath = key === "$ref"
        ? derefJsonPath
        : derefJsonPath + `/${key}`;

      const keyChanges = compareJsonSchemas(
        ctx,
        sourceValue as Object,
        targetValue as Object,
        newJsonPath,
        newDerefJsonPath,
        changes,
      );
      changes.push(...keyChanges);
    } else {
      changes.push({
        jsonPath: derefJsonPath + `/${key}`,
        source: sourceValue,
        target: targetValue,
      });
    }
  }

  return changes;
}

function checkSchemaVersions(
  sourceSchemaVersion: string,
  targetSchemaVersion: string,
) {
  if (sourceSchemaVersion.split(".")[0] !== targetSchemaVersion.split(".")[0]) {
    throw new Error(
      "source and target schemas must have the same major version",
    );
  }
}

function compareParametersObjects(
  ctx: Ctx,
  path: string,
  method: Method,
  sourceParameterObjects?: ParameterObject[],
  targetParameterObjects?: ParameterObject[],
) {
  const changes: ParameterObjectChanges[] = [];

  sourceParameterObjects = sourceParameterObjects || [];
  targetParameterObjects = targetParameterObjects || [];

  for (const targetParameterObject of targetParameterObjects) {
    const targetParameterName = targetParameterObject.name;
    const targetParameterIn = targetParameterObject.in;

    const sourceParameterObject = sourceParameterObjects.find(
      (parameterObject) =>
        parameterObject.name === targetParameterName &&
        parameterObject.in === targetParameterIn,
    );

    if (sourceParameterObject === undefined) {
      changes.push({
        type: "parameter",
        action: "added",
        name: targetParameterName,
        in: targetParameterIn,
        sourceSchema: undefined,
        targetSchema: targetParameterObject,
        comment: `${targetParameterIn} parameter "${targetParameterName}"` +
          ` has been added to ${method.toUpperCase()} "${path}" route`,
      });
      continue;
    }

    const paramChanges: ParameterKeywordChanges[] = [];

    const parametersSchemaChanges = compareJsonSchemas(
      ctx,
      sourceParameterObject.schema,
      targetParameterObject.schema,
      `#/paths${path}/${method}/parameters/${targetParameterName}`,
      "#",
    );

    if (parametersSchemaChanges.length > 0) {
      paramChanges.push({
        keyword: "schema",
        changes: parametersSchemaChanges,
        comment: "parameter schema has been changed",
      });
    }

    if (!sourceParameterObject.required && targetParameterObject.required) {
      paramChanges.push({
        keyword: "required",
        source: sourceParameterObject.required,
        target: targetParameterObject.required,
        comment: "parameter has been made required",
      });
    }

    if (paramChanges.length > 0) {
      changes.push({
        type: "parameter",
        action: "changed",
        name: targetParameterName,
        in: targetParameterIn,
        sourceSchema: sourceParameterObject,
        targetSchema: targetParameterObject,
        changes: paramChanges,
        comment: `${targetParameterIn} parameter "${targetParameterName}"` +
          ` has been changed in ${method.toUpperCase()} "${path}" route`,
      });
    }
  }

  for (const sourceParameterObject of sourceParameterObjects) {
    const sourceParameterName = sourceParameterObject.name;
    const sourceParameterIn = sourceParameterObject.in;

    const targetParameterObject = targetParameterObjects.find(
      (parameterObject) =>
        parameterObject.name === sourceParameterName &&
        parameterObject.in === sourceParameterIn,
    );

    if (targetParameterObject === undefined) {
      changes.push({
        type: "parameter",
        action: "deleted",
        name: sourceParameterName,
        in: sourceParameterIn,
        sourceSchema: sourceParameterObject,
        targetSchema: undefined,
        comment: `${sourceParameterIn} parameter "${sourceParameterName}"` +
          ` has been deleted from ${method.toUpperCase()} "${path}" route`,
      });
      continue;
    }
  }

  return changes;
}

function compareRequestBodyObjects(
  ctx: Ctx,
  path: string,
  method: Method,
  sourceRequestBodyObject?: RequestBodyObject,
  targetRequestBodyObject?: RequestBodyObject,
) {
  const changes: RequestBodyObjectChanges[] = [];

  const sourceRequestBodyContent = sourceRequestBodyObject?.content || {};
  const targetRequestBodyContent = targetRequestBodyObject?.content || {};

  const { sameKeys, addedKeys, removedKeys } = compareObjectKeys(
    sourceRequestBodyContent,
    targetRequestBodyContent,
  );

  for (const mediaType of addedKeys) {
    const requestBodyObject = targetRequestBodyContent[mediaType];
    changes.push({
      type: "requestBody",
      action: "added",
      mediaType,
      sourceSchema: undefined,
      targetSchema: requestBodyObject,
      comment: `request body for "${mediaType}" media type` +
        ` has been added to ${method.toUpperCase()} "${path}" route`,
    });
  }

  for (const mediaType of removedKeys) {
    const requestBodyObject = sourceRequestBodyContent[mediaType];
    changes.push({
      type: "requestBody",
      action: "deleted",
      mediaType,
      sourceSchema: requestBodyObject,
      targetSchema: undefined,
      comment: `request body for "${mediaType}" media type` +
        ` has been deleted from ${method.toUpperCase()} "${path}" route`,
    });
  }

  for (const mediaType of sameKeys) {
    const sourceMediaType = sourceRequestBodyContent[mediaType];
    const targetMediaType = targetRequestBodyContent[mediaType];

    const requestBodyChanges: RequestBodyKeywordChanges[] = [];

    const requestBodySchemaChanges = compareJsonSchemas(
      ctx,
      sourceMediaType.schema ?? {},
      targetMediaType.schema ?? {},
      `#/paths${path}/${method}/requestBody/content/${mediaType}`,
      "#",
    );

    if (requestBodySchemaChanges.length > 0) {
      requestBodyChanges.push({
        keyword: "schema",
        changes: requestBodySchemaChanges,
        comment: "request body schema has been changed",
      });
    }

    if (
      !sourceRequestBodyObject?.required &&
      targetRequestBodyObject?.required
    ) {
      requestBodyChanges.push({
        keyword: "required",
        source: false,
        target: true,
        comment: "request body has been made required",
      });
    }

    if (
      sourceRequestBodyObject?.required &&
      !targetRequestBodyObject?.required
    ) {
      requestBodyChanges.push({
        keyword: "required",
        source: true,
        target: false,
        comment: "request body has been made optional",
      });
    }

    if (requestBodyChanges.length > 0) {
      changes.push({
        type: "requestBody",
        action: "changed",
        mediaType,
        sourceSchema: sourceMediaType,
        targetSchema: targetMediaType,
        changes: requestBodyChanges,
        comment: `request body for "${mediaType}" media type` +
          ` has been changed in ${method.toUpperCase()} "${path}" route`,
      });
    }
  }

  return changes;
}

function compareResponseObjects(
  ctx: Ctx,
  path: string,
  method: Method,
  sourceResponseObjects: Record<string, ResponseObject>,
  targetResponseObjects: Record<string, ResponseObject>,
) {
  const changes: ResponseObjectChanges[] = [];

  if (sourceResponseObjects == null && targetResponseObjects == null) {
    return [];
  }

  for (const statusCode of Object.keys(targetResponseObjects || {})) {
    const targetResponseObject = targetResponseObjects[statusCode];
    const sourceResponseObject = sourceResponseObjects?.[statusCode];

    for (const header of Object.keys(targetResponseObject.headers || {})) {
      const targetHeaderObject = targetResponseObject.headers![header];
      const sourceHeaderObject = sourceResponseObject?.headers?.[header];

      if (!sourceHeaderObject) {
        changes.push({
          type: "responseHeader",
          action: "added",
          statusCode,
          header,
          sourceSchema: undefined,
          targetSchema: targetHeaderObject,
          comment: `response header for "${statusCode}" status code` +
            ` has been added to ${method.toUpperCase()} "${path}" route`,
        });
        continue;
      }

      const headerObjectChanges: ResponseHeaderKeywordChanges[] = [];

      const headerObjectSchemaChanges = compareJsonSchemas(
        ctx,
        resolveRef(sourceHeaderObject, ctx.sourceSchema).schema,
        resolveRef(targetHeaderObject, ctx.targetSchema).schema,
        `#/paths${path}/${method}/responses/${statusCode}/headers/${header}`,
        "#",
      );

      if (headerObjectSchemaChanges.length > 0) {
        headerObjectChanges.push({
          keyword: "schema",
          changes: headerObjectSchemaChanges,
          comment: "response header schema has been changed",
        });
      }

      if (headerObjectChanges.length > 0) {
        changes.push({
          type: "responseHeader",
          action: "changed",
          statusCode,
          header,
          sourceSchema: sourceHeaderObject,
          targetSchema: targetHeaderObject,
          changes: headerObjectChanges,
          comment: `response header for "${statusCode}" status code` +
            ` has been changed in ${method.toUpperCase()} "${path}" route`,
        });
      }
    }

    for (const mediaType of Object.keys(targetResponseObject.content || {})) {
      const targetMediaTypeObject = targetResponseObject.content![mediaType];
      const sourceMediaTypeObject = sourceResponseObject?.content?.[mediaType];

      if (!sourceMediaTypeObject) {
        changes.push({
          type: "responseBody",
          action: "added",
          statusCode,
          mediaType,
          sourceSchema: undefined,
          targetSchema: targetMediaTypeObject,
          comment:
            `response body for "${statusCode}" status code and "${mediaType}" media type` +
            ` has been added to ${method.toUpperCase()} "${path}" route`,
        });
        continue;
      }

      const responseBodyChanges: ResponseBodyKeywordChanges[] = [];

      const mediaTypeSchemaChanges = compareJsonSchemas(
        ctx,
        sourceMediaTypeObject.schema ?? {},
        targetMediaTypeObject.schema ?? {},
        `#/paths${path}/${method}/responses/${statusCode}/content/${mediaType}`,
        "#",
      );

      if (mediaTypeSchemaChanges.length > 0) {
        responseBodyChanges.push({
          keyword: "schema",
          changes: mediaTypeSchemaChanges,
          comment: "response body schema has been changed",
        });
      }

      if (responseBodyChanges.length > 0) {
        changes.push({
          type: "responseBody",
          action: "changed",
          statusCode,
          mediaType,
          sourceSchema: sourceMediaTypeObject,
          targetSchema: targetMediaTypeObject,
          changes: responseBodyChanges,
          comment:
            `response body for "${statusCode}" status code and "${mediaType}" media type` +
            ` has been changed in ${method.toUpperCase()} "${path}" route`,
        });
      }
    }
  }

  for (const statusCode of Object.keys(sourceResponseObjects || {})) {
    const sourceResponseObject = sourceResponseObjects[statusCode];
    const targetResponseObject = targetResponseObjects?.[statusCode];

    for (const header of Object.keys(sourceResponseObject.headers || {})) {
      const sourceHeaderObject = sourceResponseObject.headers![header];
      const targetHeaderObject = targetResponseObject?.headers?.[header];

      if (!targetHeaderObject) {
        changes.push({
          type: "responseHeader",
          action: "deleted",
          statusCode,
          header,
          sourceSchema: sourceHeaderObject,
          targetSchema: undefined,
          comment: `response header for "${statusCode}" status code` +
            ` has been deleted from ${method.toUpperCase()} "${path}" route`,
        });
        continue;
      }
    }

    for (const mediaType of Object.keys(sourceResponseObject.content || {})) {
      const sourceMediaTypeObject = sourceResponseObject.content![mediaType];
      const targetMediaTypeObject = targetResponseObject?.content?.[mediaType];

      if (!targetMediaTypeObject) {
        changes.push({
          type: "responseBody",
          action: "deleted",
          statusCode,
          mediaType,
          sourceSchema: sourceMediaTypeObject,
          targetSchema: undefined,
          comment:
            `response body for "${statusCode}" status code and "${mediaType}" media type` +
            ` has been deleted from ${method.toUpperCase()} "${path}" route`,
        });
        continue;
      }
    }
  }

  return changes;
}

function compareOperationObjects(
  ctx: Ctx,
  path: string,
  method: Method,
  sourceOperationObject?: OperationObject,
  targetOperationObject?: OperationObject,
) {
  const parameterObjectsChanges = compareParametersObjects(
    ctx,
    path,
    method,
    sourceOperationObject?.parameters?.map((p) =>
      resolveRef(p, ctx.sourceSchema)
    ),
    targetOperationObject?.parameters?.map((p) =>
      resolveRef(p, ctx.targetSchema)
    ),
  );

  const requestBodyObjectsChanges = compareRequestBodyObjects(
    ctx,
    path,
    method,
    sourceOperationObject?.requestBody,
    targetOperationObject?.requestBody,
  );

  const responseObjectsChanges = compareResponseObjects(
    ctx,
    path,
    method,
    resolveMapRef(
      sourceOperationObject?.responses || {},
      ctx.sourceSchema,
    ) as Record<string, ResponseObject>,
    resolveMapRef(
      targetOperationObject?.responses || {},
      ctx.targetSchema,
    ) as Record<string, ResponseObject>,
  );

  if (
    parameterObjectsChanges.length === 0 &&
    requestBodyObjectsChanges.length === 0 &&
    responseObjectsChanges.length === 0
  ) {
    ctx.sameOperations.push({
      method,
      path,
      sourceSchema: sourceOperationObject!,
      targetSchema: targetOperationObject!,
    });
    return;
  }

  ctx.changedOperations.push({
    method,
    path,
    sourceSchema: sourceOperationObject!,
    targetSchema: targetOperationObject!,
    changes: [
      ...parameterObjectsChanges,
      ...requestBodyObjectsChanges,
      ...responseObjectsChanges,
    ],
  });
}

function comparePathObjects(
  ctx: Ctx,
  path: string,
  sourcePathObject: PathItemObject,
  targetPathObject: PathItemObject,
) {
  const { sameKeys, addedKeys, removedKeys } = compareObjectKeys(
    sourcePathObject,
    targetPathObject,
  );

  for (const method of addedKeys as Method[]) {
    if (!HTTP_METHODS.includes(method)) continue;
    const targetOperationObject = targetPathObject[method];
    targetOperationObject &&
      ctx.addedOperations.push({
        method,
        path,
        targetSchema: targetOperationObject,
      });
  }

  for (const method of removedKeys as Method[]) {
    if (!HTTP_METHODS.includes(method)) continue;
    const sourceOperationObject = sourcePathObject[method];
    sourceOperationObject &&
      ctx.deletedOperations.push({
        method,
        path,
        sourceSchema: sourceOperationObject,
      });
  }

  for (const method of sameKeys as Method[]) {
    if (!HTTP_METHODS.includes(method)) continue;
    const sourceOperationObject = sourcePathObject[method];
    const targetOperationObject = targetPathObject[method];
    compareOperationObjects(
      ctx,
      path,
      method,
      sourceOperationObject,
      targetOperationObject,
    );
  }
}

function comparePathsObjects(
  ctx: Ctx,
  sourcePathsObjects: OpenAPISchema["paths"],
  targetPathsObjects: OpenAPISchema["paths"],
) {
  const { sameKeys, addedKeys, removedKeys } = compareObjectKeys(
    sourcePathsObjects,
    targetPathsObjects,
  );

  for (const path of addedKeys) {
    const pathSchema = targetPathsObjects[path];
    for (const method of Object.keys(pathSchema) as Method[]) {
      if (!HTTP_METHODS.includes(method)) continue;
      const operationSchema = pathSchema[method];
      ctx.addedOperations.push({
        method,
        path,
        targetSchema: operationSchema!,
      });
    }
  }

  for (const path of removedKeys) {
    const pathSchema = sourcePathsObjects[path];
    for (const method of Object.keys(pathSchema) as Method[]) {
      if (!HTTP_METHODS.includes(method)) continue;
      const operationSchema = pathSchema[method];
      ctx.deletedOperations.push({
        method,
        path,
        sourceSchema: operationSchema!,
      });
    }
  }

  for (const path of sameKeys) {
    const sourcePathObject = sourcePathsObjects[path];
    const targetPathObject = targetPathsObjects[path];
    comparePathObjects(ctx, path, sourcePathObject, targetPathObject);
  }
}

type ParameterKeywordChanges =
  | {
    keyword: "schema";
    changes: JsonSchemaChanges[];
    comment: string;
  }
  | {
    keyword: "required";
    source: boolean | undefined;
    target: boolean | undefined;
    comment: string;
  };
type ParameterObjectChanges =
  | {
    type: "parameter";
    action: "added";
    name: string;
    in: ParameterObject["in"];
    sourceSchema: undefined;
    targetSchema: ParameterObject;
    comment: string;
  }
  | {
    type: "parameter";
    action: "added";
    name: string;
    in: ParameterObject["in"];
    sourceSchema: undefined;
    targetSchema: ParameterObject;
    comment: string;
  }
  | {
    type: "parameter";
    action: "changed";
    name: string;
    in: ParameterObject["in"];
    sourceSchema: ParameterObject;
    targetSchema: ParameterObject;
    changes: ParameterKeywordChanges[];
    comment: string;
  }
  | {
    type: "parameter";
    action: "deleted";
    name: string;
    in: ParameterObject["in"];
    sourceSchema: ParameterObject;
    targetSchema: undefined;
    comment: string;
  };

type RequestBodyKeywordChanges =
  | {
    keyword: "schema";
    changes: JsonSchemaChanges[];
    comment: string;
  }
  | {
    keyword: "required";
    source?: boolean;
    target?: boolean;
    comment: string;
  };

type RequestBodyObjectChanges =
  | {
    type: "requestBody";
    action: "added";
    mediaType: string;
    sourceSchema: undefined;
    targetSchema: MediaTypeObject;
    comment: string;
  }
  | {
    type: "requestBody";
    action: "changed";
    mediaType: string;
    sourceSchema: MediaTypeObject;
    targetSchema: MediaTypeObject;
    changes: RequestBodyKeywordChanges[];
    comment: string;
  }
  | {
    type: "requestBody";
    action: "deleted";
    mediaType: string;
    sourceSchema: MediaTypeObject;
    targetSchema: undefined;
    comment: string;
  };

type ResponseHeaders = string | HeaderObject | ReferenceObject;
type ResponseHeaderKeywordChanges = {
  keyword: "schema";
  changes: JsonSchemaChanges[];
  comment: string;
};
type ResponseBodyKeywordChanges = {
  keyword: "schema";
  changes: JsonSchemaChanges[];
  comment: string;
};
type ResponseObjectChanges =
  | {
    type: "responseHeader";
    action: "added";
    statusCode: string;
    header: string;
    sourceSchema: undefined;
    targetSchema: ResponseHeaders;
    comment: string;
  }
  | {
    type: "responseHeader";
    action: "changed";
    statusCode: string;
    header: string;
    sourceSchema: ResponseHeaders;
    targetSchema: ResponseHeaders;
    changes: ResponseHeaderKeywordChanges[];
    comment: string;
  }
  | {
    type: "responseHeader";
    action: "deleted";
    statusCode: string;
    header: string;
    sourceSchema: ResponseHeaders;
    targetSchema: undefined;
    comment: string;
  }
  | {
    type: "responseBody";
    action: "added";
    statusCode: string;
    mediaType: string;
    sourceSchema: undefined;
    targetSchema: MediaTypeObject;
    comment: string;
  }
  | {
    type: "responseBody";
    action: "changed";
    statusCode: string;
    mediaType: string;
    sourceSchema: MediaTypeObject;
    targetSchema: MediaTypeObject;
    changes: ResponseBodyKeywordChanges[];
    comment: string;
  }
  | {
    type: "responseBody";
    action: "deleted";
    statusCode: string;
    mediaType: string;
    sourceSchema: MediaTypeObject;
    targetSchema: undefined;
    comment: string;
  };

interface Ctx {
  sourceSchema: OpenAPISchema;
  targetSchema: OpenAPISchema;
  changesCache: Record<string, JsonSchemaChanges[]>;
  sameOperations: {
    method: Method;
    path: string;
    sourceSchema: OperationObject;
    targetSchema: OperationObject;
  }[];
  addedOperations: {
    method: Method;
    path: string;
    targetSchema: OperationObject;
  }[];
  deletedOperations: {
    method: Method;
    path: string;
    sourceSchema: OperationObject;
  }[];
  changedOperations: {
    method: Method;
    path: string;
    sourceSchema: OperationObject;
    targetSchema: OperationObject;
    changes: Array<
      ParameterObjectChanges | RequestBodyObjectChanges | ResponseObjectChanges
    >;
  }[];
}

export type SchemaDiff = ReturnType<typeof compareOpenApiSchemas>;
export function compareOpenApiSchemas(
  sourceSchema: string | object,
  targetSchema: string | object,
) {
  sourceSchema = typeof sourceSchema === "string"
    ? JSON.parse(sourceSchema)
    : sourceSchema;
  targetSchema = typeof targetSchema === "string"
    ? JSON.parse(targetSchema)
    : targetSchema;

  const sourceParsedSchema = OpenAPISchema.passthrough().parse(sourceSchema);
  const targetParsedSchema = OpenAPISchema.passthrough().parse(targetSchema);

  checkSchemaVersions(sourceParsedSchema.openapi, targetParsedSchema.openapi);

  const ctx: Ctx = {
    sourceSchema: sourceParsedSchema,
    targetSchema: targetParsedSchema,
    changesCache: {},
    sameOperations: [],
    addedOperations: [],
    deletedOperations: [],
    changedOperations: [],
  };

  comparePathsObjects(
    ctx,
    resolveRefDeep(
      sourceParsedSchema.paths,
      sourceParsedSchema as JSONObject,
    ) as Record<string, PathItemObject>,
    resolveRefDeep(
      targetParsedSchema.paths,
      targetParsedSchema as JSONObject,
    ) as Record<string, PathItemObject>,
  );

  const isEqual = ctx.addedOperations.length === 0 &&
    ctx.deletedOperations.length === 0 &&
    ctx.changedOperations.length === 0;

  return {
    isEqual,
    sameRoutes: ctx.sameOperations,
    addedRoutes: ctx.addedOperations,
    deletedRoutes: ctx.deletedOperations,
    changedRoutes: ctx.changedOperations,
  };
}
