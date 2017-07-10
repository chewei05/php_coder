/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LinkedMap {
    constructor() {
        this.map = Object.create(null);
        this.head = undefined;
        this.tail = undefined;
        this._length = 0;
    }
    isEmpty() {
        return !this.head && !this.tail;
    }
    length() {
        return this._length;
    }
    get(key) {
        const item = this.map[key];
        if (!item) {
            return undefined;
        }
        return item.value;
    }
    add(key, value, touch = false) {
        let item = this.map[key];
        if (item) {
            item.value = value;
            if (touch) {
                this.touch(item);
            }
        }
        else {
            item = { key, value, next: undefined, previous: undefined };
            if (touch) {
                this.addItemFirst(item);
            }
            else {
                this.addItemLast(item);
            }
            this.map[key] = item;
            this._length++;
        }
    }
    remove(key) {
        const item = this.map[key];
        if (!item) {
            return undefined;
        }
        delete this.map[key];
        this.removeItem(item);
        this._length--;
        return item.value;
    }
    shift() {
        if (!this.head && !this.tail) {
            return undefined;
        }
        if (!this.head || !this.tail) {
            throw new Error('Invalid list');
        }
        const item = this.head;
        delete this.map[item.key];
        this.removeItem(item);
        this._length--;
        return item.value;
    }
    addItemFirst(item) {
        // First time Insert
        if (!this.head && !this.tail) {
            this.tail = item;
        }
        else if (!this.head) {
            throw new Error('Invalid list');
        }
        else {
            item.next = this.head;
            this.head.previous = item;
        }
        this.head = item;
    }
    addItemLast(item) {
        // First time Insert
        if (!this.head && !this.tail) {
            this.head = item;
        }
        else if (!this.tail) {
            throw new Error('Invalid list');
        }
        else {
            item.previous = this.tail;
            this.tail.next = item;
        }
        this.tail = item;
    }
    removeItem(item) {
        if (item === this.head && item === this.tail) {
            this.head = undefined;
            this.tail = undefined;
        }
        else if (item === this.head) {
            this.head = item.next;
        }
        else if (item === this.tail) {
            this.tail = item.previous;
        }
        else {
            const next = item.next;
            const previous = item.previous;
            if (!next || !previous) {
                throw new Error('Invalid list');
            }
            next.previous = previous;
            previous.next = next;
        }
    }
    touch(item) {
        if (item === this.head) {
            return;
        }
        const next = item.next;
        const previous = item.previous;
        // Unlink the item
        if (item === this.tail) {
            this.tail = previous;
        }
        else {
            // Both next and previous are not null since item was neither head nor tail.
            if (next) {
                next.previous = previous;
            }
            if (previous) {
                previous.next = next;
            }
        }
        // Insert the node at head
        item.previous = undefined;
        item.next = this.head;
        if (!this.head) {
            throw new Error('Invalid list');
        }
        this.head.previous = item;
        this.head = item;
    }
}
exports.default = LinkedMap;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/extensions\typescript\out/features\linkedMap.js.map
