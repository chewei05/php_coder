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
    let pattern = path.join(workspaceRoot, 'Gruntfile.js');
    let detectorPromise = undefined;
    let fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
    fileWatcher.onDidChange(() => detectorPromise = undefined);
    fileWatcher.onDidCreate(() => detectorPromise = undefined);
    fileWatcher.onDidDelete(() => detectorPromise = undefined);
    function onConfigurationChanged() {
        let autoDetect = vscode.workspace.getConfiguration('grunt').get('autoDetect');
        if (taskProvider && autoDetect === 'off') {
            detectorPromise = undefined;
            taskProvider.dispose();
            taskProvider = undefined;
        }
        else if (!taskProvider && autoDetect === 'on') {
            taskProvider = vscode.workspace.registerTaskProvider({
                provideTasks: () => {
                    if (!detectorPromise) {
                        detectorPromise = getGruntTasks();
                    }
                    return detectorPromise;
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
function getGruntTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        let workspaceRoot = vscode.workspace.rootPath;
        let emptyTasks = [];
        if (!workspaceRoot) {
            return emptyTasks;
        }
        let gruntfile = path.join(workspaceRoot, 'Gruntfile.js');
        if (!(yield exists(gruntfile))) {
            return emptyTasks;
        }
        let command;
        let platform = process.platform;
        if (platform === 'win32' && (yield exists(path.join(workspaceRoot, 'node_modules', '.bin', 'grunt.cmd')))) {
            command = path.join('.', 'node_modules', '.bin', 'grunt.cmd');
        }
        else if ((platform === 'linux' || platform === 'darwin') && (yield exists(path.join(workspaceRoot, 'node_modules', '.bin', 'grunt')))) {
            command = path.join('.', 'node_modules', '.bin', 'grunt');
        }
        else {
            command = 'grunt';
        }
        let commandLine = `${command} --help --no-color`;
        let channel = vscode.window.createOutputChannel('tasks');
        try {
            let { stdout, stderr } = yield exec(commandLine, { cwd: workspaceRoot });
            if (stderr) {
                channel.appendLine(stderr);
                channel.show(true);
            }
            let result = [];
            if (stdout) {
                let buildTask = { task: undefined, rank: 0 };
                let testTask = { task: undefined, rank: 0 };
                // grunt lists tasks as follows (description is wrapped into a new line if too long):
                // ...
                // Available tasks
                //         uglify  Minify files with UglifyJS. *
                //         jshint  Validate files with JSHint. *
                //           test  Alias for "jshint", "qunit" tasks.
                //        default  Alias for "jshint", "qunit", "concat", "uglify" tasks.
                //           long  Alias for "eslint", "qunit", "browserify", "sass",
                //                 "autoprefixer", "uglify", tasks.
                //
                // Tasks run in the order specified
                let lines = stdout.split(/\r{0,1}\n/);
                let tasksStart = false;
                let tasksEnd = false;
                for (let line of lines) {
                    if (line.length === 0) {
                        continue;
                    }
                    if (!tasksStart && !tasksEnd) {
                        if (line.indexOf('Available tasks') === 0) {
                            tasksStart = true;
                        }
                    }
                    else if (tasksStart && !tasksEnd) {
                        if (line.indexOf('Tasks run in the order specified') === 0) {
                            tasksEnd = true;
                        }
                        else {
                            let regExp = /^\s*(\S.*\S)  \S/g;
                            let matches = regExp.exec(line);
                            if (matches && matches.length === 2) {
                                let taskName = matches[1];
                                let task = taskName.indexOf(' ') === -1
                                    ? new vscode.ShellTask(`grunt: ${taskName}`, `${command} ${taskName}`)
                                    : new vscode.ShellTask(`grunt: ${taskName}`, `${command} "${taskName}"`);
                                task.identifier = `grunt.${taskName}`;
                                result.push(task);
                                let lowerCaseTaskName = taskName.toLowerCase();
                                if (lowerCaseTaskName === 'build') {
                                    buildTask = { task, rank: 2 };
                                }
                                else if (lowerCaseTaskName.indexOf('build') !== -1 && buildTask.rank < 1) {
                                    buildTask = { task, rank: 1 };
                                }
                                else if (lowerCaseTaskName === 'test') {
                                    testTask = { task, rank: 2 };
                                }
                                else if (lowerCaseTaskName.indexOf('test') !== -1 && testTask.rank < 1) {
                                    testTask = { task, rank: 1 };
                                }
                            }
                        }
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
                channel.show(true);
            }
            channel.appendLine(localize(0, null, err.error ? err.error.toString() : 'unknown'));
            return emptyTasks;
        }
    });
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\grunt\out/main.js.map
