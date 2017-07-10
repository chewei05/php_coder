/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var jsonContributions_1 = require("./features/jsonContributions");
var httpRequest = require("request-light");
var vscode_1 = require("vscode");
var nls = require("vscode-nls");
function activate(context) {
    nls.config({ locale: vscode_1.env.language });
    configureHttpRequest();
    vscode_1.workspace.onDidChangeConfiguration(function (e) { return configureHttpRequest(); });
    context.subscriptions.push(jsonContributions_1.addJSONProviders(httpRequest.xhr));
}
exports.activate = activate;
function configureHttpRequest() {
    var httpSettings = vscode_1.workspace.getConfiguration('http');
    httpRequest.configure(httpSettings.get('proxy'), httpSettings.get('proxyStrictSSL'));
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\javascript\out/javascriptMain.js.map
