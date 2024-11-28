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

describe('CNodeRedMsg Class Tests', function(){
    it('can handle message textProperties ', function (done) {
        let oMsg = { payload: strTestFile, textContent: strTestText1}
        let oMessageObj = new AUTODOC.CNodeRedMsg(oMsg);
        try {
            let strPropName1 = "Test.1";
            let strPropValue1 = "Testline no 1";
            oMessageObj.setTextPropertyByName(strPropName1,strPropValue1);
            oMessageObj.NodeInputMsg.should.have.property("textProperties");
            assert.strictEqual(oMessageObj.getTextPropertyValue(strPropName1),strPropValue1,"Compare values of prop1");
            done();
        } catch(err) {
            done(err);
        }
    });

});