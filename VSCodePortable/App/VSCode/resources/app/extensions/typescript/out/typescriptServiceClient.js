/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const os = require("os");
const electron = require("./utils/electron");
const wireProtocol_1 = require("./utils/wireProtocol");
const vscode_1 = require("vscode");
const typescriptService_1 = require("./typescriptService");
const VersionStatus = require("./utils/versionStatus");
const is = require("./utils/is");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle(__filename);
var Trace;
(function (Trace) {
    Trace[Trace["Off"] = 0] = "Off";
    Trace[Trace["Messages"] = 1] = "Messages";
    Trace[Trace["Verbose"] = 2] = "Verbose";
})(Trace || (Trace = {}));
(function (Trace) {
    function fromString(value) {
        value = value.toLowerCase();
        switch (value) {
            case 'off':
                return Trace.Off;
            case 'messages':
                return Trace.Messages;
            case 'verbose':
                return Trace.Verbose;
            default:
                return Trace.Off;
        }
    }
    Trace.fromString = fromString;
})(Trace || (Trace = {}));
var TsServerLogLevel;
(function (TsServerLogLevel) {
    TsServerLogLevel[TsServerLogLevel["Off"] = 0] = "Off";
    TsServerLogLevel[TsServerLogLevel["Normal"] = 1] = "Normal";
    TsServerLogLevel[TsServerLogLevel["Terse"] = 2] = "Terse";
    TsServerLogLevel[TsServerLogLevel["Verbose"] = 3] = "Verbose";
})(TsServerLogLevel || (TsServerLogLevel = {}));
(function (TsServerLogLevel) {
    function fromString(value) {
        switch (value && value.toLowerCase()) {
            case 'normal':
                return TsServerLogLevel.Normal;
            case 'terse':
                return TsServerLogLevel.Terse;
            case 'verbose':
                return TsServerLogLevel.Verbose;
            case 'off':
            default:
                return TsServerLogLevel.Off;
        }
    }
    TsServerLogLevel.fromString = fromString;
    function toString(value) {
        switch (value) {
            case TsServerLogLevel.Normal:
                return 'normal';
            case TsServerLogLevel.Terse:
                return 'terse';
            case TsServerLogLevel.Verbose:
                return 'verbose';
            case TsServerLogLevel.Off:
            default:
                return 'off';
        }
    }
    TsServerLogLevel.toString = toString;
})(TsServerLogLevel || (TsServerLogLevel = {}));
var MessageAction;
(function (MessageAction) {
    MessageAction[MessageAction["useLocal"] = 0] = "useLocal";
    MessageAction[MessageAction["useBundled"] = 1] = "useBundled";
    MessageAction[MessageAction["learnMore"] = 2] = "learnMore";
    MessageAction[MessageAction["reportIssue"] = 3] = "reportIssue";
})(MessageAction || (MessageAction = {}));
class TypeScriptServiceClient {
    constructor(host, storagePath, globalState, workspaceState, disposables) {
        this.workspaceState = workspaceState;
        this.tsServerLogFile = null;
        this.tsServerLogLevel = TsServerLogLevel.Off;
        this.cancellationPipeName = null;
        this._onProjectLanguageServiceStateChanged = new vscode_1.EventEmitter();
        this._onDidBeginInstallTypings = new vscode_1.EventEmitter();
        this._onDidEndInstallTypings = new vscode_1.EventEmitter();
        this._onTypesInstallerInitializationFailed = new vscode_1.EventEmitter();
        this.host = host;
        this.storagePath = storagePath;
        this.globalState = globalState;
        this.pathSeparator = path.sep;
        this.lastStart = Date.now();
        var p = new Promise((resolve, reject) => {
            this._onReady = { promise: p, resolve, reject };
        });
        this._onReady.promise = p;
        this.servicePromise = null;
        this.lastError = null;
        this.sequenceNumber = 0;
        this.exitRequested = false;
        this.firstStart = Date.now();
        this.numberRestarts = 0;
        this.requestQueue = [];
        this.pendingResponses = 0;
        this.callbacks = Object.create(null);
        const configuration = vscode_1.workspace.getConfiguration();
        this.globalTsdk = this.extractGlobalTsdk(configuration);
        this.localTsdk = this.extractLocalTsdk(configuration);
        this._experimentalAutoBuild = false; // configuration.get<boolean>('typescript.tsserver.experimentalAutoBuild', false);
        this._apiVersion = new typescriptService_1.API('1.0.0');
        this._checkGlobalTSCVersion = true;
        this.trace = this.readTrace();
        this.tsServerLogLevel = this.readTsServerLogLevel();
        this.checkJs = this.readCheckJs();
        disposables.push(vscode_1.workspace.onDidChangeConfiguration(() => {
            let oldLoggingLevel = this.tsServerLogLevel;
            let oldglobalTsdk = this.globalTsdk;
            let oldLocalTsdk = this.localTsdk;
            let oldCheckJs = this.checkJs;
            this.trace = this.readTrace();
            this.tsServerLogLevel = this.readTsServerLogLevel();
            const configuration = vscode_1.workspace.getConfiguration();
            this.globalTsdk = this.extractGlobalTsdk(configuration);
            this.localTsdk = this.extractLocalTsdk(configuration);
            this.checkJs = this.readCheckJs();
            if (this.servicePromise && oldCheckJs !== this.checkJs) {
                this.setCompilerOptionsForInferredProjects();
            }
            if (this.servicePromise === null && (oldglobalTsdk !== this.globalTsdk || oldLocalTsdk !== this.localTsdk)) {
                this.startService();
            }
            else if (this.servicePromise !== null && (this.tsServerLogLevel !== oldLoggingLevel || (oldglobalTsdk !== this.globalTsdk || oldLocalTsdk !== this.localTsdk))) {
                this.restartTsServer();
            }
        }));
        if (this.packageInfo && this.packageInfo.aiKey) {
            this.telemetryReporter = new vscode_extension_telemetry_1.default(this.packageInfo.name, this.packageInfo.version, this.packageInfo.aiKey);
            disposables.push(this.telemetryReporter);
        }
        this.startService();
    }
    restartTsServer() {
        const start = () => {
            this.trace = this.readTrace();
            this.tsServerLogLevel = this.readTsServerLogLevel();
            this.servicePromise = this.startService();
            return this.servicePromise;
        };
        if (this.servicePromise !== null) {
            this.servicePromise = this.servicePromise.then(cp => {
                if (cp) {
                    cp.kill();
                }
            }).then(start);
        }
        else {
            start();
        }
    }
    extractGlobalTsdk(configuration) {
        let inspect = configuration.inspect('typescript.tsdk');
        if (inspect && inspect.globalValue && 'string' === typeof inspect.globalValue) {
            return inspect.globalValue;
        }
        if (inspect && inspect.defaultValue && 'string' === typeof inspect.defaultValue) {
            return inspect.defaultValue;
        }
        return null;
    }
    extractLocalTsdk(configuration) {
        let inspect = configuration.inspect('typescript.tsdk');
        if (inspect && inspect.workspaceValue && 'string' === typeof inspect.workspaceValue) {
            return inspect.workspaceValue;
        }
        return null;
    }
    get onProjectLanguageServiceStateChanged() {
        return this._onProjectLanguageServiceStateChanged.event;
    }
    get onDidBeginInstallTypings() {
        return this._onDidBeginInstallTypings.event;
    }
    get onDidEndInstallTypings() {
        return this._onDidEndInstallTypings.event;
    }
    get onTypesInstallerInitializationFailed() {
        return this._onTypesInstallerInitializationFailed.event;
    }
    get output() {
        if (!this._output) {
            this._output = vscode_1.window.createOutputChannel(localize(0, null));
        }
        return this._output;
    }
    readTrace() {
        let result = Trace.fromString(vscode_1.workspace.getConfiguration().get('typescript.tsserver.trace', 'off'));
        if (result === Trace.Off && !!process.env.TSS_TRACE) {
            result = Trace.Messages;
        }
        return result;
    }
    readTsServerLogLevel() {
        const setting = vscode_1.workspace.getConfiguration().get('typescript.tsserver.log', 'off');
        return TsServerLogLevel.fromString(setting);
    }
    readCheckJs() {
        return vscode_1.workspace.getConfiguration().get('javascript.implicitProjectConfig.checkJs', false);
    }
    get experimentalAutoBuild() {
        return this._experimentalAutoBuild;
    }
    get checkGlobalTSCVersion() {
        return this._checkGlobalTSCVersion;
    }
    get apiVersion() {
        return this._apiVersion;
    }
    onReady() {
        return this._onReady.promise;
    }
    data2String(data) {
        if (data instanceof Error) {
            if (is.string(data.stack)) {
                return data.stack;
            }
            return data.message;
        }
        if (is.boolean(data.success) && !data.success && is.string(data.message)) {
            return data.message;
        }
        if (is.string(data)) {
            return data;
        }
        return data.toString();
    }
    info(message, data) {
        this.output.appendLine(`[Info  - ${(new Date().toLocaleTimeString())}] ${message}`);
        if (data) {
            this.output.appendLine(this.data2String(data));
        }
    }
    warn(message, data) {
        this.output.appendLine(`[Warn  - ${(new Date().toLocaleTimeString())}] ${message}`);
        if (data) {
            this.output.appendLine(this.data2String(data));
        }
    }
    error(message, data) {
        // See https://github.com/Microsoft/TypeScript/issues/10496
        if (data && data.message === 'No content available.') {
            return;
        }
        this.output.appendLine(`[Error - ${(new Date().toLocaleTimeString())}] ${message}`);
        if (data) {
            this.output.appendLine(this.data2String(data));
        }
        // this.output.show(true);
    }
    logTrace(message, data) {
        this.output.appendLine(`[Trace - ${(new Date().toLocaleTimeString())}] ${message}`);
        if (data) {
            this.output.appendLine(this.data2String(data));
        }
        // this.output.show(true);
    }
    get packageInfo() {
        if (this._packageInfo !== undefined) {
            return this._packageInfo;
        }
        let packagePath = path.join(__dirname, './../package.json');
        let extensionPackage = require(packagePath);
        if (extensionPackage) {
            this._packageInfo = {
                name: extensionPackage.name,
                version: extensionPackage.version,
                aiKey: extensionPackage.aiKey
            };
        }
        else {
            this._packageInfo = null;
        }
        return this._packageInfo;
    }
    logTelemetry(eventName, properties) {
        if (this.telemetryReporter) {
            this.telemetryReporter.sendTelemetryEvent(eventName, properties);
        }
    }
    service() {
        if (this.servicePromise) {
            return this.servicePromise;
        }
        if (this.lastError) {
            return Promise.reject(this.lastError);
        }
        this.startService();
        if (this.servicePromise) {
            return this.servicePromise;
        }
        return Promise.reject(new Error('Could not create TS service'));
    }
    get bundledTypeScriptPath() {
        try {
            return require.resolve('typescript/lib/tsserver.js');
        }
        catch (e) {
            return '';
        }
    }
    get localTypeScriptPath() {
        if (!vscode_1.workspace.rootPath) {
            return null;
        }
        if (this.localTsdk) {
            this._checkGlobalTSCVersion = false;
            if (path.isAbsolute(this.localTsdk)) {
                return path.join(this.localTsdk, 'tsserver.js');
            }
            return path.join(vscode_1.workspace.rootPath, this.localTsdk, 'tsserver.js');
        }
        const localModulePath = path.join(vscode_1.workspace.rootPath, 'node_modules', 'typescript', 'lib', 'tsserver.js');
        if (fs.existsSync(localModulePath) && this.getTypeScriptVersion(localModulePath)) {
            return localModulePath;
        }
        return null;
    }
    get globalTypescriptPath() {
        if (this.globalTsdk) {
            this._checkGlobalTSCVersion = false;
            if (path.isAbsolute(this.globalTsdk)) {
                return path.join(this.globalTsdk, 'tsserver.js');
            }
            else if (vscode_1.workspace.rootPath) {
                return path.join(vscode_1.workspace.rootPath, this.globalTsdk, 'tsserver.js');
            }
        }
        return this.bundledTypeScriptPath;
    }
    hasWorkspaceTsdkSetting() {
        return !!this.localTsdk;
    }
    startService(resendModels = false) {
        let modulePath = Promise.resolve(this.globalTypescriptPath);
        if (!this.workspaceState.get(TypeScriptServiceClient.tsdkMigratedStorageKey, false)) {
            this.workspaceState.update(TypeScriptServiceClient.tsdkMigratedStorageKey, true);
            if (vscode_1.workspace.rootPath && this.hasWorkspaceTsdkSetting()) {
                modulePath = this.showVersionPicker(true);
            }
        }
        return modulePath.then(modulePath => {
            if (this.workspaceState.get(TypeScriptServiceClient.useWorkspaceTsdkStorageKey, false)) {
                if (vscode_1.workspace.rootPath) {
                    // TODO: check if we need better error handling
                    return this.localTypeScriptPath || modulePath;
                }
            }
            return modulePath;
        }).then(modulePath => {
            return this.servicePromise = new Promise((resolve, reject) => {
                const tsConfig = vscode_1.workspace.getConfiguration('typescript');
                this.info(`Using tsserver from: ${modulePath}`);
                if (!fs.existsSync(modulePath)) {
                    vscode_1.window.showWarningMessage(localize(1, null, modulePath ? path.dirname(modulePath) : ''));
                    if (!this.bundledTypeScriptPath) {
                        vscode_1.window.showErrorMessage(localize(2, null));
                        return reject(new Error('Could not find bundled tsserver.js'));
                    }
                    modulePath = this.bundledTypeScriptPath;
                }
                let version = this.getTypeScriptVersion(modulePath);
                if (!version) {
                    version = vscode_1.workspace.getConfiguration().get('typescript.tsdk_version', undefined);
                }
                if (version) {
                    this._apiVersion = new typescriptService_1.API(version);
                }
                const label = version || localize(3, null);
                const tooltip = modulePath;
                this.modulePath = modulePath;
                VersionStatus.showHideStatus();
                VersionStatus.setInfo(label, tooltip);
                // This is backwards compatibility code to move the setting from the local
                // store into the workspace setting file.
                const doGlobalVersionCheckKey = 'doGlobalVersionCheck';
                const globalStateValue = this.globalState.get(doGlobalVersionCheckKey, true);
                const checkTscVersion = 'check.tscVersion';
                if (!globalStateValue) {
                    tsConfig.update(checkTscVersion, false, true);
                    this.globalState.update(doGlobalVersionCheckKey, true);
                }
                try {
                    let options = {
                        execArgv: [] // [`--debug-brk=5859`]
                    };
                    if (vscode_1.workspace.rootPath) {
                        options.cwd = vscode_1.workspace.rootPath;
                    }
                    let value = process.env.TSS_DEBUG;
                    if (value) {
                        let port = parseInt(value);
                        if (!isNaN(port)) {
                            this.info(`TSServer started in debug mode using port ${port}`);
                            options.execArgv = [`--debug=${port}`];
                        }
                    }
                    let args = [];
                    if (this.apiVersion.has206Features()) {
                        args.push('--useSingleInferredProject');
                        if (vscode_1.workspace.getConfiguration().get('typescript.disableAutomaticTypeAcquisition', false)) {
                            args.push('--disableAutomaticTypingAcquisition');
                        }
                    }
                    if (this.apiVersion.has208Features()) {
                        args.push('--enableTelemetry');
                    }
                    if (this.apiVersion.has222Features()) {
                        this.cancellationPipeName = electron.getPipeName(`tscancellation-${electron.makeRandomHexString(20)}`);
                        args.push('--cancellationPipeName', this.cancellationPipeName + '*');
                    }
                    if (this.apiVersion.has222Features()) {
                        if (this.tsServerLogLevel !== TsServerLogLevel.Off) {
                            try {
                                const logDir = fs.mkdtempSync(path.join(os.tmpdir(), `vscode-tsserver-log-`));
                                this.tsServerLogFile = path.join(logDir, `tsserver.log`);
                                this.info(`TSServer log file: ${this.tsServerLogFile}`);
                            }
                            catch (e) {
                                this.error('Could not create TSServer log directory');
                            }
                            if (this.tsServerLogFile) {
                                args.push('--logVerbosity', TsServerLogLevel.toString(this.tsServerLogLevel));
                                args.push('--logFile', this.tsServerLogFile);
                            }
                        }
                    }
                    if (this.apiVersion.has230Features()) {
                        const plugins = this.getContributedTypeScriptServerPlugins();
                        if (plugins.length) {
                            args.push('--globalPlugins', plugins.map(x => x.name).join(','));
                            if (modulePath === this.globalTypescriptPath) {
                                args.push('--pluginProbeLocations', plugins.map(x => x.path).join(','));
                            }
                        }
                    }
                    electron.fork(modulePath, args, options, (err, childProcess) => {
                        if (err) {
                            this.lastError = err;
                            this.error('Starting TSServer failed with error.', err);
                            vscode_1.window.showErrorMessage(localize(4, null, err.message || err));
                            this.logTelemetry('error', { message: err.message });
                            return;
                        }
                        this.lastStart = Date.now();
                        childProcess.on('error', (err) => {
                            this.lastError = err;
                            this.error('TSServer errored with error.', err);
                            if (this.tsServerLogFile) {
                                this.error(`TSServer log file: ${this.tsServerLogFile}`);
                            }
                            this.serviceExited(false);
                        });
                        childProcess.on('exit', (code) => {
                            if (code === null || typeof code === 'undefined') {
                                this.info(`TSServer exited`);
                            }
                            else {
                                this.error(`TSServer exited with code: ${code}`);
                            }
                            if (this.tsServerLogFile) {
                                this.info(`TSServer log file: ${this.tsServerLogFile}`);
                            }
                            this.serviceExited(true);
                        });
                        this.reader = new wireProtocol_1.Reader(childProcess.stdout, (msg) => {
                            this.dispatchMessage(msg);
                        });
                        this._onReady.resolve();
                        resolve(childProcess);
                        this.serviceStarted(resendModels);
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    onVersionStatusClicked() {
        return this.showVersionPicker(false);
    }
    showVersionPicker(firstRun) {
        const modulePath = this.modulePath || this.globalTypescriptPath;
        if (!vscode_1.workspace.rootPath || !modulePath) {
            return Promise.resolve(modulePath);
        }
        const useWorkspaceVersionSetting = this.workspaceState.get(TypeScriptServiceClient.useWorkspaceTsdkStorageKey, false);
        const shippedVersion = this.getTypeScriptVersion(this.globalTypescriptPath);
        const localModulePath = this.localTypeScriptPath;
        const pickOptions = [];
        pickOptions.push({
            label: localize(5, null),
            description: shippedVersion || this.globalTypescriptPath,
            detail: modulePath === this.globalTypescriptPath && (modulePath !== localModulePath || !useWorkspaceVersionSetting) ? localize(6, null) : '',
            id: MessageAction.useBundled,
        });
        if (localModulePath) {
            const localVersion = this.getTypeScriptVersion(localModulePath);
            pickOptions.push({
                label: localize(7, null),
                description: localVersion || localModulePath,
                detail: modulePath === localModulePath && (modulePath !== this.globalTypescriptPath || useWorkspaceVersionSetting) ? localize(8, null) : '',
                id: MessageAction.useLocal
            });
        }
        pickOptions.push({
            label: localize(9, null),
            description: '',
            id: MessageAction.learnMore
        });
        const tryShowRestart = (newModulePath) => {
            if (firstRun || newModulePath === this.modulePath) {
                return;
            }
            this.restartTsServer();
        };
        return vscode_1.window.showQuickPick(pickOptions, {
            placeHolder: localize(10, null),
            ignoreFocusOut: firstRun
        })
            .then(selected => {
            if (!selected) {
                return modulePath;
            }
            switch (selected.id) {
                case MessageAction.useLocal:
                    return this.workspaceState.update(TypeScriptServiceClient.useWorkspaceTsdkStorageKey, true)
                        .then(_ => {
                        if (localModulePath) {
                            tryShowRestart(localModulePath);
                        }
                        return localModulePath || '';
                    });
                case MessageAction.useBundled:
                    return this.workspaceState.update(TypeScriptServiceClient.useWorkspaceTsdkStorageKey, false)
                        .then(_ => {
                        tryShowRestart(this.globalTypescriptPath);
                        return this.globalTypescriptPath;
                    });
                case MessageAction.learnMore:
                    vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse('https://go.microsoft.com/fwlink/?linkid=839919'));
                    return modulePath;
                default:
                    return modulePath;
            }
        });
    }
    openTsServerLogFile() {
        if (!this.apiVersion.has222Features()) {
            return vscode_1.window.showErrorMessage(localize(11, null))
                .then(() => false);
        }
        if (this.tsServerLogLevel === TsServerLogLevel.Off) {
            return vscode_1.window.showErrorMessage(localize(12, null), {
                title: localize(13, null),
            })
                .then(selection => {
                if (selection) {
                    return vscode_1.workspace.getConfiguration().update('typescript.tsserver.log', 'verbose', true).then(() => {
                        this.restartTsServer();
                        return false;
                    });
                }
                return false;
            });
        }
        if (!this.tsServerLogFile) {
            return vscode_1.window.showWarningMessage(localize(14, null)).then(() => false);
        }
        return vscode_1.workspace.openTextDocument(this.tsServerLogFile)
            .then(doc => {
            if (!doc) {
                return false;
            }
            return vscode_1.window.showTextDocument(doc, vscode_1.window.activeTextEditor ? vscode_1.window.activeTextEditor.viewColumn : undefined)
                .then(editor => !!editor);
        }, () => false)
            .then(didOpen => {
            if (!didOpen) {
                vscode_1.window.showWarningMessage(localize(15, null));
            }
            return didOpen;
        });
    }
    serviceStarted(resendModels) {
        let configureOptions = {
            hostInfo: 'vscode'
        };
        if (this._experimentalAutoBuild && this.storagePath) {
            try {
                fs.mkdirSync(this.storagePath);
            }
            catch (error) {
            }
            // configureOptions.autoDiagnostics = true;
        }
        this.execute('configure', configureOptions);
        this.setCompilerOptionsForInferredProjects();
        if (resendModels) {
            this.host.populateService();
        }
    }
    setCompilerOptionsForInferredProjects() {
        if (!this.apiVersion.has206Features()) {
            return;
        }
        const compilerOptions = {
            module: 'CommonJS',
            target: 'ES6',
            allowSyntheticDefaultImports: true,
            allowNonTsExtensions: true,
            allowJs: true,
            jsx: 'Preserve'
        };
        if (this.apiVersion.has230Features()) {
            compilerOptions.checkJs = vscode_1.workspace.getConfiguration('javascript').get('implicitProjectConfig.checkJs', false);
        }
        const args = {
            options: compilerOptions
        };
        this.execute('compilerOptionsForInferredProjects', args, true).catch((err) => {
            this.error(`'compilerOptionsForInferredProjects' request failed with error.`, err);
        });
    }
    getTypeScriptVersion(serverPath) {
        if (!fs.existsSync(serverPath)) {
            return undefined;
        }
        let p = serverPath.split(path.sep);
        if (p.length <= 2) {
            return undefined;
        }
        let p2 = p.slice(0, -2);
        let modulePath = p2.join(path.sep);
        let fileName = path.join(modulePath, 'package.json');
        if (!fs.existsSync(fileName)) {
            return undefined;
        }
        let contents = fs.readFileSync(fileName).toString();
        let desc = null;
        try {
            desc = JSON.parse(contents);
        }
        catch (err) {
            return undefined;
        }
        if (!desc || !desc.version) {
            return undefined;
        }
        return desc.version;
    }
    getContributedTypeScriptServerPlugins() {
        const plugins = [];
        for (const extension of vscode_1.extensions.all) {
            const pack = extension.packageJSON;
            if (pack.contributes && pack.contributes.typescriptServerPlugins && Array.isArray(pack.contributes.typescriptServerPlugins)) {
                for (const plugin of pack.contributes.typescriptServerPlugins) {
                    plugins.push({
                        name: plugin.name,
                        path: extension.extensionPath
                    });
                }
            }
        }
        return plugins;
    }
    serviceExited(restart) {
        this.servicePromise = null;
        this.tsServerLogFile = null;
        Object.keys(this.callbacks).forEach((key) => {
            this.callbacks[parseInt(key)].e(new Error('Service died.'));
        });
        this.callbacks = Object.create(null);
        if (!this.exitRequested && restart) {
            let diff = Date.now() - this.lastStart;
            this.numberRestarts++;
            let startService = true;
            if (this.numberRestarts > 5) {
                let prompt = undefined;
                this.numberRestarts = 0;
                if (diff < 10 * 1000 /* 10 seconds */) {
                    this.lastStart = Date.now();
                    startService = false;
                    prompt = vscode_1.window.showErrorMessage(localize(16, null), {
                        title: localize(17, null),
                        id: MessageAction.reportIssue,
                        isCloseAffordance: true
                    });
                    this.logTelemetry('serviceExited');
                }
                else if (diff < 60 * 1000 /* 1 Minutes */) {
                    this.lastStart = Date.now();
                    prompt = vscode_1.window.showWarningMessage(localize(18, null), {
                        title: localize(19, null),
                        id: MessageAction.reportIssue,
                        isCloseAffordance: true
                    });
                }
                if (prompt) {
                    prompt.then(item => {
                        if (item && item.id === MessageAction.reportIssue) {
                            return vscode_1.commands.executeCommand('workbench.action.reportIssues');
                        }
                        return undefined;
                    });
                }
            }
            if (startService) {
                this.startService(true);
            }
        }
    }
    normalizePath(resource) {
        if (resource.scheme === TypeScriptServiceClient.WALK_THROUGH_SNIPPET_SCHEME) {
            return resource.toString();
        }
        if (resource.scheme === 'untitled' && this._apiVersion.has213Features()) {
            return resource.toString();
        }
        if (resource.scheme !== 'file') {
            return null;
        }
        let result = resource.fsPath;
        if (!result) {
            return null;
        }
        // Both \ and / must be escaped in regular expressions
        return result.replace(new RegExp('\\' + this.pathSeparator, 'g'), '/');
    }
    asUrl(filepath) {
        if (filepath.startsWith(TypeScriptServiceClient.WALK_THROUGH_SNIPPET_SCHEME_COLON)
            || (filepath.startsWith('untitled:') && this._apiVersion.has213Features())) {
            return vscode_1.Uri.parse(filepath);
        }
        return vscode_1.Uri.file(filepath);
    }
    execute(command, args, expectsResultOrToken, token) {
        let expectsResult = true;
        if (typeof expectsResultOrToken === 'boolean') {
            expectsResult = expectsResultOrToken;
        }
        else {
            token = expectsResultOrToken;
        }
        let request = {
            seq: this.sequenceNumber++,
            type: 'request',
            command: command,
            arguments: args
        };
        let requestInfo = {
            request: request,
            promise: null,
            callbacks: null
        };
        let result = Promise.resolve(null);
        if (expectsResult) {
            result = new Promise((resolve, reject) => {
                requestInfo.callbacks = { c: resolve, e: reject, start: Date.now() };
                if (token) {
                    token.onCancellationRequested(() => {
                        this.tryCancelRequest(request.seq);
                        resolve(undefined);
                    });
                }
            });
        }
        requestInfo.promise = result;
        this.requestQueue.push(requestInfo);
        this.sendNextRequests();
        return result;
    }
    sendNextRequests() {
        while (this.pendingResponses === 0 && this.requestQueue.length > 0) {
            const item = this.requestQueue.shift();
            if (item) {
                this.sendRequest(item);
            }
        }
    }
    sendRequest(requestItem) {
        let serverRequest = requestItem.request;
        this.traceRequest(serverRequest, !!requestItem.callbacks);
        if (requestItem.callbacks) {
            this.callbacks[serverRequest.seq] = requestItem.callbacks;
            this.pendingResponses++;
        }
        this.service()
            .then((childProcess) => {
            childProcess.stdin.write(JSON.stringify(serverRequest) + '\r\n', 'utf8');
        }).then(undefined, err => {
            let callback = this.callbacks[serverRequest.seq];
            if (callback) {
                callback.e(err);
                delete this.callbacks[serverRequest.seq];
                this.pendingResponses--;
            }
        });
    }
    tryCancelRequest(seq) {
        for (let i = 0; i < this.requestQueue.length; i++) {
            if (this.requestQueue[i].request.seq === seq) {
                this.requestQueue.splice(i, 1);
                if (this.trace !== Trace.Off) {
                    this.logTrace(`TypeScript Service: canceled request with sequence number ${seq}`);
                }
                return true;
            }
        }
        if (this.apiVersion.has222Features() && this.cancellationPipeName) {
            if (this.trace !== Trace.Off) {
                this.logTrace(`TypeScript Service: trying to cancel ongoing request with sequence number ${seq}`);
            }
            try {
                fs.writeFileSync(this.cancellationPipeName + seq, '');
                return true;
            }
            catch (e) {
                // noop
            }
        }
        if (this.trace !== Trace.Off) {
            this.logTrace(`TypeScript Service: tried to cancel request with sequence number ${seq}. But request got already delivered.`);
        }
        return false;
    }
    dispatchMessage(message) {
        try {
            if (message.type === 'response') {
                let response = message;
                let p = this.callbacks[response.request_seq];
                if (p) {
                    this.traceResponse(response, p.start);
                    delete this.callbacks[response.request_seq];
                    this.pendingResponses--;
                    if (response.success) {
                        p.c(response);
                    }
                    else {
                        p.e(response);
                    }
                }
            }
            else if (message.type === 'event') {
                let event = message;
                this.traceEvent(event);
                if (event.event === 'syntaxDiag') {
                    this.host.syntaxDiagnosticsReceived(event);
                }
                else if (event.event === 'semanticDiag') {
                    this.host.semanticDiagnosticsReceived(event);
                }
                else if (event.event === 'configFileDiag') {
                    this.host.configFileDiagnosticsReceived(event);
                }
                else if (event.event === 'telemetry') {
                    let telemetryData = event.body;
                    let properties = Object.create(null);
                    switch (telemetryData.telemetryEventName) {
                        case 'typingsInstalled':
                            let typingsInstalledPayload = telemetryData.payload;
                            properties['installedPackages'] = typingsInstalledPayload.installedPackages;
                            if (is.defined(typingsInstalledPayload.installSuccess)) {
                                properties['installSuccess'] = typingsInstalledPayload.installSuccess.toString();
                            }
                            if (is.string(typingsInstalledPayload.typingsInstallerVersion)) {
                                properties['typingsInstallerVersion'] = typingsInstalledPayload.typingsInstallerVersion;
                            }
                            break;
                        default:
                            let payload = telemetryData.payload;
                            if (payload) {
                                Object.keys(payload).forEach((key) => {
                                    if (payload.hasOwnProperty(key) && is.string(payload[key])) {
                                        properties[key] = payload[key];
                                    }
                                });
                            }
                            break;
                    }
                    this.logTelemetry(telemetryData.telemetryEventName, properties);
                }
                else if (event.event === 'projectLanguageServiceState') {
                    const data = event.body;
                    if (data) {
                        this._onProjectLanguageServiceStateChanged.fire(data);
                    }
                }
                else if (event.event === 'beginInstallTypes') {
                    const data = event.body;
                    if (data) {
                        this._onDidBeginInstallTypings.fire(data);
                    }
                }
                else if (event.event === 'endInstallTypes') {
                    const data = event.body;
                    if (data) {
                        this._onDidEndInstallTypings.fire(data);
                    }
                }
                else if (event.event === 'typesInstallerInitializationFailed') {
                    const data = event.body;
                    if (data) {
                        this._onTypesInstallerInitializationFailed.fire(data);
                    }
                }
            }
            else {
                throw new Error('Unknown message type ' + message.type + ' recevied');
            }
        }
        finally {
            this.sendNextRequests();
        }
    }
    traceRequest(request, responseExpected) {
        if (this.trace === Trace.Off) {
            return;
        }
        let data = undefined;
        if (this.trace === Trace.Verbose && request.arguments) {
            data = `Arguments: ${JSON.stringify(request.arguments, null, 4)}`;
        }
        this.logTrace(`Sending request: ${request.command} (${request.seq}). Response expected: ${responseExpected ? 'yes' : 'no'}. Current queue length: ${this.requestQueue.length}`, data);
    }
    traceResponse(response, startTime) {
        if (this.trace === Trace.Off) {
            return;
        }
        let data = undefined;
        if (this.trace === Trace.Verbose && response.body) {
            data = `Result: ${JSON.stringify(response.body, null, 4)}`;
        }
        this.logTrace(`Response received: ${response.command} (${response.request_seq}). Request took ${Date.now() - startTime} ms. Success: ${response.success} ${!response.success ? '. Message: ' + response.message : ''}`, data);
    }
    traceEvent(event) {
        if (this.trace === Trace.Off) {
            return;
        }
        let data = undefined;
        if (this.trace === Trace.Verbose && event.body) {
            data = `Data: ${JSON.stringify(event.body, null, 4)}`;
        }
        this.logTrace(`Event received: ${event.event} (${event.seq}).`, data);
    }
}
TypeScriptServiceClient.useWorkspaceTsdkStorageKey = 'typescript.useWorkspaceTsdk';
TypeScriptServiceClient.tsdkMigratedStorageKey = 'typescript.tsdkMigrated';
TypeScriptServiceClient.WALK_THROUGH_SNIPPET_SCHEME = 'walkThroughSnippet';
TypeScriptServiceClient.WALK_THROUGH_SNIPPET_SCHEME_COLON = `${TypeScriptServiceClient.WALK_THROUGH_SNIPPET_SCHEME}:`;
exports.default = TypeScriptServiceClient;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\typescript\out/typescriptServiceClient.js.map
