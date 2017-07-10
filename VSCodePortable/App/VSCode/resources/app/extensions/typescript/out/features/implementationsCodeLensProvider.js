/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const PConst = require("../protocol.const");
const baseCodeLensProvider_1 = require("./baseCodeLensProvider");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle(__filename);
class TypeScriptImplementationsCodeLensProvider extends baseCodeLensProvider_1.TypeScriptBaseCodeLensProvider {
    constructor(client) {
        super(client, 'implementationsCodeLens.enabled');
    }
    provideCodeLenses(document, token) {
        if (!this.client.apiVersion.has220Features()) {
            return Promise.resolve([]);
        }
        return super.provideCodeLenses(document, token);
    }
    resolveCodeLens(inputCodeLens, token) {
        const codeLens = inputCodeLens;
        const args = {
            file: codeLens.file,
            line: codeLens.range.start.line + 1,
            offset: codeLens.range.start.character + 1
        };
        return this.client.execute('implementation', args, token).then(response => {
            if (!response || !response.body) {
                throw codeLens;
            }
            const locations = response.body
                .map(reference => 
            // Only take first line on implementation: https://github.com/Microsoft/vscode/issues/23924
            new vscode_1.Location(this.client.asUrl(reference.file), reference.start.line === reference.end.line
                ? new vscode_1.Range(reference.start.line - 1, reference.start.offset - 1, reference.end.line - 1, reference.end.offset - 1)
                : new vscode_1.Range(reference.start.line - 1, reference.start.offset - 1, reference.start.line, 0)))
                .filter(location => !(location.uri.fsPath === codeLens.document.fsPath &&
                location.range.start.line === codeLens.range.start.line &&
                location.range.start.character === codeLens.range.start.character));
            codeLens.command = {
                title: locations.length === 1
                    ? localize(0, null)
                    : localize(1, null, locations.length),
                command: locations.length ? 'editor.action.showReferences' : '',
                arguments: [codeLens.document, codeLens.range.start, locations]
            };
            return codeLens;
        }).catch(() => {
            codeLens.command = {
                title: localize(2, null),
                command: ''
            };
            return codeLens;
        });
    }
    extractSymbol(document, item, _parent) {
        switch (item.kind) {
            case PConst.Kind.interface:
                return super.getSymbolRange(document, item);
            case PConst.Kind.class:
            case PConst.Kind.memberFunction:
            case PConst.Kind.memberVariable:
            case PConst.Kind.memberGetAccessor:
            case PConst.Kind.memberSetAccessor:
                if (item.kindModifiers.match(/\babstract\b/g)) {
                    return super.getSymbolRange(document, item);
                }
                break;
        }
        return null;
    }
}
exports.default = TypeScriptImplementationsCodeLensProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\typescript\out/features\implementationsCodeLensProvider.js.map
