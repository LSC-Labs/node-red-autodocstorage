/* Initial for Node-Red */
module.exports = function(RED) {

    const AUTODOC = require("./lib/AutoDocLibV1.js");


    /* Set a fix data into the node as defined in the config */
    function setPropertiesNode(oConfig) {
        RED.nodes.createNode(this,oConfig);
        let oNode = this;

        oNode.on('input', function(oMsg,pNodeSend,pNodeDone) {
            let oContext = new AUTODOC.CNodeObjectContext(oNode,oConfig,oMsg,"setProperties");
            oContext.log("- setting properties for document " + oMsg.payload);
            // const oNodeRedMsg = new AUTODOC.CNodeRedMsg(msg);
            const oTextParser = new AUTODOC.CTextParser(oContext);
            oContext.getMessage
            for(const oProp of oConfig[AUTODOC.PROPERTY_TEXTPROPERTY_LIST]??[]) {
                // Substitute vars if defined...
                let strValue = oProp.value ?? "";
                let strNewValue = oTextParser.substituteLine(strValue);
                oContext.Message.setTextPropertyByName(oProp.name,strNewValue);
            }
            pNodeSend(oMsg);
        });
    }
    RED.nodes.registerType("set props",setPropertiesNode);
}
