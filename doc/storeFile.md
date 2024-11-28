# Store File Node
Stores a file into a target area - a file based area.

Use the properties that are set while parsing the content with ["search"](searchProps.md), ["set"](setProps.md) or ["autoProperties"](autoProps.md).

In addition you can set properties in the target area config.

## ⏺️ Options
### Target
Specifies how to operate, if the target name already exists.
|operation|action
|:--|:--
|`override`|Overrides the target if the file already exists
|`rename`|Renames the file by using a number increment to avoid overriding existing files.
|`don't copy`|Do not copy the file, if the target alredy exists.

### Log
Writes a logfile to the target (filename).log, with all necessary information for diag.

### Store Info
Writes an entry into _storage.log (source/drop location), when the file is stored with source and target info. 

### Path mask
Specify the path, where the file should be stored. You can use property infos by specifying the
name with $(xxx) syntax.

### File mask
Specify the name of the file to be stored by using property names.