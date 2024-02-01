import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export type Method = z.infer<typeof Method>;
export const Method = z.enum([
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]);

export const ExternalDocumentationObject = z.object({
  description: z.string().optional(),
  url: z.string(),
});

export const TagObject = z.object({
  name: z.string(),
  description: z.string().optional(),
  externalDocs: ExternalDocumentationObject.optional(),
});

export const DescriminatorObject = z.object({
  propertyName: z.string(),
  mapping: z.record(z.string()),
});

export type ReferenceObject = z.infer<typeof ReferenceObject>;
export const ReferenceObject = z.object({
  $ref: z.string(),
});

const baseSchemaObject = z.object({
  title: z.string().optional(),
  multipleOf: z.number().optional(),
  maximum: z.number().optional(),
  exclusiveMaximum: z.number().optional(),
  minimum: z.number().optional(),
  exclusiveMinimum: z.number().optional(),
  maxLength: z.number().optional(),
  minLength: z.number().optional(),
  pattern: z.string().optional(),
  maxItems: z.number().optional(),
  minItems: z.number().optional(),
  uniqueItems: z.boolean().optional(),
  maxProperties: z.number().optional(),
  minProperties: z.number().optional(),
  required: z.array(z.string()).optional(),
  enum: z.array(z.any()).optional(),
  type: z
    .enum(["array", "boolean", "integer", "number", "object", "string"])
    .optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  default: z.any().optional(),
  nullable: z.boolean().optional(),
  discriminator: DescriminatorObject.optional(),
  readOnly: z.boolean().optional(),
  writeOnly: z.boolean().optional(),
  xml: z.any().optional(),
  externalDocs: ExternalDocumentationObject.optional(),
  example: z.any().optional(),
  deprecated: z.boolean().optional(),
});

type SchemaObject = z.infer<typeof baseSchemaObject> & {
  allOf?: Array<SchemaObject | ReferenceObject>;
  oneOf?: Array<SchemaObject | ReferenceObject>;
  anyOf?: Array<SchemaObject | ReferenceObject>;
  not?: SchemaObject | ReferenceObject;
  items?: SchemaObject | ReferenceObject;
  properties?: Record<string, SchemaObject | ReferenceObject>;
  additionalProperties?: boolean | SchemaObject | ReferenceObject;
};

export const SchemaObject: z.ZodType<SchemaObject> = baseSchemaObject.extend({
  allOf: z
    .lazy(() => z.array(z.union([SchemaObject, ReferenceObject])))
    .optional(),
  oneOf: z
    .lazy(() => z.array(z.union([SchemaObject, ReferenceObject])))
    .optional(),
  anyOf: z
    .lazy(() => z.array(z.union([SchemaObject, ReferenceObject])))
    .optional(),
  not: z.lazy(() => z.union([SchemaObject, ReferenceObject])).optional(),
  items: z.lazy(() => z.union([SchemaObject, ReferenceObject])).optional(),
  properties: z
    .lazy(() => z.record(z.union([SchemaObject, ReferenceObject])))
    .optional(),
  additionalProperties: z
    .lazy(() => z.union([z.boolean(), SchemaObject, ReferenceObject]))
    .optional(),
});

export type MediaTypeObject = z.infer<typeof MediaTypeObject>;
export const MediaTypeObject = z.object({
  schema: z.union([SchemaObject, ReferenceObject]).optional(),
  example: z.any().optional(),
  examples: z.any().optional(),
  encoding: z.any().optional(),
});

const baseParameterObject = z.object({
  description: z.string().optional(),
  required: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  allowEmptyValue: z.boolean().optional(),
  style: z
    .enum([
      "matrix",
      "label",
      "form",
      "simple",
      "spaceDelimited",
      "pipeDelimited",
      "deepObject",
    ])
    .optional(),
  explode: z.boolean().optional(),
  allowReserved: z.boolean().optional(),
  schema: z.union([SchemaObject, ReferenceObject]),
  example: z.any().optional(),
  examples: z.any().optional(),
  content: z.record(MediaTypeObject).optional(),
});

export type ParameterObject = z.infer<typeof baseParameterObject> & {
  name: string;
  in: "query" | "header" | "path" | "cookie";
};

export const ParameterObject: z.ZodType<ParameterObject> = baseParameterObject
  .extend({
    name: z.string(),
    in: z.enum(["query", "header", "path", "cookie"]),
  });

export type HeaderObject = z.infer<typeof HeaderObject>;
export const HeaderObject = baseParameterObject;

export type RequestBodyObject = z.infer<typeof RequestBodyObject>;
export const RequestBodyObject = z.object({
  description: z.string().optional(),
  content: z.record(MediaTypeObject),
  required: z.boolean().optional(),
});

export type ResponseObject = z.infer<typeof ResponseObject>;
export const ResponseObject = z.object({
  description: z.string().optional(),
  headers: z.record(z.union([HeaderObject, ReferenceObject])).optional(),
  content: z.record(MediaTypeObject).optional(),
  links: z.record(z.any()).optional(),
});

export type OperationObject = z.infer<typeof OperationObject>;
export const OperationObject = z.object({
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  externalDocs: ExternalDocumentationObject.optional(),
  operationId: z.string().optional(),
  parameters: z.array(z.union([ParameterObject, ReferenceObject])).optional(),
  requestBody: RequestBodyObject.optional(),
  responses: z.record(z.union([ResponseObject, ReferenceObject])),
  callbacks: z.any().optional(),
  deprecated: z.boolean().optional(),
  security: z.array(z.any()).optional(),
  servers: z.array(z.any()).optional(),
});

export type PathItemObject = z.infer<typeof PathItemObject>;
export const PathItemObject = z.object({
  $ref: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  get: OperationObject.optional(),
  put: OperationObject.optional(),
  post: OperationObject.optional(),
  delete: OperationObject.optional(),
  options: OperationObject.optional(),
  head: OperationObject.optional(),
  patch: OperationObject.optional(),
  trace: OperationObject.optional(),
});

export const ComponentsObject = z.object({
  schemas: z.record(z.union([SchemaObject, ReferenceObject])).optional(),
  responses: z.record(z.union([ResponseObject, ReferenceObject])).optional(),
  parameters: z.record(z.union([ParameterObject, ReferenceObject])).optional(),
  examples: z.record(z.any()).optional(),
  requestBodies: z
    .record(z.union([RequestBodyObject, ReferenceObject]))
    .optional(),
  headers: z.record(z.union([HeaderObject, ReferenceObject])).optional(),
  securitySchemes: z.record(z.any()).optional(),
  links: z.record(z.any()).optional(),
  callbacks: z.record(z.any()).optional(),
});

export type OpenAPISchema = z.infer<typeof OpenAPISchema>;
export const OpenAPISchema = z.object({
  openapi: z.string(),
  info: z.object({
    title: z.string(),
    dscription: z.string().optional(),
    termsOfService: z.string().optional(),
    contact: z
      .object({
        name: z.string().optional(),
        url: z.string().url().optional(),
        email: z.string().email().optional(),
      })
      .optional(),
    version: z.string(),
  }),
  paths: z.record(PathItemObject),
  components: ComponentsObject.optional(),
  tags: z.array(TagObject).optional(),
});
