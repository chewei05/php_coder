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
class TypeScriptReferencesCodeLensProvider extends baseCodeLensProvider_1.TypeScriptBaseCodeLensProvider {
    constructor(client) {
        super(client, 'referencesCodeLens.enabled');
    }
    provideCodeLenses(document, token) {
        if (!this.client.apiVersion.has206Features()) {
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
        return this.client.execute('references', args, token).then(response => {
            if (!response || !response.body) {
                throw codeLens;
            }
            const locations = response.body.refs
                .map(reference => new vscode_1.Location(this.client.asUrl(reference.file), new vscode_1.Range(reference.start.line - 1, reference.start.offset - 1, reference.end.line - 1, reference.end.offset - 1)))
                .filter(location => 
            // Exclude original definition from references
            !(location.uri.fsPath === codeLens.document.fsPath &&
                location.range.start.isEqual(codeLens.range.start)));
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
    extractSymbol(document, item, parent) {
        if (parent && parent.kind === PConst.Kind.enum) {
            return super.getSymbolRange(document, item);
        }
        switch (item.kind) {
            case PConst.Kind.const:
            case PConst.Kind.let:
            case PConst.Kind.variable:
            case PConst.Kind.function:
                // Only show references for exported variables
                if (!item.kindModifiers.match(/\bexport\b/)) {
                    break;
                }
            // fallthrough
            case PConst.Kind.class:
                if (item.text === '<class>') {
                    break;
                }
            // fallthrough
            case PConst.Kind.memberFunction:
            case PConst.Kind.memberVariable:
            case PConst.Kind.memberGetAccessor:
            case PConst.Kind.memberSetAccessor:
            case PConst.Kind.constructorImplementation:
            case PConst.Kind.interface:
            case PConst.Kind.type:
            case PConst.Kind.enum:
                return super.getSymbolRange(document, item);
        }
        return null;
    }
}
exports.default = TypeScriptReferencesCodeLensProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\typescript\out/features\referencesCodeLensProvider.js.map
