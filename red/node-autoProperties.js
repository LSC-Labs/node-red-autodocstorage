/* Initial for Node-Red */

const AUTODOC = require("./lib/AutoDocLibV1.js");
const LSC = require("./lib/TSLibV1.js");

module.exports = function(RED) {

    const DefaultScanType   = "date:day=0,2:month=3,2:year=6,4";
    const ENUScanType       = "date:day=3,2:month=0,2:year=6,4";
    const ISOScanType       = "date:day=8,2:month=5,2:year=0,4";

    // ToDo: put it into the Config GUI - also enhance the identification (!)
    const Languages = [ 
                        { lang: "ENU", scanMask:"\\d\\d/\\d\\d/\\d\\d\\d\\d",     ScanType:ENUScanType },
                        { lang: "DEU", scanMask:"\\d\\d\\.\\d\\d\\.\\d\\d\\d\\d", ScanType:DefaultScanType },
                        { lang: ""   , scanMask:"\\d\\d\\d\\d-\\d\\d-\\d\\d",     ScanType:ISOScanType}
                      ];

    function setDatePropsByType(oContext, strDate, strType, strPrefix) {
        if(strType.toLowerCase().startsWith("date:")) {
            const tDateElements = [];
            const tTypeElements = strType.split(":");
            strPrefix = strPrefix ? strPrefix + "." : "";
            for(let nIndex = 1; nIndex < tTypeElements.length; nIndex++) {
                try {
                    const strElement = tTypeElements[nIndex];
                    const strName= LSC.stringBefore(strElement,"=");
                    const strPositions = LSC.stringAfter(strElement,"=");
                    const nStartPos = +LSC.stringBefore(strPositions,",");
                    const nLength = +LSC.stringAfter(strPositions,",");
                    if(nLength && nLength > 0) {
                        let strValue = strDate.substring(nStartPos, nStartPos + nLength);
                        oContext.Message.setTextPropertyByName(strPrefix + strName,strValue);
                        tDateElements[strName] = strValue;
                    }
                    const strIsoDate = tDateElements["year"] + "-" + tDateElements["month"] + "-" + tDateElements["day"];
                    if(strIsoDate.length == 10) oContext.Message.setTextPropertyByName(strPrefix + "date", strIsoDate);
                } catch (ex) {
                    oContext.error(ex);
                }
            }
        }
    }

    function scanForDefaults(oTextParser, oContext) {
        let bFound = false;
        for(const oLangDef of Languages) {
            let strTextToScan = oContext.getMessage().textContent ?? "";
            if(oTextParser.matchByRegexMask(strTextToScan, oLangDef.scanMask )) {
                if(oLangDef.lang && oLangDef.lang.length > 0) {
                    oContext.log( "Language detected: " + oLangDef.lang);
                    oContext.Message.setTextPropertyByName("doc.language",oLangDef.lang);
                }
                if(oLangDef.ScanType.startsWith("date:")) {
                    setDatePropsByType(oContext, oTextParser.LastMatchString, oLangDef.ScanType, "doc");
                }
                bFound = true;
                break;
            }
        }
        return(bFound);
    }

    function setPropertiesToMessage(oDateParser,oContext) {
        for(const oVar of oDateParser.Properties.getVarDefList()) {
            oContext.trace(" - setting message properties: " + oVar.name + " => " + oVar.value);
            oContext.Message.setTextPropertyByName(oVar.name,oVar.value);
        }
    }

    /*
    * Main Entry Point - Prepare the document for LSC-AutoDocStore processing 
    */
    function setDocumentAutoProps(oConfig) {
        RED.nodes.createNode(this,oConfig);
        let oNode = this;
        // let oNodeConfig = new AUTODOC.CNodeConfig(oConfig,"AutoProps");

        oNode.on('input', function(oMsg,pNodeSend,pNodeDone) {
            let oContext = new AUTODOC.CNodeObjectContext(oNode,oConfig,oMsg,"autoProperties");
            oContext.log("- scanning document " + oMsg.payload);

            // Set the input file information
            let oFileInfo = new LSC.CFileInfo(oMsg.payload);
            oContext.Message.setTextPropertyByName("file.name",oFileInfo.FileName);
            oContext.Message.setTextPropertyByName("file.nameonly",oFileInfo.FileNameOnly);
            oContext.Message.setTextPropertyByName("file.path",oFileInfo.AbsoluteDirName);
            oContext.Message.setTextPropertyByName("file.ext",oFileInfo.Extension);

            let oDateParser = new AUTODOC.CAutoParseDate(oContext);
            if(oFileInfo.LastWrite) {
                oContext.trace(" - setting file date infos...");
                oDateParser.scanForDateAndLanguage(oFileInfo.LastWrite.toISOString(),"file");
                // Set the file properties
                setPropertiesToMessage(oDateParser,oContext);

                // Default for the document is the timestamp of the file
                oContext.trace(" - setting doc default infos...");
                oDateParser.scanForDateAndLanguage(oFileInfo.LastWrite.toISOString(),"doc");
                setPropertiesToMessage(oDateParser,oContext);
            }
            oContext.trace(" - setting doc date infos...");
            oDateParser.scanForDateAndLanguage(oMsg.textContent,"doc",true);
            // Now transfer to the output...
            setPropertiesToMessage(oDateParser,oContext);
           
            // let oTextParser = new AUTODOC.CTextParser(oContext);

            // Try to detect document day / time and language by content...
            // scanForDefaults(oTextParser, oContext);
            
            pNodeSend(oMsg);
            pNodeDone();
        });
    };

    RED.nodes.registerType("auto props",setDocumentAutoProps);
}
