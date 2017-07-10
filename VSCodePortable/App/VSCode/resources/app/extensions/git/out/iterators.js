/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
function* filter(it, condition) {
    let i = 0;
    for (let t of it) {
        if (condition(t, i++)) {
            yield t;
        }
    }
}
function* map(it, fn) {
    let i = 0;
    for (let t of it) {
        yield fn(t, i++);
    }
}
class FunctionalIteratorImpl {
    constructor(iterator) {
        this.iterator = iterator;
    }
    filter(condition) {
        return new FunctionalIteratorImpl(filter(this.iterator, condition));
    }
    map(fn) {
        return new FunctionalIteratorImpl(map(this.iterator, fn));
    }
    toArray() {
        return Array.from(this.iterator);
    }
    [Symbol.iterator]() {
        return this.iterator;
    }
}
function iterate(obj) {
    if (Array.isArray(obj)) {
        return new FunctionalIteratorImpl(obj[Symbol.iterator]());
    }
    return new FunctionalIteratorImpl(obj);
}
exports.iterate = iterate;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\git\out/iterators.js.map
