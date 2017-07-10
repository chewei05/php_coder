/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class TypeScriptDefinitionProviderBase {
    constructor(client) {
        this.client = client;
    }
    getSymbolLocations(definitionType, document, position, token) {
        const filepath = this.client.normalizePath(document.uri);
        if (!filepath) {
            return Promise.resolve(null);
        }
        const args = {
            file: filepath,
            line: position.line + 1,
            offset: position.character + 1
        };
        return this.client.execute(definitionType, args, token).then(response => {
            const locations = (response && response.body) || [];
            if (!locations || locations.length === 0) {
                return [];
            }
            return locations.map(location => {
                const resource = this.client.asUrl(location.file);
                if (resource === null) {
                    return null;
                }
                else {
                    return new vscode_1.Location(resource, new vscode_1.Range(location.start.line - 1, location.start.offset - 1, location.end.line - 1, location.end.offset - 1));
                }
            }).filter(x => x !== null);
        }, (error) => {
            this.client.error(`'${definitionType}' request failed with error.`, error);
            return [];
        });
    }
}
exports.default = TypeScriptDefinitionProviderBase;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\typescript\out/features\definitionProviderBase.js.map
