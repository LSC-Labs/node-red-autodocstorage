"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CFileLocker = exports.CTextParser = exports.CAutoParseDate = exports.CTargetFile = exports.TargetOption = exports.CNodeObjectContext = exports.CNodeRedMsg = exports.CAutoDocObject = exports.PROPERTY_LOG_MESSAGES = exports.PROPERTY_TEXTPROPERTY_LIST = exports.PROPERTY_LASTMATCH_CONTENT = exports.PROPERTY_TEXT_CONTENT = exports.OPTION_SEARCH_ANYCASE = exports.OPTION_SEARCH_NOMATCH = exports.OPTION_SEARCH_ATLEASTONE = exports.OPTION_SEARCH_FIRSTMATCH = exports.OPTION_SEARCH_ALLMATCHES = exports.TEXT_CONTENT_MSG_PROPERTY = exports.TEXT_CONTENT_PROPERTY = exports.TEXT_CONTENT_FILENAME = exports.TEXT_CONTENT_LASTMATCH = exports.TEXT_CONTENT_DOCUMENT = void 0;
exports.writeToStorageLogOf = writeToStorageLogOf;
// @ts-check
// AutoDocLibV1 - Library for Node Red AutoDoc Storage with Stirling Service
//
// (c) 2023 LSC-Labs - P.Liebl
//
//
const TSLibV1_1 = require("./TSLibV1");
const CONST = __importStar(require("./AutoDocDefs"));
const FS = __importStar(require("fs"));
const PATH = __importStar(require("path"));
// #region common functions
function writeToStorageLogOf(strSourceFileName, strMessage) {
    if (strSourceFileName) {
        let oSourceFile = new TSLibV1_1.CFileInfo(strSourceFileName);
        if (oSourceFile.ParentDirName) {
            let strCopyLog = PATH.join(oSourceFile.ParentDirName, CONST.STORAGE_LOG_NAME);
            let strData = new Date().toISOString().substring(0, 19) + " : " + strMessage;
            FS.appendFileSync(strCopyLog, "\n" + strData);
        }
    }
}
// #endregion
// #region Constants and definitions 
// Config Properties and options
exports.TEXT_CONTENT_DOCUMENT = "DocumentText";
exports.TEXT_CONTENT_LASTMATCH = "LastMatch";
exports.TEXT_CONTENT_FILENAME = "FileName";
exports.TEXT_CONTENT_PROPERTY = "Property";
exports.TEXT_CONTENT_MSG_PROPERTY = "MessageProperty";
// Search Options
exports.OPTION_SEARCH_ALLMATCHES = "AllMatches";
exports.OPTION_SEARCH_FIRSTMATCH = "FirstMatch";
exports.OPTION_SEARCH_ATLEASTONE = "AtLeastOne";
exports.OPTION_SEARCH_NOMATCH = "NoMatch";
exports.OPTION_SEARCH_ANYCASE = "AnyCase";
// Message Properties
exports.PROPERTY_TEXT_CONTENT = "textContent";
exports.PROPERTY_LASTMATCH_CONTENT = "lastMatchContent";
exports.PROPERTY_TEXTPROPERTY_LIST = "textProperties";
exports.PROPERTY_LOG_MESSAGES = "lastMessages";
// #endregion
// #region common classes
class CAutoDocObject {
    Trace = false;
    myObj;
    constructor(oObj) {
        this.myObj = oObj;
    }
    traceToConsole(strName, oData) {
        if (this.Trace) {
            if (typeof oData === 'string') {
                console.log(`[T] ${strName} : ` + oData);
            }
            else {
                console.log(oData);
            }
        }
    }
    /**
     *
     * @param strName Name of the property to be requested
     * @returns the property, or if it does not exist, the default
     */
    getObjProperty(strName, oDefault) {
        return (this.myObj ? this.myObj[strName] : oDefault);
    }
    /**
     * Get the property or create the property if it does not exist.
     * @param strName Name of the object property
     * @param oProp Property to be set if it does not exist
     * @returns
     */
    getOrCreateObjProperty(strName, oProp) {
        let oResult = this.getObjProperty(strName);
        if (!oResult) {
            this.setObjProperty(strName, oProp);
            oResult = this.getObjProperty(strName);
        }
        return (oResult);
    }
    setObjProperty(strName, oProp) {
        if (this.myObj)
            this.myObj[strName] = oProp;
    }
}
exports.CAutoDocObject = CAutoDocObject;
// #endregion
// #region Node RED Message Class
/**
 * Covers the node red input message and gets/sets the properities
 * in this message in a common way over the modules.
 * Needs the node - red message in the constructor.
 */
class CNodeRedMsg extends CAutoDocObject {
    /**
     * The Node - RED Message
     */
    NodeInputMsg;
    /**
     * Constructor of this object
     * @param msg the Node RED Message (partial)
     */
    constructor(msg) {
        super(msg);
        this.NodeInputMsg = msg;
    }
    // #region Logging and common functions
    logEntry(strName, strMessage) {
        this.traceToConsole(strName, strMessage);
        this.insertLogMessage(strName, strMessage);
    }
    //  Message - Property Access Area
    getNodeRedMessageObject() {
        return (this.NodeInputMsg);
    }
    /**
     * set the last message to the queue on the message object.
     * @param strPrefix prefix, like the node name
     * @param strMessage  the message to be stored
     */
    insertLogMessage(strName, strMessage) {
        if (!this.getObjProperty(exports.PROPERTY_LOG_MESSAGES))
            this.setObjProperty(exports.PROPERTY_LOG_MESSAGES, []);
        this.getObjProperty(exports.PROPERTY_LOG_MESSAGES).push({ ts: new Date(), name: strName, text: strMessage });
    }
    getDiagDataAsTextBlock() {
        let strDiagData = "AutoDoc (c) LSC-Labs\n";
        strDiagData += "====================\n";
        strDiagData += "Input File: " + this.NodeInputMsg.payload + "\n";
        strDiagData += "------------------------------------------------------------------------\n";
        strDiagData += "Messages\n";
        strDiagData += "------------------------------------------------------------------------\n";
        let nLen = 0;
        for (let oMessageBlock of this.getObjProperty(exports.PROPERTY_LOG_MESSAGES, [])) {
            nLen = Math.max(nLen, oMessageBlock.name.length);
        }
        for (let oMessageBlock of this.getObjProperty(exports.PROPERTY_LOG_MESSAGES, [])) {
            let strPrefix = ("[" + (oMessageBlock.name ?? "-") + "] " + " ".repeat(nLen - oMessageBlock.name.length));
            if (oMessageBlock)
                strDiagData += strPrefix + (oMessageBlock.text ?? "-") + "\n";
        }
        strDiagData += "\n";
        strDiagData += "------------------------------------------------------------------------\n";
        strDiagData += "Final properties\n";
        strDiagData += "------------------------------------------------------------------------\n";
        nLen = 0;
        for (let oProperty of this.getObjProperty(exports.PROPERTY_TEXTPROPERTY_LIST, [])) {
            nLen = Math.max(nLen, oProperty.name.length);
        }
        for (let oProperty of this.getObjProperty(exports.PROPERTY_TEXTPROPERTY_LIST, [])) {
            let strPrefix = ((oProperty.name ?? "-") + " ".repeat(nLen - oProperty.name.length));
            if (oProperty)
                strDiagData += strPrefix + " == " + oProperty.value + "\n";
        }
        strDiagData += "\n";
        strDiagData += "------------------------------------------------------------------------\n";
        strDiagData += "Text content\n";
        strDiagData += "------------------------------------------------------------------------\n";
        strDiagData += this.getObjProperty(exports.PROPERTY_TEXT_CONTENT, "");
        strDiagData += "\n";
        strDiagData += "------------------------------------------------------------------------\n";
        strDiagData += "Last match content\n";
        strDiagData += "------------------------------------------------------------------------\n";
        strDiagData += this.getObjProperty(exports.PROPERTY_LASTMATCH_CONTENT, "");
        strDiagData += "\n";
        return (strDiagData);
    }
    // #endregion
    // #region well known objects in the message object
    getTextContent() {
        return (this.getObjProperty(exports.PROPERTY_TEXT_CONTENT, ""));
    }
    /**
     * Text to be scanned.
     * Resets also the LastMatch property
     * @param strText Text to be set
     */
    setTextContent(strText) {
        this.setObjProperty(exports.PROPERTY_TEXT_CONTENT, strText ?? "");
        this.setLastMatchContent("");
    }
    /**
     * Last Match for selection.
     * @param strText Text to be set
     */
    setLastMatchContent(strText) {
        this.setObjProperty(exports.PROPERTY_LASTMATCH_CONTENT, strText ?? "");
    }
    getLastMatchContent() {
        return (this.getObjProperty(exports.PROPERTY_LASTMATCH_CONTENT, ""));
    }
    getSourceFilename() {
        return (this.getObjProperty("payload", ""));
    }
    setSourceFilename(strName) {
        this.setObjProperty("payload", strName);
    }
    getTextPropertyList() {
        return (this.getOrCreateObjProperty(exports.PROPERTY_TEXTPROPERTY_LIST, []));
    }
    // #endregion
    // #region Text Content in search context
    /**
     * Get the text to be scanned by Property parsers
     * If mode is not set, the mode will be extracted from this message.
     * Default is the document text, but if source is set to "LastMatch",
     * the las match will be used, if set.
     * @param strMode
     * @returns the text.
     */
    getTextContentToBeParsed(strMode, strPropertyName) {
        let strTextToScan;
        if (this.NodeInputMsg) {
            if (strMode == exports.TEXT_CONTENT_LASTMATCH) {
                strTextToScan = this.getLastMatchContent();
            }
            else if (strMode == exports.TEXT_CONTENT_FILENAME) {
                strTextToScan = this.getSourceFilename();
            }
            else if (strMode == exports.TEXT_CONTENT_PROPERTY) {
                strTextToScan = this.getTextPropertyValue(strPropertyName ?? "") ?? "";
            }
            else if (strMode == exports.TEXT_CONTENT_MSG_PROPERTY) {
                strTextToScan = this.getMessagePropertyValue(strPropertyName ?? "") ?? "";
            }
            else {
                strTextToScan = this.getTextContent();
            }
        }
        return (strTextToScan ?? "");
    }
    //#endregion
    // #region Text Property Handling
    setTextPropertyByName(strName, strValue) {
        let oProp = {
            name: strName,
            value: strValue
        };
        this.setTextProperty(oProp);
    }
    /**
     * set a text property
     * overrides an existing one..
     * @param oProperty Property to be set
     */
    setTextProperty(oProperty, strNodeName) {
        let oPropertyList = this.getOrCreateObjProperty(exports.PROPERTY_TEXTPROPERTY_LIST, []);
        if (oPropertyList) {
            const nIdx = oPropertyList.findIndex(oProp => oProp.name.toLowerCase() === oProperty.name.toLowerCase());
            if (nIdx > -1) {
                oPropertyList.splice(nIdx, 1);
            }
            if (!oProperty.value)
                oProperty.value = "";
            if (strNodeName)
                this.logEntry(strNodeName, " - setting property : '" + oProperty.name + "' to '" + oProperty.value + "'");
            oPropertyList.push(oProperty);
        }
    }
    appendTextPropertyList(tProperties) {
        for (const oProp of tProperties) {
            this.setTextProperty(oProp);
        }
    }
    getMessagePropertyValue(strPropName) {
        let strResult;
        if (this.NodeInputMsg.payload) {
            const strKey = strPropName;
            strResult = this.myObj[strKey];
        }
        return (strResult);
    }
    getTextPropertyValue(strPropName) {
        let oPropertyList = this.getObjProperty(exports.PROPERTY_TEXTPROPERTY_LIST, []);
        const nIdx = oPropertyList.findIndex(oProp => oProp.name.toLowerCase() == strPropName.toLowerCase());
        let strResult = nIdx > -1 ? oPropertyList.at(nIdx)?.value : undefined;
        return (strResult);
    }
}
exports.CNodeRedMsg = CNodeRedMsg;
// #endregion
// #region NodeObjectContext
class CNodeObjectContext extends CAutoDocObject {
    // #region Main object like this, Config and the Message
    // the Node object (this)
    Node;
    // the configuration of this Node
    Config;
    // the Message as object to be processed
    Message;
    // the NodeName as initialized (either from config or default)
    NodeName;
    // #endregion
    // #region Constructor and prepare with message
    constructor(oNodeObj, oConfig, oNodeRedMsg, strDefaultName) {
        super(oNodeObj);
        this.Node = oNodeObj;
        this.Config = oConfig;
        this.Message = new CNodeRedMsg(oNodeRedMsg);
        this.NodeName = oConfig?.name ?? strDefaultName;
        this.Trace = oConfig?.TraceMode ?? false;
        if (this.NodeName.length < 1)
            this.NodeName = strDefaultName;
        this.trace(" - trace mode enabled...");
    }
    // #endregion
    // #region Functions and logic
    getMessage() {
        return (this.Message?.getNodeRedMessageObject());
    }
    getMessagePayload() { return (this.getMessage()?.payload); }
    setMessagePayload(oData) {
        this.Message.setSourceFilename(oData);
    }
    /**
     * Check if the data is at minimum lenth, and the chars inside
     * the first data are not control characters or zero.
     *
     * @param strData Data to be checked (if undefined, use the text content of this message)
     * @returns true, if the strData is valid
     */
    isValidTextBlock(strData) {
        let bResult = false;
        let nMinCode = this.Config.minCharCode ?? 7;
        let nMinLen = this.Config.minLength ?? 20;
        if (!strData)
            strData = this.Message.getTextContent();
        if (strData && strData.length > nMinLen) {
            bResult = true;
            for (let i = 0; i < nMinLen; i++) {
                let nCharCode = strData.charCodeAt(i);
                if (nCharCode < nMinCode) {
                    bResult = false;
                    break;
                }
            }
            if (!bResult) {
                this.log(" - invalid data in preamble of the document. (first " + nMinLen + "chars)");
            }
        }
        else {
            this.log(" - not enough data in document. Found " + strData.length + " bytes - expected " + nMinLen);
        }
        return (bResult);
    }
    // #endregion
    // #region Node Logging and Tracing
    log(strMessage) {
        if (this.Message) {
            this.Message.logEntry(this.NodeName, strMessage);
        }
    }
    warn(oMessage) {
        this.log((typeof oMessage === 'string') ? "[W] " + oMessage : oMessage);
        this.Node.warn(oMessage);
    }
    error(oMessage) {
        this.log((typeof oMessage === 'string') ? "[E] " + oMessage : oMessage);
        this.Node.error(oMessage);
    }
    trace(oData) {
        this.Node.trace(oData);
        this.traceToConsole(this.NodeName, oData);
    }
    getDiagDataAsTextBlock() {
        return (this.Message.getDiagDataAsTextBlock());
    }
    getTextContentToBeParsed(strMode, strPropertyName) {
        return (this.Message.getTextContentToBeParsed(strMode, strPropertyName));
    }
}
exports.CNodeObjectContext = CNodeObjectContext;
// #endregion
// #region Target File Naming
var TargetOption;
(function (TargetOption) {
    TargetOption["override"] = "override";
    TargetOption["rename"] = "rename";
    TargetOption["noaction"] = "noaction";
})(TargetOption || (exports.TargetOption = TargetOption = {}));
/**
 * TargetFile Class
 * Depending on the TargetOption, the target file name will be calculated by this class.
 * Instance this class with the original filename like ("inputfile.pic",".pdf").
 * The class will replace the extension with the requested one (default is - no replace)
 * Depending on the mode, the new name will
 * "override" the target
 * "rename" - find a new name, by incrementing a number at the end of the filename.
 * "noaction" - will set the result to "undefined" - don't use further information of this object !!!
 *
 * The new calculated target name is in "NameOfFile", after instanciating the file
 * All fileinfos are in place for the new file, so it can be used by the calling module.
 */
class CTargetFile extends TSLibV1_1.CFileInfo {
    NameOfFile;
    constructor(strFileName, oOptions, strExpectedExtension) {
        super(strFileName);
        this.NameOfFile = this.getFileNameWithCorrectExtension(strFileName, strExpectedExtension);
        this.setData(this.NameOfFile);
        // Set a default existOption if it is not in place..
        let strExistOption = oOptions.existOption ?? TargetOption.rename;
        switch (strExistOption) {
            case TargetOption.noaction:
                // File already exists ? then it should not be processed.
                // Set NameOfFile to undefined !
                if (this.Exists) {
                    this.NameOfFile = undefined;
                }
                break;
            case TargetOption.rename:
                {
                    // File already exists ? the build a new file name
                    let strNativeName = this.NameOfFile.substring(0, strFileName.length - (this.Extension ? this.Extension.length : 0));
                    let nCounter = 1;
                    while (this.Exists) {
                        this.NameOfFile = strNativeName + "-(" + (nCounter++) + ")" + this.Extension;
                        this.setData(this.NameOfFile);
                    }
                }
                break;
            case TargetOption.override:
                // The hard way... override anyway !
                break;
            default:
                // In correct operation, this could not happen (type checking), but who knows ?
                this.NameOfFile = undefined;
                break;
        }
    }
    /**
     * Replaces the extension of the file, with the extension the user is asking for.
     * @param strFileName original filename
     * @param strExpectedExtension New extension like ".pdf"
     * @returns the filename with the new extension in place.
     */
    getFileNameWithCorrectExtension(strFileName, strExpectedExtension) {
        let strCurExtension = PATH.extname(strFileName);
        if (strExpectedExtension && strCurExtension && strCurExtension != strExpectedExtension) {
            strFileName = strFileName.substring(0, strFileName.length - strCurExtension.length) + strExpectedExtension;
        }
        return (strFileName);
    }
}
exports.CTargetFile = CTargetFile;
/**
 * Auto Date Parser..
 * Detects time formats and depending language
 *
 * Uses a DateDookup Table (IDateLookup).
 * Replace or enrich this table to implement other languages.
 * Currenty DEU (Germany) and ENU (Amerika) is implemented to be able to detect the formats:
 * DD.MM.YYYY and MM/DD/YYYY.
 *
 * Limitations: Detections
 */
class CAutoParseDate {
    Context;
    _ScanProps = new TSLibV1_1.CVarTable();
    Properties = new TSLibV1_1.CVarTable();
    constructor(oContext) {
        this.Context = oContext;
    }
    trace(oData) {
        if (this.Context)
            this.Context.trace(oData);
        else
            console.log(oData);
    }
    log(oData) {
        if (this.Context)
            this.Context.log(oData);
    }
    DateLookup = [
        {
            Types: ["DEU", "Default"],
            Lang: "DEU",
            MonthNames: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
            FormatLongName: "$(day) $(MonthName) $(year)",
            ScanMasks: [
                { Format: "Month", Masks: ["(?<day>\\d{1,2})\\.(?<Month>\\d{1,2})\\.(?<Year>\\d{2,4})"] },
                { Format: "MonthNames", Masks: ["(?<Day>\\d{1,2})\\.{0,1} (?<MonthName>[A-Za-zä]{3,9}) (?<Year>\\d{2,4})",] }
            ],
        },
        {
            Types: ["ENU", "Default"],
            Lang: "ENU",
            MonthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            ScanMasks: [
                { Format: "Month", Masks: ["(?<Month>\\d{1,2})\\s*/\\s*(?<day>\\d*)\\s*/\\s*(?<Year>\\d{2,4})"] }
            ]
        },
        {
            Types: ["ISO", "Default"],
            Lang: "*",
            ScanMasks: [
                { Format: "Month", Masks: ["(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})"] }
            ]
        }
    ];
    getVar(strName) {
        return (this.Properties.getVarValue(strName, undefined));
    }
    substituteLine(strLine) {
        return (this.Properties.substituteLine(strLine));
    }
    scanForDateAndLanguage(strText, strNamePrefix, bWithLanguage = false, strForceType = "Default") {
        let bResult = false;
        this.trace(" - scanning input: " + strText);
        this.trace(" - using prefix  : " + strNamePrefix);
        this._ScanProps.clear();
        for (const oLookup of this.DateLookup) {
            if (oLookup.Types.includes(strForceType)) {
                for (const oScanMaskDefs of oLookup.ScanMasks) {
                    for (const strScanMask of oScanMaskDefs.Masks) {
                        this.trace(" - try to match '" + strScanMask + "' ...");
                        // only global and ignore cases - no multiline as the date is in one line.
                        let oRegExp = new RegExp(strScanMask, "gi");
                        let oMatch = oRegExp.exec(strText);
                        if (oMatch) {
                            this.setRegexMatchResultValues(oMatch, oLookup, oScanMaskDefs);
                            if (bWithLanguage)
                                this._ScanProps.setVarValue("language", oLookup.Lang);
                            this.enrichLocalVarsWithPrefix(strNamePrefix);
                            bResult = true;
                            return (bResult);
                        }
                    }
                }
            }
        }
        return (bResult);
    }
    enrichLocalVarsWithPrefix(strNamePrefix) {
        if (strNamePrefix) {
            // make a backup copy of local vars - and clear
            this.Properties.clear();
            // store the names with the prefix
            let strPrefix = strNamePrefix + ".";
            for (const oVar of this._ScanProps.getVarDefList()) {
                if (oVar) {
                    this.trace("-- Setting property : " + strPrefix + oVar.name + " == " + oVar.value);
                    this.Properties.setVarValue(strPrefix + oVar.name, oVar.value);
                }
            }
        }
    }
    /**
     * Sets the local vars, depending on the content of a regulare expression match object.
     * @param oMatch a regular expression execution result object.
     */
    setRegexMatchResultValues(oMatch, oDateLookup, oScanMaskDef) {
        //        let strVarPrefix = strNamePrefix ? strNamePrefix + "." : "";
        this._ScanProps.setVarValue("match", oMatch[0]);
        // Set the default result and the default Groups (1...n);
        let nIndex = 0;
        // Replace the named groups if found...
        // see https://stackoverflow.com/questions/5367369/named-capturing-groups-in-javascript-regex
        let strMonthName;
        let strMonth;
        for (let strGroupName in oMatch.groups) {
            // Specials for the month information - name the group names exact like this:
            switch (strGroupName) {
                case "MonthName":
                    strMonthName = oMatch.groups[strGroupName];
                    break;
                case "Month":
                    strMonth = oMatch.groups[strGroupName];
                    break;
            }
            // Set the var - same as the groupname
            this._ScanProps.setVarValue(strGroupName, oMatch.groups[strGroupName]);
            this.trace(" ---- setting regex group result : " + strGroupName + " == " + oMatch.groups[strGroupName]);
        }
        this.correctDateNameInfos(oDateLookup, strMonth, strMonthName);
    }
    correctDateNameInfos(oDateLookup, strMonth, strMonthName) {
        // Number of month, but no long - name... use lookup if exists
        if (strMonth && !strMonthName && oDateLookup.MonthNames) {
            let nMonthIndex = Number(strMonth) - 1;
            let strLocalMonthName = (nMonthIndex > -1 && oDateLookup.MonthNames.length > nMonthIndex) ? oDateLookup.MonthNames[nMonthIndex] : undefined;
            if (strLocalMonthName) {
                this._ScanProps.setVarValue("MonthName", strLocalMonthName);
                strMonthName = strLocalMonthName;
            }
        }
        // Name of month, but no number.... use lookup if exists
        if (strMonthName && !strMonth && oDateLookup.MonthNames) {
            let strMonthNameSearch = strMonthName.toLowerCase();
            for (let nIndex = 0; nIndex < oDateLookup.MonthNames.length; nIndex++) {
                let strLocalMonthName = oDateLookup.MonthNames[nIndex];
                if (strLocalMonthName.toLowerCase() == strMonthNameSearch) {
                    this._ScanProps.setVarValue("Month", "" + (nIndex + 1));
                }
            }
        }
        // Correct the Month Number to 2 digits !
        let strMonthNumber = this._ScanProps.getVarValue("Month", "0");
        if (strMonthNumber && strMonthNumber.length < 2)
            this._ScanProps.setVarValue("Month", "0" + strMonthNumber);
        // Correct the Day Number to 2 digits !
        let strDayNumber = this._ScanProps.getVarValue("Day");
        if (strDayNumber) {
            if (strDayNumber.length == 1)
                this._ScanProps.setVarValue("Day", "0" + strDayNumber);
        }
        // Correct the Year Number to 2 digits !
        let strYearNumber = this._ScanProps.getVarValue("Year");
        if (strYearNumber) {
            if (strYearNumber.length == 2)
                this._ScanProps.setVarValue("Year", "20" + strYearNumber);
        }
        // now build the ISO date string - and the long string...
        this._ScanProps.setVarValue("date", this._ScanProps.substituteLine("$(year)-$(month)-$(day)"));
        if (strMonthName) {
            let strMask = oDateLookup.FormatLongName ?? "$(day) $(monthname) $(year)";
            this._ScanProps.setVarValue("date.long", this._ScanProps.substituteLine(strMask));
        }
    }
}
exports.CAutoParseDate = CAutoParseDate;
// #endregion
// #region Text Parsing functions
class CTextParser extends TSLibV1_1.CVarTable {
    // #region Constructor & Vars
    /**
     * Prepare a Text Parser.
     * First use the additional properties, then load the context message properties.
     * @param oContext Context definition from AutoDoc
     * @param tProperties Additional service properties (loads first if in place)
     */
    constructor(oContext, tProperties) {
        super();
        this.Context = oContext;
        for (const oProp of tProperties ?? []) {
            this.setVarValue(oProp.name, oProp.value);
        }
        for (const oProp of oContext.Message.getTextPropertyList() ?? []) {
            this.setVarValue(oProp.name, oProp.value);
        }
    }
    Context;
    trace(oData) {
        if (this.Context)
            this.Context.trace(oData);
    }
    LastRegExp;
    LastMatchResult;
    LastMatchString;
    // #endregion
    // #region Functions
    loadTextPropertiesFrom(oNodeMsg) {
        for (const oProperty of oNodeMsg.getTextPropertyList()) {
            this.setVarValue(oProperty.name, oProperty.value);
        }
    }
    getTextPropertyList() {
        let tProperties = [];
        for (let oVar of this.getVarDefList()) {
            let oProp = { name: oVar.name, value: oVar.value };
            tProperties.push(oProp);
        }
        return (tProperties);
    }
    /**
     * Parse the text with a regular expression.
     * If a match comes in place, the "LastMatchResult" contains the Match object,
     * The LastMatchText contains the matched text
     * In addition, the match values becomes available via property vars.
     * ${0} contains the matched text,
     * ${1..n} contains the matched groups.
     * If you are using the extended group naming functions in the regex expression,
     * the groupnames are also set ${groupname}.
     * @param strText Text to be parsed
     * @param strRegExMask The regular expression
     * @param oOptions The parse options
     * @returns
     */
    matchByRegexMask(strText, strRegExMask, oOptions) {
        this.LastMatchResult = undefined;
        this.trace(" - try to match '" + strRegExMask + "' in global context...");
        let strSearchOptions = "g" + (oOptions?.caseSensitive ? "" : "i");
        let oRegExp = new RegExp(strRegExMask, strSearchOptions);
        let oMatch = oRegExp.exec(strText);
        this.setRegexMatchResultValues(oMatch, oOptions);
        return (!!this.LastMatchResult);
    }
    /**
     * Parses a list of regular expression.
     * Either all expressions are executed, or only until the first expression is matching.
     * The workhorse is th matchByRegexMask funciton
     * @see Options.
     * @see matchByRegexMask
     * @param strText Text to be parsed
     * @param tRegexMasks a list of regular expressions
     * @param oOptions The parse options
     * @returns
     */
    matchByRegexMaskList(strText, tRegexMasks, oOptions) {
        let bScanResult = false;
        let strTotalMatchString = undefined;
        let strSearchMode = oOptions.searchMode ?? exports.OPTION_SEARCH_ALLMATCHES;
        this.trace("matchByRegexMaskList()");
        this.trace("  - searchMode: " + strSearchMode + " - case sensitive:" + oOptions.caseSensitive);
        this.trace("================ start scanning for regex masks...");
        for (let strRegEx of tRegexMasks) {
            let bMatchFound = this.matchByRegexMask(strText, strRegEx, oOptions);
            if (bMatchFound) {
                if (strSearchMode == exports.OPTION_SEARCH_NOMATCH) {
                    this.trace(" --- MATCH - terminating, cause mode is NoMatch... ");
                    // Reset the results, cause nothing should be touched in this mode !
                    this.clear();
                    bScanResult = true;
                    break;
                }
                if (strTotalMatchString)
                    strTotalMatchString += "\n" + this.LastMatchString;
                else
                    strTotalMatchString = this.LastMatchString;
                bScanResult = true;
                if (strSearchMode == exports.OPTION_SEARCH_FIRSTMATCH) {
                    this.trace(" --- MATCH - terminating, cause mode is scanFirstMatch.");
                    break;
                }
            }
            else {
                // If all masks have to match, the result is false
                // if one of the regex will fail...
                if (strSearchMode == exports.OPTION_SEARCH_ALLMATCHES) {
                    bScanResult = false;
                    this.trace(" --- NO MATCH - terminating, cause mode is scanAllMatches.");
                    break;
                }
            }
            this.trace(" --- continue search...");
        }
        this.trace("matchByRegexMaskList(" + bScanResult + ")");
        this.LastMatchString = strTotalMatchString;
        return (bScanResult);
    }
    /**
     * Sets the local vars, depending on the content of a regulare expression match object.
     * @param oMatch a regular expression execution result object.
     */
    setRegexMatchResultValues(oMatch, oOptions) {
        this.LastMatchResult = oMatch;
        this.LastMatchString = oMatch ? oMatch[0] : undefined;
        this.trace(" -- regex result found: " + this.LastMatchString);
        let bFirstGroupName = oOptions?.firstGroupName;
        if (oMatch) {
            // Set the default result and the default Groups (1...n);
            let nIndex = 0;
            while (oMatch[nIndex]) {
                this.setVarValue("" + nIndex, oMatch[nIndex]);
                nIndex++;
            }
            // Replace the named groups if found...
            // see https://stackoverflow.com/questions/5367369/named-capturing-groups-in-javascript-regex
            if (oMatch.groups) {
                for (let strGroupName in oMatch.groups) {
                    let toBeSet = true;
                    if (bFirstGroupName)
                        toBeSet = this.getVarDef(strGroupName) == undefined;
                    if (toBeSet) {
                        this.setVarValue(strGroupName, oMatch.groups[strGroupName]);
                        this.trace(" ---- setting regex group result : " + strGroupName + " == " + oMatch.groups[strGroupName]);
                    }
                }
            }
        }
    }
}
exports.CTextParser = CTextParser;
var LockStatus;
(function (LockStatus) {
    LockStatus[LockStatus["unknown"] = 0] = "unknown";
    LockStatus[LockStatus["locked"] = 1] = "locked";
    LockStatus[LockStatus["unlocked"] = 2] = "unlocked";
})(LockStatus || (LockStatus = {}));
class CFileLocker {
    LOCK_FILE_EXTENSION = ".lock";
    _ForFileName;
    _LockStatus = LockStatus.unknown;
    _LockData;
    Context;
    /**
     *
     */
    constructor(oContext) {
        this.Context = oContext;
        this._ForFileName = oContext.Message?.getSourceFilename();
    }
    /**
     * check if the file is a LockFile.
     * If a strFileName is specified, this file will be checked,
     * otherwise the filename for this instance will be used.
     * The file has to end with the defined lockfile extension,
     * the content is a JSON object with the propertiny isLockFile set to "true".
     * @param strFileName (optional) Filename to check
     * @returns
     */
    isLockFile(strFileName) {
        let isValid = false;
        let strFileToCheck = strFileName ?? this._ForFileName;
        if (strFileToCheck.endsWith(this.LOCK_FILE_EXTENSION)) {
            let oLockData = this.getLockFileContent(strFileToCheck);
            if (oLockData)
                isValid = oLockData.isLockFile && oLockData.isLockFile == true;
        }
        return (isValid);
    }
    isStorageLogFile(strFileName) {
        let strFileToCheck = strFileName ?? this._ForFileName;
        let oFileInfo = new TSLibV1_1.CFileInfo(strFileToCheck);
        return (oFileInfo.FileName == CONST.STORAGE_LOG_NAME);
    }
    /**
     * Gets the name for the lockfile.
     * @returns the lockfilename or undefined - if no ForFileName is in place
     */
    getLockFileName() {
        return (this._ForFileName ? this._ForFileName + this.LOCK_FILE_EXTENSION : undefined);
    }
    /**
     * Checks if a file with the name of the lockfile is in place
     * Ensure that it is also a valid lock file, before assuming that the lock is in place.
     * see: isValidLockFileInPlace()
     * @returns true or false
     */
    doesLockFileExists() {
        let strLockFileName = this.getLockFileName();
        return (strLockFileName ? FS.existsSync(strLockFileName) : false);
    }
    /**
     * checks if a lockfile is in place, and the lock counter is > 0
     * @returns true if the file is "locked"
     */
    isLocked() {
        let bIsLocked = false;
        if (this.isValidLockFileInPlace())
            bIsLocked = this._LockStatus == LockStatus.locked;
        return (bIsLocked);
    }
    /**
     * Checks if a valid lock file is in place.
     * It must exist and the content has to be a valid Json object with the correct tags inside.
     * @returns true or false
     */
    isValidLockFileInPlace() {
        let isValid = false;
        let oLockData = this.getLockFileContent();
        if (oLockData) {
            isValid = oLockData.isLockFile && oLockData.isLockFile == true;
            this._LockStatus = isValid && oLockData.LockCounter > 0 ? LockStatus.locked : LockStatus.unlocked;
        }
        return (isValid);
    }
    writeLockFileContent(oData) {
        if (!this.doesLockFileExists() || this.isValidLockFileInPlace()) {
            let strLockFileName = this.getLockFileName();
            if (strLockFileName) {
                FS.writeFileSync(strLockFileName, JSON.stringify(oData));
                this._LockData = oData;
                this._LockStatus = LockStatus.locked;
            }
        }
    }
    /**
     * Get the content of a lockfile
     * If strFileName is set, this file will be used,
     * otherwise, the lockfilename of this instance will be used.
     *
     * Expecting, that the object only exists for a short processing
     * time - no reload is in place (!) this can become an issue (!)
     * ==> LockData will be stored in _LockData for caching and query optimization
     * @param strFileName (optional) filename to be addressed
     * @returns
     */
    getLockFileContent(strFileName) {
        let strFileToCheck = strFileName ?? this.getLockFileName() ?? "_";
        let oData = this._LockData;
        try {
            if (!oData) {
                oData = JSON.parse(FS.readFileSync(strFileToCheck).toString());
            }
            if (oData?.isLockFile == undefined || oData.isLockFile != true)
                oData = undefined;
            if (oData)
                this._LockData = oData;
        }
        catch { }
        return (oData);
    }
    /**
     * Lock the file. (no lock file is in place)
     * If a lock is already in place, or the lock is already a file with this name,
     * but not a valid lock file, the result is false.
     * If the lock can be set (with lock - counter 1) - the result is true.
     * If you want to set a second lock, use the increment lock call...
     * @returns true if lock can be set
     */
    setLock() {
        let bLocked = false;
        if (!this.isValidLockFileInPlace() && !this.doesLockFileExists()) {
            let oLockData = {
                isLockFile: true,
                TS: Date.now(),
                ForFileName: this._ForFileName,
                LockCounter: 1,
            };
            this.writeLockFileContent(oLockData);
            bLocked = true;
            this.Context.log(" - lock set for: " + this._ForFileName);
        }
        return (bLocked);
    }
    incrementLock() {
        let bLocked = false;
        let oLockData = this.getLockFileContent();
        let nLockCounter = 1;
        if (oLockData) {
            oLockData.LockCounter++;
            nLockCounter = oLockData.LockCounter;
            this.writeLockFileContent(oLockData);
            bLocked = true;
        }
        else {
            bLocked = this.setLock();
        }
        if (bLocked)
            this.Context.log(` - lock incremented for "${this._ForFileName}" - ${nLockCounter} lock(s) in place now`);
        return (bLocked);
    }
    /**
     * Remove the lock
     * Be aware, if bForce is false, the lock will be decremented.
     * The result is true, but the lock is still in place (!)
     * @param bForce true == Force the unlock - ignore counter / false == decrement the counter and remove if counter is 0
     * @returns true, if the removement was successful.
     */
    removeLock(bForce = false) {
        let bSuccess = false;
        if (this.doesLockFileExists()) {
            bSuccess = false;
            let oLockData = this.getLockFileContent();
            if (oLockData) {
                let nLockCounter = oLockData.LockCounter;
                if (!bForce && oLockData.LockCounter > 1) {
                    oLockData.LockCounter--;
                    this.writeLockFileContent(oLockData);
                    bSuccess = true;
                    this.Context.log(" - lock decremented for: " + this._ForFileName + " to new counter: " + oLockData.LockCounter);
                }
                else {
                    let strLockfileName = this.getLockFileName();
                    if (strLockfileName)
                        FS.unlinkSync(strLockfileName);
                    this._LockData = undefined;
                    this._LockStatus = LockStatus.unlocked;
                    bSuccess = true;
                    this.Context.log(` - ${nLockCounter} lock(s) removed for: "${this._ForFileName}"`);
                }
            }
            else {
                this.Context.warn(` - ${this.getLockFileName()} is not a valid logfile... - no action taken`);
            }
        }
        else {
            this.Context.warn(` - lockfile ${this.getLockFileName()} does not exist... - no action taken`);
        }
        return (bSuccess);
    }
    /**
  * Checks the msg.event (set by the file monitor) is matching
  * the Config.changeEvent, selected by the user...
  *
  * @param {*} oConfig config as sent by node red
  * @param {*} oMsg    message as sent by node red
  * @returns true, if the event is matching the user selection
  */
    doesChangeEventMatch() {
        let bResult = false;
        if (this.Context.Config.changeEvent == "all" || this.Context.Config.changeEvent == this.Context.Message.getObjProperty("event"))
            bResult = true;
        return (bResult);
    }
    /**
     * Checks the file extension against the filters, the user requested.
     * @param {string} strFileName
     * @param {oConfig} oConfig
     * @returns true if the the extension matches the user selection
     */
    doesLockFileFilterMatch() {
        let bResult = false;
        const strExtension = PATH.extname(this._ForFileName).toLowerCase();
        try {
            if (this.Context.Config.FilterMasks && this.Context.Config.FilterMasks.length > 0) {
                for (let strExtensionTypeData of this.Context.Config.FilterMasks.split(';')) {
                    let strExtensionType = strExtensionTypeData.length > 0 && strExtensionTypeData.charAt(0) != "."
                        ? "." + strExtensionTypeData.trim().toLowerCase()
                        : strExtensionTypeData.trim().toLowerCase();
                    this.Context.log(" - checking extension filter " + strExtensionType + " == " + strExtension);
                    // Joker for all ?
                    if (strExtensionType == '.*') {
                        this.Context.log(" - extension filter is the wildcard => file accepted (passing)");
                        bResult = true;
                        break;
                    }
                    if (strExtension == strExtensionType) {
                        this.Context.log(" - extension filter is matching => file accepted (passing)");
                        bResult = true;
                        break;
                    }
                }
            }
            else {
                this.Context.log(" - no extension filter in node config => file accepted (passing)");
                bResult = true;
            }
        }
        catch (ex) {
            this.Context.error(ex);
        }
        return (bResult);
    }
    processSetLock() {
        let tSendMsg = [];
        if (this.doesLockFileFilterMatch()) {
            if (this.setLock()) {
                tSendMsg = [this.Context.getMessage(), null, null];
                this.Context.log(" - file locked: " + this._ForFileName);
            }
            else {
                tSendMsg = [null, null, this.Context.getMessage()];
                this.Context.warn(`File was already locked: ${this._ForFileName}`);
                this.Context.log(" - file was already locked: " + this._ForFileName);
            }
        }
        else {
            this.Context.log(" - lock filters does not match to extension of file: " + this._ForFileName);
            tSendMsg = [null, null, null, this.Context.getMessage()];
        }
        return (tSendMsg);
    }
    processIncrementLock() {
        let tSendMsg = [null, this.Context.getMessage()];
        if (this.doesLockFileFilterMatch()) {
            if (this.incrementLock()) {
                this.Context.log(" - file lock incremented: " + this._ForFileName);
                tSendMsg = [this.Context.getMessage(), null, null];
            }
            else {
                this.Context.error(`File lock increment error on: ${this._ForFileName}`);
                tSendMsg = [null, null, this.Context.getMessage()];
            }
        }
        return (tSendMsg);
    }
    processRemoveLock(bForce) {
        let tSendMsg = [];
        // Remove the lock, by decrement.
        // if successful and the file still exists, it's still a lock in place,
        // otherwise it is unlocked.
        if (this.removeLock(bForce)) {
            if (this.doesLockFileExists()) {
                this.Context.log(` - file lock still in place for: ${this._ForFileName}`);
                tSendMsg = [this.Context.getMessage(), null, null, null];
            }
            else {
                // Port 2 - unlocked !
                this.Context.log(` - file lock successfully removed on: ${this._ForFileName}`);
                tSendMsg = [null, this.Context.getMessage(), null];
            }
        }
        else {
            this.Context.error(`File lock remove error on: ${this._ForFileName}`);
            tSendMsg = [null, null, this.Context.getMessage(), null];
        }
        return (tSendMsg);
    }
    processLockRequest() {
        let tSendMsg = [];
        if (this.doesChangeEventMatch()) {
            this.Context.log(`- processing requested lock action : "${this.Context.Config.lockMode}" on "${this._ForFileName}"`);
            switch (this.Context.Config.lockMode) {
                case "setLock":
                    tSendMsg = this.processSetLock();
                    break;
                case "incrementLock":
                    tSendMsg = this.processIncrementLock();
                    break;
                case "removeLock":
                    tSendMsg = this.processRemoveLock(false);
                    break;
                case "removeLockForce":
                    tSendMsg = this.processRemoveLock(true);
                    break;
                default:
                    this.Context.warn("lockFileNode - unknown lockMode : " + this.Context.Config.lockMode);
                    break;
            }
            // Remove source file (msg.payload) if requested and unlocked
            if (this.Context.Config.removeWhenUnlocked === true && !this.doesLockFileExists()) {
                if (FS.existsSync(this._ForFileName)) {
                    FS.unlinkSync(this._ForFileName);
                    this.Context.log(" - input file removed: " + this._ForFileName);
                }
                else {
                    this.Context.warn("input file already removed (no action): " + this._ForFileName);
                }
            }
        }
        else {
            this.Context.log(" - change Event type does not match - no processing");
        }
        return (tSendMsg);
    }
}
exports.CFileLocker = CFileLocker;
// #endregion
//# sourceMappingURL=AutoDocLibV1.js.map