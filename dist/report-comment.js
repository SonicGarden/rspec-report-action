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
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportComment = void 0;
exports.examples2Table = examples2Table;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const actions_replace_comment_1 = __importStar(require("@aki77/actions-replace-comment"));
async function examples2Table(examples) {
    const { markdownTable } = await import('markdown-table');
    return markdownTable([
        ['Example', 'Description', 'Message'],
        ...examples.map(({ filePath, lineNumber, description, message }) => [
            [filePath, lineNumber].join(':'),
            description,
            message.replace(/\\n/g, ' ').trim().replace(/\s+/g, '&nbsp;')
        ])
    ]);
}
const commentGeneralOptions = () => {
    const pullRequestId = Number(core.getInput('pull-request-id')) || github.context.issue.number;
    core.info(`PR id: ${pullRequestId}`);
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
const reportComment = async (result) => {
    const title = core.getInput('title', { required: true });
    if (result.success) {
        await (0, actions_replace_comment_1.deleteComment)({
            ...commentGeneralOptions(),
            body: title,
            startsWith: true
        });
        return;
    }
    await (0, actions_replace_comment_1.default)({
        ...commentGeneralOptions(),
        body: `${title}
<details>
<summary>${result.summary}</summary>

${await examples2Table(result.examples)}

</details>
`
    });
};
exports.reportComment = reportComment;
//# sourceMappingURL=report-comment.js.map