/**
 * @module crm/timeline/item/ui/body/blocks/audio-block
 */
jn.define('crm/timeline/item/ui/body/blocks/audio-block', (require, exports, module) => {

	const { TimelineItemBodyBlock } = require('crm/timeline/item/ui/body/blocks/base');
	const { AudioPlayer } = require('layout/ui/audio-player');

	/**
	 * @class TimelineItemBodyTextBlock
	 */
	class TimelineItemBodyAudioBlock extends TimelineItemBodyBlock
	{
		render()
		{
			return View(
				{},
				new AudioPlayer({
					uri: currentDomain + this.props.src,
					uid: this.itemScopeEventBus.getUid(),
				}),
			);
		}
	}

	module.exports = { TimelineItemBodyAudioBlock };

});