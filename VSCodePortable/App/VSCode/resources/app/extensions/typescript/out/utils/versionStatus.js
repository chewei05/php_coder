/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const versionBarEntry = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, Number.MIN_VALUE);
function showHideStatus() {
    if (!versionBarEntry) {
        return;
    }
    if (!vscode.window.activeTextEditor) {
        versionBarEntry.hide();
        return;
    }
    let doc = vscode.window.activeTextEditor.document;
    if (vscode.languages.match('typescript', doc) || vscode.languages.match('typescriptreact', doc)) {
        versionBarEntry.show();
        return;
    }
    if (!vscode.window.activeTextEditor.viewColumn) {
        // viewColumn is undefined for the debug/output panel, but we still want
        // to show the version info
        return;
    }
    versionBarEntry.hide();
}
exports.showHideStatus = showHideStatus;
function disposeStatus() {
    if (versionBarEntry) {
        versionBarEntry.dispose();
    }
}
exports.disposeStatus = disposeStatus;
function setInfo(message, tooltip) {
    versionBarEntry.text = message;
    versionBarEntry.tooltip = tooltip;
    versionBarEntry.command = 'typescript.selectTypeScriptVersion';
}
exports.setInfo = setInfo;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\typescript\out/utils\versionStatus.js.map
