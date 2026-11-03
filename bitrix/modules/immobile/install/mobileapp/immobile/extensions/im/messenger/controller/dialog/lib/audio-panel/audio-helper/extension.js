/**
 * @module im/messenger/controller/dialog/lib/audio-panel/audio-helper
 */
jn.define('im/messenger/controller/dialog/lib/audio-panel/audio-helper', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { isEmpty, pickBy } = require('utils/object');
	const { isAudioMessageFile } = require('im/messenger/lib/helper');
	const { AvailableAudioRates, DialogActionType } = require('im/messenger/const');
	const { VisibilityManager } = require('im/messenger/lib/visibility-manager');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AfterScrollMessagePosition } = require('im/messenger/view/dialog');

	/**
	 * @param {ReturnToAudioMessageParams} params
	 * @returns {Promise<void>}
	 */
	async function returnToAudioMessage({ audioData, openDialog })
	{
		if (isEmpty(audioData))
		{
			return;
		}

		const { dialogId, messageId } = audioData;

		const isVisible = await VisibilityManager
			.getInstance()
			.checkIsDialogVisible({
				dialogId,
				currentContextOnly: true,
			});

		const toMessageOptions = {
			messageId,
			targetMessagePosition: AfterScrollMessagePosition.center,
		};

		// A visible dialog does not guarantee a live object in dialog-manager: the check is
		// asynchronous and VisibilityManager also answers by the saved record when the
		// component stack is out of reach. Opening the dialog is the safe fallback.
		if (isVisible)
		{
			const dialog = serviceLocator.get('dialog-manager')?.getLastOpenDialog() ?? null;
			if (dialog)
			{
				void dialog.goToMessage(toMessageOptions);

				return;
			}
		}

		void openDialog({
			dialogId,
			actionsAfterOpen: [
				{
					type: DialogActionType.goToMessage,
					...toMessageOptions,
				},
			],
		});
	}

	/**
	 * @param {PrepareAudioNameParams} params
	 * @returns {string}
	 */
	function prepareAudioName({ fileName, messageId, store })
	{
		const message = store.getters['messagesModel/getById'](messageId);
		if (!isAudioMessageFile(fileName) || !message)
		{
			return fileName;
		}

		const { authorId } = message;
		const user = store.getters['usersModel/getById'](authorId);

		return user?.name || fileName;
	}

	/**
	 * @param {number} number
	 * @returns {number}
	 */
	function roundAudioTime(number)
	{
		const n = Number(number);

		if (!Number.isFinite(n))
		{
			return 0;
		}

		return Number(n.toFixed(0));
	}

	/**
	 * Both platforms now send speedChanged as { speed }, the same way they send
	 * timeupdate as { currentTime }. A bare number is still accepted because Android
	 * wrapped the payload only in bitrix-lib 9d577a3980 (2026-08-05): builds released
	 * before it emit the scalar, and users on them are not updated yet. The scalar
	 * branch can go once those builds are out of support.
	 *
	 * @param {SpeedChangedState|number} payload
	 * @returns {number|null} null when the payload carries no usable speed
	 */
	function extractSpeed(payload)
	{
		const speed = Type.isPlainObject(payload) ? payload.speed : payload;

		return Type.isNumber(speed) && Number.isFinite(speed) && speed > 0 ? speed : null;
	}

	/**
	 * The rate is stored in the application settings and shown on the message, so it
	 * must survive a round trip through the native player without growing digits:
	 * speed 1.5 may come back as 1.4999998.
	 *
	 * @param {number} speed
	 * @returns {AudioRate}
	 */
	function roundAudioSpeed(speed)
	{
		if (speed % 1 === 0)
		{
			return speed;
		}

		const precision = 1;
		const factor = 10 ** precision;

		return Math.round(speed * factor) / factor;
	}

	/**
	 * The rate is one setting for the whole application, so every player and the video note
	 * control read it from the same place. The model keeps only values of the set in the setting,
	 * so no check is needed here; a store without the setting - it is loaded from the db after
	 * the dialog is built - gives the first value of the cycle.
	 *
	 * @param {MessengerCoreStore} store
	 * @returns {AudioRate}
	 */
	function getAudioRate(store)
	{
		const applicationSettingState = store.getters['applicationModel/getSettings']();

		return applicationSettingState?.audioRate ?? AvailableAudioRates[0];
	}

	/**
	 * The single source of the rate cycle: every player of the dialog and the video note
	 * control have to walk the same values, whichever player the audio panel gate produced.
	 * A rate outside the set - an old stored setting - gives the first one back instead of
	 * skipping the switch.
	 *
	 * @param {number} currentRate
	 * @returns {AudioRate}
	 */
	function getNextAudioRate(currentRate)
	{
		const currentIndex = AvailableAudioRates.indexOf(currentRate);
		if (currentIndex < 0)
		{
			return AvailableAudioRates[0];
		}

		return AvailableAudioRates[(currentIndex + 1) % AvailableAudioRates.length];
	}

	/**
	 * Builds returnData for a chat audio message. type and text are required by
	 * the native player; dialogId is what returnToAudioMessage navigates by, so
	 * every caller must go through here to keep the panel button working.
	 *
	 * @param {CreateChatReturnDataParams} params
	 * @returns {ReturnAudioData}
	 */
	function createChatReturnData({ dialogId, messageId, fileId })
	{
		return {
			dialogId,
			type: 'chat',
			text: Loc.getMessage('IMMOBILE_AUDIO_PANEL_GO_TO_AUDIO'),
			fileId,
			messageId,
		};
	}

	/**
	 * Merges only the fields the caller really provided. The native player omits
	 * playingTime and duration in part of its payloads, so a blind spread would
	 * reset the progress the panel has to restore.
	 *
	 * @template T
	 * @param {T} state
	 * @param {Partial<T>} patch
	 * @returns {T}
	 */
	function mergeDefinedFields(state, patch)
	{
		return {
			...state,
			...pickBy(patch, (value) => value !== undefined),
		};
	}

	/**
	 * The dialog audio panel and the sidebar audio tab must resolve the same native
	 * player id: a different id attaches to a separate native player and loses the
	 * audio started in the chat. Comments share the player of their parent chat.
	 *
	 * @param {AudioPlayerIdParams} params
	 * @returns {string}
	 */
	function createAudioPlayerId({ chatId, isComment = false, parentChatId = null })
	{
		const playerChatId = (isComment && parentChatId) ? parentChatId : chatId;

		return `audioPanel-chatId-${playerChatId}`;
	}

	module.exports = {
		returnToAudioMessage,
		prepareAudioName,
		roundAudioTime,
		roundAudioSpeed,
		getAudioRate,
		getNextAudioRate,
		extractSpeed,
		createChatReturnData,
		mergeDefinedFields,
		createAudioPlayerId,
	};
});
