/**
 * This module exports an object that configures the session options for an Express application.
 * The options include the session name, secret for signing the session ID cookie, and cookie settings.
 * In production, the secure option is set to true to ensure that cookies are only sent over HTTPS.
 *
 * @property {string} name - The name of the session, stored in process.env.SESSION_NAME.
 * @property {string} secret - The secret used to sign the session ID cookie, stored in process.env.SESSION_SECRET.
 * @property {boolean} resave - Specifies whether the session should be saved even if it was not modified. Set to false.
 * @property {boolean} saveUninitialisation - Specifies whether to save a new session that has no data. Set to false.
 * @property {boolean} cookie.httpOnly - Specifies whether the cookie should be inaccessible via client-side JavaScript. Set to true.
 * @property {number} cookie.maxAge - The maximum age of the cookie in milliseconds. Set to 1 day.
 * @property {string} cookie.sameSite - Specifies the SameSite attribute of the cookie. Set to 'strict'.
 * @property {boolean} [cookie.secure] - Specifies whether cookies should only be sent over HTTPS. Set to true in production.
 */
export const sessionOptions = {
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET, //  express-session middleware uses secret value to sign the session ID cookie using an HMAC (Hash-based Message Authentication Code) algorithm
  resave: false, // only save is session modified
  saveUninitialisation: false, // dont save if new session with no data
  cookie: {
    httpOnly: true, // cookie not accessible via client side JS
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: 'strict'
    // prevents cross site request attacks, first party context: cookie only sent if request is made from the same site as cookie.
  }
}
if (process.env.NODE_ENV === 'production') {
  sessionOptions.cookie.secure = true
}
