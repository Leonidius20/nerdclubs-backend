import HandlableError from '../utils/handlableError.js';

export default function handleErrors(err, req, res, next) {
    if (res.headersSent) {
      return next(err);
    }
    if (!(err instanceof HandlableError)) {
      console.log(err);
    }
    res.status(500).json({ error: 1, message: `${err.message}` });
}