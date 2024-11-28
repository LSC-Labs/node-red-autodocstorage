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

const strServiceAddress = "http://papa-nas:9080/api/v1/convert/pdf/text";


function showResult(strData) {
    console.log("RESULT:")
    console.log("=======================================================");
    // console.log(strData);
    console.log("=======================================================");

}

let oStirlingService = new CStirlingService("http://papa-nas:9080");
oStirlingService.TraceMode = true;
// oStirlingService.getTextOf(strTestFilePDF,null,showResult);

oStirlingService.getTextOfAsync(strTestFilePDF,null).then(strData => {
    console.log("Async RESULT:")
    console.log("=======================================================");
    console.log(strData);
    console.log("=======================================================");

});


