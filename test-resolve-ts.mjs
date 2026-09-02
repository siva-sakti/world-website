// TEST-ONLY module resolver. Not part of the app build; nothing in src/ imports it.
//
// Node's built-in TypeScript support needs an explicit file extension, but source
// files import their neighbours the normal way (`./act-rules`). Until this existed,
// a module could only be tested if it had NO runtime imports at all — which is why
// the four tested files were all import-free, and why the board's most dangerous
// code had no coverage.
//
// This teaches the test runner one thing: a relative import with no extension may
// mean the .ts file sitting next to it. App resolution is untouched.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[mc]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of [".ts", ".tsx"]) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) {
          return { url: candidate.href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
