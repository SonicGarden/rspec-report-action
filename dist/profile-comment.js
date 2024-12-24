"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportProfileComment = void 0;
exports.examples2Table = examples2Table;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const util_1 = require("./util");
const actions_replace_comment_1 = __importDefault(require("@aki77/actions-replace-comment"));
async function examples2Table(examples) {
    const { markdownTable } = await import('markdown-table');
    return markdownTable([
        ['Example', 'Description', 'Time in seconds'],
        ...examples.map(({ filePath, lineNumber, description, runTime }) => [
            [filePath, lineNumber].join(':'),
            description,
            String((0, util_1.floor)(runTime, 5))
        ])
    ]);
}
const commentGeneralOptions = () => {
    const pullRequestId = github.context.issue.number;
    if (!pullRequestId) {
        throw new Error('Cannot find the PR id.');
    }
    return {
        token: core.getInput('token', { required: true }),
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: pullRequestId
    };
};
const slowestExamplesSummary = (result) => {
    const totalTime = result.totalTime;
    const slowTotalTime = result.slowExamples.reduce((total, { runTime }) => total + runTime, 0);
    const percentage = (slowTotalTime / totalTime) * 100;
    // eslint-disable-next-line i18n-text/no-en
    return `Top ${result.slowExamples.length} slowest examples (${(0, util_1.floor)(slowTotalTime, 2)} seconds, ${(0, util_1.floor)(percentage, 2)}% of total time)`;
};
const reportProfileComment = async (result) => {
    const title = core.getInput('profileTitle', { required: true });
    const summary = slowestExamplesSummary(result);
    await (0, actions_replace_comment_1.default)({
        ...commentGeneralOptions(),
        body: `${title}
<details>
<summary>${summary}</summary>

${await examples2Table(result.slowExamples)}

</details>
`
    });
};
exports.reportProfileComment = reportProfileComment;
//# sourceMappingURL=profile-comment.js.map