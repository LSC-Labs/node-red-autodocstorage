# Search Properties Node
Searches and set properties in context of a document and is used to select the work flow path by using regular expressions.

As the node has two exist points, the first usage is to select the work flow path. If a match comes in place, port 1 is used othewise port 2.

If a match comes in place you are able to set and define
properties reflectiong the match results.

Source for the search can be the text content, the file name, the result of the last search or an existing property - set by a previous step.

The module supports the standard group definition of regular expression and the group naming 
extension "(?&lt;groupname&gt;searchfor)". Groups are used to define the property content depending on the text content.<br/>
<code>Tip</code> As properties will substituted, you can expand or redefine already definde properties.

For example <code>Topic = "$(Topic)-secret"</code>. In addition, it is possible to use a simple if then else logic in defining the value ( see Examples below)
## ⏺️ Options
### Operation
![Operation](./searchProps-Options.png)
    Specifies the "**search input**" and "**search mode**" for the operation.


Search Input||
|:--|:--| 
`document text`|Uses the "_msg.textContent_" field from the message (the document text) as input. Use the ["read pdf"](./readPDFText.md) for the Stirling Service to load this field.
`last match result`|Uses the result of the last match content in the "_msg.lastMatch_" field of the previous node to narrow the search results.
`source file name`|Uses the source file name, the "_msg.payload_" field, as input.
`text property`|Uses an existing property from a previous set or search props as input.
`message property`|Uses a string property from the message object as input.


----
Search Mode||
|:--|:--|
`all matches`|All search masks will be processed, and if all of them matches, the properties will be set. Otherwise NO property will be set and the result is "no match"
`first match`|When the first match of a search comes in place, the processing stops.
at least one match|All search masks will be processed, at least one must match.
`if no match`|If no search mask is matching, the property area will be processed and the message will be sent on port 2. If a match comes in place, the property area will **NOT** be processed, and the message will be sent on port 1.
`in any case`|Match or not, the property area will be processed. Depending on a match or not, the message will be sent on port 1 or 2.


All valid matches will become part of the "last match result" and stored in the message property "lastMatchContent".

### First group
    If you specify a group in a regular exrpession more than once, the last matching expression with the same group name will override previous matches. Remember, group names are NOT case sensitive.
    By checking this flag, the first match will stay in place and will NOT be replaced by further matches.


## ⚡Message Object
    The following message properties are used by this node


|Element|Type|Description
|:--|:--|:--
|payload|string|The path to the document in a way, that it can be addressed and found. It will not be modified.
|textContent|string|The content of the document as text. It will not be modified.
|lastMatch|string|The result of the last match. Will be replaced by the matches of this node

## 🚦 Output Ports
1. match <br/>
If a match comes in place, the message will be sent on this port.
2. no match<br/>
No match - be careful for modes "if no match" or "in any case" - the message will be sent on this port.

## Examples

> Search Mask   : "(Jo).(<LastName>Waschl)"

|Search Mask|Comment
|:--|:--
|"(Jo).(<LastName>Waschl)"|Is searching for the name "Jo Waschl". <br/>
The groups will be set as follow:
    - $(0) = "Jo Waschl" - the found text.
    - $(1) = "Jo" - the first group.
    - $(2) = "Waschl" - the second group.
    - $(LastName) = "Waschl"
   

|Property Assignment|Comment
|:--|:--
|LastName=$(lastname)|Works, cause property names ar NOT case sensitive. Sets the property "LastName" to the found value - in this example "Waschl"
|lastname=\$(2)|Will set the property to the content of group 2. The result is the same as in the example as above.
|LastName=\$(unknownVar??$(lastname))|If unknownVar is empty, the result is the group lastname, otherwise the var content of unknownVar.
|LastName=\$(unknownVar?\$(lastname):$(firstname))|Will set the property to content of group "lastName" if unknownVar is empty, otherwis to the content of group "firstName".



