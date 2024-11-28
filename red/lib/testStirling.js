"use strict";
// @ts-check
Object.defineProperty(exports, "__esModule", { value: true });
const StirlingService_1 = require("./LSC/StirlingService");
const FS = require("fs");
const oStirlingService = new StirlingService_1.CStirlingService("http://papa-nas:9080");
const strTestNativePDF = "c:\\temp\\Autodoc-Test-native.pdf";
const strTestFilePDF = "c:\\temp\\Autodoc-Test.pdf";
oStirlingService.TraceMode = true;
try {
    console.log("Calling 'Enrich with text' ...");
    console.log("------------------------------");
    let oOptions = {
        sidecar: false,
        deskew: false,
        ocrType: StirlingService_1.OCRType["force-ocr"],
        clean: false,
        cleanFinal: false,
        removeImagesAfter: false
    };
    let oStartTime = Date.now();
    oStirlingService.enrichWithText(strTestNativePDF, oOptions, (oData) => {
        console.log("Back from enrich with text : " + strTestNativePDF + "  " + oData.length + "(bytes)");
        console.log("=======================================================");
        let strTargetFile = strTestNativePDF + "-enriched.pdf";
        console.log("Writing buffer to file...");
        FS.writeFileSync(strTargetFile, oData);
        console.log("done, " + oData.length + " bytes written to :" + strTargetFile);
        const oEndTime = Date.now(); // End time in milliseconds
        const timeInSeconds = (oEndTime - oStartTime) / 1000; // Convert to seconds
        console.log(`Execution time: ${timeInSeconds} seconds`);
    });
}
catch (ex) {
    console.log("Exception occured:" + ex);
    console.log(ex);
}
console.log("Calling 'Query Meta Info' ...");
console.log("------------------------------");
oStirlingService.getMetaInfoOf(strTestFilePDF, (strData) => {
    console.log("Back from query Meta Infos of : " + strTestFilePDF);
    console.log("=======================================================");
    console.log(strData);
});
console.log("Calling 'Extract Text' ...");
console.log("------------------------------");
oStirlingService.getTextOf(strTestFilePDF, null, (strData) => {
    console.log("Back from query Text of : " + strTestFilePDF);
    console.log("=======================================================");
    console.log(" Length of result: " + strData.length);
    let strCheck = "";
    for (let i = 0; i < 10; i++) {
        if (i < strData.length) {
            let nAsciiCode = strData.charCodeAt(i);
            strCheck += "0x" + nAsciiCode.toString(16);
            strCheck += " (" + (nAsciiCode < 9 ? "err" : "ok") + ") ";
        }
    }
    console.log("Checking first characters of string: " + strCheck);
    //    console.log(strData);
});
//# sourceMappingURL=testStirling.js.map