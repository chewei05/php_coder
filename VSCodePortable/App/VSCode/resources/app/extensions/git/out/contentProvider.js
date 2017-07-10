/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const decorators_1 = require("./decorators");
const uri_1 = require("./uri");
const THREE_MINUTES = 1000 * 60 * 3;
const FIVE_MINUTES = 1000 * 60 * 5;
class GitContentProvider {
    constructor(model) {
        this.model = model;
        this.onDidChangeEmitter = new vscode_1.EventEmitter();
        this.cache = Object.create(null);
        this.disposables = [];
        this.disposables.push(model.onDidChangeRepository(this.eventuallyFireChangeEvents, this), vscode_1.workspace.registerTextDocumentContentProvider('git', this));
        setInterval(() => this.cleanup(), FIVE_MINUTES);
    }
    get onDidChange() { return this.onDidChangeEmitter.event; }
    eventuallyFireChangeEvents() {
        this.fireChangeEvents();
    }
    fireChangeEvents() {
        Object.keys(this.cache)
            .forEach(key => this.onDidChangeEmitter.fire(this.cache[key].uri));
    }
    provideTextDocumentContent(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = uri.toString();
            const timestamp = new Date().getTime();
            const cacheValue = { uri, timestamp };
            this.cache[cacheKey] = cacheValue;
            let { path, ref } = uri_1.fromGitUri(uri);
            if (ref === '~') {
                const fileUri = vscode_1.Uri.file(path);
                const uriString = fileUri.toString();
                const [indexStatus] = this.model.indexGroup.resources.filter(r => r.original.toString() === uriString);
                ref = indexStatus ? '' : 'HEAD';
            }
            try {
                return yield this.model.show(ref, path);
            }
            catch (err) {
                return '';
            }
        });
    }
    cleanup() {
        const now = new Date().getTime();
        const cache = Object.create(null);
        Object.keys(this.cache).forEach(key => {
            const row = this.cache[key];
            const isOpen = vscode_1.window.visibleTextEditors.some(e => e.document.uri.fsPath === row.uri.fsPath);
            if (isOpen || now - row.timestamp < THREE_MINUTES) {
                cache[row.uri.toString()] = row;
            }
        });
        this.cache = cache;
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
__decorate([
    decorators_1.debounce(1100)
], GitContentProvider.prototype, "eventuallyFireChangeEvents", null);
exports.GitContentProvider = GitContentProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\git\out/contentProvider.js.map
