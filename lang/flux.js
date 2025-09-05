const keywords = new Set([
  'if', 'else', 'elseif', 'switch', 'case', 'default', 'while', 'for', 'break', 'continue', 'return',
  'let', 'const', 'var', 'mutable', 'static',
  'function', 'fn', 'lambda', 'async', 'await',
  'int', 'float', 'string', 'bool', 'object', 'array', 'enum', 'class',
  'try', 'catch', 'finally', 'throw',
  'and', 'or', 'not', 'is', 'in', 'mod',
  'import', 'export', 'package', 'module', 'include',
  'class', 'extends', 'super', 'this', 'interface', 'abstract',
  'true', 'false', 'null', 'new', 'delete'
]);

function isKeyword(word) {
  return keywords.has(word);
}
const builtInFunctions = {
  print: (...args) => console.log(...args),
  len: arg => arg.length,
  sqrt: Math.sqrt,
  pow: Math.pow,
  abs: Math.abs,
  int: arg => parseInt(arg, 10),
  float: arg => parseFloat(arg),
  str: arg => String(arg),
  upper: str => str.toUpperCase(),
  lower: str => str.toLowerCase(),
  random: Math.random,
  input: prompt,
  type: arg => typeof arg,
  round: Math.round,
  toString: arg => arg.toString(),
  parseInt: arg => parseInt(arg, 10),
  parseFloat: arg => parseFloat(arg),
  isNaN: isNaN,
  slice: (str, start, end) => str.slice(start, end),
  concat: (a, b) => a.concat(b)
};
function lexer(input) {
  const tokenPattern = /\s*([A-Za-z_]\w*|\d+(\.\d+)?|"[^"]*"|'[^']*'|[+\-*/=();,{}<>]|==|!=|<=|>=|&&|\|\||!)\s*/g;
  let tokens = [];
  let match;
  while ((match = tokenPattern.exec(input)) !== null) {
    tokens.push(match[1]);
  }
  return tokens;
}
function parser(tokens) {
  let pos = 0;

  function peek() {
    return tokens[pos];
  }
  function consume(expected) {
    let token = tokens[pos];
    if (expected && token !== expected) {
      throw new Error(`Expected "${expected}" but got "${token}"`);
    }
    pos++;
    return token;
  }
  function isAtEnd() {
    return pos >= tokens.length;
  }
  function parsePrimary() {
    let token = peek();
    if (!token) throw new Error("Unexpected end of input");

    if (!isNaN(token)) {
      consume();
      return { type: "number", value: Number(token) };
    } else if (token[0] === '"' || token[0] === "'") {
      consume();
      return { type: "string", value: token.slice(1, -1) };
    } else if (isKeyword(token)) {
      consume();
      if (token === "true" || token === "false" || token === "null") {
        let val = token === "true" ? true : token === "false" ? false : null;
        return { type: "literal", value: val };
      }
      return { type: "keyword", value: token };
    } else {
      consume();
      return { type: "variable", name: token };
    }
  }
  function parseCall() {
    let expr = parsePrimary();

    while (true) {
      if (peek() === "(") {
        consume("(");
        let args = [];
        if (peek() !== ")") {
          do {
            args.push(parseExpression());
          } while (peek() === "," && consume(","));
        }
        consume(")");
        expr = { type: "call", callee: expr, arguments: args };
      } else {
        break;
      }
    }
    return expr;
  }
  function parseExpression() {
    let left = parseCall();

    while (peek() === "+" || peek() === "-" || peek() === "*" || peek() === "/" || peek() === "==" || peek() === "!=") {
      let operator = consume();
      let right = parseCall();
      left = { type: "binary", operator, left, right };
    }
    return left;
  }
  function parseStatement() {
    if (peek() === "let" || peek() === "const" || peek() === "var") {
      let kind = consume();
      let name = consume();
      if (!name.match(/^[A-Za-z_]\w*$/)) throw new Error("Invalid variable name");
      consume("=");
      let expr = parseExpression();
      consume(";");
      return { type: "var_decl", kind, name, expr };
    } else {
      let expr = parseExpression();
      consume(";");
      return { type: "expr_stmt", expr };
    }
  }

  let statements = [];
  while (!isAtEnd()) {
    statements.push(parseStatement());
  }
  return statements;
}
class Interpreter {
  constructor() {
    this.env = Object.create(null);
  }

  eval(node) {
    switch (node.type) {
      case "number": return node.value;
      case "string": return node.value;
      case "literal": return node.value;
      case "variable":
        if (node.name in this.env) return this.env[node.name];
        else throw new Error(`Undefined variable '${node.name}'`);
      case "call":
        let callee = this.eval(node.callee);
        if (typeof callee !== "function") throw new Error("Call of non-function");
        let args = node.arguments.map(arg => this.eval(arg));
        return callee(...args);
      case "binary":
        let left = this.eval(node.left);
        let right = this.eval(node.right);
        switch (node.operator) {
          case "+": return left + right;
          case "-": return left - right;
          case "*": return left * right;
          case "/": return left / right;
          case "==": return left === right;
          case "!=": return left !== right;
          default: throw new Error(`Unsupported operator ${node.operator}`);
        }
      case "var_decl":
        let val = this.eval(node.expr);
        this.env[node.name] = val;
        return null;
      case "expr_stmt":
        return this.eval(node.expr);
      default:
        throw new Error("Unknown node type " + node.type);
    }
  }
}
function executeFlux(code) {
  const tokens = lexer(code);
  const ast = parser(tokens);

  const interpreter = new Interpreter();
  for (const fn in builtInFunctions) {
    interpreter.env[fn] = builtInFunctions[fn];
  }

  for (const stmt of ast) {
    interpreter.eval(stmt);
  }
}
window.addEventListener('DOMContentLoaded', () => {
  const fluxTags = document.querySelectorAll('flux');
  fluxTags.forEach(tag => {
    try {
      executeFlux(tag.textContent);
    } catch (e) {
      console.error('Flux error:', e);
    }
  });
});
