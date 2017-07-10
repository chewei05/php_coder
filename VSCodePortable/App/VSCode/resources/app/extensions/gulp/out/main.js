/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const cp = require("child_process");
const vscode = require("vscode");
const nls = require("vscode-nls");
const localize = nls.config(process.env.VSCODE_NLS_CONFIG)(__filename);
let taskProvider;
function activate(_context) {
    let workspaceRoot = vscode.workspace.rootPath;
    if (!workspaceRoot) {
        return;
    }
    let pattern = path.join(workspaceRoot, 'gulpfile{.babel.js,.js}');
    let gulpPromise = undefined;
    let fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
    fileWatcher.onDidChange(() => gulpPromise = undefined);
    fileWatcher.onDidCreate(() => gulpPromise = undefined);
    fileWatcher.onDidDelete(() => gulpPromise = undefined);
    function onConfigurationChanged() {
        let autoDetect = vscode.workspace.getConfiguration('gulp').get('autoDetect');
        if (taskProvider && autoDetect === 'off') {
            gulpPromise = undefined;
            taskProvider.dispose();
            taskProvider = undefined;
        }
        else if (!taskProvider && autoDetect === 'on') {
            taskProvider = vscode.workspace.registerTaskProvider({
                provideTasks: () => {
                    if (!gulpPromise) {
                        gulpPromise = getGulpTasks();
                    }
                    return gulpPromise;
                }
            });
        }
    }
    vscode.workspace.onDidChangeConfiguration(onConfigurationChanged);
    onConfigurationChanged();
}
exports.activate = activate;
function deactivate() {
    if (taskProvider) {
        taskProvider.dispose();
    }
}
exports.deactivate = deactivate;
function exists(file) {
    return new Promise((resolve, _reject) => {
        fs.exists(file, (value) => {
            resolve(value);
        });
    });
}
function exec(command, options) {
    return new Promise((resolve, reject) => {
        cp.exec(command, options, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stdout, stderr });
            }
            resolve({ stdout, stderr });
        });
    });
}
function getGulpTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        let workspaceRoot = vscode.workspace.rootPath;
        let emptyTasks = [];
        if (!workspaceRoot) {
            return emptyTasks;
        }
        let gulpfile = path.join(workspaceRoot, 'gulpfile.js');
        if (!(yield exists(gulpfile))) {
            gulpfile = path.join(workspaceRoot, 'gulpfile.babel.js');
            if (!(yield exists(gulpfile))) {
                return emptyTasks;
            }
        }
        let gulpCommand;
        let platform = process.platform;
        if (platform === 'win32' && (yield exists(path.join(workspaceRoot, 'node_modules', '.bin', 'gulp.cmd')))) {
            gulpCommand = path.join('.', 'node_modules', '.bin', 'gulp.cmd');
        }
        else if ((platform === 'linux' || platform === 'darwin') && (yield exists(path.join(workspaceRoot, 'node_modules', '.bin', 'gulp')))) {
            gulpCommand = path.join('.', 'node_modules', '.bin', 'gulp');
        }
        else {
            gulpCommand = 'gulp';
        }
        let commandLine = `${gulpCommand} --tasks-simple --no-color`;
        let channel = vscode.window.createOutputChannel('tasks');
        try {
            let { stdout, stderr } = yield exec(commandLine, { cwd: workspaceRoot });
            if (stderr) {
                channel.appendLine(stderr);
            }
            let result = [];
            if (stdout) {
                let buildTask = { task: undefined, rank: 0 };
                let testTask = { task: undefined, rank: 0 };
                let lines = stdout.split(/\r{0,1}\n/);
                for (let line of lines) {
                    if (line.length === 0) {
                        continue;
                    }
                    let task = new vscode.ShellTask(`gulp: ${line}`, `${gulpCommand} ${line}`);
                    task.identifier = `gulp.${line}`;
                    result.push(task);
                    let lowerCaseLine = line.toLowerCase();
                    if (lowerCaseLine === 'build') {
                        buildTask = { task, rank: 2 };
                    }
                    else if (lowerCaseLine.indexOf('build') !== -1 && buildTask.rank < 1) {
                        buildTask = { task, rank: 1 };
                    }
                    else if (lowerCaseLine === 'test') {
                        testTask = { task, rank: 2 };
                    }
                    else if (lowerCaseLine.indexOf('test') !== -1 && testTask.rank < 1) {
                        testTask = { task, rank: 1 };
                    }
                }
                if (buildTask.task) {
                    buildTask.task.group = vscode.TaskGroup.Build;
                }
                if (testTask.task) {
                    testTask.task.group = vscode.TaskGroup.Test;
                }
            }
            return result;
        }
        catch (err) {
            if (err.stderr) {
                channel.appendLine(err.stderr);
            }
            channel.appendLine(localize(0, null, err.error ? err.error.toString() : 'unknown'));
            return emptyTasks;
        }
    });
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\gulp\out/main.js.map
