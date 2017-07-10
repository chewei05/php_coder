/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle(__filename);
const configurationNamespace = 'jsDocCompletion';
var Configuration;
(function (Configuration) {
    Configuration.enabled = 'enabled';
})(Configuration || (Configuration = {}));
class JsDocCompletionItem extends vscode_1.CompletionItem {
    constructor(file, position, shouldGetJSDocFromTSServer) {
        super('/** */', vscode_1.CompletionItemKind.Snippet);
        this.detail = localize(0, null);
        this.insertText = '';
        this.sortText = '\0';
        this.command = {
            title: 'Try Complete JSDoc',
            command: TryCompleteJsDocCommand.COMMAND_NAME,
            arguments: [file, position, shouldGetJSDocFromTSServer]
        };
    }
}
class JsDocCompletionProvider {
    constructor(client) {
        this.client = client;
        this.config = { enabled: true };
    }
    updateConfiguration() {
        const jsDocCompletionConfig = vscode_1.workspace.getConfiguration(configurationNamespace);
        this.config.enabled = jsDocCompletionConfig.get(Configuration.enabled, true);
    }
    provideCompletionItems(document, position, _token) {
        const file = this.client.normalizePath(document.uri);
        if (!file) {
            return [];
        }
        // Only show the JSdoc completion when the everything before the cursor is whitespace
        // or could be the opening of a comment
        const line = document.lineAt(position.line).text;
        const prefix = line.slice(0, position.character);
        if (prefix.match(/^\s*$|\/\*\*\s*$|^\s*\/\*\*+\s*$/)) {
            return [new JsDocCompletionItem(document.uri, position, this.config.enabled)];
        }
        return [];
    }
    resolveCompletionItem(item, _token) {
        return item;
    }
}
exports.JsDocCompletionProvider = JsDocCompletionProvider;
class TryCompleteJsDocCommand {
    constructor(client) {
        this.client = client;
    }
    /**
     * Try to insert a jsdoc comment, using a template provide by typescript
     * if possible, otherwise falling back to a default comment format.
     */
    tryCompleteJsDoc(resource, position, shouldGetJSDocFromTSServer) {
        const file = this.client.normalizePath(resource);
        if (!file) {
            return Promise.resolve(false);
        }
        const editor = vscode_1.window.activeTextEditor;
        if (!editor || editor.document.uri.fsPath !== resource.fsPath) {
            return Promise.resolve(false);
        }
        return this.prepForDocCompletion(editor, position)
            .then((start) => {
            if (!shouldGetJSDocFromTSServer) {
                return this.tryInsertDefaultDoc(editor, start);
            }
            return this.tryInsertJsDocFromTemplate(editor, file, start)
                .then((didInsertFromTemplate) => {
                if (didInsertFromTemplate) {
                    return true;
                }
                return this.tryInsertDefaultDoc(editor, start);
            });
        });
    }
    /**
     * Prepare the area around the position for insertion of the jsdoc.
     *
     * Removes any the prefix and suffix of a possible jsdoc
     */
    prepForDocCompletion(editor, position) {
        const line = editor.document.lineAt(position.line).text;
        const prefix = line.slice(0, position.character).match(/\/\**\s*$/);
        const suffix = line.slice(position.character).match(/^\s*\**\//);
        if (!prefix && !suffix) {
            // Nothing to remove
            return Promise.resolve(position);
        }
        const start = position.translate(0, prefix ? -prefix[0].length : 0);
        return editor.edit(edits => {
            edits.delete(new vscode_1.Range(start, position.translate(0, suffix ? suffix[0].length : 0)));
        }, {
            undoStopBefore: true,
            undoStopAfter: false
        }).then(() => start);
    }
    tryInsertJsDocFromTemplate(editor, file, position) {
        const args = {
            file: file,
            line: position.line + 1,
            offset: position.character + 1
        };
        return Promise.race([
            this.client.execute('docCommentTemplate', args),
            new Promise((_, reject) => setTimeout(reject, 250))
        ]).then((res) => {
            if (!res || !res.body) {
                return false;
            }
            return editor.insertSnippet(this.templateToSnippet(res.body.newText), position, { undoStopBefore: false, undoStopAfter: true });
        }, () => false);
    }
    templateToSnippet(template) {
        let snippetIndex = 1;
        template = template.replace(/^\s*(?=(\/|[ ]\*))/gm, '');
        template = template.replace(/^(\/\*\*\s*\*[ ]*)$/m, (x) => x + `\$0`);
        template = template.replace(/\* @param([ ]\{\S+\})?\s+(\S+)\s*$/gm, (_param, type, post) => {
            let out = '* @param ';
            if (type === ' {any}' || type === ' {*}') {
                out += `{*\$\{${snippetIndex++}\}} `;
            }
            else if (type) {
                out += type + ' ';
            }
            out += post + ` \${${snippetIndex++}}`;
            return out;
        });
        return new vscode_1.SnippetString(template);
    }
    /**
     * Insert the default JSDoc
     */
    tryInsertDefaultDoc(editor, position) {
        const snippet = new vscode_1.SnippetString(`/**\n * $0\n */`);
        return editor.insertSnippet(snippet, position, { undoStopBefore: false, undoStopAfter: true });
    }
}
TryCompleteJsDocCommand.COMMAND_NAME = '_typeScript.tryCompleteJsDoc';
exports.TryCompleteJsDocCommand = TryCompleteJsDocCommand;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\typescript\out/features\jsDocCompletionProvider.js.map
