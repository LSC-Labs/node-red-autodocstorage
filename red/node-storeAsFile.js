/* Initial for Node-Red */


module.exports = function(RED) {

    const AUTODOC = require("./lib/AutoDocLibV1.js");
    const TS = require("./lib/TSLibV1.js");

    const FS = require("fs");
    const PATH = require("path");

    /**
     * gets the final file name, depending on the Target Option 
     * by checking if the target file exists.
     * @param {*} strPathName 
     * @param {*} strFileName 
     * @param {*} oConfig 
     * @returns 
     */
    function getFinalFileName(strPathName, strFileName,oConfig) {
        let strResultName = strFileName;
        if(strPathName && strFileName && FS.existsSync(PATH.join(strPathName, strFileName))) {
            let strRequestedName = strFileName;
            let strOption = oConfig.targetOption ? oConfig.targetOption : "noaction";
            switch( strOption ) {
                case "override" : break;
                case "noaction" : strResultName = undefined; break;
                case "rename" : {
                    let strExtension = PATH.extname(strRequestedName);
                    let strNameWithoutExt = strRequestedName.substring(0,strRequestedName.length - strExtension.length);
                    let nIndex = 1;
                    do {
                        strResultName = strNameWithoutExt + "(" + nIndex++ + ")" + strExtension;
                    } while(FS.existsSync(PATH.join(strPathName,strResultName)));
                    break;
                }
            }
        }
        return(strResultName);
    }

    /* Prepare the document for LSC-AutoDocStore processing */
    function storeAsFileNode(oConfig) {
        RED.nodes.createNode(this,oConfig);
        let oNode = this;
        let StorageLocation = RED.nodes.getNode(oConfig.StorageLocation);
        
        // this.ConfigData = oConfig;
        // this.NodeName = oConfig.name ?? "storeAsFile";

        oNode.on('input', function(oMsg,pNodeSend,pNodeDone) {
            let oContext = new AUTODOC.CNodeObjectContext(oNode,oConfig,oMsg,"storeAsFile");
            let oTextParser = new AUTODOC.CTextParser(oContext,StorageLocation.Properties);

            let strAddress = oTextParser.substituteLine(StorageLocation.Address);
            let strPathName = oTextParser.substituteLine(oConfig.filePath);
            
            let strFullPathName = PATH.join(strAddress,strPathName);
            let strFileMask = oTextParser.substituteLine(oConfig.fileMask);
            let strFileName = getFinalFileName(strFullPathName,strFileMask,oConfig);
            oContext.log(" - storage address : " + strAddress);
            oContext.log(" - config filePath : " + strPathName);
            oContext.log(" - config fileMask : " + oConfig.fileMask);
            oContext.log(" - final store path: " + strFullPathName);
            oContext.log(" - final store file: " + strFileName);
            let strTargetFile;
            try {
                // Implement store command here...
                if(strFileName) {
                    // Prepare und store file...
                    strTargetFile = PATH.join(strFullPathName,strFileName).normalize();
                    oContext.log( " - targetfile: " + strTargetFile);
                    let oSourceFile = new TS.CFileInfo(oMsg.payload);
                    oSourceFile.copyFileTo(strTargetFile);
                    oContext.log(oSourceFile.FileName + " copied to " + strTargetFile);

                    // Prepare und store log if requested...
                    if(FS.existsSync(strTargetFile)) {
                        if(oConfig.writeLog) {
                            let strLogFile = strTargetFile + ".log";
                            FS.writeFileSync(strLogFile,oContext.getDiagDataAsTextBlock());
                            if(oSourceFile.Stats.mode) FS.chmodSync(strLogFile,oSourceFile.Stats.mode);
                        }
                        if(oConfig.writeCopyLog) {
                            AUTODOC.writeToStorageLogOf(oMsg.payload, oSourceFile.FileName + "  => " + strTargetFile)
                        }
                        oContext.log("Sending message on port 1");
                        pNodeSend([oMsg,null]);
                    } else {
                        oContext.warn("File " + oSourceFile.FileName + " could NOT be copied to " + strTargetFile);
                        oContext.log("Sending message on port 2");
                        pNodeSend([null,oMsg]);
                    }
                    
                } else {
                    // not stored...
                    oContext.warn("Final file name could not be generated for input: " + oMsg.payload)
                    oContext.log("Sending message on port 2");
                    pNodeSend([null,oMsg]);
                }
            } catch(ex) {
                oContext.error("File could not be stored: " + oMsg.payload + " to " + strTargetFile);
                oContext.error(ex);
                oContext.log("Sending message on port 2");
                pNodeSend([null,oMsg]);
            }
            pNodeDone();
        });
    };

    RED.nodes.registerType("store file",storeAsFileNode);
}
