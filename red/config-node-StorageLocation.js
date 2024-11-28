module.exports = function(RED) {

    function StorageLocationeNode(oConfig) {
        RED.nodes.createNode(this,oConfig);

        this.Address    = oConfig.Address;
        this.Properties = oConfig.Properties;
        // TODO: Implementation of Location Helper Class
        //       This class should do the "work" to store the data, 
        //       depending of type and operation like authentificatiton.
        // this.username = this.credentials.Username;
        // this.password = this.credentials.Password;
         // New Implementation of Service Class
         // this.Service.TraceMode = oConfig.Trace ?? false;
         // this.Service.trace("TraceMode enabled...");
    }

    RED.nodes.registerType("storage-location",StorageLocationeNode,{
        credentials: {
            Username: { type:"text"     },
            Password: { type:"password" }
        }
    });
}