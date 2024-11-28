"use strict";
// @ts-check
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const StirlingService_1 = require("./LSC/StirlingService");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const form_data_1 = __importDefault(require("form-data"));
const oStirlingService = new StirlingService_1.CStirlingService("http://papa-nas:9080");
const strTestNativePDF = "c:\\temp\\Autodoc-Test-native.pdf";
const strTestFilePDF = "c:\\temp\\Autodoc-Test.pdf";
oStirlingService.TraceMode = true;
const strAddress = "http://papa-nas:9080/api/v1/misc/ocr-pdf";
const oAddressURL = new URL(strAddress);
function buildHeaders(strAddress) {
    const oURL = new URL(strAddress);
    const oHeaders = new Headers();
    oHeaders.set('Accept', '*/*');
    oHeaders.set('Content-Type', "multipart/form-data"),
        oHeaders.set('Host', oURL.hostname);
    return (oHeaders);
}
function getPayload(strFileName, strOutputName) {
    if (!strOutputName)
        strOutputName = strFileName;
    const oPayload = new form_data_1.default();
    oPayload.append("fileInput", fs_1.default.createReadStream(strFileName), path_1.default.basename(strOutputName));
    oPayload.append("languages", "deu, eng");
    oPayload.append("ocrType", "force-ocr");
    oPayload.append("ocrRenderType", "hocr");
    oPayload.append("sidecar", "false");
    oPayload.append("deskew", "false");
    oPayload.append("clean", "false");
    oPayload.append("cleanFinal", "false");
    oPayload.append("removeImagesAfter", "false");
    return (oPayload);
}
let oPayload = new form_data_1.default();
oPayload.append("fileInput", fs_1.default.createReadStream(strTestNativePDF), path_1.default.basename(strTestNativePDF));
oPayload.append("languages", "deu,eng");
oPayload.append("sidecar", "false");
oPayload.append("deskew", "false");
oPayload.append("clean", "false");
oPayload.append("cleanFinal", "false");
oPayload.append("ocrType", "force-ocr");
oPayload.append("ocrRenderType", "hocr");
oPayload.append("removeImagesAfter", "false");
let oHeaders = new Headers();
oHeaders.set('Accept', '*/*');
// oHeaders.set('Content-Type',"multipart/form-data"),
oHeaders.set('Host', oAddressURL.hostname);
const oRequest = new Request(strAddress, {
    method: 'POST',
    cache: 'reload',
    headers: oPayload.getHeaders({
        "Host": oAddressURL.hostname,
        "Accept": '*/*'
    }),
    body: JSON.stringify(oPayload)
});
let oStartTime = Date.now();
console.log("calling service....");
console.log("Headers:");
console.log("================");
console.log(oRequest.headers);
fetch(strAddress, oRequest)
    .then(oResponse => {
    console.log("Received from call:");
    console.log(oResponse);
    if (!oResponse.ok) {
        console.log("ERROR");
        throw oResponse;
    }
    return (oResponse);
})
    .then(response => response.arrayBuffer())
    .then(oData => {
    console.log("Back from enrich with text : " + strTestNativePDF);
    console.log("=======================================================");
    console.log(oData);
    let strTargetFile = strTestNativePDF + "-enriched.pdf";
    console.log("Writing buffer to file...");
    fs_1.default.writeFileSync(strTargetFile, new Buffer(oData));
})
    .catch(error => {
    console.error('Error:', error.status + " -> " + error.statusText);
});
const oEndTime = Date.now(); // End time in milliseconds
const timeInSeconds = (oEndTime - oStartTime) / 1000; // Convert to seconds
console.log(`Execution time: ${timeInSeconds} seconds`);
//# sourceMappingURL=testStirlingOCR.js.map