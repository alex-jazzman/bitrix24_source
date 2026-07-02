/**
 * @module im/messenger/lib/element/dialog/message/audio
 */
jn.define('im/messenger/lib/element/dialog/message/audio', (require, exports, module) => {
	const { Type } = require('type');
	const { Color } = require('tokens');

	const { MessageType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { Audio } = require('im/messenger/lib/element/dialog/message/element/audio/audio');

	/**
	 * @class AudioMessage
	 */
	class AudioMessage extends Message
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);

			if (modelMessage.text !== '')
			{
				this.setMessage(modelMessage.text, { dialogId: options.dialogId });
			}

			this.file = this.getModelFiles()[0];

			const transcript = serviceLocator.get('core')
				.getStore()
				.getters['filesModel/transcriptModel/getById'](this.file.id);
			const audio = new Audio(modelMessage, this.file, transcript, options);
			this.audio = audio.toMessageFormat();

			/* region deprecated properties */
			this.audioUrl = this.audio.url;
			this.localAudioUrl = this.audio.localUrl;
			this.size = this.audio.size;
			/* end region */
		}

		/**
		 * @return {AudioDialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				audio: this.audio,
				audioUrl: this.audioUrl,
				localAudioUrl: this.localAudioUrl,
				size: this.size,
			};
		}

		getType()
		{
			return MessageType.audio;
		}

		getIsPlaying()
		{
			return this.audio.isPlaying;
		}

		setPlayingTime(playingTime)
		{
			if (!Type.isNumber(playingTime))
			{
				return;
			}

			this.audio.playingTime = playingTime;
		}

		setSystemStyle()
		{
			super.setSystemStyle();

			this.style.audio = {
				rateBorderColor: Color.chatOverallTech3.toHex(),
				rateTextColor: Color.base1.toHex(),
				speech2TextBackgroundColor: Color.chatOverallTech.toHex(),
				speech2TextIconColor: Color.chatOverallBaseWhite2.toHex(),
				speech2TextLoaderColor: Color.chatOverallBaseWhite1.toHex(),
				speech2TextCollapseIconColor: Color.chatOverallBaseWhite1.toHex(),
				speech2TextSeparatorColor: Color.chatOverallBase0.toHex(),
				durationColor: Color.chatOtherBase1_1.toHex(),
				playButtonBackgroundColor: Color.accentMainPrimary.toHex(),
				playButtonIconColor: Color.chatOverallBaseWhite1.toHex(),
				waveColor: Color.chatOtherBase0_1.toHex(),
				waveActiveColor: Color.accentMainPrimary.toHex(),
			};

			return this;
		}
	}

	module.exports = {
		AudioMessage,
	};
});
