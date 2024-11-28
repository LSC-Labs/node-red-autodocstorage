# OCR Scan Node
Initiates an OCR scan on a pdf file, by using the stirling service.

As this process takes a while and the result depends on the quality of the pictures inside, use this node only, if you are sure that the pdf does not already contains readable text.

Recommended is to use the "Read PDF Text" node first and if no text is detected, use this node.

## ⏺️ Options
### Operation

Mode||
|:--|:--| 
`Process found text`|Sets the found text into the message property "textContent" and continues.
`Create new file with ocr`|Stores the text enriched pdf with a new name into the input folder. If the start trigger of your process is a file monitor, this will trigger a new process for the new document.
`Replace source file`|Replaces the source file with the text enriched version. If you have a file monitor with a file locker node behind, this will NOT trigger a new process, but you will "loose" your original input file. Be careful when using ! 

### Min len
Set the min len of text that must exist when the service was called.
If the text is shorter, or charactes in this range are not printable, the text will be flaged as "invalid".


## 🚦 Output Ports
1. doc with text <br/>
Valid text could be extracted from the pdf document
2. new document<br/>
A new document was created.
3. no valid text<br/>
No valid text could be extracted (use OCR scan to fix) 
Reason could be:
    - The document contains no text.
    - The text is to short (specified by the min length of text in this node)
    - The text is invalid. The node tests the min lengt of text to be valid - means, all characters are printable. Characters like 0x0 are declared as invalid.

## Input
- The input file must exist.

## Output
- The document text is stored in the message property "textContent"
