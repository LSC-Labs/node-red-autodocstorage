# Lock Filter Node
This node will help you to avoid multiple triggers on the same file (name) by setting a "lock". The lock itself is a file with the same name as the input file with the extension ".lock".

 When the processing of the file is finished, the file has to be unlocked, this will remove the lockfile.


## Usage example
If a file monitor tells, a new file comes in place, set a lock on this file, so if updates on this file will not trigger the process again, this node will "block" these new flows. Also if you wan't to copy this file to more than one destination, increment the lock in the flow, so each flow can finish and unlock (decrement the lock), and the last one will delete the inputfile.

## Input
The filename that should be locked or unlocked, is expected in the `msg.payload`.

## The Lock
The lock itself is a file with the same name as in `msg.payload` with the extension ".lock"

| :exclamation:  This is very important   |
|-----------------------------------------|
To avoid overwriting already existing user files, with the lockfile name, the lock is only valid, if the lockfile name is "free" or if it is a valid lockfile content. Otherwise the node will abort the flow !

## Extension Filter
The extension filter is a list of extensions like 'pdf', separated with a ';'. Only files that are matching this filter will be processed.
When a filename does not match this filter, the message will be blocked.  
Default is : '*' - All files

## Output Ports
Depending on the mode, the 3 output ports are used.
port|meaning|description
|:--|:--|:--
1|`file locked`|The lock is in place. This is also the port when the lock is decremented, but still active !
2|`file unlocked`|The lock is gone. Depending on the option "mode", the source file is removed
3|`no lock possible`|Either there is no write permission for the process to write the lock file, or a file with the same name as the lockfile is in place, but does not have the right content (to avoid to destroy user data).
## Modes
<dl>
 <dt><b>- "lock file"</b></dt>
 <dd>Will create the lockfile (if possible).
 <ol>
 <li>"file locked": The lock could be created and the file is now locked.</li>
 <li>"file unlocked": ---</li>
 <li>"no lock possible": The lock could not be created.</li>
 </ol>
 No message will be sent if a valid lockfile is already in place.
 </dd>

 <dt><b>- "increment lock</b></dt>
 <dd>The lock counter will be incremented by one.<ol>
 <li>"file locked": The lock was created or incremented.</li>
 <li>"file unlocked": ---</li>
 <li>"no lock possible": The lockfile could not be created</li>
 </ol>
 If no lock is in place, it will be created.
 </dd>

 <dt><b>- "unlock"</b></dt>
 <dd>Unlockes the file.
 <ol>
 <li>"file locked": The lock is still active.</li>
 <li>"file unlocked": The lock is removed</li>
 <li>"no lock possible": The lockfile is not valid, or missing access rights.</li>
 </ol>
 
 The lock counter will be decremented by one, and if no further lock is in place, the lockfile will be removed and the message will be forwarded to port "file unlocked". If there is no lockfile in place, the message will be sent on "no lock possible. A message will be sent on port 1, if there is still an active lock on the file.
 </dd>

<dt><b>- "unlock force"</b></dt>
 <dd>The lockfile will be deleted in any case - not respecting the lock counter.
 <ol>
 <li>"file locked": -- no message.</li>
 <li>"file unlocked": the lock is  removed.</li>
<li>"no lock possible": the lockfile is not in place or not valid.</li>
</ul> 
 </dd>
</dl>

## Remove
This option is only available in unlock modes.

This will remove the inputfile, if the last lock is removed.


