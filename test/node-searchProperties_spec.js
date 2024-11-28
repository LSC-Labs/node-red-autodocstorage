var should = require("should");
var assert = require("assert");
var helper = require("node-red-node-test-helper");
var oTestNode = require("../red/node-searchProperties.js");
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

let strNodeType = "search props";
let strTestPayload = __filename;
let oFileInfo = new LSC.CFileInfo(strTestPayload);





function getReceivedProperties(oMsg) {
    let tReceivedValues = [];
    for(const oProperty of oMsg.textProperties ?? []) {
        tReceivedValues[oProperty.name.toLowerCase()] = oProperty.value;
    }
    return(tReceivedValues);
}




/**
 * Test a port receiving message.
 * If not expected, throw an error...
 * @param {number} nPortNumber 
 * @param {*} oPortTestData 
 * @param {*} oMsg 
 * @param {*} pDoneFunction 
 */
function portTestFunction(nPortNumber,oPortTestData,oMsg,pDoneFunction) {
    trace("Message received on port " + nPortNumber);
    if(oPortTestData.expected) {
        try {
            oMsg.should.have.property('payload', strTestPayload);
            let tReceivedValues = getReceivedProperties(oMsg);
            trace(tReceivedValues);
            
            for(let oTestElement of oPortTestData.tests) {
                if(Object.keys(tReceivedValues).length > 0) {
                    // All other defined properties should match in property array...
                    log(" - testing : " + oTestElement.name + " == " + oTestElement.expected + " found (" + tReceivedValues[oTestElement.name] + ")");
                    tReceivedValues.should.have.property(oTestElement.name.toLowerCase(),oTestElement.expected,"Testing property : " + oTestElement.name);
                } else {
                    throw(new Error("no properties received on message. Expected at least : " + oPortTestData.tests.length));
                }
            }
            pDoneFunction();
        }
        catch(err){
            console.log(oMsg);
            pDoneFunction(err);
        }

    } else {
        console.log(oMsg);
        let oError = new Error();
        oError.message = "Unexpected message on port " + nPortNumber;
        pDoneFunction(oError);
    }
}

/**
 * Test a port receiving message.
 * If not expected, throw an error...
 * @param {number} nPortNumber 
 * @param {*} oPortTestData 
 * @param {*} oMsg 
 * @param {*} pDoneFunction 
 */
function portTestFunctionSource(nPortNumber,oPortTestData,oMsg,pDoneFunction) {
    trace("Message received on port " + nPortNumber);
    if(oPortTestData.expected) {
        try {
            let tReceivedValues = getReceivedProperties(oMsg);
            trace(tReceivedValues);
            
            for(let oTestElement of oPortTestData.tests) {
                if(Object.keys(tReceivedValues).length > 0) {
                    // All other defined properties should match in property array...
                    log(" - testing : " + oTestElement.name + " == " + oTestElement.expected + " found (" + tReceivedValues[oTestElement.name] + ")");
                    tReceivedValues.should.have.property(oTestElement.name.toLowerCase(),oTestElement.expected,"Testing property : " + oTestElement.name);
                } else {
                    throw(new Error("no properties received on message. Expected at least : " + oPortTestData.tests.length));
                }
            }
            pDoneFunction();
        }
        catch(err){
            console.log(oMsg);
            pDoneFunction(err);
        }

    } else {
        console.log(oMsg);
        let oError = new Error();
        oError.message = "Unexpected message on port " + nPortNumber;
        pDoneFunction(oError);
    }
}




describe('Test searchProperties node modes', function () {


    let tTestArray = [
        { 
            name:"first match entry wins",
            searchMode:"FirstMatch", 
            input: "Das ist ein Test für Peter Liebl oder Dagmar Liebl" ,
            port1: {
                expected: true,
                tests: 
                    [
                        { name:"name",      expected: "Peter"},
                    ]
                },
            port2: { expected: false, },
        },
        { 
            name:"all entries must match (last one wins)",
            searchMode:"AllMatches",
            input: "Das ist ein Test für Peter Liebl oder Dagmar Liebl" ,
            port1: {
                expected: true,
                tests: 
                    [
                        { name:"name",      expected: "Dagmar" },
                        { name:"fullname",  expected: "Dagmar, Liebl" },
                    ]
                },
            port2: { expected: false, },
        },
        { 
            name:"at least one entry should match (not all entries are set)",
            searchMode:"AtLeastOne", 
            input: "Das ist ein Test für Peter und Dagmar" , 
            
            port1: {
                expected: true,
                tests: 
                    [
                        { name:"name",      expected: "Dagmar" },
                        { name:"fullname",  expected: "Dagmar, $(LastName)" },
                    ]
                },
            port2: { expected: false, },
        },
        { 
            name:"should set props in any case (with one match - on port 1)",
            searchMode:"AnyCase", 
            input: "Das ist ein Test für Peter und Dagmar" , 
            
            port1: {
                expected: true,
                tests: 
                    [
                        { name:"name",      expected: "Dagmar" },
                        { name:"fullname",  expected: "Dagmar, $(LastName)" },
                    ]
                },
            port2: { expected: false, },
        },
        { 
            name:"should set props in any case (with NO match - on port 2)",
            searchMode:"AnyCase", 
            input: "Das ist ein einfacher Test" , 
            
            port1: { expected: false, },
            port2: {
                expected: true,
                tests: 
                    [
                        { name:"name",      expected: "$(FirstName)" },
                        { name:"fullname",  expected: "$(FirstName), $(LastName)" },
                    ]
                },
        },
        { 
            name:"should set props if no entry matches (on port 2)",
            searchMode:"NoMatch", 
            input: "Das ist ein einfacher Test" , 
            
            port1: { expected: false, },
            port2: {
                expected: true,
                tests: 
                    [
                        { name:"name",      expected: "$(FirstName)" },
                        { name:"fullname",  expected: "$(FirstName), $(LastName)" },
                    ]
                },
        },
        { 
            name:"should set props if no entry matches (on port 1 - cause a match comes in place)",
            searchMode:"NoMatch", 
            input: "Das ist ein einfacher Test Peter Liebl" , 
            port1: {
                expected: true,
                tests: 
                    [
                        { name:"name",      expected: "$(FirstName)" },
                        { name:"fullname",  expected: "$(FirstName), $(LastName)" },
                    ]
                },
            port2: { expected: false, },
        },
    ];

    var oRunTestFlow = [
        { id: "TestNode", 
            type: strNodeType, 
            name: strNodeType, 
            "TraceMode": Trace, 
            "searchMode" : "FirstMatch",
            "source": "DocumentText",
            "searchMasks": [
                { "searchMask": "(?<FirstName>Peter)"} ,
                { "searchMask": "(?<FirstName>Dagmar)"} ,
                { "searchMask": "(?<LastName>Liebl)"} 
            ],
            "textProperties": [
                { name:"Name", value:"$(FirstName)"},
                { name:"FullName", value:"$(FirstName), $(LastName)"}
            ],
            wires:[["nh1"], ["nh2"] ]
        },
        { id: "nh1", type: "helper" },{ id: "nh2", type: "helper" }
      ];

    beforeEach(function (done) {
        helper.startServer(done);
    });
  
    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    // Test the node could be loaded...
    it('should be loaded (mode tests)', function (done) {
        helper.load(oTestNode, oRunTestFlow, function () {
            var nTestNode = helper.getNode("TestNode");
            try {
                nTestNode.should.have.property('name');
                nTestNode.should.have.property('type',strNodeType);

                done();
            } catch(err) {
                done(err);
            }
        });
    });


    for(let oTestData of tTestArray) {
        it( oTestData.name, function (done) {
            oRunTestFlow[0].searchMode = oTestData.searchMode;
            helper.load(oTestNode, oRunTestFlow, function () {
                var nTestNode = helper.getNode("TestNode");
                var nh1 = helper.getNode("nh1");
                var nh2 = helper.getNode("nh2");
                assert.strictEqual(nh1.type,nh2.type,"both helpers are in place")
                assert.strictEqual(nTestNode.type, strNodeType);
                
                nh1.on("input", function (msg) {
                    portTestFunction(1,oTestData.port1,msg,done);
                });

                nh2.on("input", function (msg) {
                    portTestFunction(2,oTestData.port2,msg,done);
                });
    
                let oMsg = {
                    payload: strTestPayload,
                    textContent: oTestData.input,
                    textProperties: []
                }
    
                try {
                    nTestNode.receive( oMsg );    
                } catch(err) {
                    log("unexpected error while sending the message...");
                    done(err);
                }
               });
        });

    }

});

describe('Test searchProperties node input', function () {

    beforeEach(function (done) {
        helper.startServer(done);
    });
  
    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    // Test the node could be loaded...
    it('should be loaded (input tests)', function (done) {
        helper.load(oTestNode, oRunTestFlow, function () {
            var nTestNode = helper.getNode("TestNode");
            try {
                nTestNode.should.have.property('name');
                nTestNode.should.have.property('type',strNodeType);

                done();
            } catch(err) {
                done(err);
            }
        });
    });

    let tTestArray = [
        { 
            name:"document text as input",
            source:"DocumentText", 
            payload: "tmp/filename.pdf",
            textContent: "Das ist ein Test für Peter Liebl oder Dagmar Liebl" ,
            textHeader: "Header information for testing",
            port1: {
                expected: true,
                tests: 
                    [
                        { name:"name",      expected: "Peter"},
                    ]
                },
            port2: { expected: false, },
        },
        { 
            name:"filename as input",
            source:"FileName",  
            payload: "tmp/filename-from-Peter.pdf",
            textContent: "Das ist ein Test für Dagmar Liebl" ,
            textHeader: "Header information for testing",
            port1: {
                expected: true,
                tests: 
                    [
                        { name:"name",      expected: "Peter"},
                    ]
                },
            port2: { expected: false, },
        },
        { 
            name:"Message property (textHeader) as input",
            source:"MessageProperty",  
            payload: "tmp/filename-from-Otto.pdf",
            textContent: "Das ist ein Test für Dagmar Liebl" ,
            textHeader: "Header information for Peter testing",
            port1: {
                expected: true,
                tests: 
                    [
                        { name:"name",      expected: "Peter"},
                    ]
                },
            port2: { expected: false, },
        }
    ];

    var oRunTestFlow = [
        { id: "TestNode", 
            type: strNodeType, 
            name: strNodeType, 
            "TraceMode": Trace, 
            "searchMode" : "FirstMatch",
            "source": "DocumentText",
            "usePropertyName": "textHeader",
            "searchMasks": [
                { "searchMask": "(?<FirstName>Peter)"} ,
                { "searchMask": "(?<FirstName>Dagmar)"} ,
                { "searchMask": "(?<LastName>Liebl)"} 
            ],
            "textProperties": [
                { name:"Name", value:"$(FirstName)"},
                { name:"FullName", value:"$(FirstName), $(LastName)"}
            ],
            wires:[["nh1"], ["nh2"] ]
        },
        { id: "nh1", type: "helper" },{ id: "nh2", type: "helper" }
      ];

      /*
    beforeEach(function (done) {
        helper.startServer(done);
    });
  
    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });
*/
    for(let oTestData of tTestArray) {
        it( oTestData.name, function (done) {
            oRunTestFlow[0].source = oTestData.source,
            helper.load(oTestNode, oRunTestFlow, function () {
                var nTestNode = helper.getNode("TestNode");
                var nh1 = helper.getNode("nh1");
                var nh2 = helper.getNode("nh2");
                assert.strictEqual(nh1.type,nh2.type,"both helpers are in place")
                assert.strictEqual(nTestNode.type, strNodeType);
                
                nh1.on("input", function (msg) {
                    portTestFunctionSource(1,oTestData.port1,msg,done);
                });

                nh2.on("input", function (msg) {
                    portTestFunctionSource(2,oTestData.port2,msg,done);
                });
    
                let oMsg = {
                    payload: oTestData.payload,
                    textContent: oTestData.textContent,
                    textHeader: oTestData.textHeader,
                    textProperties: []
                }
    
                try {
                    nTestNode.receive( oMsg );    
                } catch(err) {
                    log("unexpected error while sending the message...");
                    done(err);
                }
               });
        });

    }

});


