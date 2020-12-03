const EventEmitter = require('events').EventEmitter;
<<<<<<< HEAD
const emit = new EventEmitter();
=======

const emit = new EventEmitter();
emit.setMaxListeners(50);
>>>>>>> 848b18d16733a27859c21045b8416a806a902d3e
export { emit };
