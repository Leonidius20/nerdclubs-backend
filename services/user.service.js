const dbPool = require('~/app').dbPool;

/**
 * Save a new user into the database
 * @param {string} username
 * @param {string} passwordHash
 * @param {string} email
 * @param {function} callback The callback function to call when the user is created. Accepts one parameter: the user ID of the newly created user
 * @returns {Promise<{userId: number}>} The user ID of the newly created user
 */
async function create(username, passwordHash, email, callback) {

}