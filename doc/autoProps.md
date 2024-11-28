# Auto Properties Node
Sets  properties based on the filename and the document context.

The document properties are set based on the content of the document or,
if no content is available, defaults are set based on the filename.

Currently the date formats ENU (MM/DD/YYYY) and DEU (DD.MM.YYYY) are implemented.
The properties MonthName and Date.Long are language dependend. Date formats with written month names are also detected.

## Property assignement by example

The following properties will be set by this node based on the input file `/input/filename.pdf`


|Property|Content|Remark
|:--|:--|--
|file.nameonly|"filename"|The file name, withou extension
|file.name|"filename.pdf"|The file name of the input file
|file.ext|".pdf|The extension of the filen name
|file.path|"/input"|The path of the input file
|file.date|"2024-12-24"|The last write timestamp in ISO format
|file.year|"2024"|Year of the last write timestamp
|file.month|"12"|Month of the last write timestamp
|file.day|"24"|Day of the last write timestamp
|doc.date|"2024-10-29"|The date, found in the document, otherwise the same as file.date
|doc.date.long|"06 Juni 2024"|The long date
|doc.year|"2024"|The year of the doc.date property
|doc.month|"10"|The month of the doc.date property
|doc.day|"29"|The day of the doc.date property
|doc.MonthName|Juni|The name of the month, based on doc.date
|doc.language|"DEU"|Based on the date format, the language will be detected.

## Input
- The document content must be assigned in the message property msg.textContent. Use readPDFText node or similar nodes to fullfil this requirement.
- The input file must exist.

