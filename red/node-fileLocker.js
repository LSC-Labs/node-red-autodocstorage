/**
 * fileLocker.js
 * 
 * (c) 2023 LSC-Labs  
 * 
 * file locker sets and removes locks in form of lock-file for a input file
 * 
 **/

const AUTODOC = require("./lib/AutoDocLibV1.js");
const FS = require("fs");

module.exports = function(RED) {

    /* Prepare the document for LSC-AutoDocStore processing */
    function lockFileNode(oConfig) {
        RED.nodes.createNode(this,oConfig);
        let oNode = this;

        oNode.on('input', function(oMsg,pNodeSend,pNodeDone) {
            let oContext = new AUTODOC.CNodeObjectContext(oNode,oConfig,oMsg,"fileLocker");
            let oFileLocker = new AUTODOC.CFileLocker(oContext);

            if(oFileLocker.isStorageLogFile() || oFileLocker.isLockFile()) {
                // Per default - this message will not receive anyone, cause no processing 
                // but to be honest, maybe it will be sent on a later version.
                oContext.log("- file is a lock file or the storage log - no further processing (ignoring)");
            } else {
                // Default send message...
                let tSendMsg = [null,null,oMsg];
                tSendMsg = oFileLocker.processLockRequest();
                if(tSendMsg) pNodeSend(tSendMsg);
            }
            pNodeDone();
        });
    };


    RED.nodes.registerType("lock file",lockFileNode);
}
