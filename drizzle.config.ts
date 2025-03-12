import * as fs from "node:fs";
import type { Config } from "drizzle-kit";
import * as path from "node:path";

const localD1DB = getLocalD1DB();
console.log("localD1DB", localD1DB);
if (!localD1DB) {
  process.exit(1);
}

const config: Config = {
  schema: "./src/db/schema",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: localD1DB,
  },
};

export default config;
function getLocalD1DB() {
  try {
    const basePath = path.resolve(".wrangler");
    const files = fs
      .readdirSync(basePath, { encoding: "utf-8", recursive: true })
      .filter((f) => f.endsWith(".sqlite"));

    // In case there are multiple .sqlite files, we want the most recent one.
    files.sort((a, b) => {
      const statA = fs.statSync(path.join(basePath, a));
      const statB = fs.statSync(path.join(basePath, b));
      return statB.mtime.getTime() - statA.mtime.getTime();
    });
    const dbFile = files[0];

    if (!dbFile) {
      throw new Error(`.sqlite file not found in ${basePath}`);
    }

    const url = path.resolve(basePath, dbFile);
    console.debug(`Resolved local D1 DB: ${url}`);
    return url;
  } catch (err) {
    if (err instanceof Error) {
      console.log(`Error resolving local D1 DB: ${err.message}`);
    } else {
      console.log(`Error resolving local D1 DB: ${err}`);
    }
  }
}
