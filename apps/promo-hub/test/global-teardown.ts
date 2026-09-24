import { readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Removes the per-test database copies and the template.
export default function globalTeardown(): void {
  for (const file of readdirSync(tmpdir())) {
    if (file.startsWith("promo-hub-test-")) {
      rmSync(join(tmpdir(), file), { force: true });
    }
  }
}
