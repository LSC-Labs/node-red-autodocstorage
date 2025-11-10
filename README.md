# LSC Autodoc Storage
The Autodoc Storage modules will help you to store documents based on their content and naming.
The Stirling services are used to read the content of PDF files, but you can use also other mechanism to extract the documents text.

In all nodes, the msg.payload contains the filename that is processed.
The message object will be enriched with the text content of the document and properties depending on the content of the file.

## Usage example
A workflow for a "pdf document" could be:
1. Monitor a directory for a droped/new document.
2. Lock the document - so no further triggers could appear.
3. Set some fixed properties, like own department name or storage base paths.
4. Extract the text of the document, to be used for further analyzing.
   (If no text could be found, enrich the document with text by using the OCR scan Node and repeat this step.)
5. Set the auto properties, like languages, date / time of file and document content.
6. Search properties by using regular expressions to find information like "invoice" or company names.
7. store the document by using the found properties.
8. Unlock the file - and delete or move the document, if not needed any longer.


## The message object
The following elements will be used in the message object while processing. 

element|type|content
:--|:--|:--
|payload|string|holds the name of the source file to be processed. 
|textContent|string|OCR parsed document content as string. (Available after read PDF text).
|textProperties|map[name,value]|Properties found, while processing the flow.
|lastMatchContent|string|Partial text of textContent (last search of a regular expression).


## Available nodes

node|short|objective
:--|:--|:--
["lock file"](doc/lockFile.md)|Locks and unlocks the source file|Avoid unexpected removement and supress additional flow triggers. Only when a file has no lock, it can be removed (default)
["set props"](doc/setProps.md)|setting props|Fixed properties can be set, depending on the flow (i.E.) "Input=CommonArea"
["search props"](doc/searchProps.md)|searching props|Context specific properties, like parts of the filename or the file content. Can search for existing and non existing entries.
["auto props"](doc/autoProps.md)|Automatic props|Set default properties. The language (ENU, DEU, ISO) and timestamp of the document and file can be detected.
["read PDF"](doc/readPDFText.md)|read pdf text|Extracts the text of a pdf document. (Needs Stirling Service in place)
["ocr scan"](doc/scanPDFText.md)|read/scan pdf text|Initiates a OCR scan on a pdf document and extracts the text. Can replace the input file with an enriched version. You should use this node, after "read PDF" can not detect a valid text. (Needs Stirling Service in place)
"build PDF"|build a PDF file|Builds a new PDF file from one or more picture (jpg, png). The PDF does NOT contain a valid text, so you should use "scan PDF" after creating. (Needs Stirling Service in place)
["store File"](storeFile.md)|store the file|Store the input file in a location by building the target path and name based on the properties found.

## Properties
When setting text properties, you can reflect already existing properties, using the syntax `$(propertyname)`

If the property does not exist, the result will the string `$(propertyname)`. This is usefull, if you want to define the propertyname in a later step.

### Conditional setting of a property
Setting|Result
:--|:--
$(propertyname??)|The value will be empty, if the propertyname does not exist
$(propertyname?value1:value2)|If propertyname exists, the result will be value1, otherwise value2. Instead of using a static text, you can also use a property by adressing with the same syntax $(otherproperty).


## Test cases
In the folder "examples" you find a sample workflow with some test cases for the node, so you can get familiar with it. 

See: ["Test cases"](doc/testCases.md)




