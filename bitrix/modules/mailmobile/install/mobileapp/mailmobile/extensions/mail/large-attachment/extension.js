/**
 * @module mail/large-attachment
 */
jn.define('mail/large-attachment', (require, exports, module) => {
	/**
	 * The category of the user options of the guides of the mail module. The web writes the marks of the
	 * one-time decisions of this scenario there, and the mobile client writes into the very same options:
	 * otherwise a person would be asked the same question twice, once on each platform. The name of an
	 * option is never spelled here: it comes from the server together with the marks themselves.
	 */
	const LARGE_ATTACHMENT_USER_OPTION_CATEGORY = 'mail.guide';

	module.exports = { LARGE_ATTACHMENT_USER_OPTION_CATEGORY };
});
