// PasswordGeneratorNodeDef.ts
import * as nodered from "node-red";

export interface SampleNodeConfigDef
    extends nodered.NodeDef {
    length: number;
    setTo?: string;
}