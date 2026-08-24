import { OptionsValidationError } from '../Error/OptionsValidationError.js';
const validate = (function () {
    'use strict';
    const stringLength = (string) => /[\uD800-\uDFFF]/.test(string) ? [...string].length : string.length;
    const pointerPart = (s) => (/~\//.test(s) ? `${s}`.replace(/~/g, '~0').replace(/\//g, '~1') : s);
    const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
    const ref1 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "string")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(data === "none" || data === "horizontal" || data === "vertical" || data === "both")) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/enum", instanceLocation: "#" });
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const errorMerge = ({ keywordLocation, instanceLocation }, schemaBase, dataBase) => ({
        keywordLocation: `${schemaBase}${keywordLocation.slice(1)}`,
        instanceLocation: `${dataBase}${instanceLocation.slice(1)}`,
    });
    const pattern0 = new RegExp("^[a-zA-Z0-9_\\-]+( [a-zA-Z0-9_\\-]+)*(, ?[a-zA-Z0-9_\\-]+( [a-zA-Z0-9_\\-]+)*)*$", "u");
    const ref2 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "string")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            const prev1 = errorCount;
            if (data.length > 256 && stringLength(data) > 256) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maxLength", instanceLocation: "#" });
                errorCount++;
            }
            if (errorCount === prev1) {
                if (!pattern0.test(data)) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/pattern", instanceLocation: "#" });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const ref3 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!Number.isInteger(data)) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(1 <= data)) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/minimum", instanceLocation: "#" });
                errorCount++;
            }
            if (!(1000 >= data)) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maximum", instanceLocation: "#" });
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const ref5 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "number")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(0 <= data)) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/minimum", instanceLocation: "#" });
                errorCount++;
            }
            if (!(10 >= data)) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maximum", instanceLocation: "#" });
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const ref4 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        let suberr9 = null;
        const sub6 = (() => {
            let errorCount = 0;
            const err6 = validate.errors;
            const res6 = ref5(data);
            const suberr10 = ref5.errors;
            validate.errors = err6;
            if (!res6) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push(...suberr10.map(e => errorMerge(e, "#/anyOf/0/$ref", "#")));
                errorCount++;
            }
            return errorCount === 0;
        })();
        if (!sub6) {
            const sub7 = (() => {
                let errorCount = 0;
                if (!Array.isArray(data)) {
                    if (suberr9 === null)
                        suberr9 = [];
                    suberr9.push({ keywordLocation: "#/anyOf/1/type", instanceLocation: "#" });
                    errorCount++;
                }
                else {
                    if (data.length > 2) {
                        if (suberr9 === null)
                            suberr9 = [];
                        suberr9.push({ keywordLocation: "#/anyOf/1/maxItems", instanceLocation: "#" });
                        errorCount++;
                    }
                    if (data.length < 0) {
                        if (suberr9 === null)
                            suberr9 = [];
                        suberr9.push({ keywordLocation: "#/anyOf/1/minItems", instanceLocation: "#" });
                        errorCount++;
                    }
                    for (let l = 0; l < data.length; l++) {
                        if (data[l] !== undefined && hasOwn(data, l)) {
                            const err7 = validate.errors;
                            const res7 = ref5(data[l]);
                            const suberr11 = ref5.errors;
                            validate.errors = err7;
                            if (!res7) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push(...suberr11.map(e => errorMerge(e, "#/anyOf/1/items/$ref", "#/" + l)));
                                errorCount++;
                            }
                        }
                    }
                }
                return errorCount === 0;
            })();
            if (!sub7) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/anyOf", instanceLocation: "#" });
                if (suberr9)
                    validate.errors.push(...suberr9);
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const ref6 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "number")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(0 <= data)) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/minimum", instanceLocation: "#" });
                errorCount++;
            }
            if (!(50 >= data)) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maximum", instanceLocation: "#" });
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const pattern1 = new RegExp("^!?[a-z][a-zA-Z0-9]*(:[a-z][a-zA-Z0-9]*)?$", "u");
    const ref7 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "string")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            const prev2 = errorCount;
            if (data.length > 130 && stringLength(data) > 130) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maxLength", instanceLocation: "#" });
                errorCount++;
            }
            if (errorCount === prev2) {
                if (!pattern1.test(data)) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/pattern", instanceLocation: "#" });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const pattern2 = new RegExp("^[a-z][a-zA-Z0-9]*Probability$", "u");
    const pattern3 = new RegExp("^[a-z][a-zA-Z0-9]*Variant$", "u");
    const pattern4 = new RegExp("^[a-z][a-zA-Z0-9]*$", "u");
    const ref8 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "string")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            const prev3 = errorCount;
            if (data.length > 64 && stringLength(data) > 64) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maxLength", instanceLocation: "#" });
                errorCount++;
            }
            if (errorCount === prev3) {
                if (!pattern4.test(data)) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/pattern", instanceLocation: "#" });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const pattern5 = new RegExp("^[a-z][a-zA-Z0-9]*Color$", "u");
    const pattern6 = new RegExp("^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{4}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$", "u");
    const ref9 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "string")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            const prev4 = errorCount;
            if (errorCount === prev4) {
                if (!pattern6.test(data)) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/pattern", instanceLocation: "#" });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const pattern7 = new RegExp("^[a-z][a-zA-Z0-9]*ColorFill$", "u");
    const ref10 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "string")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(data === "solid" || data === "linear" || data === "radial")) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/enum", instanceLocation: "#" });
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const pattern8 = new RegExp("^[a-z][a-zA-Z0-9]*ColorFillStops$", "u");
    const ref11 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!Number.isInteger(data)) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(2 <= data)) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/minimum", instanceLocation: "#" });
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const pattern9 = new RegExp("^[a-z][a-zA-Z0-9]*ColorAngle$", "u");
    const ref13 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "number")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(-360 <= data)) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/minimum", instanceLocation: "#" });
                errorCount++;
            }
            if (!(360 >= data)) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maximum", instanceLocation: "#" });
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const ref12 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        let suberr32 = null;
        const sub21 = (() => {
            let errorCount = 0;
            const err22 = validate.errors;
            const res22 = ref13(data);
            const suberr33 = ref13.errors;
            validate.errors = err22;
            if (!res22) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push(...suberr33.map(e => errorMerge(e, "#/anyOf/0/$ref", "#")));
                errorCount++;
            }
            return errorCount === 0;
        })();
        if (!sub21) {
            const sub22 = (() => {
                let errorCount = 0;
                if (!Array.isArray(data)) {
                    if (suberr32 === null)
                        suberr32 = [];
                    suberr32.push({ keywordLocation: "#/anyOf/1/type", instanceLocation: "#" });
                    errorCount++;
                }
                else {
                    if (data.length > 2) {
                        if (suberr32 === null)
                            suberr32 = [];
                        suberr32.push({ keywordLocation: "#/anyOf/1/maxItems", instanceLocation: "#" });
                        errorCount++;
                    }
                    if (data.length < 0) {
                        if (suberr32 === null)
                            suberr32 = [];
                        suberr32.push({ keywordLocation: "#/anyOf/1/minItems", instanceLocation: "#" });
                        errorCount++;
                    }
                    for (let s = 0; s < data.length; s++) {
                        if (data[s] !== undefined && hasOwn(data, s)) {
                            const err23 = validate.errors;
                            const res23 = ref13(data[s]);
                            const suberr34 = ref13.errors;
                            validate.errors = err23;
                            if (!res23) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push(...suberr34.map(e => errorMerge(e, "#/anyOf/1/items/$ref", "#/" + s)));
                                errorCount++;
                            }
                        }
                    }
                }
                return errorCount === 0;
            })();
            if (!sub22) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/anyOf", instanceLocation: "#" });
                if (suberr32)
                    validate.errors.push(...suberr32);
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const pattern10 = new RegExp("^[a-z][a-zA-Z0-9]*ColorOrder$", "u");
    const ref15 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "number")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(-1000 <= data)) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/minimum", instanceLocation: "#" });
                errorCount++;
            }
            if (!(1000 >= data)) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maximum", instanceLocation: "#" });
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const ref14 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        let suberr37 = null;
        const sub23 = (() => {
            let errorCount = 0;
            const err26 = validate.errors;
            const res26 = ref15(data);
            const suberr38 = ref15.errors;
            validate.errors = err26;
            if (!res26) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push(...suberr38.map(e => errorMerge(e, "#/anyOf/0/$ref", "#")));
                errorCount++;
            }
            return errorCount === 0;
        })();
        if (!sub23) {
            const sub24 = (() => {
                let errorCount = 0;
                if (!Array.isArray(data)) {
                    if (suberr37 === null)
                        suberr37 = [];
                    suberr37.push({ keywordLocation: "#/anyOf/1/type", instanceLocation: "#" });
                    errorCount++;
                }
                else {
                    if (data.length > 2) {
                        if (suberr37 === null)
                            suberr37 = [];
                        suberr37.push({ keywordLocation: "#/anyOf/1/maxItems", instanceLocation: "#" });
                        errorCount++;
                    }
                    if (data.length < 0) {
                        if (suberr37 === null)
                            suberr37 = [];
                        suberr37.push({ keywordLocation: "#/anyOf/1/minItems", instanceLocation: "#" });
                        errorCount++;
                    }
                    for (let t = 0; t < data.length; t++) {
                        if (data[t] !== undefined && hasOwn(data, t)) {
                            const err27 = validate.errors;
                            const res27 = ref15(data[t]);
                            const suberr39 = ref15.errors;
                            validate.errors = err27;
                            if (!res27) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push(...suberr39.map(e => errorMerge(e, "#/anyOf/1/items/$ref", "#/" + t)));
                                errorCount++;
                            }
                        }
                    }
                }
                return errorCount === 0;
            })();
            if (!sub24) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/anyOf", instanceLocation: "#" });
                if (suberr37)
                    validate.errors.push(...suberr37);
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const ref0 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "object" && data && !Array.isArray(data))) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            const prev0 = errorCount;
            if (Object.keys(data).length > 512) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maxProperties", instanceLocation: "#" });
                errorCount++;
            }
            for (const key0 of Object.keys(data)) {
                if (key0.length > 128 && stringLength(key0) > 128) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/propertyNames/maxLength", instanceLocation: "#/" + pointerPart(key0) });
                    errorCount++;
                }
            }
            if (data.seed !== undefined && hasOwn(data, "seed")) {
                if (!(typeof data.seed === "string")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/seed/type", instanceLocation: "#/seed" });
                    errorCount++;
                }
                else {
                    if (data.seed.length > 1024 && stringLength(data.seed) > 1024) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/seed/maxLength", instanceLocation: "#/seed" });
                        errorCount++;
                    }
                }
            }
            if (data.size !== undefined && hasOwn(data, "size")) {
                if (!Number.isInteger(data.size)) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/size/type", instanceLocation: "#/size" });
                    errorCount++;
                }
                else {
                    if (!(1 <= data.size)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/size/minimum", instanceLocation: "#/size" });
                        errorCount++;
                    }
                    if (!(4096 >= data.size)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/size/maximum", instanceLocation: "#/size" });
                        errorCount++;
                    }
                }
            }
            if (data.idRandomization !== undefined && hasOwn(data, "idRandomization")) {
                if (!(typeof data.idRandomization === "boolean")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/idRandomization/type", instanceLocation: "#/idRandomization" });
                    errorCount++;
                }
            }
            if (data.title !== undefined && hasOwn(data, "title")) {
                if (!(typeof data.title === "string")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/title/type", instanceLocation: "#/title" });
                    errorCount++;
                }
                else {
                    if (data.title.length > 256 && stringLength(data.title) > 256) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/title/maxLength", instanceLocation: "#/title" });
                        errorCount++;
                    }
                }
            }
            if (data.flip !== undefined && hasOwn(data, "flip")) {
                let suberr0 = null;
                const sub0 = (() => {
                    let errorCount = 0;
                    const err0 = validate.errors;
                    const res0 = ref1(data.flip);
                    const suberr1 = ref1.errors;
                    validate.errors = err0;
                    if (!res0) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push(...suberr1.map(e => errorMerge(e, "#/properties/flip/anyOf/0/$ref", "#/flip")));
                        errorCount++;
                    }
                    return errorCount === 0;
                })();
                if (!sub0) {
                    const sub1 = (() => {
                        let errorCount = 0;
                        if (!Array.isArray(data.flip)) {
                            if (suberr0 === null)
                                suberr0 = [];
                            suberr0.push({ keywordLocation: "#/properties/flip/anyOf/1/type", instanceLocation: "#/flip" });
                            errorCount++;
                        }
                        else {
                            if (data.flip.length > 4) {
                                if (suberr0 === null)
                                    suberr0 = [];
                                suberr0.push({ keywordLocation: "#/properties/flip/anyOf/1/maxItems", instanceLocation: "#/flip" });
                                errorCount++;
                            }
                            if (data.flip.length < 0) {
                                if (suberr0 === null)
                                    suberr0 = [];
                                suberr0.push({ keywordLocation: "#/properties/flip/anyOf/1/minItems", instanceLocation: "#/flip" });
                                errorCount++;
                            }
                            for (let i = 0; i < data.flip.length; i++) {
                                if (data.flip[i] !== undefined && hasOwn(data.flip, i)) {
                                    const err1 = validate.errors;
                                    const res1 = ref1(data.flip[i]);
                                    const suberr2 = ref1.errors;
                                    validate.errors = err1;
                                    if (!res1) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push(...suberr2.map(e => errorMerge(e, "#/properties/flip/anyOf/1/items/$ref", "#/flip/" + i)));
                                        errorCount++;
                                    }
                                }
                            }
                        }
                        return errorCount === 0;
                    })();
                    if (!sub1) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/flip/anyOf", instanceLocation: "#/flip" });
                        if (suberr0)
                            validate.errors.push(...suberr0);
                        errorCount++;
                    }
                }
            }
            if (data.fontFamily !== undefined && hasOwn(data, "fontFamily")) {
                let suberr3 = null;
                const sub2 = (() => {
                    let errorCount = 0;
                    const err2 = validate.errors;
                    const res2 = ref2(data.fontFamily);
                    const suberr4 = ref2.errors;
                    validate.errors = err2;
                    if (!res2) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push(...suberr4.map(e => errorMerge(e, "#/properties/fontFamily/anyOf/0/$ref", "#/fontFamily")));
                        errorCount++;
                    }
                    return errorCount === 0;
                })();
                if (!sub2) {
                    const sub3 = (() => {
                        let errorCount = 0;
                        if (!Array.isArray(data.fontFamily)) {
                            if (suberr3 === null)
                                suberr3 = [];
                            suberr3.push({ keywordLocation: "#/properties/fontFamily/anyOf/1/type", instanceLocation: "#/fontFamily" });
                            errorCount++;
                        }
                        else {
                            if (data.fontFamily.length > 128) {
                                if (suberr3 === null)
                                    suberr3 = [];
                                suberr3.push({ keywordLocation: "#/properties/fontFamily/anyOf/1/maxItems", instanceLocation: "#/fontFamily" });
                                errorCount++;
                            }
                            if (data.fontFamily.length < 0) {
                                if (suberr3 === null)
                                    suberr3 = [];
                                suberr3.push({ keywordLocation: "#/properties/fontFamily/anyOf/1/minItems", instanceLocation: "#/fontFamily" });
                                errorCount++;
                            }
                            for (let j = 0; j < data.fontFamily.length; j++) {
                                if (data.fontFamily[j] !== undefined && hasOwn(data.fontFamily, j)) {
                                    const err3 = validate.errors;
                                    const res3 = ref2(data.fontFamily[j]);
                                    const suberr5 = ref2.errors;
                                    validate.errors = err3;
                                    if (!res3) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push(...suberr5.map(e => errorMerge(e, "#/properties/fontFamily/anyOf/1/items/$ref", "#/fontFamily/" + j)));
                                        errorCount++;
                                    }
                                }
                            }
                        }
                        return errorCount === 0;
                    })();
                    if (!sub3) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/fontFamily/anyOf", instanceLocation: "#/fontFamily" });
                        if (suberr3)
                            validate.errors.push(...suberr3);
                        errorCount++;
                    }
                }
            }
            if (data.fontWeight !== undefined && hasOwn(data, "fontWeight")) {
                let suberr6 = null;
                const sub4 = (() => {
                    let errorCount = 0;
                    const err4 = validate.errors;
                    const res4 = ref3(data.fontWeight);
                    const suberr7 = ref3.errors;
                    validate.errors = err4;
                    if (!res4) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push(...suberr7.map(e => errorMerge(e, "#/properties/fontWeight/anyOf/0/$ref", "#/fontWeight")));
                        errorCount++;
                    }
                    return errorCount === 0;
                })();
                if (!sub4) {
                    const sub5 = (() => {
                        let errorCount = 0;
                        if (!Array.isArray(data.fontWeight)) {
                            if (suberr6 === null)
                                suberr6 = [];
                            suberr6.push({ keywordLocation: "#/properties/fontWeight/anyOf/1/type", instanceLocation: "#/fontWeight" });
                            errorCount++;
                        }
                        else {
                            if (data.fontWeight.length > 128) {
                                if (suberr6 === null)
                                    suberr6 = [];
                                suberr6.push({ keywordLocation: "#/properties/fontWeight/anyOf/1/maxItems", instanceLocation: "#/fontWeight" });
                                errorCount++;
                            }
                            if (data.fontWeight.length < 0) {
                                if (suberr6 === null)
                                    suberr6 = [];
                                suberr6.push({ keywordLocation: "#/properties/fontWeight/anyOf/1/minItems", instanceLocation: "#/fontWeight" });
                                errorCount++;
                            }
                            for (let k = 0; k < data.fontWeight.length; k++) {
                                if (data.fontWeight[k] !== undefined && hasOwn(data.fontWeight, k)) {
                                    const err5 = validate.errors;
                                    const res5 = ref3(data.fontWeight[k]);
                                    const suberr8 = ref3.errors;
                                    validate.errors = err5;
                                    if (!res5) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push(...suberr8.map(e => errorMerge(e, "#/properties/fontWeight/anyOf/1/items/$ref", "#/fontWeight/" + k)));
                                        errorCount++;
                                    }
                                }
                            }
                        }
                        return errorCount === 0;
                    })();
                    if (!sub5) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/fontWeight/anyOf", instanceLocation: "#/fontWeight" });
                        if (suberr6)
                            validate.errors.push(...suberr6);
                        errorCount++;
                    }
                }
            }
            if (data.scale !== undefined && hasOwn(data, "scale")) {
                const err8 = validate.errors;
                const res8 = ref4(data.scale);
                const suberr12 = ref4.errors;
                validate.errors = err8;
                if (!res8) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr12.map(e => errorMerge(e, "#/properties/scale/allOf/0/$ref", "#/scale")));
                    errorCount++;
                }
            }
            if (data.borderRadius !== undefined && hasOwn(data, "borderRadius")) {
                let suberr13 = null;
                const sub8 = (() => {
                    let errorCount = 0;
                    const err9 = validate.errors;
                    const res9 = ref6(data.borderRadius);
                    const suberr14 = ref6.errors;
                    validate.errors = err9;
                    if (!res9) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push(...suberr14.map(e => errorMerge(e, "#/properties/borderRadius/anyOf/0/$ref", "#/borderRadius")));
                        errorCount++;
                    }
                    return errorCount === 0;
                })();
                if (!sub8) {
                    const sub9 = (() => {
                        let errorCount = 0;
                        if (!Array.isArray(data.borderRadius)) {
                            if (suberr13 === null)
                                suberr13 = [];
                            suberr13.push({ keywordLocation: "#/properties/borderRadius/anyOf/1/type", instanceLocation: "#/borderRadius" });
                            errorCount++;
                        }
                        else {
                            if (data.borderRadius.length > 2) {
                                if (suberr13 === null)
                                    suberr13 = [];
                                suberr13.push({ keywordLocation: "#/properties/borderRadius/anyOf/1/maxItems", instanceLocation: "#/borderRadius" });
                                errorCount++;
                            }
                            if (data.borderRadius.length < 0) {
                                if (suberr13 === null)
                                    suberr13 = [];
                                suberr13.push({ keywordLocation: "#/properties/borderRadius/anyOf/1/minItems", instanceLocation: "#/borderRadius" });
                                errorCount++;
                            }
                            for (let m = 0; m < data.borderRadius.length; m++) {
                                if (data.borderRadius[m] !== undefined && hasOwn(data.borderRadius, m)) {
                                    const err10 = validate.errors;
                                    const res10 = ref6(data.borderRadius[m]);
                                    const suberr15 = ref6.errors;
                                    validate.errors = err10;
                                    if (!res10) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push(...suberr15.map(e => errorMerge(e, "#/properties/borderRadius/anyOf/1/items/$ref", "#/borderRadius/" + m)));
                                        errorCount++;
                                    }
                                }
                            }
                        }
                        return errorCount === 0;
                    })();
                    if (!sub9) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/borderRadius/anyOf", instanceLocation: "#/borderRadius" });
                        if (suberr13)
                            validate.errors.push(...suberr13);
                        errorCount++;
                    }
                }
            }
            if (data.tags !== undefined && hasOwn(data, "tags")) {
                let suberr16 = null;
                const sub10 = (() => {
                    let errorCount = 0;
                    const err11 = validate.errors;
                    const res11 = ref7(data.tags);
                    const suberr17 = ref7.errors;
                    validate.errors = err11;
                    if (!res11) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push(...suberr17.map(e => errorMerge(e, "#/properties/tags/anyOf/0/$ref", "#/tags")));
                        errorCount++;
                    }
                    return errorCount === 0;
                })();
                if (!sub10) {
                    const sub11 = (() => {
                        let errorCount = 0;
                        if (!Array.isArray(data.tags)) {
                            if (suberr16 === null)
                                suberr16 = [];
                            suberr16.push({ keywordLocation: "#/properties/tags/anyOf/1/type", instanceLocation: "#/tags" });
                            errorCount++;
                        }
                        else {
                            if (data.tags.length > 128) {
                                if (suberr16 === null)
                                    suberr16 = [];
                                suberr16.push({ keywordLocation: "#/properties/tags/anyOf/1/maxItems", instanceLocation: "#/tags" });
                                errorCount++;
                            }
                            if (data.tags.length < 0) {
                                if (suberr16 === null)
                                    suberr16 = [];
                                suberr16.push({ keywordLocation: "#/properties/tags/anyOf/1/minItems", instanceLocation: "#/tags" });
                                errorCount++;
                            }
                            for (let n = 0; n < data.tags.length; n++) {
                                if (data.tags[n] !== undefined && hasOwn(data.tags, n)) {
                                    const err12 = validate.errors;
                                    const res12 = ref7(data.tags[n]);
                                    const suberr18 = ref7.errors;
                                    validate.errors = err12;
                                    if (!res12) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push(...suberr18.map(e => errorMerge(e, "#/properties/tags/anyOf/1/items/$ref", "#/tags/" + n)));
                                        errorCount++;
                                    }
                                }
                            }
                        }
                        return errorCount === 0;
                    })();
                    if (!sub11) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/tags/anyOf", instanceLocation: "#/tags" });
                        if (suberr16)
                            validate.errors.push(...suberr16);
                        errorCount++;
                    }
                }
            }
            if (errorCount === prev0) {
                for (const key1 of Object.keys(data)) {
                    if (pattern2.test(key1)) {
                        if (!(typeof data[key1] === "number")) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Probability$/type", instanceLocation: "#/" + pointerPart(key1) });
                            errorCount++;
                        }
                        else {
                            if (!(0 <= data[key1])) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Probability$/minimum", instanceLocation: "#/" + pointerPart(key1) });
                                errorCount++;
                            }
                            if (!(100 >= data[key1])) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Probability$/maximum", instanceLocation: "#/" + pointerPart(key1) });
                                errorCount++;
                            }
                        }
                    }
                    if (pattern3.test(key1)) {
                        let suberr19 = null;
                        const sub12 = (() => {
                            let errorCount = 0;
                            const err13 = validate.errors;
                            const res13 = ref8(data[key1]);
                            const suberr20 = ref8.errors;
                            validate.errors = err13;
                            if (!res13) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push(...suberr20.map(e => errorMerge(e, "#/patternProperties/^[a-z][a-zA-Z0-9]*Variant$/anyOf/0/$ref", "#/" + pointerPart(key1))));
                                errorCount++;
                            }
                            return errorCount === 0;
                        })();
                        if (!sub12) {
                            const sub13 = (() => {
                                let errorCount = 0;
                                if (!(Array.isArray(data[key1]))) {
                                    if (suberr19 === null)
                                        suberr19 = [];
                                    suberr19.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Variant$/anyOf/1/type", instanceLocation: "#/" + pointerPart(key1) });
                                    errorCount++;
                                }
                                else {
                                    if (data[key1].length > 128) {
                                        if (suberr19 === null)
                                            suberr19 = [];
                                        suberr19.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Variant$/anyOf/1/maxItems", instanceLocation: "#/" + pointerPart(key1) });
                                        errorCount++;
                                    }
                                    if (data[key1].length < 0) {
                                        if (suberr19 === null)
                                            suberr19 = [];
                                        suberr19.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Variant$/anyOf/1/minItems", instanceLocation: "#/" + pointerPart(key1) });
                                        errorCount++;
                                    }
                                    for (let o = 0; o < data[key1].length; o++) {
                                        if (data[key1][o] !== undefined && hasOwn(data[key1], o)) {
                                            const err14 = validate.errors;
                                            const res14 = ref8(data[key1][o]);
                                            const suberr21 = ref8.errors;
                                            validate.errors = err14;
                                            if (!res14) {
                                                if (validate.errors === null)
                                                    validate.errors = [];
                                                validate.errors.push(...suberr21.map(e => errorMerge(e, "#/patternProperties/^[a-z][a-zA-Z0-9]*Variant$/anyOf/1/items/$ref", "#/" + pointerPart(key1) + "/" + o)));
                                                errorCount++;
                                            }
                                        }
                                    }
                                }
                                return errorCount === 0;
                            })();
                            if (!sub13) {
                                const sub14 = (() => {
                                    let errorCount = 0;
                                    if (!(typeof data[key1] === "object" && data[key1] && !Array.isArray(data[key1]))) {
                                        if (suberr19 === null)
                                            suberr19 = [];
                                        suberr19.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Variant$/anyOf/2/type", instanceLocation: "#/" + pointerPart(key1) });
                                        errorCount++;
                                    }
                                    else {
                                        if (Object.keys(data[key1]).length > 512) {
                                            if (suberr19 === null)
                                                suberr19 = [];
                                            suberr19.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Variant$/anyOf/2/maxProperties", instanceLocation: "#/" + pointerPart(key1) });
                                            errorCount++;
                                        }
                                        if (Object.keys(data[key1]).length < 1) {
                                            if (suberr19 === null)
                                                suberr19 = [];
                                            suberr19.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Variant$/anyOf/2/minProperties", instanceLocation: "#/" + pointerPart(key1) });
                                            errorCount++;
                                        }
                                        for (const key2 of Object.keys(data[key1])) {
                                            const err15 = validate.errors;
                                            const res15 = ref8(key2);
                                            const suberr22 = ref8.errors;
                                            validate.errors = err15;
                                            if (!res15) {
                                                if (validate.errors === null)
                                                    validate.errors = [];
                                                validate.errors.push(...suberr22.map(e => errorMerge(e, "#/patternProperties/^[a-z][a-zA-Z0-9]*Variant$/anyOf/2/propertyNames/$ref", "#/" + pointerPart(key1) + "/" + pointerPart(key2))));
                                                errorCount++;
                                            }
                                        }
                                        for (const key3 of Object.keys(data[key1])) {
                                            if (!(typeof data[key1][key3] === "number")) {
                                                if (suberr19 === null)
                                                    suberr19 = [];
                                                suberr19.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Variant$/anyOf/2/additionalProperties/type", instanceLocation: "#/" + pointerPart(key1) + "/" + pointerPart(key3) });
                                                errorCount++;
                                            }
                                            else {
                                                if (!(0 <= data[key1][key3])) {
                                                    if (suberr19 === null)
                                                        suberr19 = [];
                                                    suberr19.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Variant$/anyOf/2/additionalProperties/minimum", instanceLocation: "#/" + pointerPart(key1) + "/" + pointerPart(key3) });
                                                    errorCount++;
                                                }
                                            }
                                        }
                                    }
                                    return errorCount === 0;
                                })();
                                if (!sub14) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Variant$/anyOf", instanceLocation: "#/" + pointerPart(key1) });
                                    if (suberr19)
                                        validate.errors.push(...suberr19);
                                    errorCount++;
                                }
                            }
                        }
                    }
                    if (pattern5.test(key1)) {
                        let suberr23 = null;
                        const sub15 = (() => {
                            let errorCount = 0;
                            const err16 = validate.errors;
                            const res16 = ref9(data[key1]);
                            const suberr24 = ref9.errors;
                            validate.errors = err16;
                            if (!res16) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push(...suberr24.map(e => errorMerge(e, "#/patternProperties/^[a-z][a-zA-Z0-9]*Color$/anyOf/0/$ref", "#/" + pointerPart(key1))));
                                errorCount++;
                            }
                            return errorCount === 0;
                        })();
                        if (!sub15) {
                            const sub16 = (() => {
                                let errorCount = 0;
                                if (!(Array.isArray(data[key1]))) {
                                    if (suberr23 === null)
                                        suberr23 = [];
                                    suberr23.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Color$/anyOf/1/type", instanceLocation: "#/" + pointerPart(key1) });
                                    errorCount++;
                                }
                                else {
                                    if (data[key1].length > 128) {
                                        if (suberr23 === null)
                                            suberr23 = [];
                                        suberr23.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Color$/anyOf/1/maxItems", instanceLocation: "#/" + pointerPart(key1) });
                                        errorCount++;
                                    }
                                    if (data[key1].length < 0) {
                                        if (suberr23 === null)
                                            suberr23 = [];
                                        suberr23.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Color$/anyOf/1/minItems", instanceLocation: "#/" + pointerPart(key1) });
                                        errorCount++;
                                    }
                                    for (let p = 0; p < data[key1].length; p++) {
                                        if (data[key1][p] !== undefined && hasOwn(data[key1], p)) {
                                            const err17 = validate.errors;
                                            const res17 = ref9(data[key1][p]);
                                            const suberr25 = ref9.errors;
                                            validate.errors = err17;
                                            if (!res17) {
                                                if (validate.errors === null)
                                                    validate.errors = [];
                                                validate.errors.push(...suberr25.map(e => errorMerge(e, "#/patternProperties/^[a-z][a-zA-Z0-9]*Color$/anyOf/1/items/$ref", "#/" + pointerPart(key1) + "/" + p)));
                                                errorCount++;
                                            }
                                        }
                                    }
                                }
                                return errorCount === 0;
                            })();
                            if (!sub16) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*Color$/anyOf", instanceLocation: "#/" + pointerPart(key1) });
                                if (suberr23)
                                    validate.errors.push(...suberr23);
                                errorCount++;
                            }
                        }
                    }
                    if (pattern7.test(key1)) {
                        let suberr26 = null;
                        const sub17 = (() => {
                            let errorCount = 0;
                            const err18 = validate.errors;
                            const res18 = ref10(data[key1]);
                            const suberr27 = ref10.errors;
                            validate.errors = err18;
                            if (!res18) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push(...suberr27.map(e => errorMerge(e, "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorFill$/anyOf/0/$ref", "#/" + pointerPart(key1))));
                                errorCount++;
                            }
                            return errorCount === 0;
                        })();
                        if (!sub17) {
                            const sub18 = (() => {
                                let errorCount = 0;
                                if (!(Array.isArray(data[key1]))) {
                                    if (suberr26 === null)
                                        suberr26 = [];
                                    suberr26.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorFill$/anyOf/1/type", instanceLocation: "#/" + pointerPart(key1) });
                                    errorCount++;
                                }
                                else {
                                    if (data[key1].length > 128) {
                                        if (suberr26 === null)
                                            suberr26 = [];
                                        suberr26.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorFill$/anyOf/1/maxItems", instanceLocation: "#/" + pointerPart(key1) });
                                        errorCount++;
                                    }
                                    if (data[key1].length < 0) {
                                        if (suberr26 === null)
                                            suberr26 = [];
                                        suberr26.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorFill$/anyOf/1/minItems", instanceLocation: "#/" + pointerPart(key1) });
                                        errorCount++;
                                    }
                                    for (let q = 0; q < data[key1].length; q++) {
                                        if (data[key1][q] !== undefined && hasOwn(data[key1], q)) {
                                            const err19 = validate.errors;
                                            const res19 = ref10(data[key1][q]);
                                            const suberr28 = ref10.errors;
                                            validate.errors = err19;
                                            if (!res19) {
                                                if (validate.errors === null)
                                                    validate.errors = [];
                                                validate.errors.push(...suberr28.map(e => errorMerge(e, "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorFill$/anyOf/1/items/$ref", "#/" + pointerPart(key1) + "/" + q)));
                                                errorCount++;
                                            }
                                        }
                                    }
                                }
                                return errorCount === 0;
                            })();
                            if (!sub18) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorFill$/anyOf", instanceLocation: "#/" + pointerPart(key1) });
                                if (suberr26)
                                    validate.errors.push(...suberr26);
                                errorCount++;
                            }
                        }
                    }
                    if (pattern8.test(key1)) {
                        let suberr29 = null;
                        const sub19 = (() => {
                            let errorCount = 0;
                            const err20 = validate.errors;
                            const res20 = ref11(data[key1]);
                            const suberr30 = ref11.errors;
                            validate.errors = err20;
                            if (!res20) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push(...suberr30.map(e => errorMerge(e, "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorFillStops$/anyOf/0/$ref", "#/" + pointerPart(key1))));
                                errorCount++;
                            }
                            return errorCount === 0;
                        })();
                        if (!sub19) {
                            const sub20 = (() => {
                                let errorCount = 0;
                                if (!(Array.isArray(data[key1]))) {
                                    if (suberr29 === null)
                                        suberr29 = [];
                                    suberr29.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorFillStops$/anyOf/1/type", instanceLocation: "#/" + pointerPart(key1) });
                                    errorCount++;
                                }
                                else {
                                    if (data[key1].length > 2) {
                                        if (suberr29 === null)
                                            suberr29 = [];
                                        suberr29.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorFillStops$/anyOf/1/maxItems", instanceLocation: "#/" + pointerPart(key1) });
                                        errorCount++;
                                    }
                                    if (data[key1].length < 0) {
                                        if (suberr29 === null)
                                            suberr29 = [];
                                        suberr29.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorFillStops$/anyOf/1/minItems", instanceLocation: "#/" + pointerPart(key1) });
                                        errorCount++;
                                    }
                                    for (let r = 0; r < data[key1].length; r++) {
                                        if (data[key1][r] !== undefined && hasOwn(data[key1], r)) {
                                            const err21 = validate.errors;
                                            const res21 = ref11(data[key1][r]);
                                            const suberr31 = ref11.errors;
                                            validate.errors = err21;
                                            if (!res21) {
                                                if (validate.errors === null)
                                                    validate.errors = [];
                                                validate.errors.push(...suberr31.map(e => errorMerge(e, "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorFillStops$/anyOf/1/items/$ref", "#/" + pointerPart(key1) + "/" + r)));
                                                errorCount++;
                                            }
                                        }
                                    }
                                }
                                return errorCount === 0;
                            })();
                            if (!sub20) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorFillStops$/anyOf", instanceLocation: "#/" + pointerPart(key1) });
                                if (suberr29)
                                    validate.errors.push(...suberr29);
                                errorCount++;
                            }
                        }
                    }
                    if (pattern9.test(key1)) {
                        const err24 = validate.errors;
                        const res24 = ref12(data[key1]);
                        const suberr35 = ref12.errors;
                        validate.errors = err24;
                        if (!res24) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push(...suberr35.map(e => errorMerge(e, "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorAngle$/allOf/0/$ref", "#/" + pointerPart(key1))));
                            errorCount++;
                        }
                    }
                    if (pattern10.test(key1)) {
                        if (!(typeof data[key1] === "string")) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorOrder$/type", instanceLocation: "#/" + pointerPart(key1) });
                            errorCount++;
                        }
                        else {
                            if (!(data[key1] === "random" || data[key1] === "fixed")) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/patternProperties/^[a-z][a-zA-Z0-9]*ColorOrder$/enum", instanceLocation: "#/" + pointerPart(key1) });
                                errorCount++;
                            }
                        }
                    }
                    if ((key1 === "rotate")) {
                        const err25 = validate.errors;
                        const res25 = ref12(data[key1]);
                        const suberr36 = ref12.errors;
                        validate.errors = err25;
                        if (!res25) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push(...suberr36.map(e => errorMerge(e, "#/patternProperties/^rotate$/allOf/0/$ref", "#/" + pointerPart(key1))));
                            errorCount++;
                        }
                    }
                    if ((key1 === "translateY")) {
                        const err28 = validate.errors;
                        const res28 = ref14(data[key1]);
                        const suberr40 = ref14.errors;
                        validate.errors = err28;
                        if (!res28) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push(...suberr40.map(e => errorMerge(e, "#/patternProperties/^translateY$/allOf/0/$ref", "#/" + pointerPart(key1))));
                            errorCount++;
                        }
                    }
                    if ((key1 === "translateX")) {
                        const err29 = validate.errors;
                        const res29 = ref14(data[key1]);
                        const suberr41 = ref14.errors;
                        validate.errors = err29;
                        if (!res29) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push(...suberr41.map(e => errorMerge(e, "#/patternProperties/^translateX$/allOf/0/$ref", "#/" + pointerPart(key1))));
                            errorCount++;
                        }
                    }
                }
                for (const key4 of Object.keys(data)) {
                    if (key4 !== "seed" && key4 !== "size" && key4 !== "idRandomization" && key4 !== "title" && key4 !== "flip" && key4 !== "fontFamily" && key4 !== "fontWeight" && key4 !== "scale" && key4 !== "borderRadius" && key4 !== "tags" && !pattern2.test(key4) && !pattern3.test(key4) && !pattern5.test(key4) && !pattern7.test(key4) && !pattern8.test(key4) && !pattern9.test(key4) && !pattern10.test(key4) && !(key4 === "rotate") && !(key4 === "translateY") && !(key4 === "translateX")) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key4) });
                        errorCount++;
                    }
                }
            }
        }
        return errorCount === 0;
    };
    return ref0;
})();
// schemasafe reports errors as JSON pointers only (instanceLocation into the
// data, keywordLocation into the schema) without prose. Derive a short message
// from the failing keyword; the detail keeps keywordLocation as schemaPath for
// anyone who needs the exact schema rule.
const KEYWORD_MESSAGES = {
    type: 'has an invalid type',
    enum: 'must be one of the allowed values',
    const: 'must equal the expected value',
    pattern: 'does not match the required pattern',
    required: 'is required but missing',
    additionalProperties: 'has an unexpected property',
    propertyNames: 'has an invalid property name',
    minimum: 'is smaller than allowed',
    maximum: 'is larger than allowed',
    exclusiveMinimum: 'is smaller than allowed',
    exclusiveMaximum: 'is larger than allowed',
    minLength: 'is too short',
    maxLength: 'is too long',
    minItems: 'has too few items',
    maxItems: 'has too many items',
    uniqueItems: 'has duplicate items',
    minProperties: 'has too few properties',
    maxProperties: 'has too many properties',
    anyOf: 'does not match any allowed variant',
    oneOf: 'does not match exactly one allowed variant',
    allOf: 'does not match all required schemas',
    not: 'matches a disallowed schema',
};
function toDetail(error) {
    const keyword = error.keywordLocation.slice(error.keywordLocation.lastIndexOf('/') + 1);
    return {
        instancePath: error.instanceLocation.slice(1),
        schemaPath: error.keywordLocation,
        keyword,
        message: KEYWORD_MESSAGES[keyword] ?? `must satisfy '${keyword}'`,
    };
}
export class OptionsValidator {
    static validate(data) {
        if (!validate(data)) {
            throw new OptionsValidationError((validate.errors ?? []).map(toDetail));
        }
    }
}
