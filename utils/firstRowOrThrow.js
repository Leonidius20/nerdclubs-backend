import HandlableError from "./handlableError.js";

/**
 * Get the first row of a query result or throw an error if no rows are returned.
 */
export default function firstRowOrThrow(queryResult) {
    if (queryResult.rows.length === 0) {
        throw new HandlableError('Not found');
    }

    return queryResult.rows[0];
}