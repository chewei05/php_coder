/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const fs = require("fs");
const vscode_1 = require("vscode");
const async_1 = require("../utils/async");
const linkedMap_1 = require("./linkedMap");
const nls = require("vscode-nls");
let localize = nls.loadMessageBundle(__filename);
const Mode2ScriptKind = {
    'typescript': 'TS',
    'typescriptreact': 'TSX',
    'javascript': 'JS',
    'javascriptreact': 'JSX'
};
class SyncedBuffer {
    constructor(document, filepath, diagnosticRequestor, client) {
        this.document = document;
        this.filepath = filepath;
        this.diagnosticRequestor = diagnosticRequestor;
        this.client = client;
    }
    open() {
        const args = {
            file: this.filepath,
            fileContent: this.document.getText(),
        };
        if (this.client.apiVersion.has203Features()) {
            const scriptKind = Mode2ScriptKind[this.document.languageId];
            if (scriptKind) {
                args.scriptKindName = scriptKind;
            }
        }
        if (vscode_1.workspace.rootPath && this.client.apiVersion.has230Features()) {
            args.projectRootPath = vscode_1.workspace.rootPath;
        }
        this.client.execute('open', args, false);
    }
    get lineCount() {
        return this.document.lineCount;
    }
    close() {
        let args = {
            file: this.filepath
        };
        this.client.execute('close', args, false);
    }
    onContentChanged(events) {
        let filePath = this.client.normalizePath(this.document.uri);
        if (!filePath) {
            return;
        }
        for (let i = 0; i < events.length; i++) {
            let event = events[i];
            let range = event.range;
            let text = event.text;
            let args = {
                file: filePath,
                line: range.start.line + 1,
                offset: range.start.character + 1,
                endLine: range.end.line + 1,
                endOffset: range.end.character + 1,
                insertString: text
            };
            this.client.execute('change', args, false);
        }
        this.diagnosticRequestor.requestDiagnostic(filePath);
    }
}
const checkTscVersionSettingKey = 'check.tscVersion';
class BufferSyncSupport {
    constructor(client, modeIds, diagnostics, extensions, validate = true) {
        this.disposables = [];
        this.client = client;
        this.modeIds = Object.create(null);
        modeIds.forEach(modeId => this.modeIds[modeId] = true);
        this.diagnostics = diagnostics;
        this.extensions = extensions;
        this._validate = validate;
        this.projectValidationRequested = false;
        this.pendingDiagnostics = Object.create(null);
        this.diagnosticDelayer = new async_1.Delayer(300);
        this.syncedBuffers = Object.create(null);
        this.emitQueue = new linkedMap_1.default();
        const tsConfig = vscode_1.workspace.getConfiguration('typescript');
        this.checkGlobalTSCVersion = client.checkGlobalTSCVersion && this.modeIds['typescript'] === true && tsConfig.get(checkTscVersionSettingKey, true);
    }
    listen() {
        vscode_1.workspace.onDidOpenTextDocument(this.onDidOpenTextDocument, this, this.disposables);
        vscode_1.workspace.onDidCloseTextDocument(this.onDidCloseTextDocument, this, this.disposables);
        vscode_1.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument, this, this.disposables);
        vscode_1.workspace.onDidSaveTextDocument(this.onDidSaveTextDocument, this, this.disposables);
        vscode_1.workspace.textDocuments.forEach(this.onDidOpenTextDocument, this);
    }
    get validate() {
        return this._validate;
    }
    set validate(value) {
        this._validate = value;
    }
    handles(file) {
        return !!this.syncedBuffers[file];
    }
    reOpenDocuments() {
        Object.keys(this.syncedBuffers).forEach(key => {
            this.syncedBuffers[key].open();
        });
    }
    dispose() {
        while (this.disposables.length) {
            const obj = this.disposables.pop();
            if (obj) {
                obj.dispose();
            }
        }
    }
    onDidOpenTextDocument(document) {
        if (!this.modeIds[document.languageId]) {
            return;
        }
        let resource = document.uri;
        let filepath = this.client.normalizePath(resource);
        if (!filepath) {
            return;
        }
        let syncedBuffer = new SyncedBuffer(document, filepath, this, this.client);
        this.syncedBuffers[filepath] = syncedBuffer;
        syncedBuffer.open();
        this.requestDiagnostic(filepath);
        if (document.languageId === 'typescript' || document.languageId === 'typescriptreact') {
            this.checkTSCVersion();
        }
    }
    onDidCloseTextDocument(document) {
        let filepath = this.client.normalizePath(document.uri);
        if (!filepath) {
            return;
        }
        let syncedBuffer = this.syncedBuffers[filepath];
        if (!syncedBuffer) {
            return;
        }
        this.diagnostics.delete(filepath);
        delete this.syncedBuffers[filepath];
        syncedBuffer.close();
        if (!fs.existsSync(filepath)) {
            this.requestAllDiagnostics();
        }
    }
    onDidChangeTextDocument(e) {
        let filepath = this.client.normalizePath(e.document.uri);
        if (!filepath) {
            return;
        }
        let syncedBuffer = this.syncedBuffers[filepath];
        if (!syncedBuffer) {
            return;
        }
        syncedBuffer.onContentChanged(e.contentChanges);
    }
    onDidSaveTextDocument(document) {
        let filepath = this.client.normalizePath(document.uri);
        if (!filepath) {
            return;
        }
        let syncedBuffer = this.syncedBuffers[filepath];
        if (!syncedBuffer) {
            return;
        }
    }
    requestAllDiagnostics() {
        if (!this._validate) {
            return;
        }
        Object.keys(this.syncedBuffers).forEach(filePath => this.pendingDiagnostics[filePath] = Date.now());
        this.diagnosticDelayer.trigger(() => {
            this.sendPendingDiagnostics();
        }, 200);
    }
    requestDiagnostic(file) {
        if (!this._validate || this.client.experimentalAutoBuild) {
            return;
        }
        this.pendingDiagnostics[file] = Date.now();
        let buffer = this.syncedBuffers[file];
        let delay = 300;
        if (buffer) {
            let lineCount = buffer.lineCount;
            delay = Math.min(Math.max(Math.ceil(lineCount / 20), 300), 800);
        }
        this.diagnosticDelayer.trigger(() => {
            this.sendPendingDiagnostics();
        }, delay);
    }
    sendPendingDiagnostics() {
        if (!this._validate) {
            return;
        }
        let files = Object.keys(this.pendingDiagnostics).map((key) => {
            return {
                file: key,
                time: this.pendingDiagnostics[key]
            };
        }).sort((a, b) => {
            return a.time - b.time;
        }).map((value) => {
            return value.file;
        });
        // Add all open TS buffers to the geterr request. They might be visible
        Object.keys(this.syncedBuffers).forEach((file) => {
            if (!this.pendingDiagnostics[file]) {
                files.push(file);
            }
        });
        let args = {
            delay: 0,
            files: files
        };
        this.client.execute('geterr', args, false);
        this.pendingDiagnostics = Object.create(null);
    }
    checkTSCVersion() {
        if (!this.checkGlobalTSCVersion) {
            return;
        }
        this.checkGlobalTSCVersion = false;
        function openUrl(url) {
            let cmd;
            switch (process.platform) {
                case 'darwin':
                    cmd = 'open';
                    break;
                case 'win32':
                    cmd = 'start';
                    break;
                default:
                    cmd = 'xdg-open';
            }
            return cp.exec(cmd + ' ' + url);
        }
        let tscVersion = undefined;
        try {
            let out = cp.execSync('tsc --version', { encoding: 'utf8' });
            if (out) {
                let matches = out.trim().match(/Version\s*(.*)$/);
                if (matches && matches.length === 2) {
                    tscVersion = matches[1];
                }
            }
        }
        catch (error) {
        }
        if (tscVersion && tscVersion !== this.client.apiVersion.versionString) {
            vscode_1.window.showInformationMessage(localize(0, null, tscVersion, this.client.apiVersion.versionString), {
                title: localize(1, null),
                id: 1
            }, {
                title: localize(2, null),
                id: 2
            }, {
                title: localize(3, null),
                id: 3,
                isCloseAffordance: true
            }).then((selected) => {
                if (!selected || selected.id === 3) {
                    return;
                }
                switch (selected.id) {
                    case 1:
                        openUrl('http://go.microsoft.com/fwlink/?LinkId=826239');
                        break;
                    case 2:
                        const tsConfig = vscode_1.workspace.getConfiguration('typescript');
                        tsConfig.update(checkTscVersionSettingKey, false, true);
                        vscode_1.window.showInformationMessage(localize(4, null));
                        break;
                }
            });
        }
    }
}
exports.default = BufferSyncSupport;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\typescript\out/features\bufferSyncSupport.js.map
