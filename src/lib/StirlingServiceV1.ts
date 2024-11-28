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


import FS  from "fs";
import  PATH from "path";
import { IContextLog}  from "./AutoDocInterfacesV1";

// import fetch from "node-fetch";
import("node-fetch");

const REST_API_INFO_OF_PDF = "api/v1/security/get-info-on-pdf";
const REST_API_TEXT_OF_PDF = "api/v1/convert/pdf/text";
const REST_API_PDF_WITH_OCR = "api/v1/misc/ocr-pdf";
const REST_API_PDF_FROM_PIC = "api/v1/convert/img/pdf";

export enum FitPageMode {
    fillPage = "fillPage",
    fillDocumentToImage = "fillDocumentToImage",
    maintainAspectRatio = "maintainAspectRatio",
}

export enum ColorMode {
    color = "color",
    greyscale = "greyscale",
    blackwithe = "blackwithe"
}



/**
 * The Stirling Service Class
 * Offers the functionality of Stirling Service
 */
export class CStirlingService {
    TraceMode = false;
    ServiceAddress;
    StartTime:number|undefined;
    ContextLog?:IContextLog;
    /**
     *
     */
    constructor(strAddress:string, bTraceMode:boolean,pContextLog?:IContextLog|undefined) {
        this.ServiceAddress = strAddress;
        if(bTraceMode != undefined) this.TraceMode = bTraceMode;
        this.ContextLog = pContextLog;
        this.trace("Trace mode for Stirling Service enabled");
    }

    // #region Trace, Services, logging and timers
    trace(oData:any) {
        if (this.TraceMode == true) {
            if (typeof oData === 'string') {
                console.log(`[T] StirlingService(${this.ServiceAddress}) : ` + oData);
            }
            else {
                console.log(oData);
            }
        } 

    }

    log(oData:any) {
        if(this.ContextLog) this.ContextLog.log(oData);
        this.trace(oData);
    }
    error(oData:any) {
        if(this.ContextLog) this.ContextLog.error(oData);
        this.trace(oData);
    }


    startServiceTimer() {
        this.StartTime = Date.now();
    }

    stopServiceTimer() {
        let oEndTime = Date.now();
        if(this.StartTime) {
            const timeInSeconds = (oEndTime - this.StartTime) / 1000; // Convert to seconds
            this.trace(` - service execution time: ${timeInSeconds} seconds`);
        }
    }

    private getFileNameToSend(strFileName:string|string[], nPos?:number) : string {
        let strName = "new file";
        let nPosition = nPos ?? 0;
        if(typeof strFileName === 'string') strName = strFileName;
        else {
            if(strFileName.length >= nPosition) strName = strFileName[nPosition];
        }
        return(strName);
    }

    /**
     * Workhorse to call the Sterling Service
     * @param {string} strAddress Address of the Rest API
     * @param {*} strFileName Filename to be read (must be set to a valid name) or an array of filenames i.E. for Image to pdf call
     * @param {*} tElementList Elements will be set in body key / values
     * @param {*} oFileContent if not defined, content will be read from strFileName, otherwise, this is the content of the file (single file only)
     * @returns 
     */
    async callSterlingService(strAddress:string, strFileName:string|string[], tElementList:any, oFileContent:any) {
        let oAddressURL = new URL(strAddress);
        this.trace(" - preparing Stirling service call : " + strAddress)
        let oFormData = new FormData();
        if(strFileName) {
            // Ein einfaches object to send...
            if(typeof strFileName === 'string') {
                this.trace(" -> adding fileInput: " + strFileName)
                if(!oFileContent) oFileContent = FS.readFileSync(strFileName);
                oFormData.append("fileInput", new File([oFileContent] ,PATH.basename(this.getFileNameToSend(strFileName))));
            } else {
                // it is an array (typeof 'object')
                for(let nIdx = 0; nIdx < strFileName.length; nIdx++) {
                    this.trace(" -> adding fileInput: " + strFileName[nIdx])
                    let oContent = FS.readFileSync(strFileName[nIdx]);
                    oFormData.append("fileInput", new File([oContent],PATH.basename(strFileName[nIdx])));
                }
            }
        }

        if(tElementList) {
            for(let strElementName in tElementList) {
                this.trace(" - adding " + strElementName + " == " + tElementList[strElementName]);
                oFormData.append(strElementName,tElementList[strElementName])
            }
        }
        this.log(" - calling service : " + strAddress)
        this.startServiceTimer();
        return fetch(strAddress, 
         {
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
    public getTextOf(strFileName:string, oOptions:any, funcCallBack:any, oFileContent?:any) {
        this.trace(`getTextOf(${strFileName})`);
        if (!oOptions) oOptions = {};
        if(funcCallBack) {
            this.callSterlingService(
                this.ServiceAddress + "/" + REST_API_TEXT_OF_PDF,
                strFileName,
                {
                    "outputFormat": oOptions.outputFormat ?? "txt"
                },
                oFileContent
            ).then(oResponse => {
                oResponse.text().then(strData => { this.stopServiceTimer(); funcCallBack(strData) });
                }
            ).catch(oError => {
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
    public async getTextOfAsync(strFileName:string, oOptions:any, oFileContent?:any) : Promise<string> {
        this.trace(`getTextOf(${strFileName})`);
        if (!oOptions) oOptions = {};
        let oResult = await this.callSterlingService(
            this.ServiceAddress + "/" + REST_API_TEXT_OF_PDF,
            strFileName,
            {
                "outputFormat": oOptions.outputFormat ?? "txt"
            },
            oFileContent
        ).then(oResponse => {
            this.stopServiceTimer(); 
            return(oResponse.text())
        }).catch(oError => {
            console.log("[E] getTextOfAsync()" + oError);
            console.log(oError);
            return("");
        });

        return(oResult);
        
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
    public enrichWithText(strFileName:string, oOptions:any, funcCallBack:any, oFileContent?:any) {
        this.trace(`enrichWithText('${strFileName}')`);
        if (!oOptions) oOptions = {};
        if(funcCallBack) {
            this.callSterlingService(
                this.ServiceAddress + "/" + REST_API_PDF_WITH_OCR,
                strFileName,
                {
                    "languages"         : oOptions.languages ? JSON.stringify(oOptions.languages) : "deu,eng",
                    "ocrType"           : oOptions.ocrType ? oOptions.ocerType : "force-ocr",
                    "ocrRenderType"     : oOptions.ocrRenderType ?? "hocr",
                    "sidecar"           : oOptions.sidecar ?? false,
                    "deskew"            : oOptions.deskew ?? false,
                    "clean"             : oOptions.clean ?? false,
                    "cleanFinal"        : oOptions.cleanFinal ?? false,
                    "removeImagesAfter" : oOptions.removeImagesAfter ?? false,

                },
                oFileContent
            ).then(oResponse => {
                this.stopServiceTimer();
                oResponse.arrayBuffer().then(oData => { 
                    funcCallBack(oData); 
                });
            }).catch(oError =>  {
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
    public async enrichWithTextAsync(strFileName:string, oOptions?:any, oFileContent?:any) {
        this.trace(`enrichWithTextAsync('${strFileName}')`);
        if (!oOptions) oOptions = {};
        let oResult = await this.callSterlingService(
            this.ServiceAddress + "/" + REST_API_PDF_WITH_OCR,
            strFileName,
            {
                "languages"         : oOptions.languages ? JSON.stringify(oOptions.languages) : "deu,eng",
                "ocrType"           : oOptions.ocrType ? oOptions.ocerType : "force-ocr",
                "ocrRenderType"     : oOptions.ocrRenderType ?? "hocr",
                "sidecar"           : oOptions.sidecar ?? false,
                "deskew"            : oOptions.deskew ?? false,
                "clean"             : oOptions.clean ?? false,
                "cleanFinal"        : oOptions.cleanFinal ?? false,
                "removeImagesAfter" : oOptions.removeImagesAfter ?? false,
            },
            oFileContent
        ).then(oResponse => {
            this.stopServiceTimer();
            return(oResponse.arrayBuffer());
        });
        return(oResult);
    }
    // #endregion
    
    // #region Meta informations
    public getMetaInfoOf(strFileName:string,  oOptions:any, funcCallBack:any, oFileContent:any) {
        this.trace(`getMetaInfoOf('${strFileName}')`);
        if (!oOptions) oOptions = {};
        if(funcCallBack) {
            this.callSterlingService(
                this.ServiceAddress + "/" + REST_API_INFO_OF_PDF,
                strFileName,
                { },
                oFileContent
            ).then(oResponse => {
                oResponse.json().then(oData => {
                    this.stopServiceTimer();
                    funcCallBack(oData); 
                })
            }) .catch(oError =>  {
                console.log(`[E] getMetaInfoOf(): ${oError}`);
                funcCallBack("{}");
                });
                
        }
    }

    public async getMetaInfoOfAsync(strFileName:string,  oOptions:any, oFileContent:any) {
        this.trace(`getMetaInfoOfAsync('${strFileName}')`);
        if (!oOptions) oOptions = {};
        let oResult = await this.callSterlingService(
            this.ServiceAddress + "/" + REST_API_INFO_OF_PDF,
            strFileName,
            oOptions,
            oFileContent
        ).then(oResponse => {
            this.stopServiceTimer();
            return(oResponse.json());
        });
        return(oResult);
    }
    // #endregion


    public buildFromPictures(strFileNames:string|string[], oOptions:any, funcCallBack:any, oFileContent?:any) {
        this.trace(`buildFromPicture(${strFileNames})`);
        if(!oOptions) oOptions = {};
        if(funcCallBack) {
            this.callSterlingService(
                this.ServiceAddress + "/" + REST_API_PDF_FROM_PIC,
                strFileNames,
                oOptions,
                oFileContent
            ).then(oResponse => {
                this.stopServiceTimer();
                oResponse.arrayBuffer().then(oData => { 
                    funcCallBack(oData); 
                });
            }).catch(oError =>  {
                this.ContextLog?.error(oError);
            });
        }
    }



    public async buildFromPicturesAsync(strFileNames:string|string[], oOptions:any, oFileContent?:any) {
        this.trace(`buildFromPictureAsync(${strFileNames})`);
        if(!oOptions) oOptions = {};
        let oResult = await this.callSterlingService(
            this.ServiceAddress + "/" + REST_API_PDF_FROM_PIC,
            strFileNames,
            {
                fitOption: oOptions.fitOption ?? FitPageMode.fillPage,
                colorType: oOptions.colorType ?? ColorMode.color,
                autoRotate: oOptions.autoRotate ?? true,   
            },
            oFileContent
        ).then(oResponse => {
            this.stopServiceTimer();
            return(oResponse.arrayBuffer());
        });
        return(oResult);
    }


}
