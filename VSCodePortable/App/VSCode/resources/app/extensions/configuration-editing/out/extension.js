/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var jsonc_parser_1 = require("jsonc-parser");
var path = require("path");
var settingsDocumentHelper_1 = require("./settingsDocumentHelper");
var decoration = vscode.window.createTextEditorDecorationType({
    color: '#b1b1b1'
});
var pendingLaunchJsonDecoration;
function activate(context) {
    //keybindings.json command-suggestions
    context.subscriptions.push(registerKeybindingsCompletions());
    //settings.json suggestions
    context.subscriptions.push(registerSettingsCompletions());
    // launch.json decorations
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(function (editor) { return updateLaunchJsonDecorations(editor); }, null, context.subscriptions));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(function (event) {
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            if (pendingLaunchJsonDecoration) {
                clearTimeout(pendingLaunchJsonDecoration);
            }
            pendingLaunchJsonDecoration = setTimeout(function () { return updateLaunchJsonDecorations(vscode.window.activeTextEditor); }, 1000);
        }
    }, null, context.subscriptions));
    updateLaunchJsonDecorations(vscode.window.activeTextEditor);
}
exports.activate = activate;
function registerKeybindingsCompletions() {
    var commands = vscode.commands.getCommands(true);
    return vscode.languages.registerCompletionItemProvider({ pattern: '**/keybindings.json' }, {
        provideCompletionItems: function (document, position, token) {
            var location = jsonc_parser_1.getLocation(document.getText(), document.offsetAt(position));
            if (location.path[1] === 'command') {
                var range_1 = document.getWordRangeAtPosition(position) || new vscode.Range(position, position);
                return commands.then(function (ids) { return ids.map(function (id) { return newSimpleCompletionItem(JSON.stringify(id), range_1); }); });
            }
        }
    });
}
function registerSettingsCompletions() {
    return vscode.languages.registerCompletionItemProvider({ language: 'json', pattern: '**/settings.json' }, {
        provideCompletionItems: function (document, position, token) {
            return new settingsDocumentHelper_1.SettingsDocument(document).provideCompletionItems(position, token);
        }
    });
}
function newSimpleCompletionItem(text, range, description) {
    var item = new vscode.CompletionItem(text);
    item.kind = vscode.CompletionItemKind.Value;
    item.detail = description;
    item.insertText = text;
    item.range = range;
    return item;
}
function updateLaunchJsonDecorations(editor) {
    if (!editor || path.basename(editor.document.fileName) !== 'launch.json') {
        return;
    }
    var ranges = [];
    var addPropertyAndValue = false;
    var depthInArray = 0;
    jsonc_parser_1.visit(editor.document.getText(), {
        onObjectProperty: function (property, offset, length) {
            // Decorate attributes which are unlikely to be edited by the user.
            // Only decorate "configurations" if it is not inside an array (compounds have a configurations property which should not be decorated).
            addPropertyAndValue = property === 'version' || property === 'type' || property === 'request' || property === 'compounds' || (property === 'configurations' && depthInArray === 0);
            if (addPropertyAndValue) {
                ranges.push(new vscode.Range(editor.document.positionAt(offset), editor.document.positionAt(offset + length)));
            }
        },
        onLiteralValue: function (value, offset, length) {
            if (addPropertyAndValue) {
                ranges.push(new vscode.Range(editor.document.positionAt(offset), editor.document.positionAt(offset + length)));
            }
        },
        onArrayBegin: function (offset, length) {
            depthInArray++;
        },
        onArrayEnd: function (offset, length) {
            depthInArray--;
        }
    });
    editor.setDecorations(decoration, ranges);
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\configuration-editing\out/extension.js.map
