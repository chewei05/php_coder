/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class TypeScriptReferenceSupport {
    constructor(client) {
        this.client = client;
    }
    provideReferences(document, position, options, token) {
        const filepath = this.client.normalizePath(document.uri);
        if (!filepath) {
            return Promise.resolve([]);
        }
        const args = {
            file: filepath,
            line: position.line + 1,
            offset: position.character + 1
        };
        const apiVersion = this.client.apiVersion;
        return this.client.execute('references', args, token).then((msg) => {
            const result = [];
            if (!msg.body) {
                return result;
            }
            const refs = msg.body.refs;
            for (let i = 0; i < refs.length; i++) {
                const ref = refs[i];
                if (!options.includeDeclaration && apiVersion.has203Features() && ref.isDefinition) {
                    continue;
                }
                const url = this.client.asUrl(ref.file);
                const location = new vscode_1.Location(url, new vscode_1.Range(ref.start.line - 1, ref.start.offset - 1, ref.end.line - 1, ref.end.offset - 1));
                result.push(location);
            }
            return result;
        }, (err) => {
            this.client.error(`'references' request failed with error.`, err);
            return [];
        });
    }
}
exports.default = TypeScriptReferenceSupport;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\typescript\out/features\referenceProvider.js.map
