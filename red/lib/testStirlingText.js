"use strict";
// @ts-check
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
// import { lookup } from "mime-types";
// import FormData from 'form-data';
const strTestNativePDF = "c:\\temp\\Autodoc-Test-native.pdf";
const strTestFilePDF = "c:\\temp\\Autodoc-Test.pdf";
const strAddress = "http://papa-nas:9080/api/v1/convert/pdf/text";
let oStartTime = Date.now();
console.log("calling service getText()....");
function uploadFile(strAddress, strFileName) {
    return __awaiter(this, void 0, void 0, function* () {
        let oAddressURL = new URL(strAddress);
        const oFileContent = fs_1.default.readFileSync(strFileName);
        const oFile = new File();
        console.log("Creating form-data");
        let oFormData = new FormData();
        oFormData.append("fileInput", path_1.default.basename(strFileName));
        oFormData.append("outputFormat", "txt");
        console.log("...calling service");
        return (0, node_fetch_1.default)(strAddress, {
            method: "POST",
            headers: {
                "Host": oAddressURL.hostname,
                "Accept": "*/*"
            },
            body: oFormData
        });
    });
}
// fetch(strAddress,oRequestData)
uploadFile(strAddress, strTestFilePDF)
    .then(oResponse => {
    console.log("Received from call:");
    console.log(oResponse);
    if (!oResponse.ok) {
        console.log("ERROR");
        console.log("see trace log...");
        throw oResponse;
    }
    return (oResponse);
})
    .then(response => response.text())
    .then(oData => {
    console.log("Back from enrich with text : " + strTestFilePDF);
    console.log("=======================================================");
    console.log(oData);
    let strTargetFile = strTestFilePDF + ".txt";
    console.log("Writing buffer to file...");
    fs_1.default.writeFileSync(strTargetFile, oData);
})
    .catch(error => {
    console.error('Error:', error.status + " -> " + error.statusText);
});
const oEndTime = Date.now(); // End time in milliseconds
const timeInSeconds = (oEndTime - oStartTime) / 1000; // Convert to seconds
console.log(`Execution time: ${timeInSeconds} seconds`);
//# sourceMappingURL=testStirlingText.js.map