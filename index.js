const fork = require("child_process").fork;

fork("./server1.js");
fork("./server2.js");
fork("./server3.js");