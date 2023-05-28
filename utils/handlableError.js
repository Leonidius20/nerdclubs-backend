
/**
 * The kind of error that exists in the system by design and does not
 * require stack trace to be logged. (for example, user provided too long of a password)
 */
export default class HandlableError extends Error {
    constructor(message) {
      super(message); 
      this.name = "HandlableError";
    }
  }