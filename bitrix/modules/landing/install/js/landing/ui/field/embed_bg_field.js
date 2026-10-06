;(function() {
	"use strict";

	BX.namespace("BX.Landing.UI.Field");

	const bind = BX.Landing.Utils.bind;
	const fireCustomEvent = BX.Landing.Utils.fireCustomEvent;
	const getQueryParam = BX.Landing.Utils.getQueryParams;
	const remove = BX.Landing.Utils.remove;
	const create = BX.Landing.Utils.create;

	/**
	 * Implements interface for works with text field
	 *
	 * @extends {BX.Landing.UI.Field.BaseField}
	 *
	 * @inheritDoc
	 * @constructor
	 */
	BX.Landing.UI.Field.EmbedBg = function(data)
	{
		const descriptionMessageId = BX.Landing.Env.getInstance().isVkVideoAvailable()
			? 'LANDING_EMBED_BG_FIELD_DESCRIPTION_MSGVER_1'
			: 'LANDING_EMBED_BG_FIELD_DESCRIPTION_NO_VK_MSGVER_1';
		data.description = "<span class='landing-ui-anchor-preview'>"+BX.Landing.Loc.getMessage(descriptionMessageId)+"</span>";
		BX.Landing.UI.Field.Embed.apply(this, arguments);

		BX.Dom.addClass(this.error, 'landing-ui-error');
	};

	BX.Landing.UI.Field.EmbedBg.isBgVideo = true;

	BX.Landing.UI.Field.EmbedBg.prototype = {
		constructor: BX.Landing.UI.Field.EmbedBg,
		__proto__: BX.Landing.UI.Field.Embed.prototype,

		isEmbedUrl: function(value)
		{
			return BX.Landing.isSupportedVideoUrl(
				value,
				['youtube', 'vk'],
				BX.Landing.Env.getInstance().isVkVideoAvailable()
			);
		},

		getValue: function()
		{
			const res = BX.Landing.UI.Field.Embed.prototype.getValue.call(this);
			delete res.ratio;

			return res;
		},
	}
})();