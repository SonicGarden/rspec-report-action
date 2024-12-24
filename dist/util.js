"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.floor = void 0;
const floor = (n, ndigits) => {
    const shift = Math.pow(10, ndigits);
    return Math.floor(n * shift) / shift;
};
exports.floor = floor;
//# sourceMappingURL=util.js.map