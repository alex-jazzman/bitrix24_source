/**
 * @module tab-presets/managed/src/managed/utils
 */
jn.define('tab-presets/managed/src/managed/utils', (require, exports, module) => {
	const { Icon } = require('ui-system/blocks/icon');
	const { downloadImages, makeLibraryImagePath } = require('asset-manager');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { Loc } = require('loc');
	const {
		changeCurrentPresetState,
		updatePresetState,
		removePresetState,
		setPortalDefaultState,
	} = require('tab-presets/managed/src/managed/preset-cache-state');

	const icons = {
		chevron: Icon.CHEVRON_TO_THE_RIGHT,
		task: Icon.CIRCLE_CHECK,
		chat: Icon.MESSAGES,
		crm: Icon.CRM,
		menu: Icon.APPS,
		terminal: Icon.PAYMENT_TERMINAL,
		catalog_store: Icon.INVENTORY_MANAGEMENT,
		projects: Icon.FOLDER,
		calendar: Icon.CALENDAR,
		stream: Icon.NEWSFEED,
		crm_custom_section: Icon.ACTIVITY,
		calendar_with_slots: Icon.CALENDAR_WITH_SLOTS,
		drag: Icon.DRAG,
		bizproc: Icon.BUSINESS_PROCESS,
		sign: Icon.SIGN,
		file: Icon.FILE,
		call_list: Icon.PHONE_UP,
		sync: Icon.PHONE_UP,
		mail: Icon.MAIL,
		check_in: Icon.LOCATION,
	};
	const ACTION_ERROR_CODE = {
		RECIPIENT_NOT_ALLOWED: 'RECIPIENT_NOT_ALLOWED',
		OWNED_PRESET_LIMIT_EXCEEDED: 'OWNED_PRESET_LIMIT_EXCEEDED',
	};
	const MANAGED_PRESET_ID_PREFIX = 'managed:';

	const presetInfoImagePath = {
		task: makeLibraryImagePath('user-schedule.webp', 'graphic'),
		stream: makeLibraryImagePath('company-team.webp', 'graphic'),
		crm: makeLibraryImagePath('crm-with-shop.webp', 'graphic'),
		collaboration: makeLibraryImagePath('group-chat.webp', 'graphic'),
		connection: makeLibraryImagePath('connection.svg', 'graphic'),
		terminal: makeLibraryImagePath('payment-delivery.webp', 'graphic'),
		sign: makeLibraryImagePath('connection.svg', 'graphic'),
		bizproc: makeLibraryImagePath('documents-stack.webp', 'graphic'),
	};

	/**
	 * @return {string}
	 */
	const cacheId = () => `tab.settings.user.${env.userId}`;

	/**
	 * @return {RunActionExecutor}
	 */
	function getPresetGetDataRequestExecutor()
	{
		return new RunActionExecutor('mobile.managedtabpresets.getData').setCacheId(cacheId());
	}

	/**
	 * @template Data
	 * @param {string} action
	 * @param {Record<string, unknown>} [params]
	 * @return {Promise<TabPresetActionResult<Data>>}
	 */
	function callAction(action, params = {})
	{
		return new RunActionExecutor(action, params)
			.call(false)
			.then((response) => {
				if (response?.errors?.length > 0)
				{
					throw response;
				}

				return response;
			})
		;
	}

	/**
	 * @param {Record<string, TabPreset>} list
	 * @param {string} current
	 * @return {Record<string, TabPreset>}
	 */
	function getSortedPresets(list, current)
	{
		const result = {};
		const keys = Object.keys(list).filter((preset) => preset !== current);

		if (list[current])
		{
			keys.unshift(current);
		}
		keys.forEach((preset) => {
			result[preset] = list[preset];
		});

		return result;
	}

	/**
	 * @param {string} name
	 * @param {Record<string, number> | null} [tabs]
	 * @return {Promise<TabPresetActionResult>}
	 */
	function setCurrentPreset(name, tabs = null)
	{
		const params = { presetId: name };
		if (tabs)
		{
			params.tabs = tabs;
		}

		return callAction('mobile.managedtabpresets.setCurrentPreset', params);
	}

	/**
	 * @param {SaveManagedPresetParams} params
	 * @return {Promise<TabPresetActionResult<SavedManagedPresetData>>}
	 */
	function saveManagedPreset({ id = null, title = '', tabs = {} })
	{
		return callAction('mobile.managedtabpresets.savePreset', {
			id,
			title,
			tabs,
		});
	}

	/**
	 * @param {number} id
	 * @return {Promise<TabPresetActionResult>}
	 */
	function deleteManagedPreset(id)
	{
		return callAction('mobile.managedtabpresets.deletePreset', { id });
	}

	/**
	 * @param {string} presetId
	 * @param {TabPresetRecipient[]} [recipients]
	 * @param {Record<string, number> | null} [tabs]
	 * @return {Promise<TabPresetActionResult>}
	 */
	function assignPreset(presetId, recipients = [], tabs = null)
	{
		const params = { presetId, recipients };
		if (tabs)
		{
			params.tabs = tabs;
		}

		return callAction('mobile.managedtabpresets.assignPreset', params);
	}

	/**
	 * @param {TabPresetActionResult} error
	 * @return {string}
	 */
	function getApplyErrorMessage(error)
	{
		const code = error?.errors?.[0]?.code;
		if (code === ACTION_ERROR_CODE.RECIPIENT_NOT_ALLOWED)
		{
			return (
				Loc.getMessage('TAB_PRESETS_MANAGED_RECIPIENT_NOT_ALLOWED_ERROR')
				|| Loc.getMessage('TAB_PRESETS_NEW_APPLY_ERROR')
			);
		}

		if (code === ACTION_ERROR_CODE.OWNED_PRESET_LIMIT_EXCEEDED)
		{
			return (
				Loc.getMessage('TAB_PRESETS_MANAGED_CREATE_LIMIT_EXCEEDED')
				|| Loc.getMessage('TAB_PRESETS_NEW_APPLY_ERROR')
			);
		}

		return Loc.getMessage('TAB_PRESETS_NEW_APPLY_ERROR');
	}

	/**
	 * @param {TabPresetActionResult} error
	 * @return {boolean}
	 */
	const isRecipientNotAllowedError = (error) => (
		error?.errors?.[0]?.code === ACTION_ERROR_CODE.RECIPIENT_NOT_ALLOWED
	);

	/**
	 * @param {string} builtinPresetId
	 * @return {Promise<TabPresetActionResult>}
	 */
	function setPortalDefaultPreset(builtinPresetId)
	{
		return callAction('mobile.managedtabpresets.setPortalDefaultPreset', {
			presetId: builtinPresetId,
		});
	}

	/**
	 * @param {string} presetId
	 * @param {TabPreset} [preset]
	 * @return {void}
	 */
	function changeCurrentPreset(presetId, preset)
	{
		Application.storage.updateObject(
			cacheId(),
			{},
			(saved) => changeCurrentPresetState(saved, presetId, preset),
		);
		BX.onCustomEvent('onPresetChanged', [presetId]);
	}

	/**
	 * @param {string} presetId
	 * @param {TabPreset} preset
	 * @return {void}
	 */
	function updatePresetInCache(presetId, preset)
	{
		Application.storage.updateObject(
			cacheId(),
			{},
			(saved) => updatePresetState(saved, presetId, preset),
		);
	}

	/**
	 * @param {string} presetId
	 * @return {void}
	 */
	function removePresetFromCache(presetId)
	{
		Application.storage.updateObject(
			cacheId(),
			{},
			(saved) => removePresetState(saved, presetId),
		);
	}

	/**
	 * @param {string} presetId
	 * @return {void}
	 */
	function setPortalDefaultInCache(presetId)
	{
		Application.storage.updateObject(
			cacheId(),
			{},
			(saved) => setPortalDefaultState(saved, presetId),
		);
	}

	/**
	 * @param {TabPreset | string | number | null | undefined} presetId
	 * @return {boolean}
	 */
	function isManagedPresetId(presetId)
	{
		return getManagedPresetId(presetId) !== null;
	}

	/**
	 * @param {TabPreset | string | number | null | undefined} preset
	 * @return {number | null}
	 */
	function getManagedPresetId(preset)
	{
		const presetId = String(preset?.key ?? preset?.id ?? preset ?? '');
		if (!presetId.startsWith(MANAGED_PRESET_ID_PREFIX))
		{
			return null;
		}

		const id = Number(presetId.slice(MANAGED_PRESET_ID_PREFIX.length));

		return Number.isInteger(id) && id > 0 ? id : null;
	}

	/**
	 * @param {string | undefined} code
	 * @return {Icon | string}
	 */
	function getIcon(code)
	{
		const list = ['crm_custom_section'];
		const modifiedCode = list.find((id) => code?.startsWith(id)) ?? code;

		return icons[modifiedCode] ?? '';
	}

	/**
	 * @param {string} presetId
	 * @return {string}
	 */
	const getPresetInfoImagePath = (presetId) => (
		isManagedPresetId(presetId)
			? makeLibraryImagePath('menu-pluse.webp', 'graphic')
			: (presetInfoImagePath[presetId] ?? '')
	);

	/**
	 * @param {string} presetId
	 * @return {Promise<unknown>}
	 */
	function preloadPresetInfoImage(presetId)
	{
		const imagePath = getPresetInfoImagePath(presetId);
		if (!imagePath)
		{
			return Promise.resolve();
		}

		return downloadImages([imagePath]);
	}

	/**
	 * @param {string} presetId
	 * @param {Record<string, string> | null} [tabsDescription]
	 * @return {string}
	 */
	function getPresetDescription(presetId, tabsDescription = null)
	{
		const presetDescription = Loc.getMessage(`TAB_PRESETS_PRESET_DESCRIPTION_${String(presetId).toUpperCase()}`);
		if (presetDescription)
		{
			return presetDescription;
		}

		const descriptions = Object.values(tabsDescription ?? {}).filter(Boolean);

		return descriptions.length > 0 ? descriptions.join(' ') : '';
	}

	module.exports = {
		getPresetGetDataRequestExecutor,
		getSortedPresets,
		setCurrentPreset,
		saveManagedPreset,
		deleteManagedPreset,
		assignPreset,
		getApplyErrorMessage,
		isRecipientNotAllowedError,
		setPortalDefaultPreset,
		changeCurrentPreset,
		updatePresetInCache,
		removePresetFromCache,
		setPortalDefaultInCache,
		isManagedPresetId,
		getManagedPresetId,
		getIcon,
		getPresetInfoImagePath,
		preloadPresetInfoImage,
		getPresetDescription,
	};
});
