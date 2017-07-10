/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* --------------------------------------------------------------------------------------------
 * Includes code from typescript-sublime-plugin project, obtained from
 * https://github.com/Microsoft/TypeScript-Sublime-Plugin/blob/master/TypeScript%20Indent.tmPreferences
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
// This must be the first statement otherwise modules might got loaded with
// the wrong locale.
const nls = require("vscode-nls");
nls.config({ locale: vscode_1.env.language });
const localize = nls.loadMessageBundle(__filename);
const path = require("path");
const PConst = require("./protocol.const");
const typescriptServiceClient_1 = require("./typescriptServiceClient");
const hoverProvider_1 = require("./features/hoverProvider");
const definitionProvider_1 = require("./features/definitionProvider");
const implementationProvider_1 = require("./features/implementationProvider");
const typeDefinitionProvider_1 = require("./features/typeDefinitionProvider");
const documentHighlightProvider_1 = require("./features/documentHighlightProvider");
const referenceProvider_1 = require("./features/referenceProvider");
const documentSymbolProvider_1 = require("./features/documentSymbolProvider");
const signatureHelpProvider_1 = require("./features/signatureHelpProvider");
const renameProvider_1 = require("./features/renameProvider");
const formattingProvider_1 = require("./features/formattingProvider");
const bufferSyncSupport_1 = require("./features/bufferSyncSupport");
const completionItemProvider_1 = require("./features/completionItemProvider");
const workspaceSymbolProvider_1 = require("./features/workspaceSymbolProvider");
const codeActionProvider_1 = require("./features/codeActionProvider");
const referencesCodeLensProvider_1 = require("./features/referencesCodeLensProvider");
const jsDocCompletionProvider_1 = require("./features/jsDocCompletionProvider");
const implementationsCodeLensProvider_1 = require("./features/implementationsCodeLensProvider");
const BuildStatus = require("./utils/buildStatus");
const ProjectStatus = require("./utils/projectStatus");
const typingsStatus_1 = require("./utils/typingsStatus");
const VersionStatus = require("./utils/versionStatus");
var ProjectConfigAction;
(function (ProjectConfigAction) {
    ProjectConfigAction[ProjectConfigAction["None"] = 0] = "None";
    ProjectConfigAction[ProjectConfigAction["CreateConfig"] = 1] = "CreateConfig";
    ProjectConfigAction[ProjectConfigAction["LearnMore"] = 2] = "LearnMore";
})(ProjectConfigAction || (ProjectConfigAction = {}));
function activate(context) {
    const MODE_ID_TS = 'typescript';
    const MODE_ID_TSX = 'typescriptreact';
    const MODE_ID_JS = 'javascript';
    const MODE_ID_JSX = 'javascriptreact';
    const clientHost = new TypeScriptServiceClientHost([
        {
            id: 'typescript',
            diagnosticSource: 'ts',
            modeIds: [MODE_ID_TS, MODE_ID_TSX],
            extensions: ['.ts', '.tsx'],
            configFile: 'tsconfig.json'
        },
        {
            id: 'javascript',
            diagnosticSource: 'js',
            modeIds: [MODE_ID_JS, MODE_ID_JSX],
            extensions: ['.js', '.jsx'],
            configFile: 'jsconfig.json'
        }
    ], context.storagePath, context.globalState, context.workspaceState);
    context.subscriptions.push(clientHost);
    const client = clientHost.serviceClient;
    context.subscriptions.push(vscode_1.commands.registerCommand('typescript.reloadProjects', () => {
        clientHost.reloadProjects();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('javascript.reloadProjects', () => {
        clientHost.reloadProjects();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('typescript.selectTypeScriptVersion', () => {
        client.onVersionStatusClicked();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('typescript.openTsServerLog', () => {
        client.openTsServerLogFile();
    }));
    const goToProjectConfig = (isTypeScript) => {
        const editor = vscode_1.window.activeTextEditor;
        if (editor) {
            clientHost.goToProjectConfig(isTypeScript, editor.document.uri);
        }
    };
    context.subscriptions.push(vscode_1.commands.registerCommand('typescript.goToProjectConfig', goToProjectConfig.bind(null, true)));
    context.subscriptions.push(vscode_1.commands.registerCommand('javascript.goToProjectConfig', goToProjectConfig.bind(null, false)));
    const jsDocCompletionCommand = new jsDocCompletionProvider_1.TryCompleteJsDocCommand(client);
    context.subscriptions.push(vscode_1.commands.registerCommand(jsDocCompletionProvider_1.TryCompleteJsDocCommand.COMMAND_NAME, jsDocCompletionCommand.tryCompleteJsDoc, jsDocCompletionCommand));
    vscode_1.window.onDidChangeActiveTextEditor(VersionStatus.showHideStatus, null, context.subscriptions);
    client.onReady().then(() => {
        context.subscriptions.push(ProjectStatus.create(client, path => new Promise(resolve => setTimeout(() => resolve(clientHost.handles(path)), 750)), context.workspaceState));
    }, () => {
        // Nothing to do here. The client did show a message;
    });
    BuildStatus.update({ queueLength: 0 });
}
exports.activate = activate;
const validateSetting = 'validate.enable';
class LanguageProvider {
    constructor(client, description) {
        this.client = client;
        this.description = description;
        this._validate = true;
        this.disposables = [];
        this.versionDependentDisposables = [];
        this.extensions = Object.create(null);
        description.extensions.forEach(extension => this.extensions[extension] = true);
        this.bufferSyncSupport = new bufferSyncSupport_1.default(client, description.modeIds, {
            delete: (file) => {
                this.currentDiagnostics.delete(client.asUrl(file));
            }
        }, this.extensions);
        this.syntaxDiagnostics = Object.create(null);
        this.currentDiagnostics = vscode_1.languages.createDiagnosticCollection(description.id);
        this.typingsStatus = new typingsStatus_1.default(client);
        new typingsStatus_1.AtaProgressReporter(client);
        vscode_1.workspace.onDidChangeConfiguration(this.configurationChanged, this, this.disposables);
        this.configurationChanged();
        client.onReady().then(() => {
            this.registerProviders(client);
            this.bufferSyncSupport.listen();
        }, () => {
            // Nothing to do here. The client did show a message;
        });
    }
    dispose() {
        if (this.formattingProviderRegistration) {
            this.formattingProviderRegistration.dispose();
        }
        while (this.disposables.length) {
            const obj = this.disposables.pop();
            if (obj) {
                obj.dispose();
            }
        }
        while (this.versionDependentDisposables.length) {
            const obj = this.versionDependentDisposables.pop();
            if (obj) {
                obj.dispose();
            }
        }
        this.typingsStatus.dispose();
        this.currentDiagnostics.dispose();
        this.bufferSyncSupport.dispose();
    }
    registerProviders(client) {
        const selector = this.description.modeIds;
        const config = vscode_1.workspace.getConfiguration(this.id);
        this.completionItemProvider = new completionItemProvider_1.default(client, this.typingsStatus);
        this.completionItemProvider.updateConfiguration();
        this.disposables.push(vscode_1.languages.registerCompletionItemProvider(selector, this.completionItemProvider, '.'));
        this.formattingProvider = new formattingProvider_1.default(client);
        this.formattingProvider.updateConfiguration(config);
        this.disposables.push(vscode_1.languages.registerOnTypeFormattingEditProvider(selector, this.formattingProvider, ';', '}', '\n'));
        if (this.formattingProvider.isEnabled()) {
            this.formattingProviderRegistration = vscode_1.languages.registerDocumentRangeFormattingEditProvider(selector, this.formattingProvider);
        }
        this.JsDocCompletionProvider = new jsDocCompletionProvider_1.JsDocCompletionProvider(client);
        this.JsDocCompletionProvider.updateConfiguration();
        this.disposables.push(vscode_1.languages.registerCompletionItemProvider(selector, this.JsDocCompletionProvider, '*'));
        this.disposables.push(vscode_1.languages.registerHoverProvider(selector, new hoverProvider_1.default(client)));
        this.disposables.push(vscode_1.languages.registerDefinitionProvider(selector, new definitionProvider_1.default(client)));
        this.disposables.push(vscode_1.languages.registerDocumentHighlightProvider(selector, new documentHighlightProvider_1.default(client)));
        this.disposables.push(vscode_1.languages.registerReferenceProvider(selector, new referenceProvider_1.default(client)));
        this.disposables.push(vscode_1.languages.registerDocumentSymbolProvider(selector, new documentSymbolProvider_1.default(client)));
        this.disposables.push(vscode_1.languages.registerSignatureHelpProvider(selector, new signatureHelpProvider_1.default(client), '(', ','));
        this.disposables.push(vscode_1.languages.registerRenameProvider(selector, new renameProvider_1.default(client)));
        this.referenceCodeLensProvider = new referencesCodeLensProvider_1.default(client);
        this.referenceCodeLensProvider.updateConfiguration();
        this.disposables.push(vscode_1.languages.registerCodeLensProvider(selector, this.referenceCodeLensProvider));
        this.implementationCodeLensProvider = new implementationsCodeLensProvider_1.default(client);
        this.implementationCodeLensProvider.updateConfiguration();
        this.disposables.push(vscode_1.languages.registerCodeLensProvider(selector, this.implementationCodeLensProvider));
        this.disposables.push(vscode_1.languages.registerCodeActionsProvider(selector, new codeActionProvider_1.default(client, this.description.id)));
        this.registerVersionDependentProviders();
        this.description.modeIds.forEach(modeId => {
            this.disposables.push(vscode_1.languages.registerWorkspaceSymbolProvider(new workspaceSymbolProvider_1.default(client, modeId)));
            this.disposables.push(vscode_1.languages.setLanguageConfiguration(modeId, {
                indentationRules: {
                    // ^(.*\*/)?\s*\}.*$
                    decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
                    // ^.*\{[^}"']*$
                    increaseIndentPattern: /^.*\{[^}"'`]*$/
                },
                wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
                onEnterRules: [
                    {
                        // e.g. /** | */
                        beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                        afterText: /^\s*\*\/$/,
                        action: { indentAction: vscode_1.IndentAction.IndentOutdent, appendText: ' * ' }
                    }, {
                        // e.g. /** ...|
                        beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                        action: { indentAction: vscode_1.IndentAction.None, appendText: ' * ' }
                    }, {
                        // e.g.  * ...|
                        beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
                        action: { indentAction: vscode_1.IndentAction.None, appendText: '* ' }
                    }, {
                        // e.g.  */|
                        beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
                        action: { indentAction: vscode_1.IndentAction.None, removeText: 1 }
                    },
                    {
                        // e.g.  *-----*/|
                        beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
                        action: { indentAction: vscode_1.IndentAction.None, removeText: 1 }
                    }
                ]
            }));
            const EMPTY_ELEMENTS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'];
            this.disposables.push(vscode_1.languages.setLanguageConfiguration('jsx-tags', {
                wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/g,
                onEnterRules: [
                    {
                        beforeText: new RegExp(`<(?!(?:${EMPTY_ELEMENTS.join('|')}))([_:\\w][_:\\w-.\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
                        afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>$/i,
                        action: { indentAction: vscode_1.IndentAction.IndentOutdent }
                    },
                    {
                        beforeText: new RegExp(`<(?!(?:${EMPTY_ELEMENTS.join('|')}))(\\w[\\w\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
                        action: { indentAction: vscode_1.IndentAction.Indent }
                    }
                ],
            }));
        });
    }
    configurationChanged() {
        const config = vscode_1.workspace.getConfiguration(this.id);
        this.updateValidate(config.get(validateSetting, true));
        if (this.completionItemProvider) {
            this.completionItemProvider.updateConfiguration();
        }
        if (this.referenceCodeLensProvider) {
            this.referenceCodeLensProvider.updateConfiguration();
        }
        if (this.implementationCodeLensProvider) {
            this.implementationCodeLensProvider.updateConfiguration();
        }
        if (this.formattingProvider) {
            this.formattingProvider.updateConfiguration(config);
            if (!this.formattingProvider.isEnabled() && this.formattingProviderRegistration) {
                this.formattingProviderRegistration.dispose();
                this.formattingProviderRegistration = null;
            }
            else if (this.formattingProvider.isEnabled() && !this.formattingProviderRegistration) {
                this.formattingProviderRegistration = vscode_1.languages.registerDocumentRangeFormattingEditProvider(this.description.modeIds, this.formattingProvider);
            }
        }
        if (this.JsDocCompletionProvider) {
            this.JsDocCompletionProvider.updateConfiguration();
        }
    }
    handles(file) {
        const extension = path.extname(file);
        if ((extension && this.extensions[extension]) || this.bufferSyncSupport.handles(file)) {
            return true;
        }
        const basename = path.basename(file);
        return !!basename && basename === this.description.configFile;
    }
    get id() {
        return this.description.id;
    }
    get diagnosticSource() {
        return this.description.diagnosticSource;
    }
    updateValidate(value) {
        if (this._validate === value) {
            return;
        }
        this._validate = value;
        this.bufferSyncSupport.validate = value;
        if (value) {
            this.triggerAllDiagnostics();
        }
        else {
            this.syntaxDiagnostics = Object.create(null);
            this.currentDiagnostics.clear();
        }
    }
    reInitialize() {
        this.currentDiagnostics.clear();
        this.syntaxDiagnostics = Object.create(null);
        this.bufferSyncSupport.reOpenDocuments();
        this.bufferSyncSupport.requestAllDiagnostics();
        this.registerVersionDependentProviders();
    }
    registerVersionDependentProviders() {
        while (this.versionDependentDisposables.length) {
            const obj = this.versionDependentDisposables.pop();
            if (obj) {
                obj.dispose();
            }
        }
        this.versionDependentDisposables = [];
        if (!this.client) {
            return;
        }
        const selector = this.description.modeIds;
        if (this.client.apiVersion.has220Features()) {
            this.versionDependentDisposables.push(vscode_1.languages.registerImplementationProvider(selector, new implementationProvider_1.default(this.client)));
        }
        if (this.client.apiVersion.has213Features()) {
            this.versionDependentDisposables.push(vscode_1.languages.registerTypeDefinitionProvider(selector, new typeDefinitionProvider_1.default(this.client)));
        }
    }
    triggerAllDiagnostics() {
        this.bufferSyncSupport.requestAllDiagnostics();
    }
    syntaxDiagnosticsReceived(file, diagnostics) {
        this.syntaxDiagnostics[file] = diagnostics;
    }
    semanticDiagnosticsReceived(file, diagnostics) {
        const syntaxMarkers = this.syntaxDiagnostics[file];
        if (syntaxMarkers) {
            delete this.syntaxDiagnostics[file];
            diagnostics = syntaxMarkers.concat(diagnostics);
        }
        this.currentDiagnostics.set(this.client.asUrl(file), diagnostics);
    }
    configFileDiagnosticsReceived(file, diagnostics) {
        this.currentDiagnostics.set(this.client.asUrl(file), diagnostics);
    }
}
class TypeScriptServiceClientHost {
    constructor(descriptions, storagePath, globalState, workspaceState) {
        this.disposables = [];
        const handleProjectCreateOrDelete = () => {
            this.client.execute('reloadProjects', null, false);
            this.triggerAllDiagnostics();
        };
        const handleProjectChange = () => {
            setTimeout(() => {
                this.triggerAllDiagnostics();
            }, 1500);
        };
        const configFileWatcher = vscode_1.workspace.createFileSystemWatcher('**/[tj]sconfig.json');
        this.disposables.push(configFileWatcher);
        configFileWatcher.onDidCreate(handleProjectCreateOrDelete, this, this.disposables);
        configFileWatcher.onDidDelete(handleProjectCreateOrDelete, this, this.disposables);
        configFileWatcher.onDidChange(handleProjectChange, this, this.disposables);
        this.client = new typescriptServiceClient_1.default(this, storagePath, globalState, workspaceState, this.disposables);
        this.languages = [];
        this.languagePerId = Object.create(null);
        for (const description of descriptions) {
            const manager = new LanguageProvider(this.client, description);
            this.languages.push(manager);
            this.disposables.push(manager);
            this.languagePerId[description.id] = manager;
        }
    }
    dispose() {
        while (this.disposables.length) {
            const obj = this.disposables.pop();
            if (obj) {
                obj.dispose();
            }
        }
        this.configFileWatcher.dispose();
    }
    get serviceClient() {
        return this.client;
    }
    restartTsServer() {
        this.client.restartTsServer();
        if (this.languages) {
            for (const provider of this.languages) {
                provider.reInitialize();
            }
        }
    }
    reloadProjects() {
        this.client.execute('reloadProjects', null, false);
        this.triggerAllDiagnostics();
    }
    handles(file) {
        return !!this.findLanguage(file);
    }
    goToProjectConfig(isTypeScriptProject, resource) {
        const rootPath = vscode_1.workspace.rootPath;
        if (!rootPath) {
            vscode_1.window.showInformationMessage(localize(0, null));
            return;
        }
        const file = this.client.normalizePath(resource);
        // TSServer errors when 'projectInfo' is invoked on a non js/ts file
        if (!file || !this.handles(file)) {
            vscode_1.window.showWarningMessage(localize(1, null));
            return;
        }
        return this.client.execute('projectInfo', { file, needFileNameList: false }).then(res => {
            if (!res || !res.body) {
                return vscode_1.window.showWarningMessage(localize(2, null))
                    .then(() => void 0);
            }
            const { configFileName } = res.body;
            if (configFileName && configFileName.indexOf('/dev/null/') !== 0) {
                return vscode_1.workspace.openTextDocument(configFileName)
                    .then(doc => vscode_1.window.showTextDocument(doc, vscode_1.window.activeTextEditor ? vscode_1.window.activeTextEditor.viewColumn : undefined));
            }
            return vscode_1.window.showInformationMessage((isTypeScriptProject
                ? localize(3, null)
                : localize(4, null)), {
                title: isTypeScriptProject
                    ? localize(5, null)
                    : localize(6, null),
                id: ProjectConfigAction.CreateConfig
            }, {
                title: localize(7, null),
                id: ProjectConfigAction.LearnMore
            }).then(selected => {
                switch (selected && selected.id) {
                    case ProjectConfigAction.CreateConfig:
                        const configFile = vscode_1.Uri.file(path.join(rootPath, isTypeScriptProject ? 'tsconfig.json' : 'jsconfig.json'));
                        return vscode_1.workspace.openTextDocument(configFile)
                            .then(undefined, _ => vscode_1.workspace.openTextDocument(configFile.with({ scheme: 'untitled' })))
                            .then(doc => vscode_1.window.showTextDocument(doc, vscode_1.window.activeTextEditor ? vscode_1.window.activeTextEditor.viewColumn : undefined));
                    case ProjectConfigAction.LearnMore:
                        if (isTypeScriptProject) {
                            vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse('https://go.microsoft.com/fwlink/?linkid=841896'));
                        }
                        else {
                            vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse('https://go.microsoft.com/fwlink/?linkid=759670'));
                        }
                        return;
                    default:
                        return Promise.resolve(undefined);
                }
            });
        });
    }
    findLanguage(file) {
        for (let i = 0; i < this.languages.length; i++) {
            let language = this.languages[i];
            if (language.handles(file)) {
                return language;
            }
        }
        return null;
    }
    triggerAllDiagnostics() {
        Object.keys(this.languagePerId).forEach(key => this.languagePerId[key].triggerAllDiagnostics());
    }
    /* internal */ populateService() {
        // See https://github.com/Microsoft/TypeScript/issues/5530
        vscode_1.workspace.saveAll(false).then(_ => {
            Object.keys(this.languagePerId).forEach(key => this.languagePerId[key].reInitialize());
        });
    }
    /* internal */ syntaxDiagnosticsReceived(event) {
        let body = event.body;
        if (body && body.diagnostics) {
            let language = this.findLanguage(body.file);
            if (language) {
                language.syntaxDiagnosticsReceived(body.file, this.createMarkerDatas(body.diagnostics, language.diagnosticSource));
            }
        }
    }
    /* internal */ semanticDiagnosticsReceived(event) {
        let body = event.body;
        if (body && body.diagnostics) {
            let language = this.findLanguage(body.file);
            if (language) {
                language.semanticDiagnosticsReceived(body.file, this.createMarkerDatas(body.diagnostics, language.diagnosticSource));
            }
        }
        /*
        if (Is.defined(body.queueLength)) {
            BuildStatus.update({ queueLength: body.queueLength });
        }
        */
    }
    /* internal */ configFileDiagnosticsReceived(event) {
        // See https://github.com/Microsoft/TypeScript/issues/10384
        const body = event.body;
        if (!body || !body.diagnostics || !body.configFile) {
            return;
        }
        const language = body.triggerFile ? this.findLanguage(body.triggerFile) : this.findLanguage(body.configFile);
        if (!language) {
            return;
        }
        if (body.diagnostics.length === 0) {
            language.configFileDiagnosticsReceived(body.configFile, []);
        }
        else if (body.diagnostics.length >= 1) {
            vscode_1.workspace.openTextDocument(vscode_1.Uri.file(body.configFile)).then((document) => {
                let curly = undefined;
                let nonCurly = undefined;
                let diagnostic;
                for (let index = 0; index < document.lineCount; index++) {
                    const line = document.lineAt(index);
                    const text = line.text;
                    const firstNonWhitespaceCharacterIndex = line.firstNonWhitespaceCharacterIndex;
                    if (firstNonWhitespaceCharacterIndex < text.length) {
                        if (text.charAt(firstNonWhitespaceCharacterIndex) === '{') {
                            curly = [index, firstNonWhitespaceCharacterIndex, firstNonWhitespaceCharacterIndex + 1];
                            break;
                        }
                        else {
                            const matches = /\s*([^\s]*)(?:\s*|$)/.exec(text.substr(firstNonWhitespaceCharacterIndex));
                            if (matches && matches.length >= 1) {
                                nonCurly = [index, firstNonWhitespaceCharacterIndex, firstNonWhitespaceCharacterIndex + matches[1].length];
                            }
                        }
                    }
                }
                const match = curly || nonCurly;
                if (match) {
                    diagnostic = new vscode_1.Diagnostic(new vscode_1.Range(match[0], match[1], match[0], match[2]), body.diagnostics[0].text);
                }
                else {
                    diagnostic = new vscode_1.Diagnostic(new vscode_1.Range(0, 0, 0, 0), body.diagnostics[0].text);
                }
                if (diagnostic) {
                    diagnostic.source = language.diagnosticSource;
                    language.configFileDiagnosticsReceived(body.configFile, [diagnostic]);
                }
            }, _error => {
                language.configFileDiagnosticsReceived(body.configFile, [new vscode_1.Diagnostic(new vscode_1.Range(0, 0, 0, 0), body.diagnostics[0].text)]);
            });
        }
    }
    createMarkerDatas(diagnostics, source) {
        const result = [];
        for (let diagnostic of diagnostics) {
            const { start, end, text } = diagnostic;
            const range = new vscode_1.Range(start.line - 1, start.offset - 1, end.line - 1, end.offset - 1);
            const converted = new vscode_1.Diagnostic(range, text);
            converted.severity = this.getDiagnosticSeverity(diagnostic);
            converted.source = diagnostic.source || source;
            converted.code = '' + diagnostic.code;
            result.push(converted);
        }
        return result;
    }
    getDiagnosticSeverity(diagnostic) {
        switch (diagnostic.category) {
            case PConst.DiagnosticCategory.error:
                return vscode_1.DiagnosticSeverity.Error;
            case PConst.DiagnosticCategory.warning:
                return vscode_1.DiagnosticSeverity.Warning;
            default:
                return vscode_1.DiagnosticSeverity.Error;
        }
    }
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\typescript\out/typescriptMain.js.map
