/**
 * @module more-menu/block/company/bitrix-answers/screen/src/opener
 */
jn.define('more-menu/block/company/bitrix-answers/screen/src/opener', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Feature } = require('feature');
	const { checkFeatureFlag, FeatureFlagType } = require('feature-flag');
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');
	const { Uri } = require('utils/uri');
	const {
		ANSWERS_COMPONENT_CODE,
		ANSWERS_COMPONENT_NAME,
		THEME_QUERY_PARAM,
	} = require('more-menu/block/company/bitrix-answers/screen/src/const');
	const { BitrixAnswersScreen } = require('more-menu/block/company/bitrix-answers/screen/src/screen');

	function appendThemeId(url)
	{
		const pageUrl = Type.isStringFilled(url) ? url : '';
		const themeId = Type.isStringFilled(AppTheme.id) ? AppTheme.id : '';

		if (!pageUrl || !themeId)
		{
			return pageUrl;
		}

		try
		{
			// the address already carries parameters of its own, so the theme is set on the parsed uri
			return new Uri(pageUrl).setQueryParam(THEME_QUERY_PARAM, themeId).toString();
		}
		catch
		{
			// the theme only decides which palette the page starts in: an address the parser chokes on
			// still opens, just without the hint
			return pageUrl;
		}
	}

	/**
	 * The address the container raises the section by, or `null` when the section cannot be shown in the
	 * native collapsible container at all. The address is a condition of the mode like the other three:
	 * the registry of the place of execution carries the component only where it was bundled, and a
	 * container with nothing to raise would leave the user a closed section and no screen. The
	 * synchronous checks come first: a build that would not raise the container has no reason to ask the
	 * portal at all.
	 *
	 * @return {Promise<?string>}
	 */
	async function resolvePanelScriptPath()
	{
		// the native global is absent in builds that do not ship the container: fall back instead of throwing
		if (!Feature.isPersistentScreenSupported() || typeof PersistentScreen === 'undefined')
		{
			return null;
		}

		// eslint-disable-next-line no-undef
		const scriptPath = availableComponents?.[ANSWERS_COMPONENT_NAME]?.publicUrl;
		if (!scriptPath)
		{
			return null;
		}

		try
		{
			// `undefined` stands both for a key the portal does not know and for a refused response, and a
			// request that failed outright rejects - none of the three is the mode being on
			const enabled = await checkFeatureFlag(FeatureFlagType.BITRIX_ANSWERS_PERSISTENT_SCREEN);

			return enabled === true ? scriptPath : null;
		}
		catch (error)
		{
			console.error(error);

			return null;
		}
	}

	/**
	 * The container raises the content itself, by the address of the component, and answers nothing - so
	 * the measure closes right after the call and covers the call alone.
	 *
	 * @param {Omit<BitrixAnswersScreenProps, 'layout'>} screenProps
	 * @param {string} scriptPath address of the component, resolved along with the mode
	 * @return {void}
	 */
	function openPanelScreen(screenProps, scriptPath)
	{
		const point = new PerfPoint('Bitrix Answers Open', 'screen').start();

		// eslint-disable-next-line no-undef
		PersistentScreen.open({
			name: 'JSStackComponent',
			componentCode: ANSWERS_COMPONENT_CODE,
			scriptPath,
			// heading of the window of the container and caption of its collapsed strip
			title: screenProps.title,
			params: screenProps,
			rootWidget: { name: 'layout', settings: { objectName: 'layout' } },
		});

		point.end();
	}

	/**
	 * A workaround, and a temporary one. The section the card lives in is opened modally, and a container
	 * raised over it gives the user no collapsed screen at all: on iOS the collapsing does not go through,
	 * on Android the collapsed strip stays behind the section. Neither is ours to fix - the container is
	 * native. Until it learns to collapse from a modally opened section, the widget of the section goes
	 * off the screen first and the container is raised in the callback of its closing; once it does, this
	 * goes away and the panel is raised straight from open().
	 *
	 * Two outcomes raise the container at once: a parent with no callable close - the global page
	 * manager has none - and a close that threw; the price of a mistake here is a tap that opens
	 * nothing. A close that went through is waited for, so a close that never calls its callback back
	 * leaves the section closed and the panel unraised - a known outcome, left uncovered on purpose: a
	 * timer firing before the closing is over would bring back the very blocker this works around. The
	 * latch is what keeps a callback called twice from giving a second tab of the container.
	 *
	 * @param {Omit<BitrixAnswersScreenProps, 'layout'>} screenProps
	 * @param {string} scriptPath address of the component, resolved along with the mode
	 * @param {PageManager} parentWidget
	 * @return {void}
	 */
	function closeParentThenOpenPanel(screenProps, scriptPath, parentWidget)
	{
		let raised = false;
		const raise = () => {
			if (raised)
			{
				return;
			}

			raised = true;
			openPanelScreen(screenProps, scriptPath);
		};

		if (typeof parentWidget?.close !== 'function')
		{
			raise();

			return;
		}

		try
		{
			parentWidget.close(raise);
		}
		catch (error)
		{
			console.error(error);
			raise();
		}
	}

	/**
	 * The path of the builds without the bridge: the screen is drawn in a modal widget the opener raises
	 * itself and owns the bar of.
	 *
	 * @param {Omit<BitrixAnswersScreenProps, 'layout'>} screenProps
	 * @param {PageManager} parentWidget
	 * @return {Promise<void>}
	 */
	function openModalWidget(screenProps, parentWidget)
	{
		const point = new PerfPoint('Bitrix Answers Open', 'screen').start();

		// Modal on purpose: at this presentation the horizontal gesture belongs to the content, which
		// walks the sections of the knowledge base inside the one web view.
		return parentWidget.openWidget('layout', {
			modal: true,
			grabTitle: false,
			swipeToClose: true,
			titleParams: {
				text: screenProps.title,
				type: 'section',
			},
		})
			.then((widget) => {
				widget.showComponent(new BitrixAnswersScreen({ layout: widget, ...screenProps }));
			})
			.finally(() => point.end())
			.catch(console.error)
		;
	}

	class BitrixAnswersScreenOpener
	{
		/**
		 * The support values travel untouched from the data of the block to the props of the screen: the
		 * opener neither fills them in nor reads them, a value nobody handed over stays absent.
		 *
		 * @param options
		 * @param {string} options.url address of the page to show
		 * @param {string} options.title title the screen opens with
		 * @param {boolean} [options.canUseSupport] support of the portal answers, not the helpdesk
		 * @param {?string} [options.helpdeskUrl] address of the helpdesk article
		 * @param {?number} [options.supportBotId] bot the internal route of support opens the chat with
		 * @param {string} [options.analyticsSection] section of the analytics the card reports
		 * @param {PageManager} [options.parentWidget] widget the card was drawn in; the container has its own
		 * @return {Promise<void>}
		 */
		static async open({
			url = '',
			title = '',
			canUseSupport,
			helpdeskUrl,
			supportBotId,
			analyticsSection,
			parentWidget = PageManager,
		} = {})
		{
			const pageUrl = appendThemeId(url);
			if (!pageUrl)
			{
				return;
			}

			// One set of properties for both modes: the container mounts the very same screen, only by the
			// address of its component rather than by an instance the opener builds.
			const screenProps = {
				url: pageUrl,
				title,
				canUseSupport,
				helpdeskUrl,
				supportBotId,
				analyticsSection,
			};

			const scriptPath = await resolvePanelScriptPath();
			if (scriptPath)
			{
				closeParentThenOpenPanel(screenProps, scriptPath, parentWidget);

				return;
			}

			await openModalWidget(screenProps, parentWidget);
		}
	}

	module.exports = { BitrixAnswersScreenOpener };
});
