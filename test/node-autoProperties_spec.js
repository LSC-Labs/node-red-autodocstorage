var should = require("should");
var assert = require("assert");
var helper = require("node-red-node-test-helper");
var oTestNode = require("../red/node-autoProperties.js");
var LSC = require("../red/lib/TSLibV1.js");
var AUTODOC = require("../red/lib/AutoDocLibV1.js");

helper.init(require.resolve('node-red'));

let Trace = false;
let Logging = false;

function log(oData) {
    if(Logging) console.log(oData);
}
function trace(oData) {
    if(Trace) console.log(oData);
}

describe('Test autoProperties node', function () {

    let strNodeType = "auto props";
    let strTestPayload = __filename;
    let strTestPayload1 = "test/autoProperties_spec.js";
    let oFileInfo = new LSC.CFileInfo(strTestPayload);
    let tTestArray = [
        { input: "24.08.1959", name:"german date format",
            tests: [
                { name:"file.ext",      expected: oFileInfo.Extension},
                { name:"file.date",     expected: oFileInfo.LastWrite.toISOString().substring(0,10)},
                { name:"file.nameonly", expected: "node-autoProperties_spec"},
                { name:"doc.date",      expected: "1959-08-24"},
                { name:"doc.day",       expected: "24" },
                { name:"doc.month",     expected: "08" },
                { name:"doc.year", expected: "1959" },
                { name:"doc.date.long", expected: "24 August 1959" },
                { name:"doc.monthname", expected: "August" },
                { name:"doc.language",  expected: "DEU" },
            ],
            newTests: [
                
            ]
        },
        { input: "24.08.17", name:"german short format",
            tests: [
                { name:"file.ext",      expected: oFileInfo.Extension},
                { name:"file.date",     expected: oFileInfo.LastWrite.toISOString().substring(0,10)},
                { name:"doc.date",      expected: "2017-08-24"},
                { name:"doc.day",       expected: "24" },
                { name:"doc.month",     expected: "08" },
                { name:"doc.year",      expected: "2017" },
                { name:"doc.date.long", expected: "24 August 2017" },
                { name:"doc.monthname", expected: "August" },
                { name:"doc.language",  expected: "DEU" },
            ],
            newTests: [
                
            ]
        },

        { input: "24 August 1959", prefix:"name", name:"german date long format",

            tests: [
                { name:"file.ext",      expected: oFileInfo.Extension},
                { name:"file.date",     expected: oFileInfo.LastWrite.toISOString().substring(0,10)},                
                { name:"doc.date", expected: "1959-08-24" },
                { name:"doc.day", expected: "24" },
                { name:"doc.month", expected: "08" },
                { name:"doc.year", expected: "1959" },
                { name:"doc.date.long", expected: "24 August 1959" },
                { name:"doc.monthname", expected: "August" },
                { name:"doc.language",  expected: "DEU" },
            ],
        },

        { input: "10/8/1959", prefix:"name", name:"us date format",

            tests: [
                { name:"file.ext",      expected: oFileInfo.Extension},
                { name:"file.date",     expected: oFileInfo.LastWrite.toISOString().substring(0,10)},                
                { name:"doc.date", expected: "1959-10-08" },
                { name:"doc.day", expected: "08" },
                { name:"doc.month", expected: "10" },
                { name:"doc.year", expected: "1959" },
                { name:"doc.date.long", expected: "08 October 1959" },
                { name:"doc.monthname", expected: "October" },
                { name:"doc.language",  expected: "ENU" },
            ],
        },
    ];

    beforeEach(function (done) {
        helper.startServer(done);
    });
  
    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    // Test the node could be loaded...
    it('should be loaded', function (done) {
        const oFlow = [{ id: "n1", type: strNodeType, name: strNodeType }];
        helper.load(oTestNode, oFlow, function () {
            var n1 = helper.getNode("n1");
          try {
            n1.should.have.property('name');
            done();
          } catch(err) {
            done(err);
          }
        });
    });

    for(let oTestData of tTestArray) {
        const oTestFlow = [
            { id: "n1", type: strNodeType, name: strNodeType, "TraceMode": Trace, wires:[["n2"]],  },
            { id: "n2", type: "helper" }
          ];
        it('date results are matching ' + oTestData.name, function (done) {
            helper.load(oTestNode, oTestFlow, function () {
                const n1 = helper.getNode("n1");
                const n2 = helper.getNode("n2");
                n2.on("input", function (msg) {
                    try {
                        // Payload untouched...
                        msg.should.have.property('payload', strTestPayload);
                        msg.should.have.property('textProperties');
                        
                        // All other defined properties should match in property array...
                        let tReceivedValues = [];
                        for(const oProperty of msg.textProperties) {
                            tReceivedValues[oProperty.name.toLowerCase()] = oProperty.value;
                        }
                        trace(tReceivedValues);
                        for(let oTestElement of oTestData.tests) {
                            log(" - testing : " + oTestElement.name + " == " + oTestElement.expected + " found (" + tReceivedValues[oTestElement.name] + ")");
                            tReceivedValues.should.have.property(oTestElement.name.toLowerCase(),oTestElement.expected);
                        }
                        done();
                    }
                    catch(err){
                        console.log(msg);
                        done(err);
                    }
                });

                let oMsg = {
                    payload: strTestPayload,
                    textContent: oTestData.input,
                    textProperties: []
                }
                n1.receive( oMsg );    

            });
    
        });
    }

});