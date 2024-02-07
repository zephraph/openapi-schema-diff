import type {
  HeaderObject,
  MediaTypeObject,
  Method,
  OpenAPISchema,
  OperationObject,
  ParameterObject,
  ReferenceObject,
} from "./schema.ts";

export interface JsonSchemaChanges {
  jsonPath: string;
  source: unknown;
  target: unknown;
}

export type ParameterObjectChanges =
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

export type ParameterKeywordChanges =
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

export type RequestBodyKeywordChanges =
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

export type RequestBodyObjectChanges =
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

export type ResponseHeaders = string | HeaderObject | ReferenceObject;
export type ResponseHeaderKeywordChanges = {
  keyword: "schema";
  changes: JsonSchemaChanges[];
  comment: string;
};

export type ResponseBodyKeywordChanges = {
  keyword: "schema";
  changes: JsonSchemaChanges[];
  comment: string;
};

export type ResponseObjectChanges =
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

export interface Ctx {
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
