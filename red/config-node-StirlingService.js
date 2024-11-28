/**
 * Stirling Service Config Node
 * 
 * 2024-08 LBL : New version of service comes in place.
 * 
 */
// 
module.exports = function(RED) {
    // const STIRLING = require("./lib/LSC/StirlingServiceV1.js");

    function StirlingServiceNode(oConfig) {
        RED.nodes.createNode(this,oConfig);
        this.Address = oConfig.Address;
        this.Version = oConfig.Version;
        this.TraceMode = oConfig.TraceMode;
        // New Implementation of Service Class
       /*
        this.Service = new STIRLING.CStirlingService(oConfig.Address);
        this.Service.TraceMode = oConfig.TraceMode ?? false;
        this.Service.trace("TraceMode enabled...");
        */
        }

    RED.nodes.registerType("stirling-service",StirlingServiceNode);
}