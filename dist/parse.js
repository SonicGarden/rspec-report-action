"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
const path_1 = __importDefault(require("path"));
const promises_1 = require("fs/promises");
function pluralize(noun, count) {
    if (count === 1)
        return noun;
    return `${noun}s`;
}
function generateSummary(total, failed, pending) {
    let summary = `${total} ${pluralize('example', total)}`;
    summary += `, ${failed} ${pluralize('failure', failed)}`;
    if (pending > 0) {
        summary += `, ${pending} pending`;
    }
    return summary;
}
async function parse(resultPaths) {
    const promises = resultPaths.map(async (resultPath) => {
        return JSON.parse(await (0, promises_1.readFile)(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        path_1.default.resolve(process.env.GITHUB_WORKSPACE, resultPath), 'utf-8'));
    });
    const results = await Promise.all(promises);
    const allExamples = results.reduce((acc, jsonResult) => acc.concat(jsonResult.examples), []);
    const examples = allExamples
        .filter(({ status }) => status === 'failed')
        .map(({ file_path, line_number, full_description, exception }) => {
        return {
            description: full_description,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            message: exception.message,
            filePath: file_path.replace(/^\.\//, ''),
            lineNumber: line_number
        };
    });
    const slowExamples = [...allExamples]
        .sort((a, b) => b.run_time - a.run_time)
        .slice(0, 10)
        .map(({ file_path, line_number, full_description, run_time }) => {
        return {
            description: full_description,
            filePath: file_path.replace(/^\.\//, ''),
            lineNumber: line_number,
            runTime: run_time
        };
    });
    const totalExamples = allExamples.length;
    const failedExamples = examples.length;
    const pendingExamples = allExamples.filter(example => example.pending_message !== null).length;
    const totalTime = allExamples.reduce((total, { run_time }) => total + run_time, 0);
    return {
        examples,
        slowExamples,
        summary: generateSummary(totalExamples, failedExamples, pendingExamples),
        success: examples.length === 0,
        totalTime
    };
}
//# sourceMappingURL=parse.js.map