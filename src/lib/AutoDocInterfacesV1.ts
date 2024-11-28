// @ts-check
// Interfaces (c) LSC-Labs (AutoDoc for Node Red)
//
// Defines common interfaces and constants for new implementation
//


/**
 * Interface Context Logging
 * sends error/info/warnings to the message, console and node red
 */
export interface IContextLog {
    log(strMessage:any) : void;
    warn(strMessage:any) : void;
    error(strMessage:any) : void;
    trace(strMessage:any) : void;
}

/**
 * Parser options for searching a document to find properties to
 */
export interface IParseOptions {
    searchMode: string,
    Default?: string,
    firstGroupName: boolean;
    caseSensitive: boolean;
}

/**
 * Text Property for a document.
 * Becomes part of a node message - member of (PROPERTY_PROPERTY_LIST) 
 */
export interface ITextProperty {
    name: string,
    value: string,
}
