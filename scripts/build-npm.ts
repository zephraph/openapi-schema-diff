import { build, emptyDir } from "https://deno.land/x/dnt@0.39.0/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./src/main.ts"],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "@zephraph/openapi-diff",
    version: Deno.args[0],
    description: "Finds changes between two OpenAPI schemas.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/zephraph/openapi-schema-diff.git",
    },
    bugs: {
      url: "https://github.com/zephraph/openapi-schema-diff/issues",
    },
    keywords: ["openapi", "schema", "diff", "json"],
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
