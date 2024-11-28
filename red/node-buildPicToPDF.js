/* Initial for Node-Red */

module.exports = function(RED) {
    const AUTODOC = require("./lib/AutoDocLibV1.js");
    const STIRLING = require("./lib/StirlingServiceV1.js");

    const FS = require("fs");

    /**
     * returns a single filename as string, or a array of strings, if filenames are delimited with "," or ";"
     * @param {string} strFileNames FileNames, delimited by ";" or ","
     * @returns 
     */
    function getFileNames(strFileNames) {
        if(strFileNames.includes(";") || strFileNames.includes(",")) {
            let strFiles = strFileNames.split(",").join(";")
            // Split into array and trim the names
            let tResultArray = [];
            for(let strName of strFiles.split(";")) {
                tResultArray.push(strName.trim());
                console.log("Filename found: " + strName.trim());
            }
            return(tResultArray);
        }
        return(strFileNames);
    }

    /* Prepare the document for LSC-AutoDocStore processing */
    function buildPDFFromPicNode(oConfig) {
        RED.nodes.createNode(this,oConfig);
        let oNode = this;
        let oStirlingServiceConfig = RED.nodes.getNode(oConfig.StirlingService);

        oNode.on('input', function(oMsg,pNodeSend,pNodeDone) {
            let oNodeContext = new AUTODOC.CNodeObjectContext(this,oConfig,oMsg,"buildPicToPDF");
            let oStirlingService = new STIRLING.CStirlingService(oStirlingServiceConfig.Address,oStirlingServiceConfig.TraceMode, oNodeContext); 
            let oFileNames = getFileNames(oMsg.payload)
            oStirlingService.buildFromPicturesAsync(oFileNames,oConfig,null).then(oData => {
                let strTargetFileName = (typeof oFileNames === 'string ') ? oFileNames : oFileNames[0];
                let oTargetFile = new AUTODOC.CTargetFile(strTargetFileName,{ existOption: oConfig.existOption ?? "rename" },".pdf");
                if(oTargetFile.NameOfFile) {
                    let oTargetData = Buffer.from(oData);
                    FS.writeFileSync(oTargetFile.NameOfFile,oTargetData);
                    let oNewFileMsg = JSON.parse(JSON.stringify(oMsg));
                    oNewFileMsg.payload = oTargetFile.NameOfFile;
                    oContext.log("Sending messages on port 1,2");
                    pNodeSend([oNewFileMsg,oMsg,null]);
                } else {
                    oNodeContext.error("result file could not be created: " + oTargetFile.NameOfFile);
                    oContext.log("Sending message on port 3");
                    pNodeSend([null,null,oMsg]);
                }
                pNodeDone();
            }).catch(oError => {
                oNodeContext.error(oError);
                pNodeDone();
            });
        });
    };

    RED.nodes.registerType("pic to pdf",buildPDFFromPicNode);
}
