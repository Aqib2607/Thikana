import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import ts from "typescript";
import bn from "@/locales/bn.json";
import en from "@/locales/en.json";

function resolveKey(obj: Record<string, unknown>, pathStr: string): unknown {
  return pathStr.split(".").reduce((o: unknown, part: string) => {
    return o && typeof o === "object" ? (o as Record<string, unknown>)[part] : undefined;
  }, obj);
}

function scanFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      // Intended production directories: components, routes, hooks, lib
      // Exclude tests, build output, dependencies
      if (
        f.name !== "node_modules" &&
        f.name !== "test" &&
        f.name !== "dist" &&
        f.name !== ".output" &&
        f.name !== ".tanstack" &&
        f.name !== ".wrangler" &&
        f.name !== "locales"
      ) {
        scanFiles(full, fileList);
      }
    } else if (
      f.isFile() &&
      (f.name.endsWith(".tsx") || f.name.endsWith(".ts")) &&
      !f.name.endsWith(".d.ts")
    ) {
      fileList.push(full);
    }
  }
  return fileList;
}

interface StaticMissingKey {
  key: string;
  file: string;
  line: number;
  reason: string;
}

interface UnsupportedAlias {
  identifier: string;
  file: string;
  line: number;
  description: string;
}

interface UnresolvedDynamic {
  expression: string;
  file: string;
  line: number;
  reason: string;
}

describe("Localization Integrity AST Scanner", () => {
  const srcDir = path.resolve(__dirname, "..");
  const allFiles = scanFiles(srcDir);

  it("ensures scanner coverage spans all production directories and includes all relevant files", () => {
    const relativePaths = allFiles.map((f) => path.relative(srcDir, f).replace(/\\/g, "/"));
    expect(relativePaths.some((p) => p.startsWith("components/"))).toBe(true);
    expect(relativePaths.some((p) => p.startsWith("routes/"))).toBe(true);
    expect(relativePaths.some((p) => p.startsWith("hooks/"))).toBe(true);
    expect(relativePaths.some((p) => p.startsWith("lib/"))).toBe(true);
    expect(relativePaths.some((p) => p.startsWith("test/"))).toBe(false);
  });

  it("detects and rejects unsupported translation function aliases across all source files", () => {
    const unsupportedAliases: UnsupportedAlias[] = [];

    for (const file of allFiles) {
      const code = fs.readFileSync(file, "utf8");
      const sourceFile = ts.createSourceFile(
        file,
        code,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      function visit(node: ts.Node) {
        // Detect: const tr = t; const translate = i18n.t;
        if (ts.isVariableDeclaration(node) && node.initializer) {
          const initText = node.initializer.getText(sourceFile);
          if (initText === "t" || initText === "i18n.t") {
            const relFile = path.relative(srcDir, file).replace(/\\/g, "/");
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            unsupportedAliases.push({
              identifier: node.name.getText(sourceFile),
              file: relFile,
              line: line + 1,
              description: `Aliasing translation function "${initText}" to "${node.name.getText(sourceFile)}" is unsupported.`,
            });
          }
        }
        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
    }

    expect(unsupportedAliases, "Unsupported translation aliases detected").toEqual([]);
  });

  it("verifies 100% of referenced static keys resolve to non-empty strings in bn.json and en.json", () => {
    const staticMissingBn: StaticMissingKey[] = [];
    const staticMissingEn: StaticMissingKey[] = [];

    for (const file of allFiles) {
      const code = fs.readFileSync(file, "utf8");
      const sourceFile = ts.createSourceFile(
        file,
        code,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      function visit(node: ts.Node) {
        if (ts.isCallExpression(node)) {
          let isCall = false;
          if (ts.isIdentifier(node.expression) && node.expression.text === "t") {
            isCall = true;
          } else if (
            ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression) &&
            node.expression.expression.text === "i18n" &&
            node.expression.name.text === "t"
          ) {
            isCall = true;
          }

          if (isCall && node.arguments.length > 0) {
            const firstArg = node.arguments[0]!;
            const relFile = path.relative(srcDir, file).replace(/\\/g, "/");
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

            if (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg)) {
              const key = firstArg.text;
              const bnVal = resolveKey(bn as Record<string, unknown>, key);
              const enVal = resolveKey(en as Record<string, unknown>, key);

              if (typeof bnVal !== "string" || bnVal.trim().length === 0) {
                staticMissingBn.push({
                  key,
                  file: relFile,
                  line: line + 1,
                  reason: typeof bnVal !== "string" ? "Missing or non-string" : "Empty string",
                });
              }
              if (typeof enVal !== "string" || enVal.trim().length === 0) {
                staticMissingEn.push({
                  key,
                  file: relFile,
                  line: line + 1,
                  reason: typeof enVal !== "string" ? "Missing or non-string" : "Empty string",
                });
              }
            }
          }
        }
        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
    }

    expect(staticMissingBn, "Static keys missing or empty in bn.json").toEqual([]);
    expect(staticMissingEn, "Static keys missing or empty in en.json").toEqual([]);
  });

  it("validates dynamic application data synchronization and all concrete runtime generated keys", () => {
    // 1. Synchronize source data from routes/index.tsx
    const indexPath = path.resolve(srcDir, "routes/index.tsx");
    const indexContent = fs.readFileSync(indexPath, "utf8");

    const sourceTabs = [...indexContent.matchAll(/id:\s*["'](tab_\d+)["']/g)].map((m) => m[1]);
    const uniqueTabs = [...new Set(sourceTabs)];
    expect(uniqueTabs.length).toBeGreaterThan(0);

    const sourceCols = [...indexContent.matchAll(/key:\s*["'](col_\w+)["']/g)].map((m) => m[1]);
    const uniqueCols = [...new Set(sourceCols)];
    expect(uniqueCols.length).toBeGreaterThan(0);

    const sourceHosts = [...indexContent.matchAll(/id:\s*["'](host_\d+)["']/g)].map((m) => m[1]);
    const uniqueHosts = [...new Set(sourceHosts)];
    expect(uniqueHosts.length).toBeGreaterThan(0);

    const sourceFaqs = [...indexContent.matchAll(/id:\s*["'](faq_\d+)["']/g)].map((m) => m[1]);
    const uniqueFaqs = [...new Set(sourceFaqs)];
    expect(uniqueFaqs.length).toBeGreaterThan(0);

    // 2. Roles (tenant, landlord, admin)
    const roles = ["tenant", "landlord", "admin"];
    for (const r of roles) {
      const bnVal = resolveKey(bn as Record<string, unknown>, `roles.${r}`);
      const enVal = resolveKey(en as Record<string, unknown>, `roles.${r}`);
      expect(typeof bnVal, `roles.${r} must be non-empty in bn.json`).toBe("string");
      expect(typeof enVal, `roles.${r} must be non-empty in en.json`).toBe("string");
      expect((bnVal as string).trim().length).toBeGreaterThan(0);
      expect((enVal as string).trim().length).toBeGreaterThan(0);
    }

    // 3. Showcase tabs (home.showcase.${tabId}.${field})
    const showcaseFields = ["label", "desc", "title"];
    for (const tab of uniqueTabs) {
      for (const field of showcaseFields) {
        const key = `home.showcase.${tab}.${field}`;
        const bnVal = resolveKey(bn as Record<string, unknown>, key);
        const enVal = resolveKey(en as Record<string, unknown>, key);
        expect(typeof bnVal, `${key} must be non-empty in bn.json`).toBe("string");
        expect(typeof enVal, `${key} must be non-empty in en.json`).toBe("string");
        expect((bnVal as string).trim().length).toBeGreaterThan(0);
        expect((enVal as string).trim().length).toBeGreaterThan(0);
      }
    }

    // 4. Collections (home.collectionsItems.${colKey}.${field})
    const colFields = ["title", "sub", "count", "price"];
    for (const col of uniqueCols) {
      for (const field of colFields) {
        const key = `home.collectionsItems.${col}.${field}`;
        const bnVal = resolveKey(bn as Record<string, unknown>, key);
        const enVal = resolveKey(en as Record<string, unknown>, key);
        expect(typeof bnVal, `${key} must be non-empty in bn.json`).toBe("string");
        expect(typeof enVal, `${key} must be non-empty in en.json`).toBe("string");
        expect((bnVal as string).trim().length).toBeGreaterThan(0);
        expect((enVal as string).trim().length).toBeGreaterThan(0);
      }
    }

    // 5. Community hosts (home.communityHosts.${hostId}.${field})
    const hostFields = ["name", "badge", "role"];
    for (const host of uniqueHosts) {
      for (const field of hostFields) {
        const key = `home.communityHosts.${host}.${field}`;
        const bnVal = resolveKey(bn as Record<string, unknown>, key);
        const enVal = resolveKey(en as Record<string, unknown>, key);
        expect(typeof bnVal, `${key} must be non-empty in bn.json`).toBe("string");
        expect(typeof enVal, `${key} must be non-empty in en.json`).toBe("string");
        expect((bnVal as string).trim().length).toBeGreaterThan(0);
        expect((enVal as string).trim().length).toBeGreaterThan(0);
      }
    }

    // 6. FAQs (home.faqItems.${faqId}.${field})
    const faqFields = ["q", "a"];
    for (const faq of uniqueFaqs) {
      for (const field of faqFields) {
        const key = `home.faqItems.${faq}.${field}`;
        const bnVal = resolveKey(bn as Record<string, unknown>, key);
        const enVal = resolveKey(en as Record<string, unknown>, key);
        expect(typeof bnVal, `${key} must be non-empty in bn.json`).toBe("string");
        expect(typeof enVal, `${key} must be non-empty in en.json`).toBe("string");
        expect((bnVal as string).trim().length).toBeGreaterThan(0);
        expect((enVal as string).trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("reports and ensures zero unclassified dynamic translation expressions exist in production code", () => {
    const unclassifiedDynamic: UnresolvedDynamic[] = [];

    const allowedPrefixes = [
      "roles.",
      "home.showcase.",
      "home.collectionsItems.",
      "home.communityHosts.",
      "home.faqItems.",
    ];

    for (const file of allFiles) {
      const code = fs.readFileSync(file, "utf8");
      const sourceFile = ts.createSourceFile(
        file,
        code,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      function visit(node: ts.Node) {
        if (ts.isCallExpression(node)) {
          let isCall = false;
          if (ts.isIdentifier(node.expression) && node.expression.text === "t") {
            isCall = true;
          } else if (
            ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression) &&
            node.expression.expression.text === "i18n" &&
            node.expression.name.text === "t"
          ) {
            isCall = true;
          }

          if (isCall && node.arguments.length > 0) {
            const firstArg = node.arguments[0]!;
            const relFile = path.relative(srcDir, file).replace(/\\/g, "/");
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

            if (ts.isTemplateExpression(firstArg)) {
              const head = firstArg.head.text;
              const isRecognized = allowedPrefixes.some((p) => head.startsWith(p));
              if (!isRecognized) {
                unclassifiedDynamic.push({
                  expression: firstArg.getText(sourceFile),
                  file: relFile,
                  line: line + 1,
                  reason: `Template literal prefix "${head}" does not match any recognized dynamic prefix family`,
                });
              }
            } else if (!ts.isStringLiteral(firstArg) && !ts.isNoSubstitutionTemplateLiteral(firstArg)) {
              const exprText = firstArg.getText(sourceFile);
              const isDelegation = relFile.includes("i18n.ts") && exprText === "key";
              const isErrorMessage = exprText.includes("message");

              if (!isDelegation && !isErrorMessage) {
                unclassifiedDynamic.push({
                  expression: exprText,
                  file: relFile,
                  line: line + 1,
                  reason: "Unsupported dynamic call expression",
                });
              }
            }
          }
        }
        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
    }

    expect(unclassifiedDynamic, "Unclassified dynamic translation calls detected").toEqual([]);
  });
});

