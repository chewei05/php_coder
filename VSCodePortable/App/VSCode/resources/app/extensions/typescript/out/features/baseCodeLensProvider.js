/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class ReferencesCodeLens extends vscode_1.CodeLens {
    constructor(document, file, range) {
        super(range);
        this.document = document;
        this.file = file;
    }
}
exports.ReferencesCodeLens = ReferencesCodeLens;
class TypeScriptBaseCodeLensProvider {
    constructor(client, toggleSettingName) {
        this.client = client;
        this.toggleSettingName = toggleSettingName;
        this.enabled = false;
        this.onDidChangeCodeLensesEmitter = new vscode_1.EventEmitter();
    }
    get onDidChangeCodeLenses() {
        return this.onDidChangeCodeLensesEmitter.event;
    }
    updateConfiguration() {
        const typeScriptConfig = vscode_1.workspace.getConfiguration('typescript');
        const wasEnabled = this.enabled;
        this.enabled = typeScriptConfig.get(this.toggleSettingName, false);
        if (wasEnabled !== this.enabled) {
            this.onDidChangeCodeLensesEmitter.fire();
        }
    }
    provideCodeLenses(document, token) {
        if (!this.enabled) {
            return Promise.resolve([]);
        }
        const filepath = this.client.normalizePath(document.uri);
        if (!filepath) {
            return Promise.resolve([]);
        }
        return this.client.execute('navtree', { file: filepath }, token).then(response => {
            if (!response) {
                return [];
            }
            const tree = response.body;
            const referenceableSpans = [];
            if (tree && tree.childItems) {
                tree.childItems.forEach(item => this.walkNavTree(document, item, null, referenceableSpans));
            }
            return referenceableSpans.map(span => new ReferencesCodeLens(document.uri, filepath, span));
        });
    }
    walkNavTree(document, item, parent, results) {
        if (!item) {
            return;
        }
        const range = this.extractSymbol(document, item, parent);
        if (range) {
            results.push(range);
        }
        (item.childItems || []).forEach(child => this.walkNavTree(document, child, item, results));
    }
    /**
     * TODO: TS currently requires the position for 'references 'to be inside of the identifer
     * Massage the range to make sure this is the case
     */
    getSymbolRange(document, item) {
        if (!item) {
            return null;
        }
        const span = item.spans && item.spans[0];
        if (!span) {
            return null;
        }
        const range = new vscode_1.Range(span.start.line - 1, span.start.offset - 1, span.end.line - 1, span.end.offset - 1);
        const text = document.getText(range);
        const identifierMatch = new RegExp(`^(.*?(\\b|\\W))${(item.text || '').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'gm');
        const match = identifierMatch.exec(text);
        const prefixLength = match ? match.index + match[1].length : 0;
        const startOffset = document.offsetAt(new vscode_1.Position(range.start.line, range.start.character)) + prefixLength;
        return new vscode_1.Range(document.positionAt(startOffset), document.positionAt(startOffset + item.text.length));
    }
}
exports.TypeScriptBaseCodeLensProvider = TypeScriptBaseCodeLensProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\typescript\out/features\baseCodeLensProvider.js.map
