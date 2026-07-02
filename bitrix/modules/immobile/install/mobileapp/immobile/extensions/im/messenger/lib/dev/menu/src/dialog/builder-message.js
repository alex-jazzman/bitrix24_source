/**
 * @module im/messenger/lib/dev/menu/dialog/builder-message
 */
jn.define('im/messenger/lib/dev/menu/dialog/builder-message', (require, exports, module) => {
	const { Color } = require('tokens');
	const { BuilderMessage: BuilderMessageElement } = require('im/messenger/lib/element/dialog/message/builder/message');

	class BuilderMessage extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.defaultState = {
				blocks: [
					{
						type: 'text',
						text: 'This is a sample text message.',
					},
				],
			};

			this.state = {
				configText: JSON.stringify(this.defaultState, null, 2),
				config: this.defaultState,
				parseError: false,
			};

			this.checkInPresetBlocks = this.#buildCheckInPresetBlocks();
			this.searchPresetBlocks = this.#buildSearchPresetBlocks();
			this.elements = this.#buildElements();
		}

		#buildCheckInPresetBlocks()
		{
			return [
				{
					type: 'title',
					text: 'January 10th Daily Plan from bitrixGPT',
					size: 1,
					color: 'ai-assistant',
				},
				{
					type: 'title',
					text: 'January 10th Daily Plan from bitrixGPT',
					size: 1,
					color: 'secondary',
				},
				{
					type: 'title',
					text: 'January 10th Daily Plan from bitrixGPT',
					size: 1,
					color: 'base',
				},
				{
					type: 'title',
					text: 'January 10th Daily Plan from bitrixGPT',
					size: 1,
					color: 'primary',
				},
				{
					type: 'title',
					text: 'January 10th Daily Plan from bitrixGPT',
					size: 1,
					color: 'alert',
				},
				{
					type: 'map',
					imageUrl: '',
					text: 'Moscow, New Arbat St., 10',
					status: 'working from office',
				},
				{
					type: 'spaceDivider',
					size: 's',
				},
				{
					type: 'title',
					text: 'General Information',
					size: 1,
					color: 'base',
				},
				{
					type: 'text',
					text: 'Today, your entry point is the main office. Pass through the main reception. Don’t forget to check in!',
				},
				{
					type: 'spaceDivider',
					size: 's',
				},
				{
					type: 'title',
					text: 'Entry Requirements',
					size: 1,
					color: 'base',
				},
				{
					type: 'unorderedList',
					icon: { type: 'arrow' },
					elements: [
						{ text: '[color=#1F86FF]Have your badge with you[/color]' },
						{ text: '[color=#1F86FF]Fill out the self-assessment form[/color]' },
						{ text: '[color=#1F86FF]Follow security instructions[/color]' },
					],
				},
				{
					type: 'spaceDivider',
					size: 's',
				},
				{
					type: 'title',
					text: 'Entry Time',
					size: 1,
					color: 'base',
				},
				{
					type: 'table',
					rows: [
						[
							{ text: '[color=#1F86FF]08:00 – 09:00[/color]' },
							{ text: 'Reception' },
						],
						[
							{ text: '[color=#1F86FF]09:00 – 10:00[/color]' },
							{ text: 'Main' },
						],
						[
							{ text: '[color=#1F86FF]13:00 – 15:00[/color]' },
							{ text: 'Secondary' },
						],
					],
				},
				{
					type: 'lineDivider',
				},
			];
		}

		#buildSearchPresetBlocks()
		{
			return [
				{
					type: 'unorderedList',
					color: 'tertiary',
					icon: { type: 'search', color: 'tertiary' },
					fold: {
						title: 'Thinking for 24 seconds',
						isOpened: false,
					},
					elements: [
						{ text: 'IT conferences in Kaliningrad', color: 'tertiary' },
						{ text: 'Small conferences Kaliningrad April', color: 'tertiary' },
						{ text: 'Major IT conferences Kaliningrad April 26', color: 'tertiary' },
					],
				},
				{ type: 'spaceDivider', size: 'm' },
				{
					type: 'title',
					text: 'Infoforum-Kaliningrad',
					size: 1,
				},
				{
					type: 'text',
					text: 'The 1st Interregional Conference on Information Security in the Northwestern District. [SOURCE=1]infoforum.ru[/SOURCE]',
					sources: {
						1: {
							url: 'https://infoforum.ru',
							metaData: { title: 'Infoforum', description: 'Infoforum-Kaliningrad' },
						},
					},
				},
				{
					type: 'unorderedList',
					icon: { type: 'bullet' },
					elements: [
						{ text: 'Dates: April 27-30, 2026 [SOURCE=2]safe-surf.ru[/SOURCE]' },
						{ text: 'Venue: Immanuel Kant Baltic Federal University (Kaliningrad) and a coastal event' },
						{ text: 'Main topic: Best practices in digital transformation and information security in regions [SOURCE=3]example.com[/SOURCE]' },
					],
					sources: {
						2: { url: 'https://safe-surf.ru', metaData: { title: 'safe-surf.ru', description: 'Information security news' } },
						3: { url: 'https://example.com/rights', metaData: { title: 'Access rights', description: 'Access rights configuration docs' } },
					},
				},
			];
		}

		#buildElements()
		{
			return [
				{
					key: 'title',
					type: 'element',
					label: 'Title',
					default: {
						type: 'title',
						text: 'Title',
						size: 1,
						color: 'base',
					},
				},
				{
					key: 'text',
					type: 'element',
					label: 'Text',
					default: {
						type: 'text',
						text: 'This is a sample text message.',
					},
				},
				{
					key: 'lineDivider',
					type: 'element',
					label: 'Line Divider',
					default: {
						type: 'lineDivider',
					},
				},
				{
					key: 'spaceDivider',
					type: 'element',
					label: 'Space Divider',
					default: {
						type: 'spaceDivider',
						size: 's',
					},
				},
				{
					key: 'map',
					type: 'element',
					label: 'Map',
					default: {
						type: 'map',
						imageUrl: ' ',
						text: 'Moscow, New Arbat St., 10',
						status: 'working from office',
					},
				},
				{
					key: 'unorderedList',
					type: 'element',
					label: 'Unordered',
					default: {
						type: 'unorderedList',
						icon: { type: 'bullet' },
						elements: [
							{ text: 'First item' },
							{ text: 'Second item' },
							{ text: 'Third item' },
						],
					},
				},
				{
					key: 'orderedList',
					type: 'element',
					label: 'Ordered',
					default: {
						type: 'orderedList',
						elements: [
							{ text: 'First item' },
							{ text: 'Second item' },
							{ text: 'Third item' },
						],
					},
				},
				{
					key: 'aiAssistantSearch',
					type: 'element',
					label: 'AI Search',
					default: {
						type: 'aiAssistantSearch',
						title: 'Searching',
						text: 'Looking for information...',
					},
				},
				{
					key: 'table',
					type: 'element',
					label: 'Table',
					default: {
						type: 'table',
						rows: [
							[{ text: '1' }, { text: '2' }],
							[{ text: '3' }, { text: '4' }],
						],
					},
				},
				{
					key: 'checkInPreset',
					type: 'preset',
					label: 'Check-In',
					blocks: this.checkInPresetBlocks,
				},
				{
					key: 'searchPreset',
					type: 'preset',
					label: 'Search',
					blocks: this.searchPresetBlocks,
				},
			];
		}

		render()
		{
			return View(
				{
					style: {
						flexDirection: 'column',
					},
					onClick: () => {
						this.inputRef?.blur?.({ hideKeyboard: true });
					},
				},
				this.renderEditor(),
				this.renderElementGrid(),
				this.renderPreviewStub(),
			);
		}

		renderElementGrid()
		{
			return ScrollView(
				{
					style: {
						height: 70,
						marginLeft: 10,
						marginBottom: 10,
					},
					horizontal: true,
					showsHorizontalScrollIndicator: false,
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							paddingVertical: 10,
						},
					},
					...this.elements.map((item) => Button({
						style: this.#getButtonStyle(item),
						text: item.label,
						onClick: () => {
							if (item.type === 'preset')
							{
								this.addPresetBlocks(item.blocks);
							}
							else
							{
								this.addElement(item.default);
							}
						},
					})),
				),
			);
		}

		#getButtonStyle(item)
		{
			const isPreset = item.type === 'preset';

			return {
				backgroundColor: isPreset
					? Color.accentSoftBlue3.toHex()
					: Color.accentSoftBlue2.toHex(),
				color: isPreset ? '#1976d2' : '#333333',
				fontWeight: 'bold',
				fontSize: 16,
				width: isPreset ? 160 : 110,
				height: 45,
				borderRadius: 4,
				marginRight: 8,
				marginLeft: isPreset ? 8 : 0,
			};
		}

		addPresetBlocks(blocks)
		{
			let config = [];
			let parseError = false;
			try
			{
				config = JSON.parse(this.state.configText);
				if (!Array.isArray(config.blocks))
				{
					config = { blocks: [] };
				}
			}
			catch (e)
			{
				console.error(e);
				parseError = true;
				config = { blocks: [] };
			}

			const ts = Date.now();
			const blocksWithId = blocks.map((block, idx) => ({
				...block,
				id: ts + idx,
			}));
			config.blocks = [...config.blocks, ...blocksWithId];
			const configText = JSON.stringify(config, null, 2);

			this.setState({
				config,
				configText,
				parseError,
			});
		}

		clearConfig()
		{
			this.setState({
				configText: JSON.stringify(this.defaultState, null, 2),
				config: this.defaultState,
				parseError: null,
			});
		}

		addElement(element)
		{
			let config = [];
			let parseError = false;
			try
			{
				config = JSON.parse(this.state.configText);

				if (!Array.isArray(config.blocks))
				{
					config = { blocks: [] };
				}
			}
			catch (e)
			{
				console.error(e);
				parseError = true;
				config = { blocks: [] };
			}
			// Generate a unique id for the new block
			const newElement = { ...element, id: Date.now() };
			config.blocks.push(newElement);

			const configText = JSON.stringify(config, null, 2);

			this.setState({
				config,
				configText,
				parseError,
			});
		}

		renderEditor()
		{
			const hasError = this.state.parseError;

			return View(
				{
					style: {
						marginTop: 15,
						marginBottom: 15,
						marginRight: 25,
						marginLeft: 10,
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							marginBottom: 8,
						},
					},
					Text({
						style: {
							fontSize: 16,
							fontWeight: 'bold',
							flex: 1,
						},
						text: 'Configuration JSON',
					}),
					hasError && Text({
						style: {
							fontSize: 13,
							color: Color.accentSoftElementRed1.toHex(),
							marginLeft: 8,
							maxWidth: 120,
							textAlign: 'right',
						},
						text: 'json is broken',
					}),
					View(
						{
							style: {
								marginLeft: 12,
							},
						},
						Button({
							style: {
								backgroundColor: Color.accentSoftBlue3.toHex(),
								color: Color.accentMainPrimaryalt.toHex() || '#1976d2',
								borderWidth: 1,
								borderColor: Color.accentMainPrimaryalt.toHex() || '#1976d2',
								borderRadius: 6,
								fontSize: 13,
								height: 28,
								paddingHorizontal: 10,
								paddingVertical: 0,
								minWidth: 48,
							},
							text: 'clear',
							onClick: () => this.clearConfig(),
						}),
					),
				),
				TextInput({
					style: {
						color: '#333333',
						fontSize: 16,
						fontWeight: 'normal',
						backgroundColor: '#fff',
						borderRadius: 8,
						borderWidth: 1,
						borderColor: hasError ? Color.accentSoftElementRed1.toHex() : Color.bgSeparatorPrimary.toHex(),
						padding: 10,
						height: 400,
					},
					showBBCode: true,
					enable: true,
					multiline: true,
					value: this.state.configText,
					placeholder: '{}',
					placeholderTextColor: '#80333333',
					onChangeText: (text) => {
						let parseError = false;
						let parsed = [];
						try
						{
							parsed = JSON.parse(text);
						}
						catch (e)
						{
							console.error(e);
							parseError = true;
						}

						this.setState({
							configText: text,
							config: parseError ? this.state.config : parsed,
							parseError,
						});
					},
					ref: (ref) => {
						this.inputRef = ref;
					},
					onBlur: () => {
						this.inputRef?.blur?.({ hideKeyboard: true });
					},
				}),
			);
		}

		renderPreviewStub()
		{
			return View(
				{
					style: {
						margin: 10,
						marginRight: 24,
					},
				},
				Button({
					style: {
						backgroundColor: Color.accentSoftBlue1.toHex(),
						borderRadius: 12,
						fontSize: 25,
						color: '#888',
						textAlign: 'center',
					},
					text: 'Show message',
					onClick: () => this.openDialogWidget(),
				}),
			);
		}

		openDialogWidget()
		{
			this.titleParams = {
				text: 'Message builder view',
			};

			PageManager.openWidget(
				'chat.dialog',
				{
					titleParams: this.titleParams,
					backdrop: {
						mediumPositionPercent: 90,
						horizontalSwipeAllowed: false,
						onlyMediumPosition: true,
					},
				},
			)
				.then(this.onWidgetReady.bind(this))
				.catch((error) => console.error(error))
			;
		}

		onWidgetReady(widget)
		{
			widget.textField.hide();
			widget.chatJoinButton.show({ text: 'close' });
			widget.chatJoinButton.on('tap', () => widget.close());
			console.log('setMessages', this.preparedMessage());
			widget.setMessages([this.preparedMessage()]);
		}

		preparedMessage()
		{
			const config = { ...this.state.config };
			if (config.blocks)
			{
				config.blocks = BuilderMessageElement.resolveColors(config.blocks);
			}

			return { ...this.toDialogWidgetItem(), builder: config };
		}

		toDialogWidgetItem()
		{
			return {
				align: null,
				attach: [],
				authorId: 1,
				avatar: null,
				avatarUrl: '',
				canBeChecked: false,
				canBeQuoted: false,
				commentInfo: null,
				forwardText: '',
				id: '1',
				isAuthorBottomMessage: false,
				isAuthorTopMessage: false,
				isBackgroundWide: false,
				keyboard: [],
				loadText: '',
				me: false,
				message: [{ text: 'text', type: 'text' }],
				reactions: [],
				read: false,
				richLink: null,
				showAvatar: false,
				showAvatarsInReaction: false,
				showReaction: false,
				showUsername: false,
				status: 'sent',
				statusText: '',
				style: {
					isBackgroundOn: true,
					marginBottom: 4,
					marginTop: 4,
					rightTail: true,
					roundedCorners: true,
					textAlign: 'left',
				},
				testId: '',
				time: '--:--',
				title: { text: 'username' },
				type: 'builder',
				userColor: '#df532d',
				username: 'username',
			};
		}
	}

	module.exports = { BuilderMessage };
});
