/* Initial for Node-Red */
module.exports = function(RED) {
    const FS = require("fs");
    const AUTODOC = require("./lib/AutoDocLibV1.js");
    const STIRLING = require("./lib/StirlingServiceV1.js");
    const STATUS_READY = { fill:"green", shape:"ring", text:"waiting"};
    const STATUS_ACTIVE = {fill:"blue",shape:"dot",text:"active"};

    /* Prepare the document for LSC-AutoDocStore processing */
    function readTextFromPDFNode(oConfig) {
        RED.nodes.createNode(this,oConfig);
        let oNode = this;
        let oStirlingServiceNode = RED.nodes.getNode(oConfig.StirlingService);
        oNode.status(STATUS_READY);

        oNode.on('input', function(oMsg,pNodeSend,pNodeDone) {
            let oContext = new AUTODOC.CNodeObjectContext(oNode,oConfig,oMsg,"readPDFText");
            let oStirlingService = new STIRLING.CStirlingService(oStirlingServiceNode.Address,oStirlingServiceNode.TraceMode,oContext); 
            oContext.log("- reading text from " + oMsg.payload);
            let oFinalStatus = STATUS_READY;
            try {
                if(FS.existsSync(oMsg.payload)) {
                    oNode.status(STATUS_ACTIVE);
                    oContext.log(" - calling sterling service getTextOf(" + oMsg.payload + ")");
                    oStirlingService.getTextOfAsync(oMsg.payload,{ outputFormat: "txt" })
                        .then( strData => {
                            if(!oContext.isValidTextBlock(strData)) {
                                oContext.log("Sending message on port 2 (NO valid text)")
                                pNodeSend([null,oMsg]);
                            } else {
                                oContext.Message.setTextContent(strData);
                                oContext.log("Sending message on port 1 (valid text found)")
                                pNodeSend([oMsg,null]);
                            }
                        })
                } else {
                    oContext.error(" - missing payload as existing file!")
                }
            } catch(ex) {
                oContext.error(ex);
                oFinalStatus = { fill:"red", shape:"dot", text:ex.message};
            }
            oNode.status(oFinalStatus);
            pNodeDone();
        });
    };

    RED.nodes.registerType("read pdf text",readTextFromPDFNode);
}
