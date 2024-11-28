"use strict";
// @ts-check
/**
 * Stirling Service for Node Red
 *
 * (c) 2024 LSC-Labs - P.Liebl
 *
 * Offers functionality to call the Stirling Web API's with callback functions
 * via the class CStirlingService(strAddressOfService)
 *
 * If a call to a service fails, a "Error" will be thrown, so ensure to catch them.
 * Otherwise the result will be delivered via the call back funcition of.
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CStirlingService = exports.ColorMode = exports.FitPageMode = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// import fetch from "node-fetch";
import("node-fetch");
const REST_API_INFO_OF_PDF = "api/v1/security/get-info-on-pdf";
const REST_API_TEXT_OF_PDF = "api/v1/convert/pdf/text";
const REST_API_PDF_WITH_OCR = "api/v1/misc/ocr-pdf";
const REST_API_PDF_FROM_PIC = "api/v1/convert/img/pdf";
var FitPageMode;
(function (FitPageMode) {
    FitPageMode["fillPage"] = "fillPage";
    FitPageMode["fillDocumentToImage"] = "fillDocumentToImage";
    FitPageMode["maintainAspectRatio"] = "maintainAspectRatio";
})(FitPageMode || (exports.FitPageMode = FitPageMode = {}));
var ColorMode;
(function (ColorMode) {
    ColorMode["color"] = "color";
    ColorMode["greyscale"] = "greyscale";
    ColorMode["blackwithe"] = "blackwithe";
})(ColorMode || (exports.ColorMode = ColorMode = {}));
/**
 * The Stirling Service Class
 * Offers the functionality of Stirling Service
 */
class CStirlingService {
    TraceMode = false;
    ServiceAddress;
    StartTime;
    ContextLog;
    /**
     *
     */
    constructor(strAddress, bTraceMode, pContextLog) {
        this.ServiceAddress = strAddress;
        if (bTraceMode != undefined)
            this.TraceMode = bTraceMode;
        this.ContextLog = pContextLog;
        this.trace("Trace mode for Stirling Service enabled");
    }
    // #region Trace, Services, logging and timers
    trace(oData) {
        if (this.TraceMode == true) {
            if (typeof oData === 'string') {
                console.log(`[T] StirlingService(${this.ServiceAddress}) : ` + oData);
            }
            else {
                console.log(oData);
            }
        }
    }
    log(oData) {
        if (this.ContextLog)
            this.ContextLog.log(oData);
        this.trace(oData);
    }
    error(oData) {
        if (this.ContextLog)
            this.ContextLog.error(oData);
        this.trace(oData);
    }
    startServiceTimer() {
        this.StartTime = Date.now();
    }
    stopServiceTimer() {
        let oEndTime = Date.now();
        if (this.StartTime) {
            const timeInSeconds = (oEndTime - this.StartTime) / 1000; // Convert to seconds
            this.trace(` - service execution time: ${timeInSeconds} seconds`);
        }
    }
    getFileNameToSend(strFileName, nPos) {
        let strName = "new file";
        let nPosition = nPos ?? 0;
        if (typeof strFileName === 'string')
            strName = strFileName;
        else {
            if (strFileName.length >= nPosition)
                strName = strFileName[nPosition];
        }
        return (strName);
    }
    /**
     * Workhorse to call the Sterling Service
     * @param {string} strAddress Address of the Rest API
     * @param {*} strFileName Filename to be read (must be set to a valid name) or an array of filenames i.E. for Image to pdf call
     * @param {*} tElementList Elements will be set in body key / values
     * @param {*} oFileContent if not defined, content will be read from strFileName, otherwise, this is the content of the file (single file only)
     * @returns
     */
    async callSterlingService(strAddress, strFileName, tElementList, oFileContent) {
        let oAddressURL = new URL(strAddress);
        this.trace(" - preparing Stirling service call : " + strAddress);
        let oFormData = new FormData();
        if (strFileName) {
            // Ein einfaches object to send...
            if (typeof strFileName === 'string') {
                this.trace(" -> adding fileInput: " + strFileName);
                if (!oFileContent)
                    oFileContent = fs_1.default.readFileSync(strFileName);
                oFormData.append("fileInput", new File([oFileContent], path_1.default.basename(this.getFileNameToSend(strFileName))));
            }
            else {
                // it is an array (typeof 'object')
                for (let nIdx = 0; nIdx < strFileName.length; nIdx++) {
                    this.trace(" -> adding fileInput: " + strFileName[nIdx]);
                    let oContent = fs_1.default.readFileSync(strFileName[nIdx]);
                    oFormData.append("fileInput", new File([oContent], path_1.default.basename(strFileName[nIdx])));
                }
            }
        }
        if (tElementList) {
            for (let strElementName in tElementList) {
                this.trace(" - adding " + strElementName + " == " + tElementList[strElementName]);
                oFormData.append(strElementName, tElementList[strElementName]);
            }
        }
        this.log(" - calling service : " + strAddress);
        this.startServiceTimer();
        return fetch(strAddress, {
            method: "POST",
            headers: {
                "Host": oAddressURL.hostname,
                "Accept": "*/*"
            },
            body: oFormData
        });
    }
    // #endregion
    // #region Extract Text functions
    /**
     * get the text of the file (if available)
     * @param {string} strFileName the name of the file to be processed
     * @param {*} oOptions
     * @param {*} funcCallBack call back function takes one parameter func(string)
     * @param {Buffer} oFileContent if set, this is the file content, do not read from strFileName (!)
     */
    getTextOf(strFileName, oOptions, funcCallBack, oFileContent) {
        this.trace(`getTextOf(${strFileName})`);
        if (!oOptions)
            oOptions = {};
        if (funcCallBack) {
            this.callSterlingService(this.ServiceAddress + "/" + REST_API_TEXT_OF_PDF, strFileName, {
                "outputFormat": oOptions.outputFormat ?? "txt"
            }, oFileContent).then(oResponse => {
                oResponse.text().then(strData => { this.stopServiceTimer(); funcCallBack(strData); });
            }).catch(oError => {
                console.log("[E] getTextOf()" + oError);
                this.error(oError);
                funcCallBack("");
            });
        }
    }
    /**
     * Async version of getTextOf
     * @param {string} strFileName the name of the file to be processed
     * @param {*} oOptions
     * @param {Buffer} oFileContent if set, this is the file content, do not read from strFileName (!)
     * @returns
     */
    async getTextOfAsync(strFileName, oOptions, oFileContent) {
        this.trace(`getTextOf(${strFileName})`);
        if (!oOptions)
            oOptions = {};
        let oResult = await this.callSterlingService(this.ServiceAddress + "/" + REST_API_TEXT_OF_PDF, strFileName, {
            "outputFormat": oOptions.outputFormat ?? "txt"
        }, oFileContent).then(oResponse => {
            this.stopServiceTimer();
            return (oResponse.text());
        }).catch(oError => {
            console.log("[E] getTextOfAsync()" + oError);
            console.log(oError);
            return ("");
        });
        return (oResult);
    }
    // #endregion
    // #region OCR processing functions
    /**
     * enrich the document with OCR text
     * @param {string} strFileName the name of the file to be processed
     * @param {*} oOptions
     * @param {*} funcCallBack call back function takes one parameter func(string)
     * @param {Buffer} oFileContent if set, this is the file content, do not read from strFileName (!)
     */
    enrichWithText(strFileName, oOptions, funcCallBack, oFileContent) {
        this.trace(`enrichWithText('${strFileName}')`);
        if (!oOptions)
            oOptions = {};
        if (funcCallBack) {
            this.callSterlingService(this.ServiceAddress + "/" + REST_API_PDF_WITH_OCR, strFileName, {
                "languages": oOptions.languages ? JSON.stringify(oOptions.languages) : "deu,eng",
                "ocrType": oOptions.ocrType ? oOptions.ocerType : "force-ocr",
                "ocrRenderType": oOptions.ocrRenderType ?? "hocr",
                "sidecar": oOptions.sidecar ?? false,
                "deskew": oOptions.deskew ?? false,
                "clean": oOptions.clean ?? false,
                "cleanFinal": oOptions.cleanFinal ?? false,
                "removeImagesAfter": oOptions.removeImagesAfter ?? false,
            }, oFileContent).then(oResponse => {
                this.stopServiceTimer();
                oResponse.arrayBuffer().then(oData => {
                    funcCallBack(oData);
                });
            }).catch(oError => {
                this.ContextLog?.error(oError);
            });
        }
    }
    /**
     * enrich the document with OCR text
     * @param {string} strFileName the name of the file to be processed
     * @param {*} oOptions
     * @param {Buffer} oFileContent if set, this is the file content, do not read from strFileName (!)
     */
    async enrichWithTextAsync(strFileName, oOptions, oFileContent) {
        this.trace(`enrichWithTextAsync('${strFileName}')`);
        if (!oOptions)
            oOptions = {};
        let oResult = await this.callSterlingService(this.ServiceAddress + "/" + REST_API_PDF_WITH_OCR, strFileName, {
            "languages": oOptions.languages ? JSON.stringify(oOptions.languages) : "deu,eng",
            "ocrType": oOptions.ocrType ? oOptions.ocerType : "force-ocr",
            "ocrRenderType": oOptions.ocrRenderType ?? "hocr",
            "sidecar": oOptions.sidecar ?? false,
            "deskew": oOptions.deskew ?? false,
            "clean": oOptions.clean ?? false,
            "cleanFinal": oOptions.cleanFinal ?? false,
            "removeImagesAfter": oOptions.removeImagesAfter ?? false,
        }, oFileContent).then(oResponse => {
            this.stopServiceTimer();
            return (oResponse.arrayBuffer());
        });
        return (oResult);
    }
    // #endregion
    // #region Meta informations
    getMetaInfoOf(strFileName, oOptions, funcCallBack, oFileContent) {
        this.trace(`getMetaInfoOf('${strFileName}')`);
        if (!oOptions)
            oOptions = {};
        if (funcCallBack) {
            this.callSterlingService(this.ServiceAddress + "/" + REST_API_INFO_OF_PDF, strFileName, {}, oFileContent).then(oResponse => {
                oResponse.json().then(oData => {
                    this.stopServiceTimer();
                    funcCallBack(oData);
                });
            }).catch(oError => {
                console.log(`[E] getMetaInfoOf(): ${oError}`);
                funcCallBack("{}");
            });
        }
    }
    async getMetaInfoOfAsync(strFileName, oOptions, oFileContent) {
        this.trace(`getMetaInfoOfAsync('${strFileName}')`);
        if (!oOptions)
            oOptions = {};
        let oResult = await this.callSterlingService(this.ServiceAddress + "/" + REST_API_INFO_OF_PDF, strFileName, oOptions, oFileContent).then(oResponse => {
            this.stopServiceTimer();
            return (oResponse.json());
        });
        return (oResult);
    }
    // #endregion
    buildFromPictures(strFileNames, oOptions, funcCallBack, oFileContent) {
        this.trace(`buildFromPicture(${strFileNames})`);
        if (!oOptions)
            oOptions = {};
        if (funcCallBack) {
            this.callSterlingService(this.ServiceAddress + "/" + REST_API_PDF_FROM_PIC, strFileNames, oOptions, oFileContent).then(oResponse => {
                this.stopServiceTimer();
                oResponse.arrayBuffer().then(oData => {
                    funcCallBack(oData);
                });
            }).catch(oError => {
                this.ContextLog?.error(oError);
            });
        }
    }
    async buildFromPicturesAsync(strFileNames, oOptions, oFileContent) {
        this.trace(`buildFromPictureAsync(${strFileNames})`);
        if (!oOptions)
            oOptions = {};
        let oResult = await this.callSterlingService(this.ServiceAddress + "/" + REST_API_PDF_FROM_PIC, strFileNames, {
            fitOption: oOptions.fitOption ?? FitPageMode.fillPage,
            colorType: oOptions.colorType ?? ColorMode.color,
            autoRotate: oOptions.autoRotate ?? true,
        }, oFileContent).then(oResponse => {
            this.stopServiceTimer();
            return (oResponse.arrayBuffer());
        });
        return (oResult);
    }
}
exports.CStirlingService = CStirlingService;
//# sourceMappingURL=StirlingServiceV1.js.map