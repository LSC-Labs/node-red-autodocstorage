"use strict";
// @ts-check
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
exports.CLogFileHandler = exports.CFileInfo = exports.CVarTable = exports.CVarDef = void 0;
exports.stringAfter = stringAfter;
exports.stringBefore = stringBefore;
exports.containsToken = containsToken;
exports.findMatchingEndTokenPos = findMatchingEndTokenPos;
const FS = __importStar(require("fs"));
const PATH = __importStar(require("path"));
/**
 * Get the string after a token.
 * If token is inside, like "$(", the text after this token is the result.
 * If the token is NOT inside, the result will be an empty string
 * @param strData data to be parsed
 * @param strToken token to search for like "$("
 * @returns If token is inside, the string before the token, otherwise strData.
 */
function stringAfter(strData, strToken) {
    let strResult = "";
    if (strData && strToken) {
        let nTokenPos = strData.indexOf(strToken);
        if (nTokenPos > -1) {
            strResult = strData.substring(nTokenPos + strToken.length);
        }
    }
    return (strResult);
}
/**
 * Get the string before a token.
 * If token is inside, like "$(", the text before the token is the result.
 * If the token is NOT inside, it will be the content of strData.
 * @param strData data to be parsed
 * @param strToken token to search for like "$("
 * @returns If token is inside, the string before the token, otherwise strData.
 */
function stringBefore(strData, strToken) {
    let strResult = strData;
    if (strData && strToken) {
        let nTokenPos = strData.indexOf(strToken);
        if (nTokenPos > -1) {
            strResult = strData.substring(0, nTokenPos);
        }
    }
    return (strResult);
}
function containsToken(strLine, strToken) {
    let bResult = false;
    if (strLine && strToken) {
        bResult = strLine.indexOf(strToken) > -1;
    }
    return (bResult);
}
function findMatchingEndTokenPos(strData, strStartToken, strEndToken) {
    let nDeepth = 1;
    let nTextPos = 0;
    while (nDeepth > 0 && nTextPos < strData.length) {
        let strSubString = strData.substring(nTextPos);
        if (strSubString.startsWith(strStartToken))
            nDeepth++;
        if (strSubString.startsWith(strEndToken))
            nDeepth--;
        if (nDeepth == 0)
            break;
        nTextPos++;
    }
    return (nDeepth == 0 ? nTextPos : -1);
}
// #region Var Table, and string substitution.
// Interface for a var definition
const TOKEN_START = "(";
const TOKEN_END = ")";
const TOKEN_VAR_START = "$(";
const MAX_REC_DEPTH = 7;
// Class for a single var definition
class CVarDef {
    name;
    value;
    /**
     * set VarName and VarValue.
     */
    constructor(strVarName, strVarValue) {
        this.name = strVarName;
        this.value = strVarValue;
    }
}
exports.CVarDef = CVarDef;
class CVarTable {
    isCaseSensitive = false;
    Trace = false;
    tVars = new Map();
    /**
     *
     */
    constructor(bCaseSensitive = false) {
        this.isCaseSensitive = bCaseSensitive;
    }
    trace(oData) {
        if (this.Trace)
            console.log(oData);
    }
    getTableKey(strVarName) {
        if (strVarName == null || strVarName == undefined)
            strVarName = "";
        return (this.isCaseSensitive ? strVarName : strVarName.toLowerCase());
    }
    clear() {
        this.tVars.clear();
    }
    get(strName) {
        return (this.tVars.get(strName));
    }
    getAllKeyNames() {
        let tNames = [];
        for (const [strKey, oVar] of this.tVars) {
            tNames.push(strKey);
        }
        return (tNames);
    }
    getVarDefList() {
        let tListOfVars = [];
        for (const [strKey, oVar] of this.tVars) {
            if (oVar)
                tListOfVars.push(oVar);
        }
        return (tListOfVars);
    }
    getVarDef(strVarName) {
        return (this.tVars.get(this.getTableKey(strVarName)));
    }
    // Set a var definition - if the value is empty, the var will be deleted
    setVarDef(strVarName, pVarDef) {
        if (strVarName != null && strVarName != undefined) {
            let strKey = this.getTableKey(strVarName);
            this.tVars.delete(strKey);
            if (pVarDef?.value != undefined) {
                this.tVars.set(strKey, pVarDef);
            }
        }
    }
    /**
     *
     * @param strVarName The Var name
     * @param strVarValue The value to be set. If null or undefined, the var will be deleted
     */
    setVarValue(strVarName, strVarValue) {
        if (strVarValue != null && strVarValue != undefined) {
            this.setVarDef(strVarName, new CVarDef(strVarName, strVarValue));
        }
        else {
            this.setVarDef(strVarName, null);
        }
    }
    getVarValue(strVarName, strDefault = "") {
        let strResult;
        let pVarDef = this.getVarDef(strVarName);
        if (pVarDef != null && pVarDef != undefined)
            strResult = pVarDef.value;
        return (strResult ?? strDefault);
    }
    /**
     * Resolve the var by name and substitute if there is an internal var definition
     * @param strVarName The name of the var (even with subvars inside) - case insensitive
     * @returns the resolved var, if not found the var name as defined - never null.
     */
    resolveVar(strVarName, bAsNative = false) {
        this.trace(`resolveVar("${strVarName}",${bAsNative})`);
        let strResultValue = "";
        // check if a additional var is inside the var definition...
        // If yes resolve and build the new varname...
        let nTokenPos = strVarName.indexOf(TOKEN_VAR_START);
        if (nTokenPos > -1) {
            // Additional var found... take first element
            let strNewVarName = strVarName.substring(0, nTokenPos);
            strNewVarName += this.substituteLine(strVarName.substring(nTokenPos), 3);
            strVarName = strNewVarName;
        }
        this.trace(" - name to be resolved: " + strVarName);
        if (bAsNative)
            strResultValue = this.getVarValue(strVarName) ?? "";
        else
            strResultValue = this.resolveVarCalculated(strVarName);
        return (strResultValue ?? "");
    }
    /**
     * calculate the var content result (Submodule of getVarValue())
     *
     * - varname                == The result is $(varname) or the value
     * - varname?               == either the content of the var, or if not defined ""
     * - varname??value         == either the content of the var, or the value
     * - varname?value1:value2  == if varname exists, value1 otherwise value2
     * @param strVarName Name of the variable - or the formula
     * @returns "$(varname)" if it could not be resolved, otherwise the result
     */
    resolveVarCalculated(strVarName) {
        let strResultValue = TOKEN_VAR_START + strVarName + TOKEN_END;
        // Check if the var is already available - no calculation needed...
        let oMainVarDef = this.getVarDef(strVarName);
        if (oMainVarDef)
            strResultValue = oMainVarDef.value;
        else {
            // now lets calculate...
            let nTokenPos = strVarName.indexOf("?");
            if (nTokenPos > -1) {
                let strFirstVarName = stringBefore(strVarName, "?");
                let strVarValue = stringAfter(strVarName, "?");
                let oFirstVarDef = this.getVarDef(strFirstVarName);
                // If varname? ==> use "", when varname does not exist
                if (!strVarValue || strVarValue.length == 0) {
                    strResultValue = oFirstVarDef ? oFirstVarDef.value : "";
                }
                else {
                    // check if it is the "varname??<value>" Syntax
                    if (strVarValue.startsWith("?")) {
                        if (oFirstVarDef)
                            strResultValue = oFirstVarDef.value;
                        else
                            strResultValue = strVarValue.substring(1) ?? "";
                    }
                    else {
                        // It is the "varname?value1:value2" syntax
                        nTokenPos = strVarValue.indexOf(":");
                        if (nTokenPos > -1) {
                            let strResolveLeft = stringBefore(strVarValue, ":");
                            let strResolveRight = stringAfter(strVarValue, ":");
                            if (oFirstVarDef)
                                strResultValue = strResolveLeft;
                            else
                                strResultValue = strResolveRight;
                        }
                    }
                }
            }
        }
        return (strResultValue);
    }
    /**
     * Substitute a single line by resolving all var definitions inside.
     * If vars could not be resolved, they stay in place as defined.
     * - varnames are scanned case insensitive
     * @param strLine Line to be substituted
     * @param tVars VarTable with the var - definitions
     * @param nRecDeepth Max deepth (optional) to avoid endless recursion
     * @param bAsNative Get the var content without calculation if true.
     * @returns the substituted string
     */
    substituteLine(strLine, nRecDeepth = 1, bAsNative = false) {
        let strResult = stringBefore(strLine, TOKEN_VAR_START);
        if (MAX_REC_DEPTH < nRecDeepth) {
            strResult = strLine;
        }
        else {
            // parse the text, starting from the var definition
            let strTextToParse = strLine.substring(strResult.length);
            while (containsToken(strTextToParse, TOKEN_VAR_START) && strTextToParse.length > 0) {
                // ensure we are realy at the right position
                strResult += stringBefore(strTextToParse, TOKEN_VAR_START);
                let strVarString = stringAfter(strTextToParse, TOKEN_VAR_START);
                let nVarDefEndPos = findMatchingEndTokenPos(strVarString, TOKEN_START, TOKEN_END);
                if (nVarDefEndPos > -1) {
                    // var def is complete and found - so copy it to process..
                    let strVarDef = strVarString.substring(0, nVarDefEndPos);
                    let strVarVal = this.resolveVar(strVarDef, bAsNative);
                    strResult += strVarVal;
                    // Position after the current var definition...
                    strTextToParse = strVarString.substring(nVarDefEndPos + 1);
                }
                else {
                    // var def is not complete and has a syntax error...
                    // leave the original string....
                    strResult += TOKEN_VAR_START + strTextToParse;
                    strTextToParse = "";
                }
            }
            strResult += strTextToParse;
            // When we parsed the line, there could be also a variable definition in a variable...
            // so call recursive - until finished or maxRecDepth is reached !
            if (containsToken(strResult, TOKEN_VAR_START))
                strResult = this.substituteLine(strResult, ++nRecDeepth);
        }
        return (strResult);
    }
    /**
     * Copy all vars into the target VarTable.
     * Existing vars with the same name will be replaced !
     * Vars defined in the target but not defined in this table, will stay in place.
     * @param oVarTable Target VarTable.
     */
    copyTo(oVarTable) {
        if (oVarTable) {
            for (const [strKey, oVar] of this.tVars) {
                if (oVar)
                    oVarTable.setVarValue(oVar.name, oVar.value);
            }
        }
    }
    /**
     * Copy all vars from the source VarTable.
     * Existing vars with the same name will be replaced !
     * Vars defined and not in the source, will stay in place.
     * @param oVarTable Source VarTable
     */
    copyFrom(oVarTable) {
        if (oVarTable) {
            for (const [strKey, oVar] of oVarTable.tVars) {
                if (oVar)
                    this.setVarValue(oVar.name, oVar.value);
            }
        }
    }
}
exports.CVarTable = CVarTable;
// #endregion
// #region FileInfo processing
/**
 * FileInfo Class to help operations with files.
 */
class CFileInfo {
    /**
     * Constructure need a filename as parameter
     */
    constructor(strFileName) {
        this.setData(PATH.normalize(strFileName));
    }
    setData(strFileName) {
        this.FileName = PATH.basename(strFileName);
        this.Exists = FS.existsSync(strFileName);
        this.Extension = PATH.extname(strFileName);
        this.FileNameOnly = this.FileName.substring(0, this.FileName.length - this.Extension.length);
        if (this.Exists) {
            this.Stats = FS.statSync(strFileName);
            this.Created = this.Stats.birthtime;
            this.LastWrite = this.Stats.mtime;
            this.Size = this.Stats.size;
            this.AbsoluteFileName = PATH.resolve(strFileName);
            this.ParentDirName = PATH.dirname(strFileName);
            this.AbsoluteDirName = PATH.dirname(this.AbsoluteFileName);
        }
        else {
            this.Stats = undefined;
            this.Created = undefined;
            this.LastWrite = undefined;
            this.Size = undefined;
            this.ParentDirName = ".";
            if (strFileName.indexOf(PATH.sep) > -1) {
                let nLastPos = strFileName.lastIndexOf(PATH.sep);
                this.ParentDirName = strFileName.substring(0, nLastPos);
            }
            let strTargetName = PATH.join(this.ParentDirName, this.FileName);
            this.AbsoluteDirName = PATH.dirname(strTargetName);
            this.AbsoluteFileName = PATH.join(this.AbsoluteDirName, this.FileName);
        }
    }
    // File Size
    Size;
    FileName = undefined;
    FileNameOnly = undefined;
    AbsoluteFileName = undefined;
    ParentDirName = undefined;
    AbsoluteDirName = undefined;
    Extension = undefined;
    Created;
    LastWrite;
    Exists = false;
    Stats;
    /**
     * Check if the file is more recent than me
     * @param strFilename the partner file to be checked
     * @returns true, if the file is more recent, otherwise false
     */
    isFileMoreRecent(strFilename) {
        let oPartnerFile = new CFileInfo(strFilename);
        return (this.isMoreRecent(oPartnerFile));
    }
    /**
     * Check if my partner is more recent than me
     * @param oFileInfo the partner file to be checked
     * @returns true, if my partner is more recent, otherwise false
     */
    isMoreRecent(oFileInfo) {
        let bResult = false;
        try {
            if (this.Exists && oFileInfo.Exists) {
                bResult = this.Stats.mtimeMs < oFileInfo.Stats.mtimeMs;
            }
        }
        catch { }
        return (bResult);
    }
    /**
     * Create the directory and set the permissions
     * @param bRecursive  Create the directory recursive (Default = false)
     * @param nAccessMode Set the access mode to the created dirs (Default = 0o777 )
     */
    createParentDir(bRecursive, nAccessMode) {
        if (this.ParentDirName) {
            let oOldMask = process.umask(0);
            FS.mkdirSync(this.ParentDirName, { recursive: bRecursive ?? false, mode: nAccessMode ?? 0o777 });
            process.umask(oOldMask);
        }
    }
    /**
     * Copy this file to the target location.
     * If file exists, it will be overwritten.
     * The file gets the same access rights as the source file,
     * Targt directory will be created with access mask 777
     * To control the access behaviour, use copyTo instead.
     *
     * @param strTargetFileName copy the file inside this object to the filename
     * @returns true if copy was successfull
     */
    copyFileTo(strTargetFileName) {
        let oTargetFile = new CFileInfo(strTargetFileName);
        return (this.copyTo(oTargetFile));
    }
    /**
     * copy this object to the target file object
     *
     * TODO: copy the owner/group if needed, otherwise it will be the current user/group.
     *
     * @param oTargetFile The Target file object
     * @param nAccessModeDir The requested access mode for the directory (default is 777)
     * @param nAccessMode  The requested access mode for the target file (default is the same as the source mode)
     * @returns true, if the file could be copied.
     */
    copyTo(oTargetFile, nAccessModeDir, nAccessMode) {
        let bResult = false;
        if (oTargetFile) {
            oTargetFile.createParentDir(true, nAccessModeDir);
            if (this.AbsoluteFileName && oTargetFile.AbsoluteFileName) {
                FS.copyFileSync(this.AbsoluteFileName, oTargetFile.AbsoluteFileName);
                if (!nAccessMode && this.Stats.mode)
                    nAccessMode = this.Stats.mode;
                if (nAccessMode)
                    FS.chmodSync(oTargetFile.AbsoluteFileName, nAccessMode);
                // Change ownership is not permitted to "normal" users !
                // If you need the rights, modify the chmodSync to get the proper rights to all users !
                // if(this.Stats.uid && this.Stats.gid)  FS.chownSync(oTargetFile.AbsoluteFileName,this.Stats.uid,this.Stats.gid);
                // if(this.Stats.gid)  FS.chgrpSync(oTargetFile.AbsoluteFileName,this.Stats.gid);
                // keep the original timestamp
                if (this.Stats?.atime && this.Stats?.mtime) {
                    FS.utimesSync(oTargetFile.AbsoluteFileName, this.Stats.atime, this.Stats.mtime);
                }
                bResult = true;
            }
        }
        return (bResult);
    }
}
exports.CFileInfo = CFileInfo;
/**
 * Define a Logfile name where the log entries should be written to...
 */
class CLogFileHandler {
    Filename;
    constructor(strFilename) {
        this.Filename = strFilename;
    }
    writeEntry(oEntry) {
        if (oEntry) {
            FS.appendFileSync(this.Filename, JSON.stringify(oEntry));
        }
    }
    logInfo(strMsg) {
        this.writeEntry({ ts: new Date(), type: "I", msg: strMsg });
    }
    logError(strMsg) {
        this.writeEntry({ ts: new Date(), type: "E", msg: strMsg });
    }
    logWarning(strMsg) {
        this.writeEntry({ ts: new Date(), type: "W", msg: strMsg });
    }
}
exports.CLogFileHandler = CLogFileHandler;
// #endregion
//# sourceMappingURL=TSLibV1.js.map