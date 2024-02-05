async function instantiate(module, imports = {}) {
  const adaptedImports = {
    env: Object.assign(Object.create(globalThis), imports.env || {}, {
      abort(message, fileName, lineNumber, columnNumber) {
        // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => {
          // @external.js
          throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
        })();
      },
    }),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    rational_new(num, den) {
      // assembly/index/rational_new(f64, f64) => u32
      return exports.rational_new(num, den) >>> 0;
    },
    rational_count() {
      // assembly/index/rational_count() => u32
      return exports.rational_count() >>> 0;
    },
    rational_setValue(rational, num, den, reduce) {
      // assembly/index/rational_setValue(u32, f64, f64, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_setValue(rational, num, den, reduce);
    },
    rational_addRR(rational, lhs, rhs, reduce) {
      // assembly/index/rational_addRR(u32, usize, usize, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_addRR(rational, lhs, rhs, reduce);
    },
    rational_addRD(rational, lhs, rhsnum, rhsden, reduce) {
      // assembly/index/rational_addRD(u32, usize, f64, f64, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_addRD(rational, lhs, rhsnum, rhsden, reduce);
    },
    rational_addDD(rational, lhsnum, lhsden, rhsnum, rhsden, reduce) {
      // assembly/index/rational_addDD(u32, f64, f64, f64, f64, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_addDD(rational, lhsnum, lhsden, rhsnum, rhsden, reduce);
    },
    rational_addRI(rational, lhs, rhs, reduce) {
      // assembly/index/rational_addRI(u32, usize, f64, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_addRI(rational, lhs, rhs, reduce);
    },
    rational_subRR(rational, lhs, rhs, reduce) {
      // assembly/index/rational_subRR(u32, usize, usize, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_subRR(rational, lhs, rhs, reduce);
    },
    rational_subRI(rational, lhs, rhs, reduce) {
      // assembly/index/rational_subRI(u32, usize, f64, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_subRI(rational, lhs, rhs, reduce);
    },
    rational_subIR(rational, lhs, rhs, reduce) {
      // assembly/index/rational_subIR(u32, f64, usize, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_subIR(rational, lhs, rhs, reduce);
    },
    rational_mulRR(rational, lhs, rhs, reduce) {
      // assembly/index/rational_mulRR(u32, usize, usize, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_mulRR(rational, lhs, rhs, reduce);
    },
    rational_mulRD(rational, lhs, rhsnum, rhsden, reduce) {
      // assembly/index/rational_mulRD(u32, usize, f64, f64, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_mulRD(rational, lhs, rhsnum, rhsden, reduce);
    },
    rational_mulDD(rational, lhsnum, lhsden, rhsnum, rhsden, reduce) {
      // assembly/index/rational_mulDD(u32, f64, f64, f64, f64, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_mulDD(rational, lhsnum, lhsden, rhsnum, rhsden, reduce);
    },
    rational_mulRI(rational, lhs, rhs, reduce) {
      // assembly/index/rational_mulRI(u32, usize, f64, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_mulRI(rational, lhs, rhs, reduce);
    },
    rational_divRR(rational, lhs, rhs, reduce) {
      // assembly/index/rational_divRR(u32, usize, usize, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_divRR(rational, lhs, rhs, reduce);
    },
    rational_divRI(rational, lhs, rhs, reduce) {
      // assembly/index/rational_divRI(u32, usize, f64, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_divRI(rational, lhs, rhs, reduce);
    },
    rational_divIR(rational, lhs, rhs, reduce) {
      // assembly/index/rational_divIR(u32, f64, usize, bool) => void
      reduce = reduce ? 1 : 0;
      exports.rational_divIR(rational, lhs, rhs, reduce);
    },
  }, exports);
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  return adaptedExports;
}
let _wasm;
(async url => {
  _wasm = await instantiate(
    await (async () => {
      try { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
      catch { return globalThis.WebAssembly.compile(await (await globalThis.fetch(url)).arrayBuffer()); }
    })(), {
    }
  );
})("lib/utilities.wasm");

