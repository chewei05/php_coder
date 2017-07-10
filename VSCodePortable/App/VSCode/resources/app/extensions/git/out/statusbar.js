/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const git_1 = require("./git");
const model_1 = require("./model");
const util_1 = require("./util");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle(__filename);
class CheckoutStatusBar {
    constructor(model) {
        this.model = model;
        this._onDidChange = new vscode_1.EventEmitter();
        this.disposables = [];
        model.onDidChange(this._onDidChange.fire, this._onDidChange, this.disposables);
    }
    get onDidChange() { return this._onDidChange.event; }
    get command() {
        const HEAD = this.model.HEAD;
        if (!HEAD) {
            return undefined;
        }
        const tag = this.model.refs.filter(iref => iref.type === git_1.RefType.Tag && iref.commit === HEAD.commit)[0];
        const tagName = tag && tag.name;
        const head = HEAD.name || tagName || (HEAD.commit || '').substr(0, 8);
        const title = '$(git-branch) '
            + head
            + (this.model.workingTreeGroup.resources.length > 0 ? '*' : '')
            + (this.model.indexGroup.resources.length > 0 ? '+' : '')
            + (this.model.mergeGroup.resources.length > 0 ? '!' : '');
        return {
            command: 'git.checkout',
            tooltip: localize(0, null),
            title
        };
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
class SyncStatusBar {
    constructor(model) {
        this.model = model;
        this._onDidChange = new vscode_1.EventEmitter();
        this.disposables = [];
        this._state = SyncStatusBar.StartState;
        model.onDidChange(this.onModelChange, this, this.disposables);
        model.onDidChangeOperations(this.onOperationsChange, this, this.disposables);
        this._onDidChange.fire();
    }
    get onDidChange() { return this._onDidChange.event; }
    get state() { return this._state; }
    set state(state) {
        this._state = state;
        this._onDidChange.fire();
    }
    onOperationsChange() {
        this.state = Object.assign({}, this.state, { isSyncRunning: this.model.operations.isRunning(model_1.Operation.Sync) });
    }
    onModelChange() {
        this.state = Object.assign({}, this.state, { hasRemotes: this.model.remotes.length > 0, HEAD: this.model.HEAD });
    }
    get command() {
        if (!this.state.hasRemotes) {
            return undefined;
        }
        const HEAD = this.state.HEAD;
        let icon = '$(sync)';
        let text = '';
        let command = '';
        let tooltip = '';
        if (HEAD && HEAD.name && HEAD.commit) {
            if (HEAD.upstream) {
                if (HEAD.ahead || HEAD.behind) {
                    text += `${HEAD.behind}↓ ${HEAD.ahead}↑`;
                }
                command = 'git.sync';
                tooltip = localize(1, null);
            }
            else {
                icon = '$(cloud-upload)';
                command = 'git.publish';
                tooltip = localize(2, null);
            }
        }
        else {
            command = '';
            tooltip = '';
        }
        if (this.state.isSyncRunning) {
            icon = '$(sync~spin)';
            text = '';
            command = '';
            tooltip = localize(3, null);
        }
        return {
            command,
            title: [icon, text].join(' ').trim(),
            tooltip
        };
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
SyncStatusBar.StartState = {
    isSyncRunning: false,
    hasRemotes: false,
    HEAD: undefined
};
class StatusBarCommands {
    constructor(model) {
        this.disposables = [];
        this.syncStatusBar = new SyncStatusBar(model);
        this.checkoutStatusBar = new CheckoutStatusBar(model);
    }
    get onDidChange() {
        return util_1.anyEvent(this.syncStatusBar.onDidChange, this.checkoutStatusBar.onDidChange);
    }
    get commands() {
        const result = [];
        const checkout = this.checkoutStatusBar.command;
        if (checkout) {
            result.push(checkout);
        }
        const sync = this.syncStatusBar.command;
        if (sync) {
            result.push(sync);
        }
        return result;
    }
    dispose() {
        this.syncStatusBar.dispose();
        this.checkoutStatusBar.dispose();
        this.disposables = util_1.dispose(this.disposables);
    }
}
exports.StatusBarCommands = StatusBarCommands;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\git\out/statusbar.js.map
