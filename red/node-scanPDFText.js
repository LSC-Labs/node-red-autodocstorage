/* Initial for Node-Red */
module.exports = function(RED) {

    const FS = require("fs");
    const PATH = require("path");

    const AUTODOC = require("./lib/AutoDocLibV1.js");
    const STIRLING = require("./lib/StirlingServiceV1.js");
    const LSC = require("./lib/TSLibV1.js");

    function setStatsDataTo(oStats,strTargetFile) {
        if(oStats) {
            if(oStats.atime && oStats.mtime) {
                FS.utimesSync(strTargetFile,oStats.atime,oStats.mtime);
            }
            if(oStats.mode) {
                FS.chmodSync(strTargetFile,oStats.mode);
            }
        }
    }

    function replaceDocWithContent(oNodeContext,oDocData) {
        let oOrgFile = new LSC.CFileInfo(oNodeObjData.getMessagePayload());
        oNodeContext.log(" - replacing with new content: " + oOrgFile.AbsoluteFileName);
        let oStats = oOrgFile.Stats;
        FS.copyFileSync(oOrgFile.AbsoluteFileName,oDocData);
        setStatsDataTo(oStats,oOrgFile.AbsoluteFileName);
    }

    function storeDocAsNewFile(oNodeContext,oDocData) {
        let bSuccess = false;
        let oMsg = oNodeMsg.getNodeRedMessageObject();
        let oOrgFile = new LSC.CFileInfo(oNodeContext.getMessagePayload());
        if(oOrgFile.Exists) {
            let strFileNamePre = PATH.join(oOrgFile.AbsoluteDirName,oOrgFile.FileName + "-ocr");
            let oNewFile = new LSC.CFileInfo( + oOrgFile.Extension);
            let nCounter = 1;
            while(oNewFile.Exists) {
                oNewFile = new LSC.CFileInfo(strFileNamePre + "-(" + nCounter++ + ")" + oOrgFile.Extension);
            }
            oNodeContext.log(" - storing as new document: " + oNewFile.AbsoluteFileName);
            // Parent dir already exists - as it is in parallel to the source !
            // but keep the original timestamp
            FS.writeFileSync(oNewFile.AbsoluteFileName,oDocData);
            setStatsDataTo(oOrgFile.Stats,oNewFile.AbsoluteFileName);
            oNodeContext.setMessageProperty("payload_org",oNodeContext.getMessagePayload());
            oNodeContext.setMessagePayload(oNewFile.AbsoluteFileName);
            bSuccess = true;
        }
        return(bSuccess);
    }

    function writeSendMessage(oContext,tMessages) {
        let strText = "";
        let strPlurarl = "";
        if(tMessages) {
            let nIndex = 0;
            for(let oMsg of tMessages) {
                nIndex++;
                if(oMsg) {
                    if(strText.length > 1) { strText += ", ", strPlurarl = "s"; }
                    strText += "port " + nIndex;
                    switch(nIndex) {
                        case 1: strText += "(valid text)"; break;
                        case 2: strText += "(new document created)"; break;
                        case 3: strText += "(no valid text found)"; break;
                    }
                }
            }
        }
        oContext.log(`Sending message${strPlurarl} on ${strText}`)
    }


    /* Prepare the document for LSC-AutoDocStore processing */
    function scanTextFromPDFNode(oConfig) {
        RED.nodes.createNode(this,oConfig);
        let oNode = this;
        let oStirlingServiceNode = RED.nodes.getNode(oConfig.StirlingService);
        let oReadyStatus = { fill:"green", shape:"ring", text:"waiting"};
        let oActiveStatus = {fill:"blue",shape:"dot",text:"active"};
        oNode.status(oReadyStatus);

        oNode.on('input', function(oMsg,pNodeSend,pNodeDone) {
            let oFinalStatus = oReadyStatus;
            let oNodeContext = new AUTODOC.CNodeObjectContext(this,oConfig,oMsg,"scanPDFText");
            let oStirlingService = new STIRLING.CStirlingService(oStirlingServiceNode.Address,oStirlingServiceNode.TraceMode, oNodeContext); 
            oNodeContext.log("- (STIRLING) ocr scan of document " + oMsg.payload);
            try {
                if(FS.existsSync(oMsg.payload)) {
                    oNode.status(oActiveStatus);
                    oStirlingService.enrichWithTextAsync(oMsg.payload,{}).then(oDoc => {
                        switch(oConfig.operation) {
                            case "createnew" : 
                                if(storeDocAsNewFile(oNodeContext,oDoc)) {
                                    oNodeContext.log("Sending message on port 2 (new file created)");
                                    pNodeSend([null,oMsg,null]);
                                }  
                                break;
                            case "replace": // replace the original source file with the enriched one...
                            case "textonly": // extract the text only - don't touch the sources
                                oStirlingService.getTextOfAsync(oMsg.payload,{ outputFormat: "txt" },oDoc).then(strData => {
                                    let tMessages = [ null, null, oMsg ];
                                    if(oNodeContext.isValidTextBlock(strData)) {
                                        oNodeContext.Message.setTextContent(strData);                                        tMessages = [oMsg,null,null];
                                        if(oConfig.operation == "replace") {
                                            replaceDocWithContent(oNodeMsg,oDoc);
                                        }
                                    }
                                    writeSendMessage(oNodeContext,tMessages);
                                    pNodeSend(tMessages);
                                    pNodeDone();
                                });
                                break;

                            default:
                                oNodeContext.error(" - oper mode not implemented : " + oConfig.operation);
                                oFinalStatus = {text:"unknown mode : " + oConfig.operation,color:"red", shape:"dot"};
                                break;
                        }
                    });
                }
            } catch(ex) {
                oNodeContext.error(ex);
                oFinalStatus = {fill:"red",shape:"dot",text:ex.message}
            }
            oNode.status(oFinalStatus);
        });
    };

    RED.nodes.registerType("ocr scan",scanTextFromPDFNode);
}
