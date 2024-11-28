// @ts-check

import * as FS from "fs";
import * as PATH from "path";
import { umask } from 'node:process';
/**
 * Get the string after a token.
 * If token is inside, like "$(", the text after this token is the result.
 * If the token is NOT inside, the result will be an empty string
 * @param strData data to be parsed
 * @param strToken token to search for like "$("
 * @returns If token is inside, the string before the token, otherwise strData.
 */
export function stringAfter(strData: string, strToken: string) : string {
    let strResult: string = "";
    if(strData && strToken) {
        let nTokenPos = strData.indexOf(strToken);
        if (nTokenPos > -1) {
            strResult = strData.substring(nTokenPos + strToken.length);
        }
    }
    return(strResult);
}
/**
 * Get the string before a token.
 * If token is inside, like "$(", the text before the token is the result.
 * If the token is NOT inside, it will be the content of strData.
 * @param strData data to be parsed
 * @param strToken token to search for like "$("
 * @returns If token is inside, the string before the token, otherwise strData.
 */
export function stringBefore(strData: string, strToken: string) : string {
    let strResult: string = strData;
    if(strData && strToken) {
        let nTokenPos = strData.indexOf(strToken);
        if (nTokenPos > -1) {
            strResult = strData.substring(0,nTokenPos);
        }
    }
    return(strResult);
}

export function containsToken(strLine: string, strToken: string) : boolean {
    let bResult = false;
    if(strLine && strToken) {
        bResult = strLine.indexOf(strToken) > -1;
    }
    return(bResult);
}

export function findMatchingEndTokenPos(strData: string, strStartToken: string, strEndToken: string): number {
    let nDeepth = 1;
    let nTextPos = 0;
    while(nDeepth > 0 && nTextPos < strData.length) {
        let strSubString = strData.substring(nTextPos);
        if( strSubString.startsWith(strStartToken )) nDeepth++;
        if( strSubString.startsWith(strEndToken )) nDeepth--;
        if(nDeepth == 0) break;
        nTextPos++;
    }
    return(nDeepth == 0 ? nTextPos : -1)
}

// #region Var Table, and string substitution.

// Interface for a var definition

const TOKEN_START = "(";
const TOKEN_END   = ")";
const TOKEN_VAR_START = "$(";
const MAX_REC_DEPTH: number = 7;

// for future use, 
export interface IVarDef  {
    name: string,
    value:string,
}

// Class for a single var definition
export class CVarDef implements IVarDef {
    public name: string;
    public value: string;
    /**
     * set VarName and VarValue.
     */
    public constructor(strVarName: string, strVarValue: string) {
        this.name = strVarName;
        this.value = strVarValue;
    }
}

export class CVarTable {
    private isCaseSensitive = false;
    Trace = false;
    private tVars: Map<string,IVarDef> = new Map<string,IVarDef>()
    /**
     *
     */
    constructor(bCaseSensitive = false) {
        this.isCaseSensitive = bCaseSensitive;
    }

    trace(oData:any) {
        if(this.Trace) console.log(oData);
    }

    private getTableKey(strVarName: string) : string {
        if(strVarName == null || strVarName == undefined ) strVarName = "";
        return(this.isCaseSensitive ? strVarName : strVarName.toLowerCase());
    }

    public clear() {
        this.tVars.clear();
    }

    public get(strName:string) : IVarDef| undefined {
        return(this.tVars.get(strName));
    }

    public getAllKeyNames(): string[] {
        let tNames:string[] = []
        for (const [strKey, oVar] of this.tVars) {
            tNames.push(strKey);
        }
        return(tNames);
    }

    public getVarDefList() : IVarDef[] {
        let tListOfVars: IVarDef[] = [];
        for (const [strKey, oVar] of this.tVars) {
            if(oVar) tListOfVars.push(oVar);
        }
        return(tListOfVars);
    }

    public getVarDef(strVarName : string) : IVarDef | undefined {
        return(this.tVars.get(this.getTableKey(strVarName)));
    }

    // Set a var definition - if the value is empty, the var will be deleted
    public setVarDef(strVarName: string, pVarDef: IVarDef|undefined|null) {
        if(strVarName != null && strVarName != undefined ) {
            let strKey = this.getTableKey(strVarName);
            this.tVars.delete(strKey);
            if(pVarDef?.value != undefined) {
                this.tVars.set(strKey,pVarDef);
            }        
        }
    }

    /**
     * 
     * @param strVarName The Var name
     * @param strVarValue The value to be set. If null or undefined, the var will be deleted
     */
    public setVarValue(strVarName: string, strVarValue: string)  {
        if(strVarValue != null && strVarValue != undefined) {
            this.setVarDef(strVarName, new CVarDef(strVarName,strVarValue));
        } else {
            this.setVarDef(strVarName,null);
        }
    }

    public getVarValue(strVarName: string, strDefault: string = "") : string|undefined {
        let strResult: string|undefined;
        let pVarDef : IVarDef|undefined|null = this.getVarDef(strVarName);
        if(pVarDef != null && pVarDef != undefined) strResult = pVarDef.value;
        return(strResult ?? strDefault);
    }

    /**
     * Resolve the var by name and substitute if there is an internal var definition
     * @param strVarName The name of the var (even with subvars inside) - case insensitive
     * @returns the resolved var, if not found the var name as defined - never null.
     */
    public resolveVar(strVarName: string, bAsNative:boolean = false) : string {
        this.trace(`resolveVar("${strVarName}",${bAsNative})`);
        let strResultValue = "";
        // check if a additional var is inside the var definition...
        // If yes resolve and build the new varname...
        let nTokenPos = strVarName.indexOf(TOKEN_VAR_START);
        if(nTokenPos > -1) {
            // Additional var found... take first element
            let strNewVarName = strVarName.substring(0,nTokenPos);
            strNewVarName += this.substituteLine(strVarName.substring(nTokenPos),3);
            strVarName = strNewVarName
        }
        this.trace(" - name to be resolved: " + strVarName);
        if(bAsNative) strResultValue = this.getVarValue(strVarName) ?? "";
        else strResultValue = this.resolveVarCalculated(strVarName);
        return(strResultValue ?? "");
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
    resolveVarCalculated(strVarName: string) : string {
        let strResultValue = TOKEN_VAR_START + strVarName + TOKEN_END;
        // Check if the var is already available - no calculation needed...
        let oMainVarDef = this.getVarDef(strVarName);
        if(oMainVarDef) strResultValue = oMainVarDef.value;
        else {
            // now lets calculate...
            let nTokenPos = strVarName.indexOf("?");
            if(nTokenPos > -1) {
                let strFirstVarName = stringBefore(strVarName,"?");
                let strVarValue = stringAfter(strVarName,"?");
                let oFirstVarDef = this.getVarDef(strFirstVarName);
                // If varname? ==> use "", when varname does not exist
                if(!strVarValue || strVarValue.length == 0) {
                    strResultValue = oFirstVarDef ? oFirstVarDef.value : "";
                }
                else {
                    // check if it is the "varname??<value>" Syntax
                    if(strVarValue.startsWith("?")) {
                        if(oFirstVarDef) strResultValue = oFirstVarDef.value;
                        else strResultValue = strVarValue.substring(1) ?? "";
                    } else {
                        // It is the "varname?value1:value2" syntax
                        nTokenPos = strVarValue.indexOf(":");
                        if(nTokenPos > -1) {
                            let strResolveLeft = stringBefore(strVarValue,":");
                            let strResolveRight = stringAfter(strVarValue,":");
                            if(oFirstVarDef) strResultValue = strResolveLeft;
                            else strResultValue = strResolveRight;
                        }
                    }
                }
            }
        }
        return(strResultValue);
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
    public substituteLine(strLine: string, nRecDeepth :number = 1, bAsNative:boolean = false) : string {
        let strResult = stringBefore(strLine,TOKEN_VAR_START);
        if(MAX_REC_DEPTH < nRecDeepth) {
            strResult = strLine;
        }
        else {
            // parse the text, starting from the var definition
            let strTextToParse = strLine.substring(strResult.length);
            while(containsToken(strTextToParse,TOKEN_VAR_START) && strTextToParse.length > 0) {
                // ensure we are realy at the right position
                strResult += stringBefore(strTextToParse,TOKEN_VAR_START);
                let strVarString: string = stringAfter(strTextToParse,TOKEN_VAR_START);
                let nVarDefEndPos = findMatchingEndTokenPos(strVarString,TOKEN_START,TOKEN_END);
                if(nVarDefEndPos > -1) {
                    // var def is complete and found - so copy it to process..
                    let strVarDef = strVarString.substring(0,nVarDefEndPos);
                    
                    let strVarVal = this.resolveVar(strVarDef,bAsNative);
                    strResult += strVarVal;
                    // Position after the current var definition...
                    strTextToParse = strVarString.substring(nVarDefEndPos + 1 );
                } else {
                    // var def is not complete and has a syntax error...
                    // leave the original string....
                    strResult += TOKEN_VAR_START + strTextToParse;
                    strTextToParse = "";
                }
            }
            strResult += strTextToParse;
            // When we parsed the line, there could be also a variable definition in a variable...
            // so call recursive - until finished or maxRecDepth is reached !
            if(containsToken(strResult,TOKEN_VAR_START)) strResult = this.substituteLine(strResult,++nRecDeepth);
        }
        return(strResult);
    }

    /**
     * Copy all vars into the target VarTable.
     * Existing vars with the same name will be replaced !
     * Vars defined in the target but not defined in this table, will stay in place.
     * @param oVarTable Target VarTable.
     */
    public copyTo(oVarTable:CVarTable)  {
        if(oVarTable) {
            for (const [strKey, oVar] of this.tVars) {
                if(oVar) oVarTable.setVarValue(oVar.name,oVar.value);
            }
        }
    }

    /**
     * Copy all vars from the source VarTable.
     * Existing vars with the same name will be replaced !
     * Vars defined and not in the source, will stay in place.
     * @param oVarTable Source VarTable
     */
    public copyFrom(oVarTable:CVarTable) {
        if(oVarTable) {
            for (const [strKey, oVar] of oVarTable.tVars) {
                if(oVar) this.setVarValue(oVar.name,oVar.value);
            }
        }
    }
}
// #endregion

// #region FileInfo processing

/**
 * FileInfo Class to help operations with files.
 */
export class CFileInfo {
    /**
     * Constructure need a filename as parameter
     */
    constructor(strFileName: string) {
        this.setData(PATH.normalize(strFileName));
        
    }

    protected setData(strFileName: string) {
        this.FileName = PATH.basename(strFileName);
        this.Exists = FS.existsSync(strFileName);
        this.Extension = PATH.extname(strFileName);
        this.FileNameOnly = this.FileName.substring(0,this.FileName.length - this.Extension.length);
        if(this.Exists) {
            this.Stats = FS.statSync(strFileName);
            this.Created = this.Stats.birthtime;
            this.LastWrite = this.Stats.mtime;
            this.Size = this.Stats.size;
            this.AbsoluteFileName = PATH.resolve(strFileName);
            this.ParentDirName = PATH.dirname(strFileName);
            this.AbsoluteDirName = PATH.dirname(this.AbsoluteFileName);
        } else {
            this.Stats = undefined;
            this.Created = undefined;
            this.LastWrite = undefined;
            this.Size = undefined;
            
            this.ParentDirName = ".";
            if(strFileName.indexOf(PATH.sep) > -1) {
                let nLastPos = strFileName.lastIndexOf(PATH.sep);
                this.ParentDirName = strFileName.substring(0,nLastPos);
            }
            let strTargetName = PATH.join(this.ParentDirName,this.FileName);
            this.AbsoluteDirName = PATH.dirname(strTargetName);
            this.AbsoluteFileName = PATH.join(this.AbsoluteDirName,this.FileName);
       }

    }

    // File Size
    Size:                   number | undefined;
    FileName:               string | undefined = undefined;
    FileNameOnly:           string | undefined = undefined;
    AbsoluteFileName:       string | undefined = undefined;
    ParentDirName:          string | undefined = undefined;
    public AbsoluteDirName: string | undefined= undefined;
    public Extension:       string | undefined = undefined;
    Created:                Date   | undefined;
    LastWrite:              Date   | undefined;
    Exists: boolean = false;
    Stats: any;

    /**
     * Check if the file is more recent than me
     * @param strFilename the partner file to be checked
     * @returns true, if the file is more recent, otherwise false
     */
    public isFileMoreRecent(strFilename: string) : boolean {
        let oPartnerFile = new CFileInfo(strFilename);
        return(this.isMoreRecent(oPartnerFile));
    }
    /**
     * Check if my partner is more recent than me
     * @param oFileInfo the partner file to be checked
     * @returns true, if my partner is more recent, otherwise false
     */
    public isMoreRecent( oFileInfo: CFileInfo ): boolean {
        let bResult = false;
        try {
            if(this.Exists && oFileInfo.Exists) {
                bResult = this.Stats.mtimeMs < oFileInfo.Stats.mtimeMs;
            }
        } catch {}
        return(bResult);
    }


    /**
     * Create the directory and set the permissions
     * @param bRecursive  Create the directory recursive (Default = false)
     * @param nAccessMode Set the access mode to the created dirs (Default = 0o777 )
     */
    public createParentDir(bRecursive?: boolean, nAccessMode?:number, ) {
        if(this.ParentDirName) {
            let oOldMask = process.umask(0);
            FS.mkdirSync(this.ParentDirName,{ recursive: bRecursive ?? false, mode: nAccessMode ?? 0o777 });
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
    public copyFileTo(strTargetFileName:string) : boolean {
        let oTargetFile = new CFileInfo(strTargetFileName);
        return(this.copyTo(oTargetFile));
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
    public copyTo(oTargetFile:CFileInfo, nAccessModeDir?:number, nAccessMode?:number) : boolean {
        let bResult = false;
        if(oTargetFile) {
            oTargetFile.createParentDir(true,nAccessModeDir);
            if(this.AbsoluteFileName && oTargetFile.AbsoluteFileName) {
                FS.copyFileSync(this.AbsoluteFileName,oTargetFile.AbsoluteFileName);
                if(!nAccessMode && this.Stats.mode) nAccessMode = this.Stats.mode;
                if(nAccessMode) FS.chmodSync(oTargetFile.AbsoluteFileName,nAccessMode);
                // Change ownership is not permitted to "normal" users !
                // If you need the rights, modify the chmodSync to get the proper rights to all users !
                // if(this.Stats.uid && this.Stats.gid)  FS.chownSync(oTargetFile.AbsoluteFileName,this.Stats.uid,this.Stats.gid);
                // if(this.Stats.gid)  FS.chgrpSync(oTargetFile.AbsoluteFileName,this.Stats.gid);

                // keep the original timestamp
            if(this.Stats?.atime && this.Stats?.mtime) {
                FS.utimesSync(oTargetFile.AbsoluteFileName,this.Stats.atime,this.Stats.mtime);
            }
            bResult = true;
            }
        }
        return(bResult);
    }


}

// #endregion

// #region Log Files
export interface ILogEntry {
    ts: Date,
    type: string,
    msg: string,
}

export interface ILogHandler {
    logInfo(strMsg: string): void;
    logError(strMsg: string): void;
    logWarning(strMsg: string) : void;
}

/**
 * Define a Logfile name where the log entries should be written to...
 */
export class CLogFileHandler implements ILogHandler {
    
    Filename: string;

    constructor(strFilename: string) {
        this.Filename = strFilename;
    }

    private writeEntry(oEntry: ILogEntry) {
        if(oEntry) {
            FS.appendFileSync(this.Filename, JSON.stringify(oEntry));
        }
    }
    
    public logInfo(strMsg: string): void {
        this.writeEntry( { ts:new Date(), type: "I", msg: strMsg });
    }
    public logError(strMsg: string): void {
        this.writeEntry( { ts:new Date(), type: "E", msg: strMsg });
    }
    public logWarning(strMsg: string): void {
        this.writeEntry( { ts:new Date(), type: "W", msg: strMsg });
    }

 }

// #endregion
