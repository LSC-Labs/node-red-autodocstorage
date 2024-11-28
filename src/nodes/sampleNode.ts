// PasswordGeneratorNode.ts
import * as nodered from "node-red";


// it can't set to the input event listener now
// using any is workaround but not good
interface PayloadType extends nodered.NodeMessageInFlow {
    to: string;
}

export interface SampleNodeConfigDef
    extends nodered.NodeDef {
    length: number;
    message?: string;
} 


module.exports =  (RED:nodered.NodeAPI): void => {

    RED.nodes.registerType("sampleNode",
        function (this: nodered.Node, config: SampleNodeConfigDef): void {
            RED.nodes.createNode(this, config);

            this.on("input", async (msg: any, send, done) => {
                msg.Info = "Enriched version";
                send(msg);
                done();
            });
        });
    }