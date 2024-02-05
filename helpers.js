"use strict";

// because I hate IE so much
/* eslint-disable max-statements-per-line */
Math.log2 = Math.log2 || function(x) { return Math.log(x) * Math.LOG2E; };
Math.log10 = Math.log10 || function(x) { return Math.log(x) * Math.LOG10E; };

function round1(num) {
    return Math.floor(num * 10) / 10;
}
function round2(num) {
    return Math.floor(num * 100) / 100;
}

function precision2(num) {
    return Number(num.toPrecision(2));
}
function precision3(num) {
    return Number(num.toPrecision(3));
}
function precision4(num) {
    return Number(num.toPrecision(4));
}

function pxToInt(num) {
    return parseFloat(num.substring(0, num.indexOf("px")));
}

function round(num) {
    return formatNumber(num);
}

function formatNumber(num) {
    return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
}

function formatTime(seconds) {
    if (seconds > 300) {
        let second = Math.floor(seconds%60);
        let minute = Math.floor(seconds/60%60);
        let hour = Math.floor(seconds/60/60%24);
        let day = Math.floor(seconds/60/60/24);
        
        let timeString = "";
        if(day > 0) timeString += (day + "d ");
        if(day > 0 || hour > 0) timeString += (hour + "h ");
        if(day > 0 || hour > 0 || minute > 0) timeString += (minute + "m ");
        timeString += (second + "s");
        
        return timeString;
    }
    if ((seconds % 1 === 0)) {
        return (formatNumber(seconds) + _txt("time_controls>seconds")).replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
    }
    if (seconds < 10) {
        return seconds.toFixed(2) + _txt("time_controls>seconds");
    }
    return (seconds.toFixed(1) + _txt("time_controls>seconds")).replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
}

function copyArray(arr) {
    return JSON.parse(JSON.stringify(arr));
}

/** @type {<T>(obj: T) => T} */
function copyObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function withinDistance(x1, y1, x2, y2, radius) {
    return getDistance(x1, y1, x2, y2) < radius;
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));
}

function intToStringNegative(value, amount) {
    let isPositive = 1;
    if (value < 0) {
        isPositive = -1;
        value *= -1;
    }
    if (value >= 10000) {
        return (isPositive === 1 ? "+" : "-") + nFormatter(value, 3);
    }
    let baseValue = 3;
    if (amount) {
        baseValue = amount;
    }
    return (isPositive === 1 ? "+" : "-") + parseFloat(value).toFixed(baseValue - 1);
}

function intToString(value, amount) {
    const prefix = value < 0 ? "-" : "";
    value = Math.abs(parseFloat(value));
    if (value >= 10000) {
        return prefix + nFormatter(value, 3);
    }
    if (value >= 1000) {
        let baseValue = 3;
        if (amount) {
            baseValue = amount;
        }
        const returnVal = parseFloat(value).toFixed(baseValue - 1);
        return `${prefix}${returnVal[0]},${returnVal.substring(1)}`;
    }
    let baseValue = 3;
    if (amount) {
        baseValue = amount;
    }
    return prefix + parseFloat(value).toFixed(baseValue - 1);
}

function intToStringRound(value) {
    if (value >= 10000) {
        return nFormatter(value, 3);
    }
    return Math.floor(value);
}

function toSuffix(value) {
    value = Math.round(value);
    const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "O", "N", "Dc", "Ud", "Dd", "Td", "qd", "Qd", "sd", "Sd", "Od", "Nd", "V"];
    const suffixNum = Math.floor(((String(value)).length - 1) / 3);
    const shortValue = parseFloat((suffixNum === 0 ? value : (value / Math.pow(1000, suffixNum))).toPrecision(3));
    const valueRepr = shortValue % 1 !== 0 ? shortValue.toPrecision(3) : shortValue.toString();
    return valueRepr + suffixes[suffixNum];
}

const Mana = {
    ceil(value, minNonZero) {
        return value === 0 ? 0
                : !options.fractionalMana ? Math.ceil(value)
                : !minNonZero ? value
                : value > 0 ? Math.max(value, minNonZero)
                : Math.min(value, -minNonZero);
    },
    
    floor(value, minNonZero) {
        return value === 0 ? 0
                : !options.fractionalMana ? Math.floor(value)
                : !minNonZero ? value
                : value > 0 ? Math.max(value, minNonZero)
                : Math.min(value, -minNonZero);
    },
    
    round(value, minNonZero) {
        return value === 0 ? 0
                : !options.fractionalMana ? Math.round(value)
                : !minNonZero ? value
                : value > 0 ? Math.max(value, minNonZero)
                : Math.min(value, -minNonZero);
    },
}

const si = [
    { value: 1E63, symbol: "V" },
    { value: 1E60, symbol: "Nd" },
    { value: 1E57, symbol: "Od" },
    { value: 1E54, symbol: "Sd" },
    { value: 1E51, symbol: "sd" },
    { value: 1E48, symbol: "Qd" },
    { value: 1E45, symbol: "qd" },
    { value: 1E42, symbol: "Td" },
    { value: 1E39, symbol: "Dd" },
    { value: 1E36, symbol: "Ud" },
    { value: 1E33, symbol: "Dc" },
    { value: 1E30, symbol: "N" },
    { value: 1E27, symbol: "O" },
    { value: 1E24, symbol: "Sp" },
    { value: 1E21, symbol: "Sx" },
    { value: 1E18, symbol: "Qi" },
    { value: 1E15, symbol: "Qa" },
    { value: 1E12, symbol: "T" },
    { value: 1E9, symbol: "B" },
    { value: 1E6, symbol: "M" },
    { value: 1E3, symbol: "K" }
];
const rx = /\.0+$|(\.[0-9]*[1-9])0+$/u;

function nFormatter(num, digits) {
    for (let i = 0; i < si.length; i++) {
        // /1.000501 to handle rounding
        if ((num) >= si[i].value / 1.000501) {
            return (num / si[i].value).toPrecision(digits).replace(rx, "$1") + si[i].symbol;
        }
    }
    return num.toPrecision(digits).replace(rx, "$1");
}

function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/gu, (match, index) => {
        if (Number(match) === 0) return "";
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
}

function isVisible(obj) {
    return obj.offsetWidth > 0 && obj.offsetHeight > 0;
}

const factorials = [];
function factorial(n) {
    if (n === 0 || n === 1)
        return 1;
    if (factorials[n] > 0)
        return factorials[n];
    return factorials[n] = factorial(n - 1) * n;
}


const fibonaccis = [];
function fibonacci(n) {
    if (n === 0 || n === 1 || n === undefined)
        return 1;
    if (fibonaccis[n] > 0)
        return fibonaccis[n];
    return fibonaccis[n] = fibonacci(n - 1) + fibonacci(n - 2);
}

function sortArrayObjectsByValue(arr, valueName) {
    const n = arr.length;

    // one by one move boundary of unsorted subarray
    for (let i = 0; i < n - 1; i++) {
        // find the minimum element in unsorted array
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (arr[j][valueName] < arr[minIdx][valueName])
                minIdx = j;
        }

        // swap the found minimum element with the first element
        const swap = arr[minIdx];
        arr[minIdx] = arr[i];
        arr[i] = swap;
    }
}

function addClassToDiv(div, className) {
    const arr = div.className.split(" ");
    if (arr.indexOf(className) === -1) {
        div.className += ` ${className}`;
    }
}

function removeClassFromDiv(div, className) {
    div.classList.remove(className);
}

/**
 * @template {Element} [T=Element]
 * 
 * @param {string} id 
 * @param {(new() => T)|((new() => T)[])} [expectedClass]
 * @param {boolean} [throwIfMissing] 
 * @param {boolean} [warnIfMissing] 
 * @returns {T}
 */
function getElement(id, expectedClass=/** @type {new()=>T} */(Element), throwIfMissing=true, warnIfMissing=true) {
    const expectedClasses = Array.isArray(expectedClass) ? expectedClass : [expectedClass];
    const element = document.getElementById(id);
    for (const expected of expectedClasses) {
        if (element instanceof expected) return element;
    }
    if (warnIfMissing) {
        console.warn("Expected element missing or wrong type!", id, expectedClass, element);
    }
    if (throwIfMissing) {
        throw new Error(`Expected to find element of type ${expectedClasses.join("|")} with ${id}, instead found ${element}!`);
    }
    return undefined;
}

function htmlElement(id, throwIfMissing=true, warnIfMissing=true) {
    return getElement(id, HTMLElement, throwIfMissing, warnIfMissing);
}

function inputElement(id, throwIfMissing=true, warnIfMissing=true) {
    return getElement(id, HTMLInputElement, throwIfMissing, warnIfMissing);
}

function textAreaElement(id, throwIfMissing=true, warnIfMissing=true) {
    return getElement(id, HTMLTextAreaElement, throwIfMissing, warnIfMissing);
}

function selectElement(id, throwIfMissing=true, warnIfMissing=true) {
    return getElement(id, HTMLSelectElement, throwIfMissing, warnIfMissing);
}

/** @typedef {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} HTMLValueElement */
function valueElement(id, throwIfMissing=true, warnIfMissing=true) {
    return getElement(id, [/** @type {new() => HTMLValueElement} */(HTMLInputElement), HTMLTextAreaElement, HTMLSelectElement], throwIfMissing, warnIfMissing);
}

function svgElement(id, throwIfMissing=true, warnIfMissing=true) {
    return getElement(id, SVGElement, throwIfMissing, warnIfMissing);
}

const numbers = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const tens = "twenty thirty forty fifty sixty seventy eighty ninety".split(" ");

function number2Words(n) {
    if (n < 20) return numbers[n];
    const digit = n % 10;
    if (n < 100) return tens[~~(n / 10) - 2] + (digit ? `-${numbers[digit]}` : "");
    if (n < 1000) return `${numbers[~~(n / 100)]} hundred${n % 100 === 0 ? "" : ` ${number2Words(n % 100)}`}`;
    return `${number2Words(~~(n / 1000))} thousand${n % 1000 === 0 ? "" : ` ${number2Words(n % 1000)}`}`;
}

function capitalizeFirst(s) {
    return s.charAt(0).toUpperCase() + s.substr(1);
}

function numberToWords(n) {
    return capitalizeFirst(number2Words(n));
}

function encode(theSave) {
    return Base64.encode(LZWEncode(theSave));
}

function decode(encodedSave) {
    return LZWDecode(Base64.decode(encodedSave))
}

// lzw-compress a string
function LZWEncode(s) {
    const dict = {};
    const data = String(s).split("");
    const out = [];
    let phrase = data[0];
    let code = 256;
    for (let i = 1; i < data.length; i++) {
        const currChar = data[i];
        if (dict[phrase + currChar] === undefined) {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase = currChar;
        } else {
            phrase += currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (let i = 0; i < out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// decompress an LZW-encoded string
function LZWDecode(s) {
    const dict = {};
    const data = (String(s)).split("");
    let currChar = data[0];
    let oldPhrase = currChar;
    const out = [currChar];
    let code = 256;
    let phrase;
    for (let i = 1; i < data.length; i++) {
        const currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        } else {
            phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}

const Base64 = {
    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode(input) {
        let output = "";
        let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        let i = 0;

        input = Base64.UTF8Encode(input);

        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = 64;
                enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
    },

    // public method for decoding
    decode(input) {
        let output = "";
        let chr1, chr2, chr3;
        let enc1, enc2, enc3, enc4;
        let i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output += String.fromCharCode(chr1);
            if (enc3 !== 64) {
                output += String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
                output += String.fromCharCode(chr3);
            }
        }
        output = Base64.UTF8Decode(output);
        return output;
    },

    // private method for UTF-8 encoding
    UTF8Encode(string) {
        string = string.replace(/\r\n/gu, "\n");
        let utftext = "";

        for (let n = 0; n < string.length; n++) {
            const c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    },

    // private method for UTF-8 decoding
    UTF8Decode(utftext) {
        let string = "";
        let i = 0;
        let c = 0, c2 = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                const c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
};


function roughSizeOfObject(object) {

    const objectList = [];
    const stack = [object];
    let bytes = 0;

    while (stack.length) {
        const value = stack.pop();
        if (typeof value === "boolean") {
            bytes += 4;
        } else if (typeof value === "string") {
            bytes += value.length * 2;
        } else if (typeof value === "number") {
            bytes += 8;
        } else if (typeof value === "object" && objectList.indexOf(value) === -1) {
            objectList.push(value);
            for (const i in value) {
                stack.push(value[i]);
            }
        }
    }
    return bytes;
}

/** @type {(object: any, strings?: (string|number)[], map?: Record<string, number>) => any} */
function extractStrings(object, strings, map) {
    const isToplevel = strings == undefined;
    strings ??= [];
    map ??= {};
    function extract(v) {
        if (typeof v === "string" || typeof v === "number") {
            if (!(v in map)) {
                map[v] = strings.length;
                strings.push(v);
            }
            return map[v];
        }
        return extractStrings(v, strings, map);
    }
    if (object?.toJSON) object = object.toJSON();
    if (Array.isArray(object)) {
        const arr = [];
        for (const i in object) {
            arr[i] = extract(object[i]);
        }
        return isToplevel ? [strings, arr] : arr;
    } else if (object && typeof object === "object") {
        const exObj = {};
        for (const prop in object) {
            const idx = extract(prop);
            const v = extract(object[prop]);
            exObj[idx] = v;
        }
        return isToplevel ? {"": strings, ...exObj} : exObj;
    }
    return object;
}

/** @type {(object: any, strings?: (string|number)[]) => any} */
function restoreStrings(object, strings) {
    const isTopLevel = strings == undefined;
    if (isTopLevel) {
        if (Array.isArray(object)) {
            [strings, object] = object;
        } else {
            let {"": s, ...o} = object;
            strings = s;
            object = o;
        }
    }
    function restore(v) {
        if (typeof v === "string") v = parseInt(v);
        if (typeof v === "number") return strings[v];
        return restoreStrings(v, strings);
    }
    if (Array.isArray(object)) {
        const arr = [];
        for (const i in object) {
            arr[i] = restore(object[i]);
        }
        return arr;
    } else if (object && typeof object === "object") {
        const resObj = {};
        for (const prop in object) {
            const v = object[prop];
            resObj[restore(prop)] = restore(v);
        }
        return resObj;
    }
    return object;
}

async function delay(milliseconds) {
    await new Promise(r => setTimeout(r, milliseconds));    
}

/** @returns {Promise<DOMHighResTimeStamp>} */
function nextAnimationFrame() {
    /** @param {FrameRequestCallback} r */
    return new Promise(r => requestAnimationFrame(r));
}

/** @param {IdleRequestOptions} [idleRequestOptions] @returns {Promise<IdleDeadline>} */
function nextIdle(idleRequestOptions) {
    return new Promise(r => requestIdleCallback(r, idleRequestOptions));
}

// modified from: https://stackoverflow.com/questions/879152/how-do-i-make-javascript-beep/13194087#13194087
function beep(duration) {
    // @ts-ignore
    const ctxClass = window.audioContext || window.AudioContext || window.AudioContext || window.webkitAudioContext;
    const ctx = new ctxClass();
    const osc = ctx.createOscillator();

    // stop/start for new browsers, on/off for old
    osc.connect(ctx.destination);
    if (osc.noteOn) osc.noteOn(0);
    if (osc.start) osc.start();

    setTimeout(() => {
        if (osc.noteOff) osc.noteOff(0);
        if (osc.stop) osc.stop();
    }, duration);
}

function statistics() {
    let actionCount = 0;
    let actionWithStoryCount = 0;
    let multiPartActionCount = 0;
    let PBAActionCount = 0;
    let limitedActionCount = 0;
    let storyCount = 0;
    // let skillCount = 0;
    // let buffCount = 0;
    for (const action of totalActionList) {
        if (action.storyReqs !== undefined) {
            const name = action.name.toLowerCase().replace(/ /gu, "_");
            storyCount += _txt(`actions>${name}`, "fallback").split("⮀").length - 1;
            actionWithStoryCount++;
        }
        if (action.type === "progress") PBAActionCount++;
        else if (action.type === "limited") limitedActionCount++;
        else if (action.type === "multipart") multiPartActionCount++;
        actionCount++;
    }

    const list = 
`Actions: ${actionCount} (${actionWithStoryCount} with story)
 Multi part actions: ${multiPartActionCount}
 Progress based actions: ${PBAActionCount}
 Limited actions: ${limitedActionCount}
 Training actions: ${trainingActions.length}/9
 Stories: ${storyCount} (~${(storyCount / actionCount).toFixed(2)} avg per action)
 Skills: ${skillList.length}
 Buffs: ${buffList.length}`;
    return list;
}

const nullFunc = () => {};
/** @param {number | (() => void)} [costFunc]  */
function benchmark(func, iterations, costFunc = nullFunc, returnTimeOnly = false) {
    const baseCost = typeof costFunc === "number" ? costFunc
                   : (func === costFunc && returnTimeOnly) ? 0
                   : benchmark(costFunc, iterations, costFunc, true);
    const before = performance.mark("benchmark-start");
    for (let i = 0; i < iterations; i++) {
        func();
    }
    const after = performance.mark("benchmark-end");
    const measure = performance.measure("benchmark", "benchmark-start", "benchmark-end");
    if (returnTimeOnly) return (measure.duration - baseCost);
    return `Total cost: ${measure.duration - baseCost}ms\n Cost per iteration: ~${(measure.duration - baseCost) / iterations}ms`;
}

// make a lazy getter for an object (most useful for prototypes), which executes the
// provided function once upon first attempting to get the property, and in the future has
// the computed result as an own property of the instance
// usage: defineLazyGetter(A.prototype, 'prop', function() { return ...; })
function defineLazyGetter(object, name, getter) {
    Object.defineProperty(object, name, {
        get() {
            if (Object.prototype.hasOwnProperty.call(this, name)) {
                // only used if this getter itself is own
                // otherwise, shadowing the property is enough
                delete this[name];
            }
            Object.defineProperty(this, name, {
                value: getter.call(this)
            });
            return this[name];
        },
        configurable: true,
    });
}

/**
 * @typedef RationalLike
 * @prop {number} num
 * @prop {number} den
 */

class ImmutableRational {
    /** @readonly */
    static get zero() {
        const r = new ImmutableRational(0);
        Object.defineProperty(this, "zero", {writable: false, configurable: true, value: r});
        return r;
    }
    /** @readonly */
    static get one() {
        const r = new ImmutableRational(1);
        Object.defineProperty(this, "one", {writable: false, configurable: true, value: r});
        return r;
    } 

    static finalizers = new FinalizationRegistry(ImmutableRational.dispose);

    /** @type {RationalPtr} */
    wasmPtr;

    static {
        Data.omitProperties(this.prototype, ["wasmPtr"]);
    }

    get num() {
        return _wasm.rational_num(this.wasmPtr);
    }
    get den() {
        return _wasm.rational_den(this.wasmPtr);
    }
    get approximateValue() {return _wasm.rational_approximateValue(this.wasmPtr); }

    static fromRatio(ratio = 0, denom = 100) {
        const numX8 = Math.round(ratio * denom * 8);
        if (numX8 % 8 !== 0) {
            console.warn(`Ratio ${ratio} not cleanly divisible by 1/${denom}! Rounding to ${numX8/8}/${denom}`);
        }
        return new this(numX8 / 8, denom, true);
    }

    /** @param {RationalPtr} wasmPtr  */
    static dispose(wasmPtr) {
        if (wasmPtr !== undefined) {
            _wasm.rational_delete(wasmPtr);
        }
    }

    dispose() {
        ImmutableRational.dispose(this.wasmPtr);
        this.wasmPtr = undefined;
        ImmutableRational.finalizers.unregister(this);
    }

    /** @overload @param {number} [numOrRational] @param {number} [denom] @param {boolean} [reduce] */
    /** @overload @param {RationalLike} numOrRational */
    /** @overload @param {number|RationalLike} [numOrRational] @param {number} [denom] @param {boolean} [reduce] */
    /** @param {number|RationalLike} numOrRational */
    constructor(numOrRational = 0, denom = 1, reduce=false) {
        if (typeof numOrRational === "object" && numOrRational && "num" in numOrRational && "den" in numOrRational) {
            denom = numOrRational.den;
            numOrRational = numOrRational.num;
        } else if (typeof numOrRational !== "number") {
            numOrRational = NaN;
        }
        this.wasmPtr = _wasm.rational_new(numOrRational, denom, reduce);
        ImmutableRational.finalizers.register(this, this.wasmPtr)
    }

    get isImmutable() {
        return true;
    }

    /** @param {number|RationalLike} [num] @param {number|RationalLike} [den] @returns {ImmutableRational} */
    setImmutable(num = this.num, den = this.den, reduce = false) {
        return Rational.prototype.setValue.call(this, num, den, reduce);
    }

    /**
     * Convenience/signpost function for treating an ImmutableRational as mutable. This doesn't reprototype,
     * so you still can't call setValue() etc, but you can pass it as a result parameter.
     */
    asMutable() {
        return /** @type {Rational} */(/** @type {unknown} */(this));
    }

    /**
     * Convenience function to allow a Rational to be typed as an ImmutableRational to avoid accidental reassignment.
     * Only usable as Rational.thaw().
     * @returns {Rational}
     */
    thaw() {
        throw new Error("thaw() cannot be used on an ImmutableRational instance! call setImmutable(false) to reprototype to a Rational first.");
    }

    toString() {
        return (this.approximateValue % 1 === 0) ? this.approximateValue.toString()
             : this.num > this.den ? `${Math.trunc(this.approximateValue)}\u202F${this.num % this.den}⁄${this.den}` // 202F - narrow nbsp
             : this.num < -this.den ? `${Math.trunc(this.approximateValue)}\u202F${-this.num % this.den}⁄${this.den}`
             : `${this.num}⁄${this.den}`; // that's a fraction slash ⁄ not a regular slash /
    }

    valueOf() {
        return this.approximateValue;
    }

    setDirty() {
        return this;
    }

    isNaN() {
        return isNaN(this.approximateValue);
    }

    clone() {
        return new Rational(this);
    }

    reduced(result = new Rational()) {
        return result.setValue(this.num, this.den, true);
    }

    /** @param {RationalLike|number} [min] @param {RationalLike|number} [max] */
    clamped(min, max, result = new Rational()) {
        if (min != null && this.isLessThan(min)) {
            result.setValue(min);
        } else if (max != null && this.isGreaterThan(max)) {
            result.setValue(max);
        } else {
            result.setValue(this);
        }

        return result;
    }

    ceil() {
        return Math.ceil(this.approximateValue);
    }

    ceiled(result = new Rational()) {
        return result.setValue(this.ceil(), 1, false);
    }

    floor() {
        return Math.floor(this.approximateValue);
    }

    floored(result) {
        return result.setValue(this.floor(), 1, false);
    }

    round() {
        return Math.round(this.approximateValue);
    }

    rounded(result) {
        return result.setValue(this.round(), 1, false);
    }

    negated(result = new Rational()) {
        return result.setValue(-this.num, this.den);
    }

    inverted(result = new Rational()) {
        return result.setValue(this.num < 0 ? -this.den : this.den,
                               this.num < 0 ? -this.num : this.num);
    }

    /** @param {RationalLike|number} other  */
    plus(other, result = new Rational()) { return Rational.add(this, other, result); }
    /** @param {RationalLike|number} other  */
    minus(other, result = new Rational()) { return Rational.subtract(this, other, result); }
    /** @param {RationalLike|number} other  */
    times(other, result = new Rational()) { return Rational.multiply(this, other, result); }
    /** @param {RationalLike|number} other  */
    dividedBy(other, result = new Rational()) { return Rational.divide(this, other, result); }

    /** @param {RationalLike|number} other  */
    compareTo(other) {
        return Rational.compare(this, other);
    }

    /** @param {RationalLike|number} other  */
    equals(other) {
        return this.compareTo(other) === 0;
    }

    /** @param {RationalLike|number} other  */
    isGreaterThan(other) {
        return this.compareTo(other) > 0;
    }

    /** @param {RationalLike|number} other  */
    isLessThan(other) {
        return this.compareTo(other) < 0;
    }

    static gcd(u = 0, v = 0) {
        if (u !== u || v !== v) { // so much faster than isNaN(u) || isNaN(v), I hate it
            return NaN;
        } else if (u % 1 !== 0 || v % 1 !== 0) {
            return undefined;
        }
        return _wasm.gcd(u, v);
    }

    static lcm(u = 0, v = 0) {
        if (u !== u || v !== v) return NaN; // isNaN(u) || isNaN(v)
        if (u === v) return u;
        const gcd = this.gcd(u, v);
        return gcd === u ? v
             : gcd === v ? u
             : gcd === undefined ? undefined
             : Math.abs(u * v / gcd);
    }

}

class Rational extends ImmutableRational {
    get num() {
        return _wasm.rational_num(this.wasmPtr);
    }
    set num(n) {
        _wasm.rational_setnum(this.wasmPtr, n);
    }
    get den() {
        return _wasm.rational_den(this.wasmPtr);
    }
    set den(d) {
        _wasm.rational_setden(this.wasmPtr, d);
    }

    get isImmutable() { return false; }

    /**
     * Convenience function to retype this as an ImmutableRational to avoid accidental overwrites
     * @returns {ImmutableRational}
     */
    freeze() {
        return this;
    }

    /**
     * Convenience function to retype as a Rational, after a freeze().
     * @returns {Rational}
     */
    thaw() {
        return this;
    }


    /** @param {number|RationalLike} [num] @param {number|RationalLike} [den] */
    setValue(num = this.num, den = undefined, reduce = false) {
        if (typeof num !== "number" || typeof den !== "number") {
            if (typeof num === "number") {
                _wasm.rational_setValue(this.wasmPtr, num, 1);
            } else if (typeof num === "object" && num) {
                _wasm.rational_setValue(this.wasmPtr, num.num, num.den);
            } else {
                _wasm.rational_setValue(this.wasmPtr, 1, 1)
            }
            if (typeof den === "number") {
                _wasm.rational_mulRD(this.wasmPtr, null, 1, den, reduce);
            } else if (typeof den === "object" && den) {
                _wasm.rational_mulRD(this.wasmPtr, null, den.den, den.num, reduce);
            }
        } else {
            _wasm.rational_setValue(this.wasmPtr, num, den, reduce);
        }

        return this;
    }

    reduce() {
        return this.reduced(this);
    }

    /** @param {RationalLike} other */
    copyFrom(other) {
        return this.setValue(other.num, other.den);
    }

    negate() {
        return this.setValue(-this.num);
    }

    invert() {
        return this.inverted(this);
    }

    /** @param {RationalLike|number} other  */
    add(other) { return Rational.add(this, other, this); }

    /** @param {RationalLike|number} other  */
    subtract(other) { return Rational.subtract(this, other, this); }

    /** @param {RationalLike|number} other */
    multiplyBy(other) { return Rational.multiply(this, other, this); }

    /** @param {RationalLike|number} other  */
    divideBy(other) { return Rational.divide(this, other, this); }

    /** @param {RationalLike|number} other  */
    /** @param {RationalLike|number} [min] @param {RationalLike|number} [max] */
    clamp(min, max) {
        return this.clamped(min, max, this);
    }

    ceilThis() {
        return this.ceiled(this);
    }

    floorThis() {
        return this.floored(this);
    }

    roundThis() {
        return this.rounded(this);
    }

    /** @param {RationalLike} lhs @param {RationalLike|number} rhs */
    static add(lhs, rhs, result = new Rational(), reduce = false) {
        if (lhs instanceof ImmutableRational) {
            if (rhs instanceof ImmutableRational) {
                _wasm.rational_addRR(result.wasmPtr, lhs.wasmPtr, rhs.wasmPtr, reduce);
            } else if (typeof rhs === "number") {
                _wasm.rational_addRI(result.wasmPtr, lhs.wasmPtr, rhs, reduce);
            } else {
                _wasm.rational_addRD(result.wasmPtr, lhs.wasmPtr, rhs.num, rhs.den, reduce);
            }
        } else {
            if (rhs instanceof ImmutableRational) {
                _wasm.rational_addRD(result.wasmPtr, rhs.wasmPtr, lhs.num, lhs.den, reduce);
            } else if (typeof rhs === "number") {
                _wasm.rational_addDD(result.wasmPtr, lhs.num, lhs.den, rhs, 1, reduce);
            } else {
                _wasm.rational_addDD(result.wasmPtr, lhs.num, lhs.den, rhs.num, rhs.den, reduce);
            }
        }
        return result;
    }

    /** @param {RationalLike} lhs @param {RationalLike|number} rhs */
    static subtract(lhs, rhs, result = new Rational(), reduce = false) {
        if (lhs instanceof ImmutableRational) {
            if (rhs instanceof ImmutableRational) {
                _wasm.rational_subRR(result.wasmPtr, lhs.wasmPtr, rhs.wasmPtr, reduce);
            } else if (typeof rhs === "number") {
                _wasm.rational_subRI(result.wasmPtr, lhs.wasmPtr, rhs, reduce);
            } else {
                _wasm.rational_addRD(result.wasmPtr, lhs.wasmPtr, -rhs.num, rhs.den, reduce);
            }
        } else {
            if (rhs instanceof ImmutableRational) {
                _wasm.rational_negate(result.wasmPtr, rhs.wasmPtr);
                _wasm.rational_addRD(result.wasmPtr, null, lhs.num, lhs.den, reduce);
            } else if (typeof rhs === "number") {
                _wasm.rational_addDD(result.wasmPtr, lhs.num, lhs.den, -rhs, 1, reduce);
            } else {
                _wasm.rational_addDD(result.wasmPtr, lhs.num, lhs.den, -rhs.num, rhs.den, reduce);
            }
        }
        return result;
    }

    /** @param {RationalLike} lhs @param {RationalLike|number} rhs */
    static multiply(lhs, rhs, result = new Rational(), reduce = false) {
        if (lhs instanceof ImmutableRational) {
            if (rhs instanceof ImmutableRational) {
                _wasm.rational_mulRR(result.wasmPtr, lhs.wasmPtr, rhs.wasmPtr, reduce);
            } else if (typeof rhs === "number") {
                _wasm.rational_mulRI(result.wasmPtr, lhs.wasmPtr, rhs, reduce);
            } else {
                _wasm.rational_mulRD(result.wasmPtr, lhs.wasmPtr, rhs.num, rhs.den, reduce);
            }
        } else {
            if (rhs instanceof ImmutableRational) {
                _wasm.rational_mulRD(result.wasmPtr, rhs.wasmPtr, lhs.num, lhs.den, reduce);
            } else if (typeof rhs === "number") {
                _wasm.rational_mulDD(result.wasmPtr, lhs.num, lhs.den, rhs, 1, reduce);
            } else {
                _wasm.rational_mulDD(result.wasmPtr, lhs.num, lhs.den, rhs.num, rhs.den, reduce);
            }
        }
        return result;
    }

    /** @param {RationalLike} lhs @param {RationalLike|number} rhs */
    static divide(lhs, rhs, result = new Rational(), reduce = false) {
        if (lhs instanceof ImmutableRational) {
            if (rhs instanceof ImmutableRational) {
                _wasm.rational_divRR(result.wasmPtr, lhs.wasmPtr, rhs.wasmPtr, reduce);
            } else if (typeof rhs === "number") {
                _wasm.rational_divRI(result.wasmPtr, lhs.wasmPtr, rhs, reduce);
            } else {
                _wasm.rational_mulRD(result.wasmPtr, lhs.wasmPtr, rhs.den, rhs.num, reduce);
            }
        } else {
            if (rhs instanceof ImmutableRational) {
                _wasm.rational_invert(result.wasmPtr, rhs.wasmPtr);
                _wasm.rational_mulRD(result.wasmPtr, null, lhs.num, lhs.den, reduce);
            } else if (typeof rhs === "number") {
                _wasm.rational_mulDD(result.wasmPtr, lhs.num, lhs.den, 1, rhs, reduce);
            } else {
                _wasm.rational_mulDD(result.wasmPtr, lhs.num, lhs.den, rhs.den, rhs.num, reduce);
            }
        }
        return result;
    }

    /** @type {Rational} */
    static #scratch;
    /** @param {RationalLike} lhs @param {RationalLike|number} rhs */
    static compare(lhs, rhs) {
        const lptr = lhs instanceof ImmutableRational ? lhs.wasmPtr
                    : (this.#scratch ??= new Rational(lhs.num, lhs.den)).setValue(lhs.num, lhs.den).wasmPtr;
        if (rhs instanceof ImmutableRational) {
            return _wasm.rational_cmpRR(lptr, rhs.wasmPtr);
        } else if (typeof rhs === "number") {
            return rhs % 1 === 0 ? _wasm.rational_cmpRI(lptr, rhs) : _wasm.rational_cmpRF(lptr, rhs);
        } else {
            return _wasm.rational_cmpRD(lptr, rhs.num, rhs.den);
        }
    }

}
