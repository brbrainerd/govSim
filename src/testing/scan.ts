// TypeScript-AST source scanner shared by the purity, party-free and literal scans.
// Lives outside src/engine on purpose so the engine scan does not scan itself.
import ts from 'typescript';

export const ALLOWED_MATH = new Set(['abs', 'min', 'max', 'floor', 'ceil', 'round', 'trunc', 'sign', 'imul', 'clz32', 'fround']);
export const BANNED_IDS = new Set(['Date', 'performance', 'crypto', 'Intl', 'globalThis', 'window', 'document', 'localStorage', 'fetch', 'setTimeout']);

export function scan(file: string, text: string) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2023, true);
  const hits: string[] = [], literals: string[] = [];
  const at = (n: ts.Node) => `${file}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
  const visit = (n: ts.Node): void => {
    if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'Math' && !ALLOWED_MATH.has(n.name.text)) hits.push(`${at(n)} Math.${n.name.text}`);
    if (ts.isElementAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'Math') hits.push(`${at(n)} Math[...]`);
    // `const M = Math` or `f(Math)` would hide every later call from the two checks above (IN-01).
    if (ts.isIdentifier(n) && n.text === 'Math' && !((ts.isPropertyAccessExpression(n.parent) || ts.isElementAccessExpression(n.parent)) && n.parent.expression === n) && !(ts.isPropertyAccessExpression(n.parent) && n.parent.name === n)) hits.push(`${at(n)} Math alias`);
    if (ts.isBinaryExpression(n) && (n.operatorToken.kind === ts.SyntaxKind.AsteriskAsteriskToken || n.operatorToken.kind === ts.SyntaxKind.AsteriskAsteriskEqualsToken)) hits.push(`${at(n)} **`);
    if (ts.isIdentifier(n) && BANNED_IDS.has(n.text) && !(ts.isPropertyAccessExpression(n.parent) && n.parent.name === n)) hits.push(`${at(n)} ${n.text}`);
    if (ts.isImportDeclaration(n) && /(^|\/)(svelte|app|ui|screens)(\/|$)/.test((n.moduleSpecifier as ts.StringLiteral).text)) hits.push(`${at(n)} import ${(n.moduleSpecifier as ts.StringLiteral).text}`);
    if (ts.isNumericLiteral(n) && !ts.isLiteralTypeNode(n.parent) && n.text !== '0' && n.text !== '1') literals.push(`${at(n)} ${n.text}`);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { hits, literals };
}
