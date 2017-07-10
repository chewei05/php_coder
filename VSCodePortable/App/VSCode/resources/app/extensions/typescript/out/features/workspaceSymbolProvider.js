/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const _kindMapping = Object.create(null);
_kindMapping['method'] = vscode_1.SymbolKind.Method;
_kindMapping['enum'] = vscode_1.SymbolKind.Enum;
_kindMapping['function'] = vscode_1.SymbolKind.Function;
_kindMapping['class'] = vscode_1.SymbolKind.Class;
_kindMapping['interface'] = vscode_1.SymbolKind.Interface;
_kindMapping['var'] = vscode_1.SymbolKind.Variable;
class TypeScriptWorkspaceSymbolProvider {
    constructor(client, modeId) {
        this.client = client;
        this.modeId = modeId;
    }
    provideWorkspaceSymbols(search, token) {
        // typescript wants to have a resource even when asking
        // general questions so we check the active editor. If this
        // doesn't match we take the first TS document.
        let uri = undefined;
        let editor = vscode_1.window.activeTextEditor;
        if (editor) {
            let document = editor.document;
            if (document && document.languageId === this.modeId) {
                uri = document.uri;
            }
        }
        if (!uri) {
            let documents = vscode_1.workspace.textDocuments;
            for (let document of documents) {
                if (document.languageId === this.modeId) {
                    uri = document.uri;
                    break;
                }
            }
        }
        if (!uri) {
            return Promise.resolve([]);
        }
        const filepath = this.client.normalizePath(uri);
        if (!filepath) {
            return Promise.resolve([]);
        }
        let args = {
            file: filepath,
            searchValue: search
        };
        if (!args.file) {
            return Promise.resolve([]);
        }
        return this.client.execute('navto', args, token).then((response) => {
            let data = response.body;
            if (data) {
                let result = [];
                for (let item of data) {
                    if (!item.containerName && item.kind === 'alias') {
                        continue;
                    }
                    let range = new vscode_1.Range(item.start.line - 1, item.start.offset - 1, item.end.line - 1, item.end.offset - 1);
                    let label = item.name;
                    if (item.kind === 'method' || item.kind === 'function') {
                        label += '()';
                    }
                    result.push(new vscode_1.SymbolInformation(label, _kindMapping[item.kind], item.containerName ? item.containerName : '', new vscode_1.Location(this.client.asUrl(item.file), range)));
                }
                return result;
            }
            else {
                return [];
            }
        }, (err) => {
            this.client.error(`'navto' request failed with error.`, err);
            return [];
        });
    }
}
exports.default = TypeScriptWorkspaceSymbolProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\typescript\out/features\workspaceSymbolProvider.js.map
