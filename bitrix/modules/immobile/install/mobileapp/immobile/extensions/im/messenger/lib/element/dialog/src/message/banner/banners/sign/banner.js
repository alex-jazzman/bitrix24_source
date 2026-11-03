/**
 * @module im/messenger/lib/element/dialog/message/banner/banners/sign/banner
 */

jn.define('im/messenger/lib/element/dialog/message/banner/banners/sign/banner', (require, exports, module) => {
	const { BannerMessage } = require('im/messenger/lib/element/dialog/message/banner/message');
	const { BannerMessageConfiguration } = require('im/messenger/lib/element/dialog/message/banner/configuration');
	const { ButtonDesignType, MessageComponent } = require('im/messenger/const');
	const { Theme } = require('im/lib/theme');
	const { transparent } = require('utils/color');
	const { Type } = require('type');
	const { Loc } = require('im/messenger/loc');

	// Same value as the parser's NEW_LINE, kept local: that one lives inside another extension's bundle.
	const NEW_LINE = '\n';

	class SignMessage extends BannerMessage
	{
		/**
		 * @throws {Error} when the message carries no text element to fill
		 */
		prepareTextMessage()
		{
			if (!Type.isArrayFilled(this.message))
			{
				// CreateBannerFactory catches this and renders a plain text message instead
				throw new Error('SignMessage: the message has no text element to fill.');
			}

			const description = this.replacePhrase(this.resolvePhrase(this.metaData.description));
			let text = `[color=${Theme.colors.base3}]${description}[/color]`;

			const { userMessage } = this.getMessageComponentParams();
			if (Type.isStringFilled(userMessage))
			{
				text += NEW_LINE + NEW_LINE + this.getUserMessageHeader() + this.styleUserMessage(userMessage);
			}

			this.message[0].text = text;
		}

		/**
		 * Marks where the system text ends and the sender's own text begins. On a portal whose
		 * language has no such phrase the header is dropped and the text stays visible, the way
		 * the web card does it: a raw phrase code must never reach the user.
		 *
		 * @return {string} the header followed by a line break, or an empty string
		 */
		getUserMessageHeader()
		{
			const headerCode = 'IMMOBILE_MESSAGE_SIGN_USER_MESSAGE_HEADER';
			if (!Loc.hasMessage(headerCode))
			{
				return '';
			}

			const header = Loc.getMessage(headerCode);

			return `[b][color=${Theme.colors.base1}]${header}[/color][/b]${NEW_LINE}`;
		}

		/**
		 * A card whose text depends on the number of annulled signings declares the
		 * phrase as a function of that number and picks the plural form itself; every
		 * other card is a plain string. A message written before the number existed
		 * carries none, and such an action affected a single signing.
		 *
		 * @param {SignBannerPhrase} phrase
		 * @return {string}
		 */
		resolvePhrase(phrase)
		{
			if (!Type.isFunction(phrase))
			{
				return phrase ?? '';
			}

			const { annulledCount } = this.getMessageComponentParams();

			return phrase(Type.isNumber(annulledCount) ? annulledCount : 1) ?? '';
		}

		/**
		 * The params come from a store getter and every method of the card needs them. A card element
		 * is built anew on each render, so reading them once per element is enough.
		 *
		 * @return {SignBannerComponentParams}
		 */
		getMessageComponentParams()
		{
			this.componentParams ??= super.getComponentParams();

			return this.componentParams;
		}

		/**
		 * The server marks a card once this recipient is no longer expected to act. A card sent
		 * before the feature, or by an older server, carries no mark and stays as it is.
		 *
		 * @return {boolean}
		 */
		isActionCompleted()
		{
			return this.getMessageComponentParams().actionCompleted === true;
		}

		setBannerProp()
		{
			const { title, buttons, imageName } = this.metaData;
			const isCompleted = this.isActionCompleted();

			this.banner = {
				title: this.resolvePhrase(title),
				// The illustration stays as it is on purpose: it ships inside the app, so replacing it
				// would need a new app release, while the feature has to work on installed versions.
				// Nothing here can desaturate it either: the native banner colours the backdrop behind
				// the picture, never the picture, so a muted card keeps a coloured illustration.
				imageName,
				backgroundColor: isCompleted ? Theme.colors.base7 : Theme.colors.chatOtherMessage1,
				picBackgroundColor: transparent(Theme.colors.accentMainPrimaryalt, 0.2),
				shouldDisplayTime: true,
				buttons: isCompleted ? this.muteButtons(buttons) : buttons,
			};
		}

		/**
		 * A muted card keeps a working button (the document stays reachable from the chat), so the
		 * button only loses its accent and is never disabled.
		 *
		 * @param {Array} buttons
		 * @return {Array}
		 */
		muteButtons(buttons)
		{
			if (!Type.isArray(buttons))
			{
				return buttons;
			}

			return buttons.map((button) => ({ ...button, design: ButtonDesignType.outlineNoAccent }));
		}

		/**
		 * @param {string} phrase
		 * @return {string}
		 */
		replacePhrase(phrase)
		{
			let text = phrase ?? '';
			const {
				user,
				helpArticle,
				initiator,
				document,
			} = this.getMessageComponentParams();

			const helpdeskUrl = `/immobile/in-app/helpdesk=${helpArticle}`;
			const startBlackText = `[/color][color=${Theme.colors.base1}]`;
			const endBlackText = `[/color][color=${Theme.colors.base3}]`;
			const startMention = (id) => `[/color][USER=${id}]`;
			const endMention = `[/USER][color=${Theme.colors.base3}]`;
			// The colour goes inside the url tag: a link nested in a [color] tag is not rendered on
			// Android. On a muted card the link gives up the accent too, otherwise it stays the
			// brightest spot of a card nobody is expected to act on.
			const [startLinkColor, endLinkColor] = this.isActionCompleted()
				? [`[color=${Theme.colors.base2}]`, '[/color]']
				: ['', '']
			;
			const startLink = (url) => `[/color][b][url=${url}]${startLinkColor}`;
			const endLink = `${endLinkColor}[/url][/b][color=${Theme.colors.base3}]`;

			const phrases = {
				'#DOCUMENT_NAME#': `${startBlackText}${document?.name ?? ''}${endBlackText}`,
				'#USER_LINK#': user ? `${startMention(user.id)}${user.name}${endMention}` : '',
				'#INITIATOR_LINK#': initiator ? `${startMention(initiator.id)}${initiator.name}${endMention}` : '',
				'[helpdesklink]': startLink(helpdeskUrl),
				'[/helpdesklink]': endLink,
			};

			Object.keys(phrases).forEach((code) => {
				text = text.replaceAll(code, phrases[code]);
			});

			return text;
		}

		/**
		 * The sender's own words are set in italic to read as a quotation next to the system text.
		 *
		 * @param {string} text
		 * @return {string}
		 */
		styleUserMessage(text)
		{
			const color = Theme.colors.base1;

			return this.decorateOutsideUrlTags(text, (part) => `[i][color=${color}]${part}[/color][/i]`);
		}

		static getComponentId()
		{
			return MessageComponent.sign;
		}

		/**
		 * @return {SignBannerProps}
		 * @throws {Error} when the bundle has no configuration for the incoming stage
		 */
		get metaData()
		{
			const configuration = new BannerMessageConfiguration(this.id);
			const { stageId } = this.getMessageComponentParams();
			const data = configuration.getMetaData(SignMessage.getComponentId());
			const stageMetaData = data?.[stageId];

			if (!stageMetaData)
			{
				// CreateBannerFactory catches this and renders a plain text message instead
				throw new Error(`SignMessage: no configuration for stageId "${stageId}".`);
			}

			return stageMetaData.banner;
		}
	}

	module.exports = { SignMessage };
});
