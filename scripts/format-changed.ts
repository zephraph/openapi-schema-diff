#!/usr/bin/env deno run --allow-env --allow-read --allow-run
import $ from "https://deno.land/x/dax@0.37.1/mod.ts";

const filesChanged = (await $`git diff --cached --name-only`.lines()).filter(
  Boolean,
);

if (filesChanged.length > 0) {
  await $`deno fmt ${filesChanged}`;
  await $`git add ${filesChanged}`;
}
