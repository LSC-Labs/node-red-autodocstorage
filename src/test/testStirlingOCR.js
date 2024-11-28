import FS from "fs";
import { Blob } from "buffer";
import PATH from "path";
import { readFile } from "node:fs/promises";
import fetch from "node-fetch";
import { CStirlingService } from "../services/StirlingServiceV1.js";

// import { lookup } from "mime-types";
// import FormData from 'form-data';

const strTestNativePDF = "c:\\temp\\Autodoc-Test-native.pdf"
const strTestFilePDF = "c:\\temp\\Autodoc-Test.pdf";


function storeFile(oData) {
    console.log("RESULT (storeFile):")
    console.log("=======================================================");
    FS.writeFileSync("c:\\temp\\out.pdf",Buffer.from(oData));
}


let oStirlingService = new CStirlingService("http://papa-nas:9080");
oStirlingService.TraceMode = true;

// oStirlingService.enrichWithText(strTestNativePDF,null, storeFile);

oStirlingService.enrichWithTextAsync(strTestNativePDF, storeFile).then(oData => {
    console.log("ASYNC:");
    storeFile(oData);
});
