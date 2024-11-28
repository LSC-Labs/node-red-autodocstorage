/* Initial for Node-Red */
module.exports = function(RED) {

    const AUTODOC = require("./lib/AutoDocLibV1.js");
    
    function getSearchMaskList(oConfig) 
    {
        let tSearchMasks = [];
        for(let oSearch of oConfig.searchMasks ?? [] ) {
            let strMask = oSearch.searchMask;
            if(strMask) tSearchMasks.push(strMask)
        }
        return(tSearchMasks);
    }

    function transferProperties(oContext, oTextParser) {
        for(let oProperty of oContext.Config.textProperties ?? []) {
            
            let strValue = oTextParser.substituteLine(oProperty.value);
            oContext.Message.setTextPropertyByName( oProperty.name, strValue);
        }
        oContext.Message.setLastMatchContent(oTextParser.LastMatchString??"");
    }

    /* Set a fix data into the node as defined in the config */
    function searchPropertiesNode(oConfig) {
        RED.nodes.createNode(this,oConfig);
        let oNode = this;

        oNode.on('input', function(oMsg,pNodeSend,pNodeDone) {
            let oContext = new AUTODOC.CNodeObjectContext(oNode,oConfig,oMsg,"searchProperties");
            oContext.log("- parsing document " + oMsg.payload);
            // const oNodeRedMsg = new AUTODOC.CNodeRedMsg(msg);
            const oTextParser = new AUTODOC.CTextParser(oContext);
            const strTextToParse = oContext.getTextContentToBeParsed(oConfig.source,oConfig.usePropertyName);

            // oTextParser.TraceMode = oConfig.TraceMode ?? false;
            oContext.trace(" - using content : " + oConfig.source);
            if(oConfig.source == "FileName" || oConfig.source == "Property") oContext.trace("  ==> '" + strTextToParse + "'");

            let tSearchMasks = getSearchMaskList(oConfig);
            
            if(oTextParser.matchByRegexMaskList(strTextToParse,tSearchMasks, oConfig )) {
                // Now substitute the properties with the text parser result..
                transferProperties(oContext,oTextParser);
                oContext.log("Sending message on port 1 (match)");
                pNodeSend([oMsg,null]);
            } else {
                
                if( oConfig.searchMode == AUTODOC.OPTION_SEARCH_NOMATCH ||
                    oConfig.searchMode == AUTODOC.OPTION_SEARCH_ANYCASE ) {
                        transferProperties(oContext,oTextParser);
                    }
                oContext.log("Sending message on port 2 (no match)");
                pNodeSend([null,oMsg]);
            }
            pNodeDone();
        });
    }
    RED.nodes.registerType("search props",searchPropertiesNode);
}
