# Read PDF Text Node
Reads text from a pdf file, by using the stirling service.

If a document contains already readable text, it can be extracted with this node.
The node is using the stirling service in your environment.


## 🚦 Output Ports
1. doc with text <br/>
Valid text could be extracted from the pdf document
2. no valid text<br/>
No valid text could be extracted (use OCR scan to fix) 
Reason could be:
    - The document contains no text.
    - The text is to short (specified by the min length of text in this node)
    - The text is invalid. The node tests the min lengt of text to be valid - means, all characters are printable. Characters like 0x0 are declared as invalid.


## Input
- The input file must exist.

## Output
- The document text is stored in the message property "textContent"
