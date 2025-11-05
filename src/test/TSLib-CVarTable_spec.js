/**
 * Test of AutoDoc Library - Test of CAutoParseDate Class
 */
var should = require("should");
var assert = require("assert");
const AUTODOC = require("../../red/lib/TSLibV1.js");

class CDebugNode {
    tMessages = []
    trace(oData) {
        this.tMessages.push(oData);
    }
}

let Trace = false;

describe('CVarTable Class Tests', function () {
    let strTestVarName1 = "test";
    let strTestString1 = "Test string 1"
    let oVarTab1 = new AUTODOC.CVarTable();
    oVarTab1.setVarValue(strTestVarName1,strTestString1);

    it("should contain vars",function() {
        assert.equal(oVarTab1.getVarValue(strTestVarName1),strTestString1);
    });

    it("should contain the same elements in copy",function() {
        let oVarTab2 = new AUTODOC.CVarTable();
        oVarTab2.copyFrom(oVarTab1);
        assert.equal(oVarTab2.getVarValue(strTestVarName1),strTestString1);
    });

    it("should contain the same elements in list of vars",function() {
        assert.equal(oVarTab1.getAllKeyNames().length, 1);
        assert.equal(oVarTab1.getVarDefList().length,1);
    });
    it("should append an element list of vars",function() {
        let oVarTab2 = new AUTODOC.CVarTable();
        oVarTab2.copyFrom(oVarTab1);
        oVarTab2.setVarValue("new","new entry")
        assert.equal(oVarTab2.getAllKeyNames().length, 2);
        assert.equal(oVarTab2.getVarDefList().length,2);
    });

    it("should override the var if same name (case insensitive)",function() {
        oVarTab1.setVarValue(strTestVarName1.toUpperCase(),strTestString1);
        assert.equal(oVarTab1.getAllKeyNames().length, 1);
    });

    it("can be substituted (with formula)",function() {
        let oVarTab2 = new AUTODOC.CVarTable();
        oVarTab2.Trace = Trace;
        oVarTab2.setVarValue("var1","value1");
        oVarTab2.setVarValue("var2","value2");
        assert.strictEqual(oVarTab2.substituteLine("$(var1)-$(Var2)"),              "value1-value2",    "sustitute existing vars");
        assert.strictEqual(oVarTab2.substituteLine("$(var3)-$(Var2)"),              "$(var3)-value2",   "full var name if var does not exist");
        assert.strictEqual(oVarTab2.substituteLine("$(var3??)#$(Var2)"),            "#value2",          "blank if var does not exist (??)");
        assert.strictEqual(oVarTab2.substituteLine("$(var3??$(var2))#$(Var2)"),     "value2#value2",    "blank if var does not exist (??)");
        assert.strictEqual(oVarTab2.substituteLine("$(var3?? - $(Var2))"),          " - value2",        "Use var2 if var3 does not exist (??)");
        assert.strictEqual(oVarTab2.substituteLine("$(var3?)#$(Var2)"),             "#value2",          "blank if var does not exist (??)");
        assert.strictEqual(oVarTab2.substituteLine("$(var3?exist:$(var2))#$(Var2)"),"value2#value2",    "if then else sustitution (non exist)");
        assert.strictEqual(oVarTab2.substituteLine("$(var2?exist:$(var1))#$(Var1)"),"exist#value1",     "if then else sustitution (exist)");
    });

})