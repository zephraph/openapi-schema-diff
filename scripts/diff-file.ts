#! /usr/bin/env deno run --allow-env --allow-read --allow-run=/usr/bin/git
import $ from "https://deno.land/x/dax@0.37.1/mod.ts";
import { compareOpenApiSchemas } from "../src/main.ts";
import { Result } from "../src/utils.ts";
import { match } from "npm:ts-pattern";
import { SchemaDiff } from "../src/main.ts";
import { outdent } from "https://deno.land/x/outdent@v0.8.0/mod.ts";
import { dirname, relative } from "https://deno.land/std@0.213.0/path/mod.ts";

const schemaFile: string = Deno.args[0];
const schemaDir = dirname(schemaFile);

const repoDir = await $`git rev-parse --show-toplevel`.cwd(schemaDir).text();
const relativeFilePath = relative(repoDir, schemaFile);

const calculatePadding = (strings: string[]) => {
  const longestLength = strings.reduce(
    (acc, s) => (s.length > acc ? s.length : acc),
    0,
  );
  return longestLength + 1;
};

const getFileHistory = (file: string) =>
  Result.fromPromise(
    $`git log --oneline --pretty='format:%H||%ct||%s' --follow -- ${file}`
      .cwd(repoDir)
      .lines(),
  );

const checkIfFileChangedInCommit = (file: string, commit: string) =>
  $`git diff-tree --no-commit-id --name-only -r ${commit} -- ${file}`
    .cwd(repoDir)
    .quiet("stderr")
    .text()
    .then((d) => (d ? true : false));

const showFileAtCommit = (file: string, commit: string) => {
  return $`git show ${commit}:${file}`.cwd(repoDir).quiet("stderr").text();
};

const commitLog = match(await getFileHistory(relativeFilePath))
  .with({ type: "ok" }, ({ data }) => data)
  .with({ type: "error" }, ({ error }) => {
    throw error;
  })
  .exhaustive();

interface Commit {
  hash: string;
  pr?: string;
  message: string;
  date: string;
}
const commits: Commit[] = commitLog.map((commit) => {
  let [hash, date, message] = commit.split("||", 3);
  const pr = commit.match(/\(#[0-9]+\)$/g)?.[0];
  message = message.replace(pr ?? "", "").trim();

  return { hash, pr: pr?.slice(2, -1), message, date };
});

const printDiff = (commit: Commit, diff: SchemaDiff) => {
  const totalRoutes = diff.sameRoutes.length +
    diff.addedRoutes.length +
    diff.changedRoutes.length;

  console.log(
    outdent.string(`

    ## ${
      new Date(parseInt(commit.date) * 1000).toISOString().split("T")[0]
    } ${commit.message} [(#${commit.pr})](https://github.com/oxidecomputer/omicron/pull/${commit.pr})

    _commit hash: ${commit.hash}_

    ${totalRoutes} total, ${diff.addedRoutes.length} added, ${diff.deletedRoutes.length} removed, ${diff.changedRoutes.length} changed\n
  `),
  );

  if (diff.addedRoutes.length > 0) {
    const padding = calculatePadding(diff.addedRoutes.map((r) => r.method));
    console.log("### Added Routes");

    console.log(
      diff.addedRoutes
        .map((r) => `- ${r.method.toUpperCase().padEnd(padding)} ${r.path}`)
        .join("\n"),
    );
  }

  if (diff.deletedRoutes.length > 0) {
    const padding = calculatePadding(diff.deletedRoutes.map((r) => r.method));
    console.log("### Deleted Routes\n");

    console.log(
      diff.deletedRoutes
        .map((r) => `- ${r.method.toUpperCase().padEnd(padding)} ${r.path}`)
        .join("\n"),
    );
  }

  if (diff.changedRoutes.length > 0) {
    const padding = calculatePadding(diff.changedRoutes.map((r) => r.method));
    console.log("### Changed Routes\n");

    console.log(
      diff.changedRoutes
        .map((r) => `- ${r.method.toUpperCase().padEnd(padding)}\t ${r.path}`)
        .join("\n"),
    );
  }
};

console.log(`# Changelog`);

let previousCommit = null;
for (const commit of commits) {
  const fileChanged = await checkIfFileChangedInCommit(
    relativeFilePath,
    commit.hash,
  );

  if (!fileChanged) {
    continue;
  }

  if (!previousCommit) {
    previousCommit = commit;
    continue;
  }

  const newApi = await showFileAtCommit(relativeFilePath, commit.hash);
  const oldApi = await showFileAtCommit(relativeFilePath, previousCommit.hash);

  const diff = Result.from(() =>
    compareOpenApiSchemas(JSON.parse(newApi), JSON.parse(oldApi))
  );

  if (diff.isOk()) {
    printDiff(previousCommit, diff.unwrap());
  }

  previousCommit = commit;
}
