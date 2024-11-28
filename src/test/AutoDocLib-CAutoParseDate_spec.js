/**
 * Test of AutoDoc Library - Test of CAutoParseDate Class
 */
var should = require("should");
var assert = require("assert");
const AUTODOC = require("../../red/lib/AutoDocLibV1.js");

class CDebugNode {
    tMessages = []
    trace(oData) {
        this.tMessages.push(oData);
    }
}

const strTestFile  = __filename;
const strTestText1 = "Sample Text with date 10/9/2010 for User Peter Liebl";

describe('CAutoParseDate Class Tests', function () {

    /**
     * Test Data Array
     */
    let tTestArray = [
        { input: "24.08.1959", prefix:"doc", name:"german formats",
            tests: [
                { name:"doc.date",      expected: "1959-08-24"},
                { name:"doc.day",       expected: "24" },
                { name:"doc.month",     expected: "08" },
                { name:"doc.language",  expected: "DEU" },
                { name:"doc.date.long", expected: "24 August 1959" },
                { name:"doc.monthname", expected: "August" }
            ] 
        },
        { input: "24. August 1959", prefix:"doc", name:"german long formats (dot)",
            tests: [
                { name:"doc.date",      expected: "1959-08-24"},
                { name:"doc.day",       expected: "24" },
                { name:"doc.month",     expected: "08" },
                { name:"doc.language",  expected: "DEU" },
                { name:"doc.date.long", expected: "24 August 1959" },
                { name:"doc.monthname", expected: "August" }
            ] 
        },
        { input: "24 August 1959", prefix:"doc", name:"german long formats",
            tests: [
                { name:"doc.date",      expected: "1959-08-24"},
                { name:"doc.day",       expected: "24" },
                { name:"doc.month",     expected: "08" },
                { name:"doc.language",  expected: "DEU" },
                { name:"doc.date.long", expected: "24 August 1959" },
                { name:"doc.monthname", expected: "August" }
            ] 
        },

        { input: "08/24/1959", prefix:"enu", name:"us formats",
            tests: [
                { name:"enu.date",          expected: "1959-08-24" },
                { name:"enu.day",           expected: "24" },
                { name:"enu.month",         expected: "08" },
                { name:"enu.language",      expected: "ENU" },
                { name:"enu.date.long",     expected: "24 August 1959" },
                { name:"enu.monthname",     expected: "August" }
            ]
        },
        { input: "1959-08-24", prefix:"iso", name:"ISO  formats",
            tests: [
                { name:"iso.date", expected: "1959-08-24" },
                { name:"iso.day", expected: "24" },
                { name:"iso.month", expected: "08" },
                { name:"iso.language", expected: "*" },
            ]
        }
    ];
  
  
    /** 
     * Run the tests
     */
    for(const oTestData of tTestArray) {
        it('can handle ' + oTestData.name, function (done) {
            let oDebugNode = new CDebugNode();
            let oDateMapper = new AUTODOC.CAutoParseDate(oDebugNode);
            try {
                oDateMapper.scanForDateAndLanguage(oTestData.input,oTestData.prefix,true);
                oDateMapper.should.have.property('Properties');
                for(const oTestElement of oTestData.tests) {
                    let strValue = oDateMapper.Properties.getVarValue(oTestElement.name);
                    oDebugNode.trace(" - testing : " + oTestElement.name + " == " + oTestElement.expected + " found (" + strValue + ")");
                    assert.equal(oTestElement.expected,strValue);
                }
                done();
            }
            catch(err){
                console.log(oDateMapper);
                done(err);
            }
        });
    }



});


