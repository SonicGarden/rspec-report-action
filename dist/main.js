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
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const fs = __importStar(require("fs"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const parse_1 = require("./parse");
const report_summary_1 = require("./report-summary");
const report_comment_1 = require("./report-comment");
const profile_comment_1 = require("./profile-comment");
async function run() {
    try {
        const globPath = core.getInput('json-path', { required: true });
        let jsonPaths = await (0, fast_glob_1.default)(globPath, { dot: true });
        jsonPaths = jsonPaths.filter(jsonPath => {
            try {
                fs.accessSync(jsonPath, fs.constants.R_OK);
                return true;
            }
            catch (err) {
                core.warning(`${jsonPath}: access error!`);
                return false;
            }
        });
        const result = await (0, parse_1.parse)(jsonPaths);
        core.info(result.summary);
        if (!result.success) {
            await (0, report_summary_1.reportSummary)(result);
        }
        if (core.getInput('comment') === 'true' && github.context.issue.number) {
            await (0, report_comment_1.reportComment)(result);
            await (0, profile_comment_1.reportProfileComment)(result);
        }
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}
exports.default = run;
if (require.main === module) {
    run();
}
//# sourceMappingURL=main.js.map