import { StyleValidationError } from '../Error/StyleValidationError.js';
const validate = (function () {
    'use strict';
    const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
    const stringLength = (string) => /[\uD800-\uDFFF]/.test(string) ? [...string].length : string.length;
    const pattern0 = new RegExp("^https?:\\/\\/", "u");
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
            const prev0 = errorCount;
            if (data.length > 2048 && stringLength(data) > 2048) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maxLength", instanceLocation: "#" });
                errorCount++;
            }
            if (errorCount === prev0) {
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
    const errorMerge = ({ keywordLocation, instanceLocation }, schemaBase, dataBase) => ({
        keywordLocation: `${schemaBase}${keywordLocation.slice(1)}`,
        instanceLocation: `${dataBase}${instanceLocation.slice(1)}`,
    });
    const pointerPart = (s) => (/~\//.test(s) ? `${s}`.replace(/~/g, '~0').replace(/\//g, '~1') : s);
    const pattern1 = new RegExp("[uU][rR][lL]\\s*\\(\\s*[^#)\\s]", "u");
    const pattern2 = new RegExp("[eE][xX][pP][rR][eE][sS][sS][iI][oO][nN]\\s*\\(", "u");
    const pattern3 = new RegExp("[bB][eE][hH][aA][vV][iI][oO][rR]\\s*:", "u");
    const pattern4 = new RegExp("-[mM][oO][zZ]-[bB][iI][nN][dD][iI][nN][gG]", "u");
    const pattern5 = new RegExp("[jJ][aA][vV][aA][sS][cC][rR][iI][pP][tT]\\s*:", "u");
    const pattern6 = new RegExp("[vV][bB][sS][cC][rR][iI][pP][tT]\\s*:", "u");
    const pattern7 = new RegExp("\\\\", "u");
    const ref4 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "string")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (data.length > 16384 && stringLength(data) > 16384) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maxLength", instanceLocation: "#" });
                errorCount++;
            }
            const sub0 = (() => {
                let errorCount = 0;
                let suberr3 = null;
                const sub1 = (() => {
                    let errorCount = 0;
                    const prev1 = errorCount;
                    if (errorCount === prev1) {
                        if (!pattern1.test(data)) {
                            if (suberr3 === null)
                                suberr3 = [];
                            suberr3.push({ keywordLocation: "#/not/anyOf/0/pattern", instanceLocation: "#" });
                            errorCount++;
                        }
                    }
                    return errorCount === 0;
                })();
                if (!sub1) {
                    const sub2 = (() => {
                        let errorCount = 0;
                        const prev2 = errorCount;
                        if (errorCount === prev2) {
                            if (!pattern2.test(data)) {
                                if (suberr3 === null)
                                    suberr3 = [];
                                suberr3.push({ keywordLocation: "#/not/anyOf/1/pattern", instanceLocation: "#" });
                                errorCount++;
                            }
                        }
                        return errorCount === 0;
                    })();
                    if (!sub2) {
                        const sub3 = (() => {
                            let errorCount = 0;
                            const prev3 = errorCount;
                            if (errorCount === prev3) {
                                if (!pattern3.test(data)) {
                                    if (suberr3 === null)
                                        suberr3 = [];
                                    suberr3.push({ keywordLocation: "#/not/anyOf/2/pattern", instanceLocation: "#" });
                                    errorCount++;
                                }
                            }
                            return errorCount === 0;
                        })();
                        if (!sub3) {
                            const sub4 = (() => {
                                let errorCount = 0;
                                const prev4 = errorCount;
                                if (errorCount === prev4) {
                                    if (!pattern4.test(data)) {
                                        if (suberr3 === null)
                                            suberr3 = [];
                                        suberr3.push({ keywordLocation: "#/not/anyOf/3/pattern", instanceLocation: "#" });
                                        errorCount++;
                                    }
                                }
                                return errorCount === 0;
                            })();
                            if (!sub4) {
                                const sub5 = (() => {
                                    let errorCount = 0;
                                    const prev5 = errorCount;
                                    if (errorCount === prev5) {
                                        if (!pattern5.test(data)) {
                                            if (suberr3 === null)
                                                suberr3 = [];
                                            suberr3.push({ keywordLocation: "#/not/anyOf/4/pattern", instanceLocation: "#" });
                                            errorCount++;
                                        }
                                    }
                                    return errorCount === 0;
                                })();
                                if (!sub5) {
                                    const sub6 = (() => {
                                        let errorCount = 0;
                                        const prev6 = errorCount;
                                        if (errorCount === prev6) {
                                            if (!pattern6.test(data)) {
                                                if (suberr3 === null)
                                                    suberr3 = [];
                                                suberr3.push({ keywordLocation: "#/not/anyOf/5/pattern", instanceLocation: "#" });
                                                errorCount++;
                                            }
                                        }
                                        return errorCount === 0;
                                    })();
                                    if (!sub6) {
                                        const sub7 = (() => {
                                            let errorCount = 0;
                                            const prev7 = errorCount;
                                            if (errorCount === prev7) {
                                                if (!pattern7.test(data)) {
                                                    if (suberr3 === null)
                                                        suberr3 = [];
                                                    suberr3.push({ keywordLocation: "#/not/anyOf/6/pattern", instanceLocation: "#" });
                                                    errorCount++;
                                                }
                                            }
                                            return errorCount === 0;
                                        })();
                                        if (!sub7)
                                            errorCount++;
                                    }
                                }
                            }
                        }
                    }
                }
                return errorCount === 0;
            })();
            if (sub0) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/not", instanceLocation: "#" });
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const ref3 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "string")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (data.length > 1024 && stringLength(data) > 1024) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maxLength", instanceLocation: "#" });
                errorCount++;
            }
            const err3 = validate.errors;
            const res3 = ref4(data);
            const suberr4 = ref4.errors;
            validate.errors = err3;
            if (!res3) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push(...suberr4.map(e => errorMerge(e, "#/allOf/0/$ref", "#")));
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const pattern8 = new RegExp("^[a-z][a-zA-Z0-9]*$", "u");
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
            const prev8 = errorCount;
            if (data.length > 64 && stringLength(data) > 64) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maxLength", instanceLocation: "#" });
                errorCount++;
            }
            if (errorCount === prev8) {
                if (!pattern8.test(data)) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/pattern", instanceLocation: "#" });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const ref6 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        const err15 = validate.errors;
        const res15 = ref7(data);
        const suberr17 = ref7.errors;
        validate.errors = err15;
        if (!res15) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push(...suberr17.map(e => errorMerge(e, "#/allOf/0/$ref", "#")));
            errorCount++;
        }
        return errorCount === 0;
    };
    const ref5 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        let suberr15 = null;
        const sub8 = (() => {
            let errorCount = 0;
            const err14 = validate.errors;
            const res14 = ref3(data);
            const suberr16 = ref3.errors;
            validate.errors = err14;
            if (!res14) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push(...suberr16.map(e => errorMerge(e, "#/anyOf/0/$ref", "#")));
                errorCount++;
            }
            return errorCount === 0;
        })();
        if (!sub8) {
            const sub9 = (() => {
                let errorCount = 0;
                if (!(typeof data === "object" && data && !Array.isArray(data))) {
                    if (suberr15 === null)
                        suberr15 = [];
                    suberr15.push({ keywordLocation: "#/anyOf/1/type", instanceLocation: "#" });
                    errorCount++;
                }
                else {
                    if (!(data.type !== undefined && hasOwn(data, "type"))) {
                        if (suberr15 === null)
                            suberr15 = [];
                        suberr15.push({ keywordLocation: "#/anyOf/1/required", instanceLocation: "#/type" });
                        errorCount++;
                    }
                    if (!(data.name !== undefined && hasOwn(data, "name"))) {
                        if (suberr15 === null)
                            suberr15 = [];
                        suberr15.push({ keywordLocation: "#/anyOf/1/required", instanceLocation: "#/name" });
                        errorCount++;
                    }
                    if (data.type !== undefined && hasOwn(data, "type")) {
                        if (!(data.type === "color")) {
                            if (suberr15 === null)
                                suberr15 = [];
                            suberr15.push({ keywordLocation: "#/anyOf/1/properties/type/const", instanceLocation: "#/type" });
                            errorCount++;
                        }
                    }
                    if (data.name !== undefined && hasOwn(data, "name")) {
                        const err16 = validate.errors;
                        const res16 = ref6(data.name);
                        const suberr18 = ref6.errors;
                        validate.errors = err16;
                        if (!res16) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push(...suberr18.map(e => errorMerge(e, "#/anyOf/1/properties/name/$ref", "#/name")));
                            errorCount++;
                        }
                    }
                    for (const key4 of Object.keys(data)) {
                        if (key4 !== "type" && key4 !== "name") {
                            if (suberr15 === null)
                                suberr15 = [];
                            suberr15.push({ keywordLocation: "#/anyOf/1/additionalProperties", instanceLocation: "#/" + pointerPart(key4) });
                            errorCount++;
                        }
                    }
                }
                return errorCount === 0;
            })();
            if (!sub9) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/anyOf", instanceLocation: "#" });
                if (suberr15)
                    validate.errors.push(...suberr15);
                errorCount++;
            }
        }
        return errorCount === 0;
    };
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
            if (data.length > 16384 && stringLength(data) > 16384) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maxLength", instanceLocation: "#" });
                errorCount++;
            }
            const err23 = validate.errors;
            const res23 = ref4(data);
            const suberr25 = ref4.errors;
            validate.errors = err23;
            if (!res23) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push(...suberr25.map(e => errorMerge(e, "#/allOf/0/$ref", "#")));
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const pattern9 = new RegExp("^#[a-zA-Z_][a-zA-Z0-9_.-]*$", "u");
    const pattern10 = new RegExp("^data:image\\/(png|gif|jpeg|webp|avif);base64,[a-zA-Z0-9+/=]+$", "u");
    const pattern11 = new RegExp("@[iI][mM][pP][oO][rR][tT]", "u");
    const pattern12 = new RegExp("@[fF][oO][nN][tT]-[fF][aA][cC][eE]", "u");
    const pattern13 = new RegExp("@[dD][oO][cC][uU][mM][eE][nN][tT]", "u");
    const pattern14 = new RegExp("@[cC][hH][aA][rR][sS][eE][tT]", "u");
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
            if (data.length > 4096 && stringLength(data) > 4096) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maxLength", instanceLocation: "#" });
                errorCount++;
            }
            const sub16 = (() => {
                let errorCount = 0;
                let suberr130 = null;
                const sub17 = (() => {
                    let errorCount = 0;
                    const prev11 = errorCount;
                    if (errorCount === prev11) {
                        if (!pattern11.test(data)) {
                            if (suberr130 === null)
                                suberr130 = [];
                            suberr130.push({ keywordLocation: "#/not/anyOf/0/pattern", instanceLocation: "#" });
                            errorCount++;
                        }
                    }
                    return errorCount === 0;
                })();
                if (!sub17) {
                    const sub18 = (() => {
                        let errorCount = 0;
                        const prev12 = errorCount;
                        if (errorCount === prev12) {
                            if (!pattern12.test(data)) {
                                if (suberr130 === null)
                                    suberr130 = [];
                                suberr130.push({ keywordLocation: "#/not/anyOf/1/pattern", instanceLocation: "#" });
                                errorCount++;
                            }
                        }
                        return errorCount === 0;
                    })();
                    if (!sub18) {
                        const sub19 = (() => {
                            let errorCount = 0;
                            const prev13 = errorCount;
                            if (errorCount === prev13) {
                                if (!pattern13.test(data)) {
                                    if (suberr130 === null)
                                        suberr130 = [];
                                    suberr130.push({ keywordLocation: "#/not/anyOf/2/pattern", instanceLocation: "#" });
                                    errorCount++;
                                }
                            }
                            return errorCount === 0;
                        })();
                        if (!sub19) {
                            const sub20 = (() => {
                                let errorCount = 0;
                                const prev14 = errorCount;
                                if (errorCount === prev14) {
                                    if (!pattern14.test(data)) {
                                        if (suberr130 === null)
                                            suberr130 = [];
                                        suberr130.push({ keywordLocation: "#/not/anyOf/3/pattern", instanceLocation: "#" });
                                        errorCount++;
                                    }
                                }
                                return errorCount === 0;
                            })();
                            if (!sub20)
                                errorCount++;
                        }
                    }
                }
                return errorCount === 0;
            })();
            if (sub16) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/not", instanceLocation: "#" });
                errorCount++;
            }
            const err125 = validate.errors;
            const res125 = ref4(data);
            const suberr131 = ref4.errors;
            validate.errors = err125;
            if (!res125) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push(...suberr131.map(e => errorMerge(e, "#/allOf/0/$ref", "#")));
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const ref2 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "object" && data && !Array.isArray(data))) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (data["alignment-baseline"] !== undefined && hasOwn(data, "alignment-baseline")) {
                const err4 = validate.errors;
                const res4 = ref3(data["alignment-baseline"]);
                const suberr5 = ref3.errors;
                validate.errors = err4;
                if (!res4) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr5.map(e => errorMerge(e, "#/properties/alignment-baseline/$ref", "#/alignment-baseline")));
                    errorCount++;
                }
            }
            if (data.amplitude !== undefined && hasOwn(data, "amplitude")) {
                const err5 = validate.errors;
                const res5 = ref3(data.amplitude);
                const suberr6 = ref3.errors;
                validate.errors = err5;
                if (!res5) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr6.map(e => errorMerge(e, "#/properties/amplitude/$ref", "#/amplitude")));
                    errorCount++;
                }
            }
            if (data.azimuth !== undefined && hasOwn(data, "azimuth")) {
                const err6 = validate.errors;
                const res6 = ref3(data.azimuth);
                const suberr7 = ref3.errors;
                validate.errors = err6;
                if (!res6) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr7.map(e => errorMerge(e, "#/properties/azimuth/$ref", "#/azimuth")));
                    errorCount++;
                }
            }
            if (data.baseFrequency !== undefined && hasOwn(data, "baseFrequency")) {
                const err7 = validate.errors;
                const res7 = ref3(data.baseFrequency);
                const suberr8 = ref3.errors;
                validate.errors = err7;
                if (!res7) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr8.map(e => errorMerge(e, "#/properties/baseFrequency/$ref", "#/baseFrequency")));
                    errorCount++;
                }
            }
            if (data["baseline-shift"] !== undefined && hasOwn(data, "baseline-shift")) {
                const err8 = validate.errors;
                const res8 = ref3(data["baseline-shift"]);
                const suberr9 = ref3.errors;
                validate.errors = err8;
                if (!res8) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr9.map(e => errorMerge(e, "#/properties/baseline-shift/$ref", "#/baseline-shift")));
                    errorCount++;
                }
            }
            if (data.bias !== undefined && hasOwn(data, "bias")) {
                const err9 = validate.errors;
                const res9 = ref3(data.bias);
                const suberr10 = ref3.errors;
                validate.errors = err9;
                if (!res9) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr10.map(e => errorMerge(e, "#/properties/bias/$ref", "#/bias")));
                    errorCount++;
                }
            }
            if (data.class !== undefined && hasOwn(data, "class")) {
                const err10 = validate.errors;
                const res10 = ref3(data.class);
                const suberr11 = ref3.errors;
                validate.errors = err10;
                if (!res10) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr11.map(e => errorMerge(e, "#/properties/class/$ref", "#/class")));
                    errorCount++;
                }
            }
            if (data.clipPathUnits !== undefined && hasOwn(data, "clipPathUnits")) {
                const err11 = validate.errors;
                const res11 = ref3(data.clipPathUnits);
                const suberr12 = ref3.errors;
                validate.errors = err11;
                if (!res11) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr12.map(e => errorMerge(e, "#/properties/clipPathUnits/$ref", "#/clipPathUnits")));
                    errorCount++;
                }
            }
            if (data["clip-path"] !== undefined && hasOwn(data, "clip-path")) {
                const err12 = validate.errors;
                const res12 = ref3(data["clip-path"]);
                const suberr13 = ref3.errors;
                validate.errors = err12;
                if (!res12) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr13.map(e => errorMerge(e, "#/properties/clip-path/$ref", "#/clip-path")));
                    errorCount++;
                }
            }
            if (data["clip-rule"] !== undefined && hasOwn(data, "clip-rule")) {
                const err13 = validate.errors;
                const res13 = ref3(data["clip-rule"]);
                const suberr14 = ref3.errors;
                validate.errors = err13;
                if (!res13) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr14.map(e => errorMerge(e, "#/properties/clip-rule/$ref", "#/clip-rule")));
                    errorCount++;
                }
            }
            if (data.color !== undefined && hasOwn(data, "color")) {
                const err17 = validate.errors;
                const res17 = ref5(data.color);
                const suberr19 = ref5.errors;
                validate.errors = err17;
                if (!res17) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr19.map(e => errorMerge(e, "#/properties/color/$ref", "#/color")));
                    errorCount++;
                }
            }
            if (data["color-interpolation"] !== undefined && hasOwn(data, "color-interpolation")) {
                const err18 = validate.errors;
                const res18 = ref3(data["color-interpolation"]);
                const suberr20 = ref3.errors;
                validate.errors = err18;
                if (!res18) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr20.map(e => errorMerge(e, "#/properties/color-interpolation/$ref", "#/color-interpolation")));
                    errorCount++;
                }
            }
            if (data["color-interpolation-filters"] !== undefined && hasOwn(data, "color-interpolation-filters")) {
                const err19 = validate.errors;
                const res19 = ref3(data["color-interpolation-filters"]);
                const suberr21 = ref3.errors;
                validate.errors = err19;
                if (!res19) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr21.map(e => errorMerge(e, "#/properties/color-interpolation-filters/$ref", "#/color-interpolation-filters")));
                    errorCount++;
                }
            }
            if (data.crossorigin !== undefined && hasOwn(data, "crossorigin")) {
                const err20 = validate.errors;
                const res20 = ref3(data.crossorigin);
                const suberr22 = ref3.errors;
                validate.errors = err20;
                if (!res20) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr22.map(e => errorMerge(e, "#/properties/crossorigin/$ref", "#/crossorigin")));
                    errorCount++;
                }
            }
            if (data.cx !== undefined && hasOwn(data, "cx")) {
                const err21 = validate.errors;
                const res21 = ref3(data.cx);
                const suberr23 = ref3.errors;
                validate.errors = err21;
                if (!res21) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr23.map(e => errorMerge(e, "#/properties/cx/$ref", "#/cx")));
                    errorCount++;
                }
            }
            if (data.cy !== undefined && hasOwn(data, "cy")) {
                const err22 = validate.errors;
                const res22 = ref3(data.cy);
                const suberr24 = ref3.errors;
                validate.errors = err22;
                if (!res22) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr24.map(e => errorMerge(e, "#/properties/cy/$ref", "#/cy")));
                    errorCount++;
                }
            }
            if (data.d !== undefined && hasOwn(data, "d")) {
                const err24 = validate.errors;
                const res24 = ref8(data.d);
                const suberr26 = ref8.errors;
                validate.errors = err24;
                if (!res24) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr26.map(e => errorMerge(e, "#/properties/d/$ref", "#/d")));
                    errorCount++;
                }
            }
            if (data.decoding !== undefined && hasOwn(data, "decoding")) {
                const err25 = validate.errors;
                const res25 = ref3(data.decoding);
                const suberr27 = ref3.errors;
                validate.errors = err25;
                if (!res25) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr27.map(e => errorMerge(e, "#/properties/decoding/$ref", "#/decoding")));
                    errorCount++;
                }
            }
            if (data.diffuseConstant !== undefined && hasOwn(data, "diffuseConstant")) {
                const err26 = validate.errors;
                const res26 = ref3(data.diffuseConstant);
                const suberr28 = ref3.errors;
                validate.errors = err26;
                if (!res26) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr28.map(e => errorMerge(e, "#/properties/diffuseConstant/$ref", "#/diffuseConstant")));
                    errorCount++;
                }
            }
            if (data.direction !== undefined && hasOwn(data, "direction")) {
                const err27 = validate.errors;
                const res27 = ref3(data.direction);
                const suberr29 = ref3.errors;
                validate.errors = err27;
                if (!res27) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr29.map(e => errorMerge(e, "#/properties/direction/$ref", "#/direction")));
                    errorCount++;
                }
            }
            if (data.display !== undefined && hasOwn(data, "display")) {
                const err28 = validate.errors;
                const res28 = ref3(data.display);
                const suberr30 = ref3.errors;
                validate.errors = err28;
                if (!res28) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr30.map(e => errorMerge(e, "#/properties/display/$ref", "#/display")));
                    errorCount++;
                }
            }
            if (data.divisor !== undefined && hasOwn(data, "divisor")) {
                const err29 = validate.errors;
                const res29 = ref3(data.divisor);
                const suberr31 = ref3.errors;
                validate.errors = err29;
                if (!res29) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr31.map(e => errorMerge(e, "#/properties/divisor/$ref", "#/divisor")));
                    errorCount++;
                }
            }
            if (data["dominant-baseline"] !== undefined && hasOwn(data, "dominant-baseline")) {
                const err30 = validate.errors;
                const res30 = ref3(data["dominant-baseline"]);
                const suberr32 = ref3.errors;
                validate.errors = err30;
                if (!res30) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr32.map(e => errorMerge(e, "#/properties/dominant-baseline/$ref", "#/dominant-baseline")));
                    errorCount++;
                }
            }
            if (data.dx !== undefined && hasOwn(data, "dx")) {
                const err31 = validate.errors;
                const res31 = ref3(data.dx);
                const suberr33 = ref3.errors;
                validate.errors = err31;
                if (!res31) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr33.map(e => errorMerge(e, "#/properties/dx/$ref", "#/dx")));
                    errorCount++;
                }
            }
            if (data.dy !== undefined && hasOwn(data, "dy")) {
                const err32 = validate.errors;
                const res32 = ref3(data.dy);
                const suberr34 = ref3.errors;
                validate.errors = err32;
                if (!res32) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr34.map(e => errorMerge(e, "#/properties/dy/$ref", "#/dy")));
                    errorCount++;
                }
            }
            if (data.edgeMode !== undefined && hasOwn(data, "edgeMode")) {
                const err33 = validate.errors;
                const res33 = ref3(data.edgeMode);
                const suberr35 = ref3.errors;
                validate.errors = err33;
                if (!res33) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr35.map(e => errorMerge(e, "#/properties/edgeMode/$ref", "#/edgeMode")));
                    errorCount++;
                }
            }
            if (data.elevation !== undefined && hasOwn(data, "elevation")) {
                const err34 = validate.errors;
                const res34 = ref3(data.elevation);
                const suberr36 = ref3.errors;
                validate.errors = err34;
                if (!res34) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr36.map(e => errorMerge(e, "#/properties/elevation/$ref", "#/elevation")));
                    errorCount++;
                }
            }
            if (data.exponent !== undefined && hasOwn(data, "exponent")) {
                const err35 = validate.errors;
                const res35 = ref3(data.exponent);
                const suberr37 = ref3.errors;
                validate.errors = err35;
                if (!res35) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr37.map(e => errorMerge(e, "#/properties/exponent/$ref", "#/exponent")));
                    errorCount++;
                }
            }
            if (data.fill !== undefined && hasOwn(data, "fill")) {
                const err36 = validate.errors;
                const res36 = ref5(data.fill);
                const suberr38 = ref5.errors;
                validate.errors = err36;
                if (!res36) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr38.map(e => errorMerge(e, "#/properties/fill/$ref", "#/fill")));
                    errorCount++;
                }
            }
            if (data["fill-opacity"] !== undefined && hasOwn(data, "fill-opacity")) {
                const err37 = validate.errors;
                const res37 = ref3(data["fill-opacity"]);
                const suberr39 = ref3.errors;
                validate.errors = err37;
                if (!res37) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr39.map(e => errorMerge(e, "#/properties/fill-opacity/$ref", "#/fill-opacity")));
                    errorCount++;
                }
            }
            if (data["fill-rule"] !== undefined && hasOwn(data, "fill-rule")) {
                const err38 = validate.errors;
                const res38 = ref3(data["fill-rule"]);
                const suberr40 = ref3.errors;
                validate.errors = err38;
                if (!res38) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr40.map(e => errorMerge(e, "#/properties/fill-rule/$ref", "#/fill-rule")));
                    errorCount++;
                }
            }
            if (data.filter !== undefined && hasOwn(data, "filter")) {
                const err39 = validate.errors;
                const res39 = ref3(data.filter);
                const suberr41 = ref3.errors;
                validate.errors = err39;
                if (!res39) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr41.map(e => errorMerge(e, "#/properties/filter/$ref", "#/filter")));
                    errorCount++;
                }
            }
            if (data.filterUnits !== undefined && hasOwn(data, "filterUnits")) {
                const err40 = validate.errors;
                const res40 = ref3(data.filterUnits);
                const suberr42 = ref3.errors;
                validate.errors = err40;
                if (!res40) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr42.map(e => errorMerge(e, "#/properties/filterUnits/$ref", "#/filterUnits")));
                    errorCount++;
                }
            }
            if (data["flood-color"] !== undefined && hasOwn(data, "flood-color")) {
                const err41 = validate.errors;
                const res41 = ref5(data["flood-color"]);
                const suberr43 = ref5.errors;
                validate.errors = err41;
                if (!res41) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr43.map(e => errorMerge(e, "#/properties/flood-color/$ref", "#/flood-color")));
                    errorCount++;
                }
            }
            if (data["flood-opacity"] !== undefined && hasOwn(data, "flood-opacity")) {
                const err42 = validate.errors;
                const res42 = ref3(data["flood-opacity"]);
                const suberr44 = ref3.errors;
                validate.errors = err42;
                if (!res42) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr44.map(e => errorMerge(e, "#/properties/flood-opacity/$ref", "#/flood-opacity")));
                    errorCount++;
                }
            }
            if (data["font-family"] !== undefined && hasOwn(data, "font-family")) {
                let suberr45 = null;
                const sub10 = (() => {
                    let errorCount = 0;
                    const err43 = validate.errors;
                    const res43 = ref3(data["font-family"]);
                    const suberr46 = ref3.errors;
                    validate.errors = err43;
                    if (!res43) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push(...suberr46.map(e => errorMerge(e, "#/properties/font-family/anyOf/0/$ref", "#/font-family")));
                        errorCount++;
                    }
                    return errorCount === 0;
                })();
                if (!sub10) {
                    const sub11 = (() => {
                        let errorCount = 0;
                        if (!(typeof data["font-family"] === "object" && data["font-family"] && !Array.isArray(data["font-family"]))) {
                            if (suberr45 === null)
                                suberr45 = [];
                            suberr45.push({ keywordLocation: "#/properties/font-family/anyOf/1/type", instanceLocation: "#/font-family" });
                            errorCount++;
                        }
                        else {
                            if (!(data["font-family"].type !== undefined && hasOwn(data["font-family"], "type"))) {
                                if (suberr45 === null)
                                    suberr45 = [];
                                suberr45.push({ keywordLocation: "#/properties/font-family/anyOf/1/required", instanceLocation: "#/font-family/type" });
                                errorCount++;
                            }
                            if (!(data["font-family"].name !== undefined && hasOwn(data["font-family"], "name"))) {
                                if (suberr45 === null)
                                    suberr45 = [];
                                suberr45.push({ keywordLocation: "#/properties/font-family/anyOf/1/required", instanceLocation: "#/font-family/name" });
                                errorCount++;
                            }
                            if (data["font-family"].type !== undefined && hasOwn(data["font-family"], "type")) {
                                if (!(data["font-family"].type === "variable")) {
                                    if (suberr45 === null)
                                        suberr45 = [];
                                    suberr45.push({ keywordLocation: "#/properties/font-family/anyOf/1/properties/type/const", instanceLocation: "#/font-family/type" });
                                    errorCount++;
                                }
                            }
                            if (data["font-family"].name !== undefined && hasOwn(data["font-family"], "name")) {
                                if (!(data["font-family"].name === "fontFamily")) {
                                    if (suberr45 === null)
                                        suberr45 = [];
                                    suberr45.push({ keywordLocation: "#/properties/font-family/anyOf/1/properties/name/const", instanceLocation: "#/font-family/name" });
                                    errorCount++;
                                }
                            }
                            for (const key5 of Object.keys(data["font-family"])) {
                                if (key5 !== "type" && key5 !== "name") {
                                    if (suberr45 === null)
                                        suberr45 = [];
                                    suberr45.push({ keywordLocation: "#/properties/font-family/anyOf/1/additionalProperties", instanceLocation: "#/font-family/" + pointerPart(key5) });
                                    errorCount++;
                                }
                            }
                        }
                        return errorCount === 0;
                    })();
                    if (!sub11) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/font-family/anyOf", instanceLocation: "#/font-family" });
                        if (suberr45)
                            validate.errors.push(...suberr45);
                        errorCount++;
                    }
                }
            }
            if (data["font-size"] !== undefined && hasOwn(data, "font-size")) {
                const err44 = validate.errors;
                const res44 = ref3(data["font-size"]);
                const suberr47 = ref3.errors;
                validate.errors = err44;
                if (!res44) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr47.map(e => errorMerge(e, "#/properties/font-size/$ref", "#/font-size")));
                    errorCount++;
                }
            }
            if (data["font-size-adjust"] !== undefined && hasOwn(data, "font-size-adjust")) {
                const err45 = validate.errors;
                const res45 = ref3(data["font-size-adjust"]);
                const suberr48 = ref3.errors;
                validate.errors = err45;
                if (!res45) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr48.map(e => errorMerge(e, "#/properties/font-size-adjust/$ref", "#/font-size-adjust")));
                    errorCount++;
                }
            }
            if (data["font-style"] !== undefined && hasOwn(data, "font-style")) {
                const err46 = validate.errors;
                const res46 = ref3(data["font-style"]);
                const suberr49 = ref3.errors;
                validate.errors = err46;
                if (!res46) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr49.map(e => errorMerge(e, "#/properties/font-style/$ref", "#/font-style")));
                    errorCount++;
                }
            }
            if (data["font-variant"] !== undefined && hasOwn(data, "font-variant")) {
                const err47 = validate.errors;
                const res47 = ref3(data["font-variant"]);
                const suberr50 = ref3.errors;
                validate.errors = err47;
                if (!res47) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr50.map(e => errorMerge(e, "#/properties/font-variant/$ref", "#/font-variant")));
                    errorCount++;
                }
            }
            if (data["font-weight"] !== undefined && hasOwn(data, "font-weight")) {
                let suberr51 = null;
                const sub12 = (() => {
                    let errorCount = 0;
                    const err48 = validate.errors;
                    const res48 = ref3(data["font-weight"]);
                    const suberr52 = ref3.errors;
                    validate.errors = err48;
                    if (!res48) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push(...suberr52.map(e => errorMerge(e, "#/properties/font-weight/anyOf/0/$ref", "#/font-weight")));
                        errorCount++;
                    }
                    return errorCount === 0;
                })();
                if (!sub12) {
                    const sub13 = (() => {
                        let errorCount = 0;
                        if (!(typeof data["font-weight"] === "object" && data["font-weight"] && !Array.isArray(data["font-weight"]))) {
                            if (suberr51 === null)
                                suberr51 = [];
                            suberr51.push({ keywordLocation: "#/properties/font-weight/anyOf/1/type", instanceLocation: "#/font-weight" });
                            errorCount++;
                        }
                        else {
                            if (!(data["font-weight"].type !== undefined && hasOwn(data["font-weight"], "type"))) {
                                if (suberr51 === null)
                                    suberr51 = [];
                                suberr51.push({ keywordLocation: "#/properties/font-weight/anyOf/1/required", instanceLocation: "#/font-weight/type" });
                                errorCount++;
                            }
                            if (!(data["font-weight"].name !== undefined && hasOwn(data["font-weight"], "name"))) {
                                if (suberr51 === null)
                                    suberr51 = [];
                                suberr51.push({ keywordLocation: "#/properties/font-weight/anyOf/1/required", instanceLocation: "#/font-weight/name" });
                                errorCount++;
                            }
                            if (data["font-weight"].type !== undefined && hasOwn(data["font-weight"], "type")) {
                                if (!(data["font-weight"].type === "variable")) {
                                    if (suberr51 === null)
                                        suberr51 = [];
                                    suberr51.push({ keywordLocation: "#/properties/font-weight/anyOf/1/properties/type/const", instanceLocation: "#/font-weight/type" });
                                    errorCount++;
                                }
                            }
                            if (data["font-weight"].name !== undefined && hasOwn(data["font-weight"], "name")) {
                                if (!(data["font-weight"].name === "fontWeight")) {
                                    if (suberr51 === null)
                                        suberr51 = [];
                                    suberr51.push({ keywordLocation: "#/properties/font-weight/anyOf/1/properties/name/const", instanceLocation: "#/font-weight/name" });
                                    errorCount++;
                                }
                            }
                            for (const key6 of Object.keys(data["font-weight"])) {
                                if (key6 !== "type" && key6 !== "name") {
                                    if (suberr51 === null)
                                        suberr51 = [];
                                    suberr51.push({ keywordLocation: "#/properties/font-weight/anyOf/1/additionalProperties", instanceLocation: "#/font-weight/" + pointerPart(key6) });
                                    errorCount++;
                                }
                            }
                        }
                        return errorCount === 0;
                    })();
                    if (!sub13) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/font-weight/anyOf", instanceLocation: "#/font-weight" });
                        if (suberr51)
                            validate.errors.push(...suberr51);
                        errorCount++;
                    }
                }
            }
            if (data.fx !== undefined && hasOwn(data, "fx")) {
                const err49 = validate.errors;
                const res49 = ref3(data.fx);
                const suberr53 = ref3.errors;
                validate.errors = err49;
                if (!res49) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr53.map(e => errorMerge(e, "#/properties/fx/$ref", "#/fx")));
                    errorCount++;
                }
            }
            if (data.fy !== undefined && hasOwn(data, "fy")) {
                const err50 = validate.errors;
                const res50 = ref3(data.fy);
                const suberr54 = ref3.errors;
                validate.errors = err50;
                if (!res50) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr54.map(e => errorMerge(e, "#/properties/fy/$ref", "#/fy")));
                    errorCount++;
                }
            }
            if (data.gradientTransform !== undefined && hasOwn(data, "gradientTransform")) {
                const err51 = validate.errors;
                const res51 = ref3(data.gradientTransform);
                const suberr55 = ref3.errors;
                validate.errors = err51;
                if (!res51) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr55.map(e => errorMerge(e, "#/properties/gradientTransform/$ref", "#/gradientTransform")));
                    errorCount++;
                }
            }
            if (data.gradientUnits !== undefined && hasOwn(data, "gradientUnits")) {
                const err52 = validate.errors;
                const res52 = ref3(data.gradientUnits);
                const suberr56 = ref3.errors;
                validate.errors = err52;
                if (!res52) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr56.map(e => errorMerge(e, "#/properties/gradientUnits/$ref", "#/gradientUnits")));
                    errorCount++;
                }
            }
            if (data.height !== undefined && hasOwn(data, "height")) {
                const err53 = validate.errors;
                const res53 = ref3(data.height);
                const suberr57 = ref3.errors;
                validate.errors = err53;
                if (!res53) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr57.map(e => errorMerge(e, "#/properties/height/$ref", "#/height")));
                    errorCount++;
                }
            }
            if (data.href !== undefined && hasOwn(data, "href")) {
                let suberr58 = null;
                const sub14 = (() => {
                    let errorCount = 0;
                    if (!(typeof data.href === "string")) {
                        if (suberr58 === null)
                            suberr58 = [];
                        suberr58.push({ keywordLocation: "#/properties/href/anyOf/0/type", instanceLocation: "#/href" });
                        errorCount++;
                    }
                    else {
                        const prev9 = errorCount;
                        if (data.href.length > 128 && stringLength(data.href) > 128) {
                            if (suberr58 === null)
                                suberr58 = [];
                            suberr58.push({ keywordLocation: "#/properties/href/anyOf/0/maxLength", instanceLocation: "#/href" });
                            errorCount++;
                        }
                        if (errorCount === prev9) {
                            if (!pattern9.test(data.href)) {
                                if (suberr58 === null)
                                    suberr58 = [];
                                suberr58.push({ keywordLocation: "#/properties/href/anyOf/0/pattern", instanceLocation: "#/href" });
                                errorCount++;
                            }
                        }
                    }
                    return errorCount === 0;
                })();
                if (!sub14) {
                    const sub15 = (() => {
                        let errorCount = 0;
                        if (!(typeof data.href === "string")) {
                            if (suberr58 === null)
                                suberr58 = [];
                            suberr58.push({ keywordLocation: "#/properties/href/anyOf/1/type", instanceLocation: "#/href" });
                            errorCount++;
                        }
                        else {
                            const prev10 = errorCount;
                            if (data.href.length > 262144 && stringLength(data.href) > 262144) {
                                if (suberr58 === null)
                                    suberr58 = [];
                                suberr58.push({ keywordLocation: "#/properties/href/anyOf/1/maxLength", instanceLocation: "#/href" });
                                errorCount++;
                            }
                            if (errorCount === prev10) {
                                if (!pattern10.test(data.href)) {
                                    if (suberr58 === null)
                                        suberr58 = [];
                                    suberr58.push({ keywordLocation: "#/properties/href/anyOf/1/pattern", instanceLocation: "#/href" });
                                    errorCount++;
                                }
                            }
                        }
                        return errorCount === 0;
                    })();
                    if (!sub15) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/href/anyOf", instanceLocation: "#/href" });
                        if (suberr58)
                            validate.errors.push(...suberr58);
                        errorCount++;
                    }
                }
            }
            if (data.id !== undefined && hasOwn(data, "id")) {
                const err54 = validate.errors;
                const res54 = ref3(data.id);
                const suberr59 = ref3.errors;
                validate.errors = err54;
                if (!res54) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr59.map(e => errorMerge(e, "#/properties/id/$ref", "#/id")));
                    errorCount++;
                }
            }
            if (data["image-rendering"] !== undefined && hasOwn(data, "image-rendering")) {
                const err55 = validate.errors;
                const res55 = ref3(data["image-rendering"]);
                const suberr60 = ref3.errors;
                validate.errors = err55;
                if (!res55) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr60.map(e => errorMerge(e, "#/properties/image-rendering/$ref", "#/image-rendering")));
                    errorCount++;
                }
            }
            if (data.in !== undefined && hasOwn(data, "in")) {
                const err56 = validate.errors;
                const res56 = ref3(data.in);
                const suberr61 = ref3.errors;
                validate.errors = err56;
                if (!res56) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr61.map(e => errorMerge(e, "#/properties/in/$ref", "#/in")));
                    errorCount++;
                }
            }
            if (data.in2 !== undefined && hasOwn(data, "in2")) {
                const err57 = validate.errors;
                const res57 = ref3(data.in2);
                const suberr62 = ref3.errors;
                validate.errors = err57;
                if (!res57) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr62.map(e => errorMerge(e, "#/properties/in2/$ref", "#/in2")));
                    errorCount++;
                }
            }
            if (data.intercept !== undefined && hasOwn(data, "intercept")) {
                const err58 = validate.errors;
                const res58 = ref3(data.intercept);
                const suberr63 = ref3.errors;
                validate.errors = err58;
                if (!res58) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr63.map(e => errorMerge(e, "#/properties/intercept/$ref", "#/intercept")));
                    errorCount++;
                }
            }
            if (data.k1 !== undefined && hasOwn(data, "k1")) {
                const err59 = validate.errors;
                const res59 = ref3(data.k1);
                const suberr64 = ref3.errors;
                validate.errors = err59;
                if (!res59) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr64.map(e => errorMerge(e, "#/properties/k1/$ref", "#/k1")));
                    errorCount++;
                }
            }
            if (data.k2 !== undefined && hasOwn(data, "k2")) {
                const err60 = validate.errors;
                const res60 = ref3(data.k2);
                const suberr65 = ref3.errors;
                validate.errors = err60;
                if (!res60) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr65.map(e => errorMerge(e, "#/properties/k2/$ref", "#/k2")));
                    errorCount++;
                }
            }
            if (data.k3 !== undefined && hasOwn(data, "k3")) {
                const err61 = validate.errors;
                const res61 = ref3(data.k3);
                const suberr66 = ref3.errors;
                validate.errors = err61;
                if (!res61) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr66.map(e => errorMerge(e, "#/properties/k3/$ref", "#/k3")));
                    errorCount++;
                }
            }
            if (data.k4 !== undefined && hasOwn(data, "k4")) {
                const err62 = validate.errors;
                const res62 = ref3(data.k4);
                const suberr67 = ref3.errors;
                validate.errors = err62;
                if (!res62) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr67.map(e => errorMerge(e, "#/properties/k4/$ref", "#/k4")));
                    errorCount++;
                }
            }
            if (data.kernelMatrix !== undefined && hasOwn(data, "kernelMatrix")) {
                const err63 = validate.errors;
                const res63 = ref3(data.kernelMatrix);
                const suberr68 = ref3.errors;
                validate.errors = err63;
                if (!res63) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr68.map(e => errorMerge(e, "#/properties/kernelMatrix/$ref", "#/kernelMatrix")));
                    errorCount++;
                }
            }
            if (data.kernelUnitLength !== undefined && hasOwn(data, "kernelUnitLength")) {
                const err64 = validate.errors;
                const res64 = ref3(data.kernelUnitLength);
                const suberr69 = ref3.errors;
                validate.errors = err64;
                if (!res64) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr69.map(e => errorMerge(e, "#/properties/kernelUnitLength/$ref", "#/kernelUnitLength")));
                    errorCount++;
                }
            }
            if (data.lang !== undefined && hasOwn(data, "lang")) {
                const err65 = validate.errors;
                const res65 = ref3(data.lang);
                const suberr70 = ref3.errors;
                validate.errors = err65;
                if (!res65) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr70.map(e => errorMerge(e, "#/properties/lang/$ref", "#/lang")));
                    errorCount++;
                }
            }
            if (data.lengthAdjust !== undefined && hasOwn(data, "lengthAdjust")) {
                const err66 = validate.errors;
                const res66 = ref3(data.lengthAdjust);
                const suberr71 = ref3.errors;
                validate.errors = err66;
                if (!res66) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr71.map(e => errorMerge(e, "#/properties/lengthAdjust/$ref", "#/lengthAdjust")));
                    errorCount++;
                }
            }
            if (data["letter-spacing"] !== undefined && hasOwn(data, "letter-spacing")) {
                const err67 = validate.errors;
                const res67 = ref3(data["letter-spacing"]);
                const suberr72 = ref3.errors;
                validate.errors = err67;
                if (!res67) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr72.map(e => errorMerge(e, "#/properties/letter-spacing/$ref", "#/letter-spacing")));
                    errorCount++;
                }
            }
            if (data["lighting-color"] !== undefined && hasOwn(data, "lighting-color")) {
                const err68 = validate.errors;
                const res68 = ref5(data["lighting-color"]);
                const suberr73 = ref5.errors;
                validate.errors = err68;
                if (!res68) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr73.map(e => errorMerge(e, "#/properties/lighting-color/$ref", "#/lighting-color")));
                    errorCount++;
                }
            }
            if (data["marker-end"] !== undefined && hasOwn(data, "marker-end")) {
                const err69 = validate.errors;
                const res69 = ref3(data["marker-end"]);
                const suberr74 = ref3.errors;
                validate.errors = err69;
                if (!res69) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr74.map(e => errorMerge(e, "#/properties/marker-end/$ref", "#/marker-end")));
                    errorCount++;
                }
            }
            if (data["marker-mid"] !== undefined && hasOwn(data, "marker-mid")) {
                const err70 = validate.errors;
                const res70 = ref3(data["marker-mid"]);
                const suberr75 = ref3.errors;
                validate.errors = err70;
                if (!res70) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr75.map(e => errorMerge(e, "#/properties/marker-mid/$ref", "#/marker-mid")));
                    errorCount++;
                }
            }
            if (data["marker-start"] !== undefined && hasOwn(data, "marker-start")) {
                const err71 = validate.errors;
                const res71 = ref3(data["marker-start"]);
                const suberr76 = ref3.errors;
                validate.errors = err71;
                if (!res71) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr76.map(e => errorMerge(e, "#/properties/marker-start/$ref", "#/marker-start")));
                    errorCount++;
                }
            }
            if (data.markerHeight !== undefined && hasOwn(data, "markerHeight")) {
                const err72 = validate.errors;
                const res72 = ref3(data.markerHeight);
                const suberr77 = ref3.errors;
                validate.errors = err72;
                if (!res72) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr77.map(e => errorMerge(e, "#/properties/markerHeight/$ref", "#/markerHeight")));
                    errorCount++;
                }
            }
            if (data.markerUnits !== undefined && hasOwn(data, "markerUnits")) {
                const err73 = validate.errors;
                const res73 = ref3(data.markerUnits);
                const suberr78 = ref3.errors;
                validate.errors = err73;
                if (!res73) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr78.map(e => errorMerge(e, "#/properties/markerUnits/$ref", "#/markerUnits")));
                    errorCount++;
                }
            }
            if (data.markerWidth !== undefined && hasOwn(data, "markerWidth")) {
                const err74 = validate.errors;
                const res74 = ref3(data.markerWidth);
                const suberr79 = ref3.errors;
                validate.errors = err74;
                if (!res74) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr79.map(e => errorMerge(e, "#/properties/markerWidth/$ref", "#/markerWidth")));
                    errorCount++;
                }
            }
            if (data.mask !== undefined && hasOwn(data, "mask")) {
                const err75 = validate.errors;
                const res75 = ref3(data.mask);
                const suberr80 = ref3.errors;
                validate.errors = err75;
                if (!res75) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr80.map(e => errorMerge(e, "#/properties/mask/$ref", "#/mask")));
                    errorCount++;
                }
            }
            if (data.maskContentUnits !== undefined && hasOwn(data, "maskContentUnits")) {
                const err76 = validate.errors;
                const res76 = ref3(data.maskContentUnits);
                const suberr81 = ref3.errors;
                validate.errors = err76;
                if (!res76) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr81.map(e => errorMerge(e, "#/properties/maskContentUnits/$ref", "#/maskContentUnits")));
                    errorCount++;
                }
            }
            if (data.maskUnits !== undefined && hasOwn(data, "maskUnits")) {
                const err77 = validate.errors;
                const res77 = ref3(data.maskUnits);
                const suberr82 = ref3.errors;
                validate.errors = err77;
                if (!res77) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr82.map(e => errorMerge(e, "#/properties/maskUnits/$ref", "#/maskUnits")));
                    errorCount++;
                }
            }
            if (data.media !== undefined && hasOwn(data, "media")) {
                const err78 = validate.errors;
                const res78 = ref3(data.media);
                const suberr83 = ref3.errors;
                validate.errors = err78;
                if (!res78) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr83.map(e => errorMerge(e, "#/properties/media/$ref", "#/media")));
                    errorCount++;
                }
            }
            if (data.method !== undefined && hasOwn(data, "method")) {
                const err79 = validate.errors;
                const res79 = ref3(data.method);
                const suberr84 = ref3.errors;
                validate.errors = err79;
                if (!res79) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr84.map(e => errorMerge(e, "#/properties/method/$ref", "#/method")));
                    errorCount++;
                }
            }
            if (data.mode !== undefined && hasOwn(data, "mode")) {
                const err80 = validate.errors;
                const res80 = ref3(data.mode);
                const suberr85 = ref3.errors;
                validate.errors = err80;
                if (!res80) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr85.map(e => errorMerge(e, "#/properties/mode/$ref", "#/mode")));
                    errorCount++;
                }
            }
            if (data.numOctaves !== undefined && hasOwn(data, "numOctaves")) {
                const err81 = validate.errors;
                const res81 = ref3(data.numOctaves);
                const suberr86 = ref3.errors;
                validate.errors = err81;
                if (!res81) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr86.map(e => errorMerge(e, "#/properties/numOctaves/$ref", "#/numOctaves")));
                    errorCount++;
                }
            }
            if (data.offset !== undefined && hasOwn(data, "offset")) {
                const err82 = validate.errors;
                const res82 = ref3(data.offset);
                const suberr87 = ref3.errors;
                validate.errors = err82;
                if (!res82) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr87.map(e => errorMerge(e, "#/properties/offset/$ref", "#/offset")));
                    errorCount++;
                }
            }
            if (data.opacity !== undefined && hasOwn(data, "opacity")) {
                const err83 = validate.errors;
                const res83 = ref3(data.opacity);
                const suberr88 = ref3.errors;
                validate.errors = err83;
                if (!res83) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr88.map(e => errorMerge(e, "#/properties/opacity/$ref", "#/opacity")));
                    errorCount++;
                }
            }
            if (data.operator !== undefined && hasOwn(data, "operator")) {
                const err84 = validate.errors;
                const res84 = ref3(data.operator);
                const suberr89 = ref3.errors;
                validate.errors = err84;
                if (!res84) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr89.map(e => errorMerge(e, "#/properties/operator/$ref", "#/operator")));
                    errorCount++;
                }
            }
            if (data.order !== undefined && hasOwn(data, "order")) {
                const err85 = validate.errors;
                const res85 = ref3(data.order);
                const suberr90 = ref3.errors;
                validate.errors = err85;
                if (!res85) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr90.map(e => errorMerge(e, "#/properties/order/$ref", "#/order")));
                    errorCount++;
                }
            }
            if (data.orient !== undefined && hasOwn(data, "orient")) {
                const err86 = validate.errors;
                const res86 = ref3(data.orient);
                const suberr91 = ref3.errors;
                validate.errors = err86;
                if (!res86) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr91.map(e => errorMerge(e, "#/properties/orient/$ref", "#/orient")));
                    errorCount++;
                }
            }
            if (data.overflow !== undefined && hasOwn(data, "overflow")) {
                const err87 = validate.errors;
                const res87 = ref3(data.overflow);
                const suberr92 = ref3.errors;
                validate.errors = err87;
                if (!res87) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr92.map(e => errorMerge(e, "#/properties/overflow/$ref", "#/overflow")));
                    errorCount++;
                }
            }
            if (data["paint-order"] !== undefined && hasOwn(data, "paint-order")) {
                const err88 = validate.errors;
                const res88 = ref3(data["paint-order"]);
                const suberr93 = ref3.errors;
                validate.errors = err88;
                if (!res88) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr93.map(e => errorMerge(e, "#/properties/paint-order/$ref", "#/paint-order")));
                    errorCount++;
                }
            }
            if (data.path !== undefined && hasOwn(data, "path")) {
                const err89 = validate.errors;
                const res89 = ref3(data.path);
                const suberr94 = ref3.errors;
                validate.errors = err89;
                if (!res89) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr94.map(e => errorMerge(e, "#/properties/path/$ref", "#/path")));
                    errorCount++;
                }
            }
            if (data.pathLength !== undefined && hasOwn(data, "pathLength")) {
                const err90 = validate.errors;
                const res90 = ref3(data.pathLength);
                const suberr95 = ref3.errors;
                validate.errors = err90;
                if (!res90) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr95.map(e => errorMerge(e, "#/properties/pathLength/$ref", "#/pathLength")));
                    errorCount++;
                }
            }
            if (data.patternContentUnits !== undefined && hasOwn(data, "patternContentUnits")) {
                const err91 = validate.errors;
                const res91 = ref3(data.patternContentUnits);
                const suberr96 = ref3.errors;
                validate.errors = err91;
                if (!res91) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr96.map(e => errorMerge(e, "#/properties/patternContentUnits/$ref", "#/patternContentUnits")));
                    errorCount++;
                }
            }
            if (data.patternTransform !== undefined && hasOwn(data, "patternTransform")) {
                const err92 = validate.errors;
                const res92 = ref3(data.patternTransform);
                const suberr97 = ref3.errors;
                validate.errors = err92;
                if (!res92) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr97.map(e => errorMerge(e, "#/properties/patternTransform/$ref", "#/patternTransform")));
                    errorCount++;
                }
            }
            if (data.patternUnits !== undefined && hasOwn(data, "patternUnits")) {
                const err93 = validate.errors;
                const res93 = ref3(data.patternUnits);
                const suberr98 = ref3.errors;
                validate.errors = err93;
                if (!res93) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr98.map(e => errorMerge(e, "#/properties/patternUnits/$ref", "#/patternUnits")));
                    errorCount++;
                }
            }
            if (data.points !== undefined && hasOwn(data, "points")) {
                const err94 = validate.errors;
                const res94 = ref3(data.points);
                const suberr99 = ref3.errors;
                validate.errors = err94;
                if (!res94) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr99.map(e => errorMerge(e, "#/properties/points/$ref", "#/points")));
                    errorCount++;
                }
            }
            if (data.preserveAlpha !== undefined && hasOwn(data, "preserveAlpha")) {
                const err95 = validate.errors;
                const res95 = ref3(data.preserveAlpha);
                const suberr100 = ref3.errors;
                validate.errors = err95;
                if (!res95) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr100.map(e => errorMerge(e, "#/properties/preserveAlpha/$ref", "#/preserveAlpha")));
                    errorCount++;
                }
            }
            if (data.preserveAspectRatio !== undefined && hasOwn(data, "preserveAspectRatio")) {
                const err96 = validate.errors;
                const res96 = ref3(data.preserveAspectRatio);
                const suberr101 = ref3.errors;
                validate.errors = err96;
                if (!res96) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr101.map(e => errorMerge(e, "#/properties/preserveAspectRatio/$ref", "#/preserveAspectRatio")));
                    errorCount++;
                }
            }
            if (data.primitiveUnits !== undefined && hasOwn(data, "primitiveUnits")) {
                const err97 = validate.errors;
                const res97 = ref3(data.primitiveUnits);
                const suberr102 = ref3.errors;
                validate.errors = err97;
                if (!res97) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr102.map(e => errorMerge(e, "#/properties/primitiveUnits/$ref", "#/primitiveUnits")));
                    errorCount++;
                }
            }
            if (data.r !== undefined && hasOwn(data, "r")) {
                const err98 = validate.errors;
                const res98 = ref3(data.r);
                const suberr103 = ref3.errors;
                validate.errors = err98;
                if (!res98) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr103.map(e => errorMerge(e, "#/properties/r/$ref", "#/r")));
                    errorCount++;
                }
            }
            if (data.radius !== undefined && hasOwn(data, "radius")) {
                const err99 = validate.errors;
                const res99 = ref3(data.radius);
                const suberr104 = ref3.errors;
                validate.errors = err99;
                if (!res99) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr104.map(e => errorMerge(e, "#/properties/radius/$ref", "#/radius")));
                    errorCount++;
                }
            }
            if (data.refX !== undefined && hasOwn(data, "refX")) {
                const err100 = validate.errors;
                const res100 = ref3(data.refX);
                const suberr105 = ref3.errors;
                validate.errors = err100;
                if (!res100) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr105.map(e => errorMerge(e, "#/properties/refX/$ref", "#/refX")));
                    errorCount++;
                }
            }
            if (data.refY !== undefined && hasOwn(data, "refY")) {
                const err101 = validate.errors;
                const res101 = ref3(data.refY);
                const suberr106 = ref3.errors;
                validate.errors = err101;
                if (!res101) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr106.map(e => errorMerge(e, "#/properties/refY/$ref", "#/refY")));
                    errorCount++;
                }
            }
            if (data.result !== undefined && hasOwn(data, "result")) {
                const err102 = validate.errors;
                const res102 = ref3(data.result);
                const suberr107 = ref3.errors;
                validate.errors = err102;
                if (!res102) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr107.map(e => errorMerge(e, "#/properties/result/$ref", "#/result")));
                    errorCount++;
                }
            }
            if (data.rx !== undefined && hasOwn(data, "rx")) {
                const err103 = validate.errors;
                const res103 = ref3(data.rx);
                const suberr108 = ref3.errors;
                validate.errors = err103;
                if (!res103) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr108.map(e => errorMerge(e, "#/properties/rx/$ref", "#/rx")));
                    errorCount++;
                }
            }
            if (data.ry !== undefined && hasOwn(data, "ry")) {
                const err104 = validate.errors;
                const res104 = ref3(data.ry);
                const suberr109 = ref3.errors;
                validate.errors = err104;
                if (!res104) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr109.map(e => errorMerge(e, "#/properties/ry/$ref", "#/ry")));
                    errorCount++;
                }
            }
            if (data.scale !== undefined && hasOwn(data, "scale")) {
                const err105 = validate.errors;
                const res105 = ref3(data.scale);
                const suberr110 = ref3.errors;
                validate.errors = err105;
                if (!res105) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr110.map(e => errorMerge(e, "#/properties/scale/$ref", "#/scale")));
                    errorCount++;
                }
            }
            if (data.seed !== undefined && hasOwn(data, "seed")) {
                const err106 = validate.errors;
                const res106 = ref3(data.seed);
                const suberr111 = ref3.errors;
                validate.errors = err106;
                if (!res106) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr111.map(e => errorMerge(e, "#/properties/seed/$ref", "#/seed")));
                    errorCount++;
                }
            }
            if (data["shape-rendering"] !== undefined && hasOwn(data, "shape-rendering")) {
                const err107 = validate.errors;
                const res107 = ref3(data["shape-rendering"]);
                const suberr112 = ref3.errors;
                validate.errors = err107;
                if (!res107) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr112.map(e => errorMerge(e, "#/properties/shape-rendering/$ref", "#/shape-rendering")));
                    errorCount++;
                }
            }
            if (data.slope !== undefined && hasOwn(data, "slope")) {
                const err108 = validate.errors;
                const res108 = ref3(data.slope);
                const suberr113 = ref3.errors;
                validate.errors = err108;
                if (!res108) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr113.map(e => errorMerge(e, "#/properties/slope/$ref", "#/slope")));
                    errorCount++;
                }
            }
            if (data.specularConstant !== undefined && hasOwn(data, "specularConstant")) {
                const err109 = validate.errors;
                const res109 = ref3(data.specularConstant);
                const suberr114 = ref3.errors;
                validate.errors = err109;
                if (!res109) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr114.map(e => errorMerge(e, "#/properties/specularConstant/$ref", "#/specularConstant")));
                    errorCount++;
                }
            }
            if (data.specularExponent !== undefined && hasOwn(data, "specularExponent")) {
                const err110 = validate.errors;
                const res110 = ref3(data.specularExponent);
                const suberr115 = ref3.errors;
                validate.errors = err110;
                if (!res110) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr115.map(e => errorMerge(e, "#/properties/specularExponent/$ref", "#/specularExponent")));
                    errorCount++;
                }
            }
            if (data.spreadMethod !== undefined && hasOwn(data, "spreadMethod")) {
                const err111 = validate.errors;
                const res111 = ref3(data.spreadMethod);
                const suberr116 = ref3.errors;
                validate.errors = err111;
                if (!res111) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr116.map(e => errorMerge(e, "#/properties/spreadMethod/$ref", "#/spreadMethod")));
                    errorCount++;
                }
            }
            if (data.startOffset !== undefined && hasOwn(data, "startOffset")) {
                const err112 = validate.errors;
                const res112 = ref3(data.startOffset);
                const suberr117 = ref3.errors;
                validate.errors = err112;
                if (!res112) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr117.map(e => errorMerge(e, "#/properties/startOffset/$ref", "#/startOffset")));
                    errorCount++;
                }
            }
            if (data.stdDeviation !== undefined && hasOwn(data, "stdDeviation")) {
                const err113 = validate.errors;
                const res113 = ref3(data.stdDeviation);
                const suberr118 = ref3.errors;
                validate.errors = err113;
                if (!res113) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr118.map(e => errorMerge(e, "#/properties/stdDeviation/$ref", "#/stdDeviation")));
                    errorCount++;
                }
            }
            if (data.stitchTiles !== undefined && hasOwn(data, "stitchTiles")) {
                const err114 = validate.errors;
                const res114 = ref3(data.stitchTiles);
                const suberr119 = ref3.errors;
                validate.errors = err114;
                if (!res114) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr119.map(e => errorMerge(e, "#/properties/stitchTiles/$ref", "#/stitchTiles")));
                    errorCount++;
                }
            }
            if (data["stop-color"] !== undefined && hasOwn(data, "stop-color")) {
                const err115 = validate.errors;
                const res115 = ref5(data["stop-color"]);
                const suberr120 = ref5.errors;
                validate.errors = err115;
                if (!res115) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr120.map(e => errorMerge(e, "#/properties/stop-color/$ref", "#/stop-color")));
                    errorCount++;
                }
            }
            if (data["stop-opacity"] !== undefined && hasOwn(data, "stop-opacity")) {
                const err116 = validate.errors;
                const res116 = ref3(data["stop-opacity"]);
                const suberr121 = ref3.errors;
                validate.errors = err116;
                if (!res116) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr121.map(e => errorMerge(e, "#/properties/stop-opacity/$ref", "#/stop-opacity")));
                    errorCount++;
                }
            }
            if (data.stroke !== undefined && hasOwn(data, "stroke")) {
                const err117 = validate.errors;
                const res117 = ref5(data.stroke);
                const suberr122 = ref5.errors;
                validate.errors = err117;
                if (!res117) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr122.map(e => errorMerge(e, "#/properties/stroke/$ref", "#/stroke")));
                    errorCount++;
                }
            }
            if (data["stroke-dasharray"] !== undefined && hasOwn(data, "stroke-dasharray")) {
                const err118 = validate.errors;
                const res118 = ref3(data["stroke-dasharray"]);
                const suberr123 = ref3.errors;
                validate.errors = err118;
                if (!res118) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr123.map(e => errorMerge(e, "#/properties/stroke-dasharray/$ref", "#/stroke-dasharray")));
                    errorCount++;
                }
            }
            if (data["stroke-dashoffset"] !== undefined && hasOwn(data, "stroke-dashoffset")) {
                const err119 = validate.errors;
                const res119 = ref3(data["stroke-dashoffset"]);
                const suberr124 = ref3.errors;
                validate.errors = err119;
                if (!res119) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr124.map(e => errorMerge(e, "#/properties/stroke-dashoffset/$ref", "#/stroke-dashoffset")));
                    errorCount++;
                }
            }
            if (data["stroke-linecap"] !== undefined && hasOwn(data, "stroke-linecap")) {
                const err120 = validate.errors;
                const res120 = ref3(data["stroke-linecap"]);
                const suberr125 = ref3.errors;
                validate.errors = err120;
                if (!res120) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr125.map(e => errorMerge(e, "#/properties/stroke-linecap/$ref", "#/stroke-linecap")));
                    errorCount++;
                }
            }
            if (data["stroke-linejoin"] !== undefined && hasOwn(data, "stroke-linejoin")) {
                const err121 = validate.errors;
                const res121 = ref3(data["stroke-linejoin"]);
                const suberr126 = ref3.errors;
                validate.errors = err121;
                if (!res121) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr126.map(e => errorMerge(e, "#/properties/stroke-linejoin/$ref", "#/stroke-linejoin")));
                    errorCount++;
                }
            }
            if (data["stroke-miterlimit"] !== undefined && hasOwn(data, "stroke-miterlimit")) {
                const err122 = validate.errors;
                const res122 = ref3(data["stroke-miterlimit"]);
                const suberr127 = ref3.errors;
                validate.errors = err122;
                if (!res122) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr127.map(e => errorMerge(e, "#/properties/stroke-miterlimit/$ref", "#/stroke-miterlimit")));
                    errorCount++;
                }
            }
            if (data["stroke-opacity"] !== undefined && hasOwn(data, "stroke-opacity")) {
                const err123 = validate.errors;
                const res123 = ref3(data["stroke-opacity"]);
                const suberr128 = ref3.errors;
                validate.errors = err123;
                if (!res123) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr128.map(e => errorMerge(e, "#/properties/stroke-opacity/$ref", "#/stroke-opacity")));
                    errorCount++;
                }
            }
            if (data["stroke-width"] !== undefined && hasOwn(data, "stroke-width")) {
                const err124 = validate.errors;
                const res124 = ref3(data["stroke-width"]);
                const suberr129 = ref3.errors;
                validate.errors = err124;
                if (!res124) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr129.map(e => errorMerge(e, "#/properties/stroke-width/$ref", "#/stroke-width")));
                    errorCount++;
                }
            }
            if (data.style !== undefined && hasOwn(data, "style")) {
                const err126 = validate.errors;
                const res126 = ref9(data.style);
                const suberr132 = ref9.errors;
                validate.errors = err126;
                if (!res126) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr132.map(e => errorMerge(e, "#/properties/style/$ref", "#/style")));
                    errorCount++;
                }
            }
            if (data.surfaceScale !== undefined && hasOwn(data, "surfaceScale")) {
                const err127 = validate.errors;
                const res127 = ref3(data.surfaceScale);
                const suberr133 = ref3.errors;
                validate.errors = err127;
                if (!res127) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr133.map(e => errorMerge(e, "#/properties/surfaceScale/$ref", "#/surfaceScale")));
                    errorCount++;
                }
            }
            if (data.systemLanguage !== undefined && hasOwn(data, "systemLanguage")) {
                const err128 = validate.errors;
                const res128 = ref3(data.systemLanguage);
                const suberr134 = ref3.errors;
                validate.errors = err128;
                if (!res128) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr134.map(e => errorMerge(e, "#/properties/systemLanguage/$ref", "#/systemLanguage")));
                    errorCount++;
                }
            }
            if (data.tabindex !== undefined && hasOwn(data, "tabindex")) {
                const err129 = validate.errors;
                const res129 = ref3(data.tabindex);
                const suberr135 = ref3.errors;
                validate.errors = err129;
                if (!res129) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr135.map(e => errorMerge(e, "#/properties/tabindex/$ref", "#/tabindex")));
                    errorCount++;
                }
            }
            if (data.tableValues !== undefined && hasOwn(data, "tableValues")) {
                const err130 = validate.errors;
                const res130 = ref3(data.tableValues);
                const suberr136 = ref3.errors;
                validate.errors = err130;
                if (!res130) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr136.map(e => errorMerge(e, "#/properties/tableValues/$ref", "#/tableValues")));
                    errorCount++;
                }
            }
            if (data.targetX !== undefined && hasOwn(data, "targetX")) {
                const err131 = validate.errors;
                const res131 = ref3(data.targetX);
                const suberr137 = ref3.errors;
                validate.errors = err131;
                if (!res131) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr137.map(e => errorMerge(e, "#/properties/targetX/$ref", "#/targetX")));
                    errorCount++;
                }
            }
            if (data.targetY !== undefined && hasOwn(data, "targetY")) {
                const err132 = validate.errors;
                const res132 = ref3(data.targetY);
                const suberr138 = ref3.errors;
                validate.errors = err132;
                if (!res132) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr138.map(e => errorMerge(e, "#/properties/targetY/$ref", "#/targetY")));
                    errorCount++;
                }
            }
            if (data["text-anchor"] !== undefined && hasOwn(data, "text-anchor")) {
                const err133 = validate.errors;
                const res133 = ref3(data["text-anchor"]);
                const suberr139 = ref3.errors;
                validate.errors = err133;
                if (!res133) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr139.map(e => errorMerge(e, "#/properties/text-anchor/$ref", "#/text-anchor")));
                    errorCount++;
                }
            }
            if (data["text-decoration"] !== undefined && hasOwn(data, "text-decoration")) {
                const err134 = validate.errors;
                const res134 = ref3(data["text-decoration"]);
                const suberr140 = ref3.errors;
                validate.errors = err134;
                if (!res134) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr140.map(e => errorMerge(e, "#/properties/text-decoration/$ref", "#/text-decoration")));
                    errorCount++;
                }
            }
            if (data["text-rendering"] !== undefined && hasOwn(data, "text-rendering")) {
                const err135 = validate.errors;
                const res135 = ref3(data["text-rendering"]);
                const suberr141 = ref3.errors;
                validate.errors = err135;
                if (!res135) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr141.map(e => errorMerge(e, "#/properties/text-rendering/$ref", "#/text-rendering")));
                    errorCount++;
                }
            }
            if (data.textLength !== undefined && hasOwn(data, "textLength")) {
                const err136 = validate.errors;
                const res136 = ref3(data.textLength);
                const suberr142 = ref3.errors;
                validate.errors = err136;
                if (!res136) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr142.map(e => errorMerge(e, "#/properties/textLength/$ref", "#/textLength")));
                    errorCount++;
                }
            }
            if (data.transform !== undefined && hasOwn(data, "transform")) {
                const err137 = validate.errors;
                const res137 = ref3(data.transform);
                const suberr143 = ref3.errors;
                validate.errors = err137;
                if (!res137) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr143.map(e => errorMerge(e, "#/properties/transform/$ref", "#/transform")));
                    errorCount++;
                }
            }
            if (data["transform-origin"] !== undefined && hasOwn(data, "transform-origin")) {
                const err138 = validate.errors;
                const res138 = ref3(data["transform-origin"]);
                const suberr144 = ref3.errors;
                validate.errors = err138;
                if (!res138) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr144.map(e => errorMerge(e, "#/properties/transform-origin/$ref", "#/transform-origin")));
                    errorCount++;
                }
            }
            if (data.type !== undefined && hasOwn(data, "type")) {
                const err139 = validate.errors;
                const res139 = ref3(data.type);
                const suberr145 = ref3.errors;
                validate.errors = err139;
                if (!res139) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr145.map(e => errorMerge(e, "#/properties/type/$ref", "#/type")));
                    errorCount++;
                }
            }
            if (data.values !== undefined && hasOwn(data, "values")) {
                const err140 = validate.errors;
                const res140 = ref3(data.values);
                const suberr146 = ref3.errors;
                validate.errors = err140;
                if (!res140) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr146.map(e => errorMerge(e, "#/properties/values/$ref", "#/values")));
                    errorCount++;
                }
            }
            if (data.viewBox !== undefined && hasOwn(data, "viewBox")) {
                const err141 = validate.errors;
                const res141 = ref3(data.viewBox);
                const suberr147 = ref3.errors;
                validate.errors = err141;
                if (!res141) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr147.map(e => errorMerge(e, "#/properties/viewBox/$ref", "#/viewBox")));
                    errorCount++;
                }
            }
            if (data.visibility !== undefined && hasOwn(data, "visibility")) {
                const err142 = validate.errors;
                const res142 = ref3(data.visibility);
                const suberr148 = ref3.errors;
                validate.errors = err142;
                if (!res142) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr148.map(e => errorMerge(e, "#/properties/visibility/$ref", "#/visibility")));
                    errorCount++;
                }
            }
            if (data.width !== undefined && hasOwn(data, "width")) {
                const err143 = validate.errors;
                const res143 = ref3(data.width);
                const suberr149 = ref3.errors;
                validate.errors = err143;
                if (!res143) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr149.map(e => errorMerge(e, "#/properties/width/$ref", "#/width")));
                    errorCount++;
                }
            }
            if (data["word-spacing"] !== undefined && hasOwn(data, "word-spacing")) {
                const err144 = validate.errors;
                const res144 = ref3(data["word-spacing"]);
                const suberr150 = ref3.errors;
                validate.errors = err144;
                if (!res144) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr150.map(e => errorMerge(e, "#/properties/word-spacing/$ref", "#/word-spacing")));
                    errorCount++;
                }
            }
            if (data["writing-mode"] !== undefined && hasOwn(data, "writing-mode")) {
                const err145 = validate.errors;
                const res145 = ref3(data["writing-mode"]);
                const suberr151 = ref3.errors;
                validate.errors = err145;
                if (!res145) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr151.map(e => errorMerge(e, "#/properties/writing-mode/$ref", "#/writing-mode")));
                    errorCount++;
                }
            }
            if (data.x !== undefined && hasOwn(data, "x")) {
                const err146 = validate.errors;
                const res146 = ref3(data.x);
                const suberr152 = ref3.errors;
                validate.errors = err146;
                if (!res146) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr152.map(e => errorMerge(e, "#/properties/x/$ref", "#/x")));
                    errorCount++;
                }
            }
            if (data.x1 !== undefined && hasOwn(data, "x1")) {
                const err147 = validate.errors;
                const res147 = ref3(data.x1);
                const suberr153 = ref3.errors;
                validate.errors = err147;
                if (!res147) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr153.map(e => errorMerge(e, "#/properties/x1/$ref", "#/x1")));
                    errorCount++;
                }
            }
            if (data.x2 !== undefined && hasOwn(data, "x2")) {
                const err148 = validate.errors;
                const res148 = ref3(data.x2);
                const suberr154 = ref3.errors;
                validate.errors = err148;
                if (!res148) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr154.map(e => errorMerge(e, "#/properties/x2/$ref", "#/x2")));
                    errorCount++;
                }
            }
            if (data.xChannelSelector !== undefined && hasOwn(data, "xChannelSelector")) {
                const err149 = validate.errors;
                const res149 = ref3(data.xChannelSelector);
                const suberr155 = ref3.errors;
                validate.errors = err149;
                if (!res149) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr155.map(e => errorMerge(e, "#/properties/xChannelSelector/$ref", "#/xChannelSelector")));
                    errorCount++;
                }
            }
            if (data.y !== undefined && hasOwn(data, "y")) {
                const err150 = validate.errors;
                const res150 = ref3(data.y);
                const suberr156 = ref3.errors;
                validate.errors = err150;
                if (!res150) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr156.map(e => errorMerge(e, "#/properties/y/$ref", "#/y")));
                    errorCount++;
                }
            }
            if (data.y1 !== undefined && hasOwn(data, "y1")) {
                const err151 = validate.errors;
                const res151 = ref3(data.y1);
                const suberr157 = ref3.errors;
                validate.errors = err151;
                if (!res151) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr157.map(e => errorMerge(e, "#/properties/y1/$ref", "#/y1")));
                    errorCount++;
                }
            }
            if (data.y2 !== undefined && hasOwn(data, "y2")) {
                const err152 = validate.errors;
                const res152 = ref3(data.y2);
                const suberr158 = ref3.errors;
                validate.errors = err152;
                if (!res152) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr158.map(e => errorMerge(e, "#/properties/y2/$ref", "#/y2")));
                    errorCount++;
                }
            }
            if (data.yChannelSelector !== undefined && hasOwn(data, "yChannelSelector")) {
                const err153 = validate.errors;
                const res153 = ref3(data.yChannelSelector);
                const suberr159 = ref3.errors;
                validate.errors = err153;
                if (!res153) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr159.map(e => errorMerge(e, "#/properties/yChannelSelector/$ref", "#/yChannelSelector")));
                    errorCount++;
                }
            }
            if (data.z !== undefined && hasOwn(data, "z")) {
                const err154 = validate.errors;
                const res154 = ref3(data.z);
                const suberr160 = ref3.errors;
                validate.errors = err154;
                if (!res154) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr160.map(e => errorMerge(e, "#/properties/z/$ref", "#/z")));
                    errorCount++;
                }
            }
            for (const key7 of Object.keys(data)) {
                if (key7 !== "alignment-baseline" && key7 !== "amplitude" && key7 !== "azimuth" && key7 !== "baseFrequency" && key7 !== "baseline-shift" && key7 !== "bias" && key7 !== "class" && key7 !== "clipPathUnits" && key7 !== "clip-path" && key7 !== "clip-rule" && key7 !== "color" && key7 !== "color-interpolation" && key7 !== "color-interpolation-filters" && key7 !== "crossorigin" && key7 !== "cx" && key7 !== "cy" && key7 !== "d" && key7 !== "decoding" && key7 !== "diffuseConstant" && key7 !== "direction" && key7 !== "display" && key7 !== "divisor" && key7 !== "dominant-baseline" && key7 !== "dx" && key7 !== "dy" && key7 !== "edgeMode" && key7 !== "elevation" && key7 !== "exponent" && key7 !== "fill" && key7 !== "fill-opacity" && key7 !== "fill-rule" && key7 !== "filter" && key7 !== "filterUnits" && key7 !== "flood-color" && key7 !== "flood-opacity" && key7 !== "font-family" && key7 !== "font-size" && key7 !== "font-size-adjust" && key7 !== "font-style" && key7 !== "font-variant" && key7 !== "font-weight" && key7 !== "fx" && key7 !== "fy" && key7 !== "gradientTransform" && key7 !== "gradientUnits" && key7 !== "height" && key7 !== "href" && key7 !== "id" && key7 !== "image-rendering" && key7 !== "in" && key7 !== "in2" && key7 !== "intercept" && key7 !== "k1" && key7 !== "k2" && key7 !== "k3" && key7 !== "k4" && key7 !== "kernelMatrix" && key7 !== "kernelUnitLength" && key7 !== "lang" && key7 !== "lengthAdjust" && key7 !== "letter-spacing" && key7 !== "lighting-color" && key7 !== "marker-end" && key7 !== "marker-mid" && key7 !== "marker-start" && key7 !== "markerHeight" && key7 !== "markerUnits" && key7 !== "markerWidth" && key7 !== "mask" && key7 !== "maskContentUnits" && key7 !== "maskUnits" && key7 !== "media" && key7 !== "method" && key7 !== "mode" && key7 !== "numOctaves" && key7 !== "offset" && key7 !== "opacity" && key7 !== "operator" && key7 !== "order" && key7 !== "orient" && key7 !== "overflow" && key7 !== "paint-order" && key7 !== "path" && key7 !== "pathLength" && key7 !== "patternContentUnits" && key7 !== "patternTransform" && key7 !== "patternUnits" && key7 !== "points" && key7 !== "preserveAlpha" && key7 !== "preserveAspectRatio" && key7 !== "primitiveUnits" && key7 !== "r" && key7 !== "radius" && key7 !== "refX" && key7 !== "refY" && key7 !== "result" && key7 !== "rx" && key7 !== "ry" && key7 !== "scale" && key7 !== "seed" && key7 !== "shape-rendering" && key7 !== "slope" && key7 !== "specularConstant" && key7 !== "specularExponent" && key7 !== "spreadMethod" && key7 !== "startOffset" && key7 !== "stdDeviation" && key7 !== "stitchTiles" && key7 !== "stop-color" && key7 !== "stop-opacity" && key7 !== "stroke" && key7 !== "stroke-dasharray" && key7 !== "stroke-dashoffset" && key7 !== "stroke-linecap" && key7 !== "stroke-linejoin" && key7 !== "stroke-miterlimit" && key7 !== "stroke-opacity" && key7 !== "stroke-width" && key7 !== "style" && key7 !== "surfaceScale" && key7 !== "systemLanguage" && key7 !== "tabindex" && key7 !== "tableValues" && key7 !== "targetX" && key7 !== "targetY" && key7 !== "text-anchor" && key7 !== "text-decoration" && key7 !== "text-rendering" && key7 !== "textLength" && key7 !== "transform" && key7 !== "transform-origin" && key7 !== "type" && key7 !== "values" && key7 !== "viewBox" && key7 !== "visibility" && key7 !== "width" && key7 !== "word-spacing" && key7 !== "writing-mode" && key7 !== "x" && key7 !== "x1" && key7 !== "x2" && key7 !== "xChannelSelector" && key7 !== "y" && key7 !== "y1" && key7 !== "y2" && key7 !== "yChannelSelector" && key7 !== "z") {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key7) });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const ref11 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "object" && data && !Array.isArray(data))) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(data.type !== undefined && hasOwn(data, "type"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/type" });
                errorCount++;
            }
            if (!(data.value !== undefined && hasOwn(data, "value"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/value" });
                errorCount++;
            }
            if (data.type !== undefined && hasOwn(data, "type")) {
                if (!(data.type === "text")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/type/const", instanceLocation: "#/type" });
                    errorCount++;
                }
            }
            if (data.value !== undefined && hasOwn(data, "value")) {
                let suberr163 = null;
                const sub22 = (() => {
                    let errorCount = 0;
                    if (!(typeof data.value === "string")) {
                        if (suberr163 === null)
                            suberr163 = [];
                        suberr163.push({ keywordLocation: "#/properties/value/anyOf/0/type", instanceLocation: "#/value" });
                        errorCount++;
                    }
                    else {
                        if (data.value.length > 4096 && stringLength(data.value) > 4096) {
                            if (suberr163 === null)
                                suberr163 = [];
                            suberr163.push({ keywordLocation: "#/properties/value/anyOf/0/maxLength", instanceLocation: "#/value" });
                            errorCount++;
                        }
                    }
                    return errorCount === 0;
                })();
                if (!sub22) {
                    const sub23 = (() => {
                        let errorCount = 0;
                        if (!(typeof data.value === "object" && data.value && !Array.isArray(data.value))) {
                            if (suberr163 === null)
                                suberr163 = [];
                            suberr163.push({ keywordLocation: "#/properties/value/anyOf/1/type", instanceLocation: "#/value" });
                            errorCount++;
                        }
                        else {
                            if (!(data.value.type !== undefined && hasOwn(data.value, "type"))) {
                                if (suberr163 === null)
                                    suberr163 = [];
                                suberr163.push({ keywordLocation: "#/properties/value/anyOf/1/required", instanceLocation: "#/value/type" });
                                errorCount++;
                            }
                            if (!(data.value.name !== undefined && hasOwn(data.value, "name"))) {
                                if (suberr163 === null)
                                    suberr163 = [];
                                suberr163.push({ keywordLocation: "#/properties/value/anyOf/1/required", instanceLocation: "#/value/name" });
                                errorCount++;
                            }
                            if (data.value.type !== undefined && hasOwn(data.value, "type")) {
                                if (!(data.value.type === "variable")) {
                                    if (suberr163 === null)
                                        suberr163 = [];
                                    suberr163.push({ keywordLocation: "#/properties/value/anyOf/1/properties/type/const", instanceLocation: "#/value/type" });
                                    errorCount++;
                                }
                            }
                            if (data.value.name !== undefined && hasOwn(data.value, "name")) {
                                if (!(data.value.name === "initial" || data.value.name === "initials")) {
                                    if (suberr163 === null)
                                        suberr163 = [];
                                    suberr163.push({ keywordLocation: "#/properties/value/anyOf/1/properties/name/enum", instanceLocation: "#/value/name" });
                                    errorCount++;
                                }
                            }
                            for (const key8 of Object.keys(data.value)) {
                                if (key8 !== "type" && key8 !== "name") {
                                    if (suberr163 === null)
                                        suberr163 = [];
                                    suberr163.push({ keywordLocation: "#/properties/value/anyOf/1/additionalProperties", instanceLocation: "#/value/" + pointerPart(key8) });
                                    errorCount++;
                                }
                            }
                        }
                        return errorCount === 0;
                    })();
                    if (!sub23) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/value/anyOf", instanceLocation: "#/value" });
                        if (suberr163)
                            validate.errors.push(...suberr163);
                        errorCount++;
                    }
                }
            }
            for (const key9 of Object.keys(data)) {
                if (key9 !== "type" && key9 !== "value") {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key9) });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const ref13 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        const err157 = validate.errors;
        const res157 = ref7(data);
        const suberr165 = ref7.errors;
        validate.errors = err157;
        if (!res157) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push(...suberr165.map(e => errorMerge(e, "#/allOf/0/$ref", "#")));
            errorCount++;
        }
        return errorCount === 0;
    };
    const ref12 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "object" && data && !Array.isArray(data))) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(data.type !== undefined && hasOwn(data, "type"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/type" });
                errorCount++;
            }
            if (!(data.name !== undefined && hasOwn(data, "name"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/name" });
                errorCount++;
            }
            if (data.type !== undefined && hasOwn(data, "type")) {
                if (!(data.type === "component")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/type/const", instanceLocation: "#/type" });
                    errorCount++;
                }
            }
            if (data.name !== undefined && hasOwn(data, "name")) {
                const err158 = validate.errors;
                const res158 = ref13(data.name);
                const suberr166 = ref13.errors;
                validate.errors = err158;
                if (!res158) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr166.map(e => errorMerge(e, "#/properties/name/$ref", "#/name")));
                    errorCount++;
                }
            }
            if (data.attributes !== undefined && hasOwn(data, "attributes")) {
                const err159 = validate.errors;
                const res159 = ref2(data.attributes);
                const suberr167 = ref2.errors;
                validate.errors = err159;
                if (!res159) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr167.map(e => errorMerge(e, "#/properties/attributes/$ref", "#/attributes")));
                    errorCount++;
                }
            }
            for (const key10 of Object.keys(data)) {
                if (key10 !== "type" && key10 !== "name" && key10 !== "attributes") {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key10) });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const ref14 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "object" && data && !Array.isArray(data))) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(data.type !== undefined && hasOwn(data, "type"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/type" });
                errorCount++;
            }
            if (!(data.name !== undefined && hasOwn(data, "name"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/name" });
                errorCount++;
            }
            if (data.type !== undefined && hasOwn(data, "type")) {
                if (!(data.type === "element")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/type/const", instanceLocation: "#/type" });
                    errorCount++;
                }
            }
            if (data.name !== undefined && hasOwn(data, "name")) {
                if (!(data.name === "style")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/name/const", instanceLocation: "#/name" });
                    errorCount++;
                }
            }
            if (data.attributes !== undefined && hasOwn(data, "attributes")) {
                const err161 = validate.errors;
                const res161 = ref2(data.attributes);
                const suberr169 = ref2.errors;
                validate.errors = err161;
                if (!res161) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr169.map(e => errorMerge(e, "#/properties/attributes/$ref", "#/attributes")));
                    errorCount++;
                }
            }
            if (data.children !== undefined && hasOwn(data, "children")) {
                if (!Array.isArray(data.children)) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/children/type", instanceLocation: "#/children" });
                    errorCount++;
                }
                else {
                    if (data.children.length > 64) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/children/maxItems", instanceLocation: "#/children" });
                        errorCount++;
                    }
                    for (let j = 0; j < data.children.length; j++) {
                        if (data.children[j] !== undefined && hasOwn(data.children, j)) {
                            if (!(typeof data.children[j] === "object" && data.children[j] && !Array.isArray(data.children[j]))) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/properties/children/items/type", instanceLocation: "#/children/" + j });
                                errorCount++;
                            }
                            else {
                                if (!(data.children[j].type !== undefined && hasOwn(data.children[j], "type"))) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/children/items/required", instanceLocation: "#/children/" + j + "/type" });
                                    errorCount++;
                                }
                                if (!(data.children[j].value !== undefined && hasOwn(data.children[j], "value"))) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/children/items/required", instanceLocation: "#/children/" + j + "/value" });
                                    errorCount++;
                                }
                                if (data.children[j].type !== undefined && hasOwn(data.children[j], "type")) {
                                    if (!(data.children[j].type === "text")) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/children/items/properties/type/const", instanceLocation: "#/children/" + j + "/type" });
                                        errorCount++;
                                    }
                                }
                                if (data.children[j].value !== undefined && hasOwn(data.children[j], "value")) {
                                    const err162 = validate.errors;
                                    const res162 = ref9(data.children[j].value);
                                    const suberr170 = ref9.errors;
                                    validate.errors = err162;
                                    if (!res162) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push(...suberr170.map(e => errorMerge(e, "#/properties/children/items/properties/value/$ref", "#/children/" + j + "/value")));
                                        errorCount++;
                                    }
                                }
                                for (const key11 of Object.keys(data.children[j])) {
                                    if (key11 !== "type" && key11 !== "value") {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/children/items/additionalProperties", instanceLocation: "#/children/" + j + "/" + pointerPart(key11) });
                                        errorCount++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            for (const key12 of Object.keys(data)) {
                if (key12 !== "type" && key12 !== "name" && key12 !== "attributes" && key12 !== "children") {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key12) });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const ref15 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "object" && data && !Array.isArray(data))) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(data.type !== undefined && hasOwn(data, "type"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/type" });
                errorCount++;
            }
            if (!(data.name !== undefined && hasOwn(data, "name"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/name" });
                errorCount++;
            }
            if (data.type !== undefined && hasOwn(data, "type")) {
                if (!(data.type === "element")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/type/const", instanceLocation: "#/type" });
                    errorCount++;
                }
            }
            if (data.name !== undefined && hasOwn(data, "name")) {
                if (!(data.name === "circle" || data.name === "clipPath" || data.name === "defs" || data.name === "desc" || data.name === "ellipse" || data.name === "feBlend" || data.name === "feColorMatrix" || data.name === "feComponentTransfer" || data.name === "feComposite" || data.name === "feConvolveMatrix" || data.name === "feDiffuseLighting" || data.name === "feDisplacementMap" || data.name === "feDistantLight" || data.name === "feDropShadow" || data.name === "feFlood" || data.name === "feFuncA" || data.name === "feFuncB" || data.name === "feFuncG" || data.name === "feFuncR" || data.name === "feGaussianBlur" || data.name === "feImage" || data.name === "feMerge" || data.name === "feMergeNode" || data.name === "feMorphology" || data.name === "feOffset" || data.name === "fePointLight" || data.name === "feSpecularLighting" || data.name === "feSpotLight" || data.name === "feTile" || data.name === "feTurbulence" || data.name === "filter" || data.name === "g" || data.name === "image" || data.name === "line" || data.name === "linearGradient" || data.name === "marker" || data.name === "mask" || data.name === "metadata" || data.name === "mpath" || data.name === "path" || data.name === "pattern" || data.name === "polygon" || data.name === "polyline" || data.name === "radialGradient" || data.name === "rect" || data.name === "stop" || data.name === "svg" || data.name === "switch" || data.name === "symbol" || data.name === "text" || data.name === "textPath" || data.name === "title" || data.name === "tspan" || data.name === "use" || data.name === "view")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/name/enum", instanceLocation: "#/name" });
                    errorCount++;
                }
            }
            if (data.attributes !== undefined && hasOwn(data, "attributes")) {
                const err164 = validate.errors;
                const res164 = ref2(data.attributes);
                const suberr172 = ref2.errors;
                validate.errors = err164;
                if (!res164) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr172.map(e => errorMerge(e, "#/properties/attributes/$ref", "#/attributes")));
                    errorCount++;
                }
            }
            if (data.children !== undefined && hasOwn(data, "children")) {
                if (!Array.isArray(data.children)) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/children/type", instanceLocation: "#/children" });
                    errorCount++;
                }
                else {
                    if (data.children.length > 1024) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/children/maxItems", instanceLocation: "#/children" });
                        errorCount++;
                    }
                    for (let k = 0; k < data.children.length; k++) {
                        if (data.children[k] !== undefined && hasOwn(data.children, k)) {
                            const err165 = validate.errors;
                            const res165 = ref10(data.children[k]);
                            const suberr173 = ref10.errors;
                            validate.errors = err165;
                            if (!res165) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push(...suberr173.map(e => errorMerge(e, "#/properties/children/items/$ref", "#/children/" + k)));
                                errorCount++;
                            }
                        }
                    }
                }
            }
            for (const key13 of Object.keys(data)) {
                if (key13 !== "type" && key13 !== "name" && key13 !== "attributes" && key13 !== "children") {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key13) });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const ref10 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        let suberr162 = null;
        const sub21 = (() => {
            let errorCount = 0;
            const err156 = validate.errors;
            const res156 = ref11(data);
            const suberr164 = ref11.errors;
            validate.errors = err156;
            if (!res156) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push(...suberr164.map(e => errorMerge(e, "#/anyOf/0/$ref", "#")));
                errorCount++;
            }
            return errorCount === 0;
        })();
        if (!sub21) {
            const sub24 = (() => {
                let errorCount = 0;
                const err160 = validate.errors;
                const res160 = ref12(data);
                const suberr168 = ref12.errors;
                validate.errors = err160;
                if (!res160) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr168.map(e => errorMerge(e, "#/anyOf/1/$ref", "#")));
                    errorCount++;
                }
                return errorCount === 0;
            })();
            if (!sub24) {
                const sub25 = (() => {
                    let errorCount = 0;
                    const err163 = validate.errors;
                    const res163 = ref14(data);
                    const suberr171 = ref14.errors;
                    validate.errors = err163;
                    if (!res163) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push(...suberr171.map(e => errorMerge(e, "#/anyOf/2/$ref", "#")));
                        errorCount++;
                    }
                    return errorCount === 0;
                })();
                if (!sub25) {
                    const sub26 = (() => {
                        let errorCount = 0;
                        const err166 = validate.errors;
                        const res166 = ref15(data);
                        const suberr174 = ref15.errors;
                        validate.errors = err166;
                        if (!res166) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push(...suberr174.map(e => errorMerge(e, "#/anyOf/3/$ref", "#")));
                            errorCount++;
                        }
                        return errorCount === 0;
                    })();
                    if (!sub26) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/anyOf", instanceLocation: "#" });
                        if (suberr162)
                            validate.errors.push(...suberr162);
                        errorCount++;
                    }
                }
            }
        }
        return errorCount === 0;
    };
    const ref17 = function validate(data) {
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
            if (!(100 >= data)) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maximum", instanceLocation: "#" });
                errorCount++;
            }
        }
        return errorCount === 0;
    };
    const ref18 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "object" && data && !Array.isArray(data))) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(data.min !== undefined && hasOwn(data, "min"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/min" });
                errorCount++;
            }
            if (!(data.max !== undefined && hasOwn(data, "max"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/max" });
                errorCount++;
            }
            if (data.min !== undefined && hasOwn(data, "min")) {
                if (!(typeof data.min === "number")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/min/type", instanceLocation: "#/min" });
                    errorCount++;
                }
                else {
                    if (!(-360 <= data.min)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/min/minimum", instanceLocation: "#/min" });
                        errorCount++;
                    }
                    if (!(360 >= data.min)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/min/maximum", instanceLocation: "#/min" });
                        errorCount++;
                    }
                }
            }
            if (data.max !== undefined && hasOwn(data, "max")) {
                if (!(typeof data.max === "number")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/max/type", instanceLocation: "#/max" });
                    errorCount++;
                }
                else {
                    if (!(-360 <= data.max)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/max/minimum", instanceLocation: "#/max" });
                        errorCount++;
                    }
                    if (!(360 >= data.max)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/max/maximum", instanceLocation: "#/max" });
                        errorCount++;
                    }
                }
            }
            if (data.step !== undefined && hasOwn(data, "step")) {
                if (!(typeof data.step === "number")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/step/type", instanceLocation: "#/step" });
                    errorCount++;
                }
                else {
                    if (!(0 < data.step)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/step/exclusiveMinimum", instanceLocation: "#/step" });
                        errorCount++;
                    }
                    if (!(720 >= data.step)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/step/maximum", instanceLocation: "#/step" });
                        errorCount++;
                    }
                }
            }
            for (const key17 of Object.keys(data)) {
                if (key17 !== "min" && key17 !== "max" && key17 !== "step") {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key17) });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const ref19 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "object" && data && !Array.isArray(data))) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(data.min !== undefined && hasOwn(data, "min"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/min" });
                errorCount++;
            }
            if (!(data.max !== undefined && hasOwn(data, "max"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/max" });
                errorCount++;
            }
            if (data.min !== undefined && hasOwn(data, "min")) {
                if (!(typeof data.min === "number")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/min/type", instanceLocation: "#/min" });
                    errorCount++;
                }
                else {
                    if (!(0 <= data.min)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/min/minimum", instanceLocation: "#/min" });
                        errorCount++;
                    }
                    if (!(10 >= data.min)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/min/maximum", instanceLocation: "#/min" });
                        errorCount++;
                    }
                }
            }
            if (data.max !== undefined && hasOwn(data, "max")) {
                if (!(typeof data.max === "number")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/max/type", instanceLocation: "#/max" });
                    errorCount++;
                }
                else {
                    if (!(0 <= data.max)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/max/minimum", instanceLocation: "#/max" });
                        errorCount++;
                    }
                    if (!(10 >= data.max)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/max/maximum", instanceLocation: "#/max" });
                        errorCount++;
                    }
                }
            }
            if (data.step !== undefined && hasOwn(data, "step")) {
                if (!(typeof data.step === "number")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/step/type", instanceLocation: "#/step" });
                    errorCount++;
                }
                else {
                    if (!(0 < data.step)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/step/exclusiveMinimum", instanceLocation: "#/step" });
                        errorCount++;
                    }
                    if (!(10 >= data.step)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/step/maximum", instanceLocation: "#/step" });
                        errorCount++;
                    }
                }
            }
            for (const key18 of Object.keys(data)) {
                if (key18 !== "min" && key18 !== "max" && key18 !== "step") {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key18) });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const ref21 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "object" && data && !Array.isArray(data))) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(data.min !== undefined && hasOwn(data, "min"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/min" });
                errorCount++;
            }
            if (!(data.max !== undefined && hasOwn(data, "max"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/max" });
                errorCount++;
            }
            if (data.min !== undefined && hasOwn(data, "min")) {
                if (!(typeof data.min === "number")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/min/type", instanceLocation: "#/min" });
                    errorCount++;
                }
                else {
                    if (!(-1000 <= data.min)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/min/minimum", instanceLocation: "#/min" });
                        errorCount++;
                    }
                    if (!(1000 >= data.min)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/min/maximum", instanceLocation: "#/min" });
                        errorCount++;
                    }
                }
            }
            if (data.max !== undefined && hasOwn(data, "max")) {
                if (!(typeof data.max === "number")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/max/type", instanceLocation: "#/max" });
                    errorCount++;
                }
                else {
                    if (!(-1000 <= data.max)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/max/minimum", instanceLocation: "#/max" });
                        errorCount++;
                    }
                    if (!(1000 >= data.max)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/max/maximum", instanceLocation: "#/max" });
                        errorCount++;
                    }
                }
            }
            if (data.step !== undefined && hasOwn(data, "step")) {
                if (!(typeof data.step === "number")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/step/type", instanceLocation: "#/step" });
                    errorCount++;
                }
                else {
                    if (!(0 < data.step)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/step/exclusiveMinimum", instanceLocation: "#/step" });
                        errorCount++;
                    }
                    if (!(2000 >= data.step)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/step/maximum", instanceLocation: "#/step" });
                        errorCount++;
                    }
                }
            }
            for (const key19 of Object.keys(data)) {
                if (key19 !== "min" && key19 !== "max" && key19 !== "step") {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key19) });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const ref20 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "object" && data && !Array.isArray(data))) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (data.x !== undefined && hasOwn(data, "x")) {
                const err172 = validate.errors;
                const res172 = ref21(data.x);
                const suberr181 = ref21.errors;
                validate.errors = err172;
                if (!res172) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr181.map(e => errorMerge(e, "#/properties/x/$ref", "#/x")));
                    errorCount++;
                }
            }
            if (data.y !== undefined && hasOwn(data, "y")) {
                const err173 = validate.errors;
                const res173 = ref21(data.y);
                const suberr182 = ref21.errors;
                validate.errors = err173;
                if (!res173) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr182.map(e => errorMerge(e, "#/properties/y/$ref", "#/y")));
                    errorCount++;
                }
            }
            for (const key20 of Object.keys(data)) {
                if (key20 !== "x" && key20 !== "y") {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key20) });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const pattern15 = new RegExp("^[a-z][a-zA-Z0-9]*(:[a-z][a-zA-Z0-9]*)?$", "u");
    const unique = (array) => {
        if (array.length < 2)
            return true;
        if (array.length === 2)
            return !deepEqual(array[0], array[1]);
        const objects = [];
        const primitives = array.length > 20 ? new Set() : null;
        let primitivesCount = 0;
        let pos = 0;
        for (const item of array) {
            if (typeof item === 'object') {
                objects.push(item);
            }
            else if (primitives) {
                primitives.add(item);
                if (primitives.size !== ++primitivesCount)
                    return false;
            }
            else {
                if (array.indexOf(item, pos + 1) !== -1)
                    return false;
            }
            pos++;
        }
        for (let i = 1; i < objects.length; i++)
            for (let j = 0; j < i; j++)
                if (deepEqual(objects[i], objects[j]))
                    return false;
        return true;
    };
    const deepEqual = (obj, obj2) => {
        if (obj === obj2)
            return true;
        if (!obj || !obj2 || typeof obj !== typeof obj2)
            return false;
        if (obj !== obj2 && typeof obj !== 'object')
            return false;
        const proto = Object.getPrototypeOf(obj);
        if (proto !== Object.getPrototypeOf(obj2))
            return false;
        if (proto === Array.prototype) {
            if (!Array.isArray(obj) || !Array.isArray(obj2))
                return false;
            if (obj.length !== obj2.length)
                return false;
            return obj.every((x, i) => deepEqual(x, obj2[i]));
        }
        else if (proto === Object.prototype) {
            const [keys, keys2] = [Object.keys(obj), Object.keys(obj2)];
            if (keys.length !== keys2.length)
                return false;
            const keyset2 = new Set([...keys, ...keys2]);
            return keyset2.size === keys.length && keys.every((key) => deepEqual(obj[key], obj2[key]));
        }
        return false;
    };
    const ref16 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "object" && data && !Array.isArray(data))) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(data.width !== undefined && hasOwn(data, "width"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/width" });
                errorCount++;
            }
            if (!(data.height !== undefined && hasOwn(data, "height"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/height" });
                errorCount++;
            }
            if (!(data.variants !== undefined && hasOwn(data, "variants"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/variants" });
                errorCount++;
            }
            if (data.width !== undefined && hasOwn(data, "width")) {
                if (!(typeof data.width === "number")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/width/type", instanceLocation: "#/width" });
                    errorCount++;
                }
                else {
                    if (!(1 <= data.width)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/width/minimum", instanceLocation: "#/width" });
                        errorCount++;
                    }
                    if (!(1000000 >= data.width)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/width/maximum", instanceLocation: "#/width" });
                        errorCount++;
                    }
                }
            }
            if (data.height !== undefined && hasOwn(data, "height")) {
                if (!(typeof data.height === "number")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/height/type", instanceLocation: "#/height" });
                    errorCount++;
                }
                else {
                    if (!(1 <= data.height)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/height/minimum", instanceLocation: "#/height" });
                        errorCount++;
                    }
                    if (!(1000000 >= data.height)) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/height/maximum", instanceLocation: "#/height" });
                        errorCount++;
                    }
                }
            }
            if (data.probability !== undefined && hasOwn(data, "probability")) {
                const err169 = validate.errors;
                const res169 = ref17(data.probability);
                const suberr178 = ref17.errors;
                validate.errors = err169;
                if (!res169) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr178.map(e => errorMerge(e, "#/properties/probability/$ref", "#/probability")));
                    errorCount++;
                }
            }
            if (data.rotate !== undefined && hasOwn(data, "rotate")) {
                const err170 = validate.errors;
                const res170 = ref18(data.rotate);
                const suberr179 = ref18.errors;
                validate.errors = err170;
                if (!res170) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr179.map(e => errorMerge(e, "#/properties/rotate/$ref", "#/rotate")));
                    errorCount++;
                }
            }
            if (data.scale !== undefined && hasOwn(data, "scale")) {
                const err171 = validate.errors;
                const res171 = ref19(data.scale);
                const suberr180 = ref19.errors;
                validate.errors = err171;
                if (!res171) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr180.map(e => errorMerge(e, "#/properties/scale/$ref", "#/scale")));
                    errorCount++;
                }
            }
            if (data.translate !== undefined && hasOwn(data, "translate")) {
                const err174 = validate.errors;
                const res174 = ref20(data.translate);
                const suberr183 = ref20.errors;
                validate.errors = err174;
                if (!res174) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr183.map(e => errorMerge(e, "#/properties/translate/$ref", "#/translate")));
                    errorCount++;
                }
            }
            if (data.variants !== undefined && hasOwn(data, "variants")) {
                if (!(typeof data.variants === "object" && data.variants && !Array.isArray(data.variants))) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/variants/type", instanceLocation: "#/variants" });
                    errorCount++;
                }
                else {
                    if (Object.keys(data.variants).length > 512) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/variants/maxProperties", instanceLocation: "#/variants" });
                        errorCount++;
                    }
                    for (const key21 of Object.keys(data.variants)) {
                        const err175 = validate.errors;
                        const res175 = ref7(key21);
                        const suberr184 = ref7.errors;
                        validate.errors = err175;
                        if (!res175) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push(...suberr184.map(e => errorMerge(e, "#/properties/variants/propertyNames/$ref", "#/variants/" + pointerPart(key21))));
                            errorCount++;
                        }
                    }
                    for (const key22 of Object.keys(data.variants)) {
                        if (!(typeof data.variants[key22] === "object" && data.variants[key22] && !Array.isArray(data.variants[key22]))) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/type", instanceLocation: "#/variants/" + pointerPart(key22) });
                            errorCount++;
                        }
                        else {
                            if (!(data.variants[key22].elements !== undefined && hasOwn(data.variants[key22], "elements"))) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/required", instanceLocation: "#/variants/" + pointerPart(key22) + "/elements" });
                                errorCount++;
                            }
                            if (data.variants[key22].elements !== undefined && hasOwn(data.variants[key22], "elements")) {
                                if (!(Array.isArray(data.variants[key22].elements))) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/properties/elements/type", instanceLocation: "#/variants/" + pointerPart(key22) + "/elements" });
                                    errorCount++;
                                }
                                else {
                                    if (data.variants[key22].elements.length > 1024) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/properties/elements/maxItems", instanceLocation: "#/variants/" + pointerPart(key22) + "/elements" });
                                        errorCount++;
                                    }
                                    for (let l = 0; l < data.variants[key22].elements.length; l++) {
                                        if (data.variants[key22].elements[l] !== undefined && hasOwn(data.variants[key22].elements, l)) {
                                            const err176 = validate.errors;
                                            const res176 = ref10(data.variants[key22].elements[l]);
                                            const suberr185 = ref10.errors;
                                            validate.errors = err176;
                                            if (!res176) {
                                                if (validate.errors === null)
                                                    validate.errors = [];
                                                validate.errors.push(...suberr185.map(e => errorMerge(e, "#/properties/variants/additionalProperties/properties/elements/items/$ref", "#/variants/" + pointerPart(key22) + "elements/" + l)));
                                                errorCount++;
                                            }
                                        }
                                    }
                                }
                            }
                            if (data.variants[key22].weight !== undefined && hasOwn(data.variants[key22], "weight")) {
                                if (!(typeof data.variants[key22].weight === "number")) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/properties/weight/type", instanceLocation: "#/variants/" + pointerPart(key22) + "/weight" });
                                    errorCount++;
                                }
                                else {
                                    if (!(0 <= data.variants[key22].weight)) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/properties/weight/minimum", instanceLocation: "#/variants/" + pointerPart(key22) + "/weight" });
                                        errorCount++;
                                    }
                                    if (!(1000000 >= data.variants[key22].weight)) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/properties/weight/maximum", instanceLocation: "#/variants/" + pointerPart(key22) + "/weight" });
                                        errorCount++;
                                    }
                                }
                            }
                            if (data.variants[key22].tags !== undefined && hasOwn(data.variants[key22], "tags")) {
                                if (!(Array.isArray(data.variants[key22].tags))) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/properties/tags/type", instanceLocation: "#/variants/" + pointerPart(key22) + "/tags" });
                                    errorCount++;
                                }
                                else {
                                    const prev15 = errorCount;
                                    if (data.variants[key22].tags.length > 32) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/properties/tags/maxItems", instanceLocation: "#/variants/" + pointerPart(key22) + "/tags" });
                                        errorCount++;
                                    }
                                    for (let m = 0; m < data.variants[key22].tags.length; m++) {
                                        if (data.variants[key22].tags[m] !== undefined && hasOwn(data.variants[key22].tags, m)) {
                                            if (!(typeof data.variants[key22].tags[m] === "string")) {
                                                if (validate.errors === null)
                                                    validate.errors = [];
                                                validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/properties/tags/items/type", instanceLocation: "#/variants/" + pointerPart(key22) + "tags/" + m });
                                                errorCount++;
                                            }
                                            else {
                                                const prev16 = errorCount;
                                                if (data.variants[key22].tags[m].length > 129 && stringLength(data.variants[key22].tags[m]) > 129) {
                                                    if (validate.errors === null)
                                                        validate.errors = [];
                                                    validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/properties/tags/items/maxLength", instanceLocation: "#/variants/" + pointerPart(key22) + "tags/" + m });
                                                    errorCount++;
                                                }
                                                if (errorCount === prev16) {
                                                    if (!(pattern15.test(data.variants[key22].tags[m]))) {
                                                        if (validate.errors === null)
                                                            validate.errors = [];
                                                        validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/properties/tags/items/pattern", instanceLocation: "#/variants/" + pointerPart(key22) + "tags/" + m });
                                                        errorCount++;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (errorCount === prev15) {
                                        if (!unique(data.variants[key22].tags)) {
                                            if (validate.errors === null)
                                                validate.errors = [];
                                            validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/properties/tags/uniqueItems", instanceLocation: "#/variants/" + pointerPart(key22) + "/tags" });
                                            errorCount++;
                                        }
                                    }
                                }
                            }
                            for (const key23 of Object.keys(data.variants[key22])) {
                                if (key23 !== "elements" && key23 !== "weight" && key23 !== "tags") {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/variants/additionalProperties/additionalProperties", instanceLocation: "#/variants/" + pointerPart(key22) + "/" + pointerPart(key23) });
                                    errorCount++;
                                }
                            }
                        }
                    }
                }
            }
            for (const key24 of Object.keys(data)) {
                if (key24 !== "width" && key24 !== "height" && key24 !== "probability" && key24 !== "rotate" && key24 !== "scale" && key24 !== "translate" && key24 !== "variants") {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key24) });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const ref22 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "object" && data && !Array.isArray(data))) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            if (!(data.extends !== undefined && hasOwn(data, "extends"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/extends" });
                errorCount++;
            }
            if (data.extends !== undefined && hasOwn(data, "extends")) {
                const err178 = validate.errors;
                const res178 = ref13(data.extends);
                const suberr187 = ref13.errors;
                validate.errors = err178;
                if (!res178) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr187.map(e => errorMerge(e, "#/properties/extends/$ref", "#/extends")));
                    errorCount++;
                }
            }
            for (const key25 of Object.keys(data)) {
                if (key25 !== "extends") {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key25) });
                    errorCount++;
                }
            }
        }
        return errorCount === 0;
    };
    const pattern16 = new RegExp("^#([a-fA-F0-9]{3}|[a-fA-F0-9]{4}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$", "u");
    const ref23 = function validate(data) {
        validate.errors = null;
        let errorCount = 0;
        if (!(typeof data === "string")) {
            if (validate.errors === null)
                validate.errors = [];
            validate.errors.push({ keywordLocation: "#/type", instanceLocation: "#" });
            errorCount++;
        }
        else {
            const prev17 = errorCount;
            if (data.length > 9 && stringLength(data) > 9) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/maxLength", instanceLocation: "#" });
                errorCount++;
            }
            if (errorCount === prev17) {
                if (!pattern16.test(data)) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/pattern", instanceLocation: "#" });
                    errorCount++;
                }
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
            if (!(data.canvas !== undefined && hasOwn(data, "canvas"))) {
                if (validate.errors === null)
                    validate.errors = [];
                validate.errors.push({ keywordLocation: "#/required", instanceLocation: "#/canvas" });
                errorCount++;
            }
            if (data["$id"] !== undefined && hasOwn(data, "$id")) {
                if (!(typeof data["$id"] === "string")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/$id/type", instanceLocation: "#/$id" });
                    errorCount++;
                }
                else {
                    if (data["$id"].length > 256 && stringLength(data["$id"]) > 256) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/$id/maxLength", instanceLocation: "#/$id" });
                        errorCount++;
                    }
                }
            }
            if (data["$schema"] !== undefined && hasOwn(data, "$schema")) {
                if (!(typeof data["$schema"] === "string")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/$schema/type", instanceLocation: "#/$schema" });
                    errorCount++;
                }
                else {
                    if (data["$schema"].length > 256 && stringLength(data["$schema"]) > 256) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/$schema/maxLength", instanceLocation: "#/$schema" });
                        errorCount++;
                    }
                }
            }
            if (data["$comment"] !== undefined && hasOwn(data, "$comment")) {
                if (!(typeof data["$comment"] === "string")) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/$comment/type", instanceLocation: "#/$comment" });
                    errorCount++;
                }
                else {
                    if (data["$comment"].length > 4096 && stringLength(data["$comment"]) > 4096) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/$comment/maxLength", instanceLocation: "#/$comment" });
                        errorCount++;
                    }
                }
            }
            if (data.meta !== undefined && hasOwn(data, "meta")) {
                if (!(typeof data.meta === "object" && data.meta && !Array.isArray(data.meta))) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/meta/type", instanceLocation: "#/meta" });
                    errorCount++;
                }
                else {
                    if (data.meta.license !== undefined && hasOwn(data.meta, "license")) {
                        if (!(typeof data.meta.license === "object" && data.meta.license && !Array.isArray(data.meta.license))) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push({ keywordLocation: "#/properties/meta/properties/license/type", instanceLocation: "#/meta/license" });
                            errorCount++;
                        }
                        else {
                            if (data.meta.license.name !== undefined && hasOwn(data.meta.license, "name")) {
                                if (!(typeof data.meta.license.name === "string")) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/meta/properties/license/properties/name/type", instanceLocation: "#/meta/license/name" });
                                    errorCount++;
                                }
                                else {
                                    if (data.meta.license.name.length > 128 && stringLength(data.meta.license.name) > 128) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/meta/properties/license/properties/name/maxLength", instanceLocation: "#/meta/license/name" });
                                        errorCount++;
                                    }
                                }
                            }
                            if (data.meta.license.url !== undefined && hasOwn(data.meta.license, "url")) {
                                const err0 = validate.errors;
                                const res0 = ref1(data.meta.license.url);
                                const suberr0 = ref1.errors;
                                validate.errors = err0;
                                if (!res0) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push(...suberr0.map(e => errorMerge(e, "#/properties/meta/properties/license/properties/url/$ref", "#/meta/license/url")));
                                    errorCount++;
                                }
                            }
                            if (data.meta.license.text !== undefined && hasOwn(data.meta.license, "text")) {
                                if (!(typeof data.meta.license.text === "string")) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/meta/properties/license/properties/text/type", instanceLocation: "#/meta/license/text" });
                                    errorCount++;
                                }
                                else {
                                    if (data.meta.license.text.length > 32768 && stringLength(data.meta.license.text) > 32768) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/meta/properties/license/properties/text/maxLength", instanceLocation: "#/meta/license/text" });
                                        errorCount++;
                                    }
                                }
                            }
                            for (const key0 of Object.keys(data.meta.license)) {
                                if (key0 !== "name" && key0 !== "url" && key0 !== "text") {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/meta/properties/license/additionalProperties", instanceLocation: "#/meta/license/" + pointerPart(key0) });
                                    errorCount++;
                                }
                            }
                        }
                    }
                    if (data.meta.creator !== undefined && hasOwn(data.meta, "creator")) {
                        if (!(typeof data.meta.creator === "object" && data.meta.creator && !Array.isArray(data.meta.creator))) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push({ keywordLocation: "#/properties/meta/properties/creator/type", instanceLocation: "#/meta/creator" });
                            errorCount++;
                        }
                        else {
                            if (data.meta.creator.name !== undefined && hasOwn(data.meta.creator, "name")) {
                                if (!(typeof data.meta.creator.name === "string")) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/meta/properties/creator/properties/name/type", instanceLocation: "#/meta/creator/name" });
                                    errorCount++;
                                }
                                else {
                                    if (data.meta.creator.name.length > 128 && stringLength(data.meta.creator.name) > 128) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/meta/properties/creator/properties/name/maxLength", instanceLocation: "#/meta/creator/name" });
                                        errorCount++;
                                    }
                                }
                            }
                            if (data.meta.creator.url !== undefined && hasOwn(data.meta.creator, "url")) {
                                const err1 = validate.errors;
                                const res1 = ref1(data.meta.creator.url);
                                const suberr1 = ref1.errors;
                                validate.errors = err1;
                                if (!res1) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push(...suberr1.map(e => errorMerge(e, "#/properties/meta/properties/creator/properties/url/$ref", "#/meta/creator/url")));
                                    errorCount++;
                                }
                            }
                            for (const key1 of Object.keys(data.meta.creator)) {
                                if (key1 !== "name" && key1 !== "url") {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/meta/properties/creator/additionalProperties", instanceLocation: "#/meta/creator/" + pointerPart(key1) });
                                    errorCount++;
                                }
                            }
                        }
                    }
                    if (data.meta.source !== undefined && hasOwn(data.meta, "source")) {
                        if (!(typeof data.meta.source === "object" && data.meta.source && !Array.isArray(data.meta.source))) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push({ keywordLocation: "#/properties/meta/properties/source/type", instanceLocation: "#/meta/source" });
                            errorCount++;
                        }
                        else {
                            if (data.meta.source.name !== undefined && hasOwn(data.meta.source, "name")) {
                                if (!(typeof data.meta.source.name === "string")) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/meta/properties/source/properties/name/type", instanceLocation: "#/meta/source/name" });
                                    errorCount++;
                                }
                                else {
                                    if (data.meta.source.name.length > 128 && stringLength(data.meta.source.name) > 128) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/meta/properties/source/properties/name/maxLength", instanceLocation: "#/meta/source/name" });
                                        errorCount++;
                                    }
                                }
                            }
                            if (data.meta.source.url !== undefined && hasOwn(data.meta.source, "url")) {
                                const err2 = validate.errors;
                                const res2 = ref1(data.meta.source.url);
                                const suberr2 = ref1.errors;
                                validate.errors = err2;
                                if (!res2) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push(...suberr2.map(e => errorMerge(e, "#/properties/meta/properties/source/properties/url/$ref", "#/meta/source/url")));
                                    errorCount++;
                                }
                            }
                            for (const key2 of Object.keys(data.meta.source)) {
                                if (key2 !== "name" && key2 !== "url") {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/meta/properties/source/additionalProperties", instanceLocation: "#/meta/source/" + pointerPart(key2) });
                                    errorCount++;
                                }
                            }
                        }
                    }
                    for (const key3 of Object.keys(data.meta)) {
                        if (key3 !== "license" && key3 !== "creator" && key3 !== "source") {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push({ keywordLocation: "#/properties/meta/additionalProperties", instanceLocation: "#/meta/" + pointerPart(key3) });
                            errorCount++;
                        }
                    }
                }
            }
            if (data.attributes !== undefined && hasOwn(data, "attributes")) {
                const err155 = validate.errors;
                const res155 = ref2(data.attributes);
                const suberr161 = ref2.errors;
                validate.errors = err155;
                if (!res155) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push(...suberr161.map(e => errorMerge(e, "#/properties/attributes/$ref", "#/attributes")));
                    errorCount++;
                }
            }
            if (data.canvas !== undefined && hasOwn(data, "canvas")) {
                if (!(typeof data.canvas === "object" && data.canvas && !Array.isArray(data.canvas))) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/canvas/type", instanceLocation: "#/canvas" });
                    errorCount++;
                }
                else {
                    if (!(data.canvas.elements !== undefined && hasOwn(data.canvas, "elements"))) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/canvas/required", instanceLocation: "#/canvas/elements" });
                        errorCount++;
                    }
                    if (!(data.canvas.width !== undefined && hasOwn(data.canvas, "width"))) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/canvas/required", instanceLocation: "#/canvas/width" });
                        errorCount++;
                    }
                    if (!(data.canvas.height !== undefined && hasOwn(data.canvas, "height"))) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/canvas/required", instanceLocation: "#/canvas/height" });
                        errorCount++;
                    }
                    if (data.canvas.elements !== undefined && hasOwn(data.canvas, "elements")) {
                        if (!Array.isArray(data.canvas.elements)) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push({ keywordLocation: "#/properties/canvas/properties/elements/type", instanceLocation: "#/canvas/elements" });
                            errorCount++;
                        }
                        else {
                            if (data.canvas.elements.length > 1024) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/properties/canvas/properties/elements/maxItems", instanceLocation: "#/canvas/elements" });
                                errorCount++;
                            }
                            for (let i = 0; i < data.canvas.elements.length; i++) {
                                if (data.canvas.elements[i] !== undefined && hasOwn(data.canvas.elements, i)) {
                                    const err167 = validate.errors;
                                    const res167 = ref10(data.canvas.elements[i]);
                                    const suberr175 = ref10.errors;
                                    validate.errors = err167;
                                    if (!res167) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push(...suberr175.map(e => errorMerge(e, "#/properties/canvas/properties/elements/items/$ref", "#/canvas/elements/" + i)));
                                        errorCount++;
                                    }
                                }
                            }
                        }
                    }
                    if (data.canvas.width !== undefined && hasOwn(data.canvas, "width")) {
                        if (!(typeof data.canvas.width === "number")) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push({ keywordLocation: "#/properties/canvas/properties/width/type", instanceLocation: "#/canvas/width" });
                            errorCount++;
                        }
                        else {
                            if (!(1 <= data.canvas.width)) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/properties/canvas/properties/width/minimum", instanceLocation: "#/canvas/width" });
                                errorCount++;
                            }
                            if (!(1000000 >= data.canvas.width)) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/properties/canvas/properties/width/maximum", instanceLocation: "#/canvas/width" });
                                errorCount++;
                            }
                        }
                    }
                    if (data.canvas.height !== undefined && hasOwn(data.canvas, "height")) {
                        if (!(typeof data.canvas.height === "number")) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push({ keywordLocation: "#/properties/canvas/properties/height/type", instanceLocation: "#/canvas/height" });
                            errorCount++;
                        }
                        else {
                            if (!(1 <= data.canvas.height)) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/properties/canvas/properties/height/minimum", instanceLocation: "#/canvas/height" });
                                errorCount++;
                            }
                            if (!(1000000 >= data.canvas.height)) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/properties/canvas/properties/height/maximum", instanceLocation: "#/canvas/height" });
                                errorCount++;
                            }
                        }
                    }
                    for (const key14 of Object.keys(data.canvas)) {
                        if (key14 !== "elements" && key14 !== "width" && key14 !== "height") {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push({ keywordLocation: "#/properties/canvas/additionalProperties", instanceLocation: "#/canvas/" + pointerPart(key14) });
                            errorCount++;
                        }
                    }
                }
            }
            if (data.components !== undefined && hasOwn(data, "components")) {
                if (!(typeof data.components === "object" && data.components && !Array.isArray(data.components))) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/components/type", instanceLocation: "#/components" });
                    errorCount++;
                }
                else {
                    if (Object.keys(data.components).length > 512) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/components/maxProperties", instanceLocation: "#/components" });
                        errorCount++;
                    }
                    for (const key15 of Object.keys(data.components)) {
                        const err168 = validate.errors;
                        const res168 = ref7(key15);
                        const suberr176 = ref7.errors;
                        validate.errors = err168;
                        if (!res168) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push(...suberr176.map(e => errorMerge(e, "#/properties/components/propertyNames/$ref", "#/components/" + pointerPart(key15))));
                            errorCount++;
                        }
                    }
                    for (const key16 of Object.keys(data.components)) {
                        let suberr177 = null;
                        const sub27 = (() => {
                            let errorCount = 0;
                            const err177 = validate.errors;
                            const res177 = ref16(data.components[key16]);
                            const suberr186 = ref16.errors;
                            validate.errors = err177;
                            if (!res177) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push(...suberr186.map(e => errorMerge(e, "#/properties/components/additionalProperties/anyOf/0/$ref", "#/components/" + pointerPart(key16))));
                                errorCount++;
                            }
                            return errorCount === 0;
                        })();
                        if (!sub27) {
                            const sub28 = (() => {
                                let errorCount = 0;
                                const err179 = validate.errors;
                                const res179 = ref22(data.components[key16]);
                                const suberr188 = ref22.errors;
                                validate.errors = err179;
                                if (!res179) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push(...suberr188.map(e => errorMerge(e, "#/properties/components/additionalProperties/anyOf/1/$ref", "#/components/" + pointerPart(key16))));
                                    errorCount++;
                                }
                                return errorCount === 0;
                            })();
                            if (!sub28) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/properties/components/additionalProperties/anyOf", instanceLocation: "#/components/" + pointerPart(key16) });
                                if (suberr177)
                                    validate.errors.push(...suberr177);
                                errorCount++;
                            }
                        }
                    }
                }
            }
            if (data.colors !== undefined && hasOwn(data, "colors")) {
                if (!(typeof data.colors === "object" && data.colors && !Array.isArray(data.colors))) {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/properties/colors/type", instanceLocation: "#/colors" });
                    errorCount++;
                }
                else {
                    if (Object.keys(data.colors).length > 512) {
                        if (validate.errors === null)
                            validate.errors = [];
                        validate.errors.push({ keywordLocation: "#/properties/colors/maxProperties", instanceLocation: "#/colors" });
                        errorCount++;
                    }
                    for (const key26 of Object.keys(data.colors)) {
                        const err180 = validate.errors;
                        const res180 = ref7(key26);
                        const suberr189 = ref7.errors;
                        validate.errors = err180;
                        if (!res180) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push(...suberr189.map(e => errorMerge(e, "#/properties/colors/propertyNames/$ref", "#/colors/" + pointerPart(key26))));
                            errorCount++;
                        }
                    }
                    for (const key27 of Object.keys(data.colors)) {
                        if (!(typeof data.colors[key27] === "object" && data.colors[key27] && !Array.isArray(data.colors[key27]))) {
                            if (validate.errors === null)
                                validate.errors = [];
                            validate.errors.push({ keywordLocation: "#/properties/colors/additionalProperties/type", instanceLocation: "#/colors/" + pointerPart(key27) });
                            errorCount++;
                        }
                        else {
                            if (!(data.colors[key27].values !== undefined && hasOwn(data.colors[key27], "values"))) {
                                if (validate.errors === null)
                                    validate.errors = [];
                                validate.errors.push({ keywordLocation: "#/properties/colors/additionalProperties/required", instanceLocation: "#/colors/" + pointerPart(key27) + "/values" });
                                errorCount++;
                            }
                            if (data.colors[key27].values !== undefined && hasOwn(data.colors[key27], "values")) {
                                if (!(Array.isArray(data.colors[key27].values))) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/colors/additionalProperties/properties/values/type", instanceLocation: "#/colors/" + pointerPart(key27) + "/values" });
                                    errorCount++;
                                }
                                else {
                                    if (data.colors[key27].values.length > 128) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/colors/additionalProperties/properties/values/maxItems", instanceLocation: "#/colors/" + pointerPart(key27) + "/values" });
                                        errorCount++;
                                    }
                                    if (data.colors[key27].values.length < 1) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/colors/additionalProperties/properties/values/minItems", instanceLocation: "#/colors/" + pointerPart(key27) + "/values" });
                                        errorCount++;
                                    }
                                    for (let n = 0; n < data.colors[key27].values.length; n++) {
                                        if (data.colors[key27].values[n] !== undefined && hasOwn(data.colors[key27].values, n)) {
                                            const err181 = validate.errors;
                                            const res181 = ref23(data.colors[key27].values[n]);
                                            const suberr190 = ref23.errors;
                                            validate.errors = err181;
                                            if (!res181) {
                                                if (validate.errors === null)
                                                    validate.errors = [];
                                                validate.errors.push(...suberr190.map(e => errorMerge(e, "#/properties/colors/additionalProperties/properties/values/items/$ref", "#/colors/" + pointerPart(key27) + "values/" + n)));
                                                errorCount++;
                                            }
                                        }
                                    }
                                }
                            }
                            if (data.colors[key27].notEqualTo !== undefined && hasOwn(data.colors[key27], "notEqualTo")) {
                                if (!(Array.isArray(data.colors[key27].notEqualTo))) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/colors/additionalProperties/properties/notEqualTo/type", instanceLocation: "#/colors/" + pointerPart(key27) + "/notEqualTo" });
                                    errorCount++;
                                }
                                else {
                                    if (data.colors[key27].notEqualTo.length > 64) {
                                        if (validate.errors === null)
                                            validate.errors = [];
                                        validate.errors.push({ keywordLocation: "#/properties/colors/additionalProperties/properties/notEqualTo/maxItems", instanceLocation: "#/colors/" + pointerPart(key27) + "/notEqualTo" });
                                        errorCount++;
                                    }
                                    for (let o = 0; o < data.colors[key27].notEqualTo.length; o++) {
                                        if (data.colors[key27].notEqualTo[o] !== undefined && hasOwn(data.colors[key27].notEqualTo, o)) {
                                            const err182 = validate.errors;
                                            const res182 = ref6(data.colors[key27].notEqualTo[o]);
                                            const suberr191 = ref6.errors;
                                            validate.errors = err182;
                                            if (!res182) {
                                                if (validate.errors === null)
                                                    validate.errors = [];
                                                validate.errors.push(...suberr191.map(e => errorMerge(e, "#/properties/colors/additionalProperties/properties/notEqualTo/items/$ref", "#/colors/" + pointerPart(key27) + "notEqualTo/" + o)));
                                                errorCount++;
                                            }
                                        }
                                    }
                                }
                            }
                            if (data.colors[key27].contrastTo !== undefined && hasOwn(data.colors[key27], "contrastTo")) {
                                const err183 = validate.errors;
                                const res183 = ref6(data.colors[key27].contrastTo);
                                const suberr192 = ref6.errors;
                                validate.errors = err183;
                                if (!res183) {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push(...suberr192.map(e => errorMerge(e, "#/properties/colors/additionalProperties/properties/contrastTo/$ref", "#/colors/" + pointerPart(key27) + "/contrastTo")));
                                    errorCount++;
                                }
                            }
                            for (const key28 of Object.keys(data.colors[key27])) {
                                if (key28 !== "values" && key28 !== "notEqualTo" && key28 !== "contrastTo") {
                                    if (validate.errors === null)
                                        validate.errors = [];
                                    validate.errors.push({ keywordLocation: "#/properties/colors/additionalProperties/additionalProperties", instanceLocation: "#/colors/" + pointerPart(key27) + "/" + pointerPart(key28) });
                                    errorCount++;
                                }
                            }
                        }
                    }
                }
            }
            for (const key29 of Object.keys(data)) {
                if (key29 !== "$id" && key29 !== "$schema" && key29 !== "$comment" && key29 !== "meta" && key29 !== "attributes" && key29 !== "canvas" && key29 !== "components" && key29 !== "colors") {
                    if (validate.errors === null)
                        validate.errors = [];
                    validate.errors.push({ keywordLocation: "#/additionalProperties", instanceLocation: "#/" + pointerPart(key29) });
                    errorCount++;
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
export class StyleValidator {
    static validate(data) {
        if (!validate(data)) {
            throw new StyleValidationError((validate.errors ?? []).map(toDetail));
        }
    }
}
