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
exports.reportSummary = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const FOOTER_LINK = 
// eslint-disable-next-line i18n-text/no-en
'Reported by [rspec-report-action](https://github.com/SonicGarden/rspec-report-action)';
const formatMessage = (message) => {
    const lines = message
        .replace(/\\n/g, '\n')
        .trim()
        .replace(/ /g, '&nbsp;')
        .split(/\n/);
    const [summary, ...bodyLines] = lines;
    return `<details>
<summary>${summary}</summary>

${bodyLines.join('<br>')}
</details>
`;
};
const reportSummary = async (result) => {
    const icon = result.success ? ':tada:' : ':cold_sweat:';
    const summary = `${icon} ${result.summary}`;
    const baseUrl = `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}/blob/${github.context.sha}`;
    const rows = result.examples.map(({ filePath, lineNumber, description, message }) => [
        `\n\n[${filePath}:${lineNumber}](${baseUrl}/${filePath}#L${lineNumber})`,
        description,
        formatMessage(message)
    ]);
    const hideFooterLink = core.getInput('hideFooterLink') === 'true';
    await core.summary
        .addHeading('RSpec Result')
        .addRaw(summary)
        .addTable([
        [
            { data: 'Example :link:', header: true },
            { data: 'Description :pencil2:', header: true },
            { data: 'Message :x:', header: true }
        ],
        ...rows
    ])
        .addRaw(hideFooterLink ? '' : `\n${FOOTER_LINK}`)
        .write();
};
exports.reportSummary = reportSummary;
//# sourceMappingURL=report-summary.js.map