/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_ai_nameService, main_core, ui_textEditor, ui_vue3, crm_integration_analytics, ui_analytics, ui_bbcode_parser, ui_infoHelper, ui_notification, ui_promoVideoPopup, ui_switcher, ui_buttons, main_core_events, ui_entitySelector, crm_field_inlinePlaceholderSelector) {
	'use strict';

	const AssignmentType = Object.freeze({
		byUser: 1,
		byClient: 2,
		byClientLastDeal: 3
	});

	const AdditionalInfoComponent = {
		props: {
			title: {
				type: String,
				required: true
			}
		},
		mounted() {
			this.popup = null;
			this.region = main_core.Extension.getSettings('crm.repeat-sale.segment').get('region');
			main_core.Event.EventEmitter.subscribe('UI.PromoVideoPopup:accept', event => {
				this.popup?.hide();
			});
		},
		methods: {
			onClick() {
				if (this.popup === null) {
					this.popup = new ui_promoVideoPopup.PromoVideoPopup({
						angleOptions: null,
						targetOptions: '1',
						useOverlay: true,
						videoSrc: this.videoSrc,
						videoContainerMinHeight: 255,
						title: main_core.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_HOW_IT_WORK_TITLE'),
						colors: {
							title: 'var(--ui-color-palette-black-base)'
						}
					});
				}
				this.popup.show();
			}
		},
		computed: {
			videoSrc() {
				let name = 'how-it-work-en';
				if (['kz', 'ru', 'by', 'uz'].includes(this.region)) {
					name = 'how-it-work-ru';
				}
				return `/bitrix/js/crm/repeat-sale/segment/video/${name}.webm`;
			}
		},
		// language=Vue
		template: `
		<div class="crm-repeat-sale__segment-field-info">
			<span @click="onClick">
				{{title}}
			</span>
		</div>
	`
	};

	const AiSwitcherComponent = {
		emits: ['change'],
		components: {
			AdditionalInfoComponent
		},
		props: {
			checked: {
				type: Boolean,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			}
		},
		mounted() {
			this.renderSwitcher();
		},
		methods: {
			renderSwitcher() {
				if (!this.switcher) {
					this.switcher = new ui_switcher.Switcher({
						checked: this.checked,
						disabled: this.readOnly,
						size: ui_switcher.SwitcherSize.small,
						showStateTitle: false,
						handlers: {
							checked: event => {
								this.emitChange(false);
							},
							unchecked: event => {
								this.emitChange(true);
							}
						}
					});
					this.switcher.renderTo(this.$refs.switcher);
				}
			},
			emitChange(value) {
				this.$emit('change', value);
			}
		},
		computed: {
			badgeClassList() {
				return {
					'--enabled': this.checked
				};
			},
			badgeTitle() {
				if (this.checked) {
					return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_COPILOT_ENABLED');
				}
				return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_COPILOT_DISABLED');
			},
			segmentCopilotTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_COPILOT_TITLE', crm_ai_nameService.NameService.copilotNameReplacement());
			}
		},
		watch: {
			checked(newValue) {
				this.switcher.check(newValue, false);
			}
		},
		// language=Vue
		template: `
		<div class="crm-repeat-sale__segment-ai-switcher-wrapper">
			<div>
				<div class="crm-repeat-sale__segment-ai-switcher-title">
					{{ segmentCopilotTitle }}
					<span :class="badgeClassList">{{ badgeTitle }}</span>
				</div>
				<div class="crm-repeat-sale__segment-ai-switcher-description">
					{{ this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_COPILOT_DESCRIPTION') }}
				</div>
			</div>
			<div class="crm-repeat-sale__segment-ai-switcher" ref="switcher"></div>
		</div>
	`
	};

	const TextEditorWrapperComponent = {
		components: {
			TextEditorComponent: ui_textEditor.TextEditorComponent,
			AiSwitcherComponent
		},
		emits: ['change'],
		props: {
			textEditor: ui_textEditor.TextEditor
		},
		data() {
			return {
				textEditorEvents: {
					onChange: this.emitChangeData
				}
			};
		},
		mounted() {
			this.setTextEditorHeight();
			this.windowResizeHandler = this.windowResizeHandler.bind(this);
			main_core.Event.bind(window, 'resize', this.windowResizeHandler);
		},
		unmounted() {
			main_core.Event.unbind(window, 'resize', this.windowResizeHandler);
		},
		methods: {
			emitChangeData() {
				if (!main_core.Type.isFunction(this.onChangeDebounce)) {
					this.onChangeDebounce = main_core.Runtime.debounce(this.onChange, 100, this);
				}
				this.onChangeDebounce();
			},
			onChange() {
				this.$emit('change', {
					prompt: this.textEditor.getText()
				});
			},
			windowResizeHandler() {
				this.setTextEditorHeight();
			},
			setTextEditorHeight() {
				const editorOffsetTop = this.$el.parentNode.offsetTop;
				const navigationClassName = '.crm-repeat-sale__segment_navigation-container';
				const navigationOffsetTop = document.querySelector(navigationClassName)?.offsetTop ?? 0;
				const textEditorContainerBottomPadding = 20;
				const availableHeight = navigationOffsetTop - editorOffsetTop - textEditorContainerBottomPadding;
				const minHeight = Math.round(availableHeight * 0.5);
				const maxHeight = Math.round(availableHeight * 0.8);
				if (minHeight < 200) {
					this.textEditor?.setMinHeight(maxHeight);
				} else {
					this.textEditor?.setMinHeight(minHeight);
				}
				this.textEditor?.setMaxHeight(maxHeight);
			}
		},
		// language=Vue
		template: `
		<TextEditorComponent
			:events="textEditorEvents"
			:editor-instance="textEditor"
		/>
	`
	};

	const ButtonEvents = {
		click: 'crm:repeat-sale:segment:navigation-button-click'
	};
	const Button = {
		props: {
			id: {
				type: String,
				required: true
			}
		},
		mounted() {
			this.initButton();
		},
		methods: {
			initButton() {
				this.button = new ui_buttons.Button({
					useAirDesign: true,
					text: main_core.Loc.getMessage(`CRM_REPEAT_SALE_SEGMENT_NAVIGATION_BUTTON_${this.id.toUpperCase()}`),
					round: true,
					style: this.buttonStyle,
					onclick: () => {
						this.emitClickEvent();
					}
				});
				this.button.setDataSet({
					id: `crm-repeat-sale-segment-buttons-${this.id.toLowerCase()}`
				});
				if (this.$refs.button) {
					this.button.renderTo(this.$refs.button);
				}
			},
			emitClickEvent() {
				this.$Bitrix.eventEmitter.emit(ButtonEvents.click, {
					id: this.id
				});
			}
		},
		computed: {
			buttonStyle() {
				if (this.id === 'update') {
					return ui_buttons.AirButtonStyle.FILLED;
				}
				return ui_buttons.AirButtonStyle.OUTLINE;
			}
		},
		// language=Vue
		template: `
		<div ref="button" class="crm-repeat-sale__segment_button"></div>
	`
	};

	const DialogWrapperComponent = {
		emits: ['change', 'onSelectItem', 'onDeselectItem'],
		props: {
			items: {
				type: Array,
				default: []
			},
			tabs: {
				type: Array,
				default: []
			},
			entities: {
				type: Array,
				default: []
			},
			showAvatars: {
				type: Boolean
			},
			multiple: {
				type: Boolean
			},
			context: {
				type: String,
				default: ''
			},
			events: {
				type: Object,
				default: {}
			},
			readOnly: {
				type: Boolean
			},
			enableSearch: {
				type: Boolean,
				default: true
			},
			showInputIcon: {
				type: Boolean,
				default: true
			},
			halfWidth: {
				type: Boolean
			},
			useItemMaxSize: {
				type: Boolean,
				default: true
			},
			width: {
				type: Number,
				default: 450
			}
		},
		methods: {
			getDialog() {
				if (!this.dialog) {
					const targetNode = this.$refs.dialog;
					const parentPopupContainer = targetNode.closest('body');
					this.dialog = new ui_entitySelector.Dialog({
						targetNode,
						context: this.context,
						multiple: this.multiple,
						dropdownMode: true,
						showAvatars: this.showAvatars,
						enableSearch: this.enableSearch,
						width: this.width,
						zIndex: 2500,
						items: this.items,
						entities: this.entities,
						tabs: this.tabs,
						searchOptions: {
							allowCreateItem: false
						},
						events: {
							'Item:onSelect': event => {
								const {
									item: selectedItem
								} = event.getData();
								this.emitSelectItem(selectedItem);
							},
							'Item:onDeselect': event => {
								const {
									item: deselectedItem
								} = event.getData();
								this.emitDeselectItem(deselectedItem);
							},
							onShow: event => {
								main_core.Event.bindOnce(parentPopupContainer, 'click', this.onPopupContainerClick.bind(this));
							}
						}
					});
				}
				return this.dialog;
			},
			emitSelectItem(selectedItem) {
				this.$emit('onSelectItem', selectedItem);
			},
			emitDeselectItem(deselectedItem) {
				this.$emit('onDeselectItem', deselectedItem);
			},
			selectItem(itemId) {
				const item = this.dialog.getItem(itemId);
				item?.select();
			},
			onPopupContainerClick() {
				this.getDialog().hide();
			},
			show() {
				this.getDialog().show();
			},
			toggleDialog() {
				if (this.readOnly) {
					return;
				}
				const dialog = this.getDialog();
				if (dialog.isOpen()) {
					dialog.hide();
				} else {
					dialog.show();
				}
			},
			destroy() {
				this.dialog?.destroy();
				this.dialog = null;
			}
		},
		computed: {
			elementTitle() {
				return this.items.find(item => item.selected)?.title ?? '';
			},
			customData() {
				return this.items.find(item => item.selected)?.customData ?? '';
			},
			controlClassList() {
				return ['ui-ctl', 'ui-ctl-after-icon', {
					'ui-ctl-w50': this.halfWidth
				}, {
					'ui-ctl-dropdown': !this.readOnly
				}];
			},
			iconClassList() {
				if (this.showInputIcon) {
					return ['crm-repeat-sale__segment-dialog-field-icon', {
						'--color': Boolean(this.customData?.color)
					}];
				}
				return [];
			},
			iconStyleList() {
				if (this.customData?.color === null) {
					return {};
				}
				return {
					backgroundColor: this.customData.color
				};
			},
			itemClassList() {
				return {
					'crm-repeat-sale__segment-dialog-field-value': true,
					'--max-size': this.useItemMaxSize
				};
			}
		},
		// language=Vue
		template: `
		<div
			:class="controlClassList"
			ref="dialog"
			@click="toggleDialog"
		>
				<div 
				v-if="!readOnly"
				class="ui-ctl-after ui-ctl-icon-angle"
			></div>
			<div class="ui-ctl-element">
				<span class="crm-repeat-sale__segment-dialog-field">
					<span 
						:class="iconClassList"
						:style="iconStyleList"
					></span>
					<span :class="itemClassList">
						{{elementTitle}}
					</span>
				</span>
			</div>
		</div>
	`
	};

	const AssignmentTypeSelector = {
		components: {
			DialogWrapperComponent
		},
		props: {
			currentTypeId: {
				type: Number,
				required: true
			},
			types: {
				type: Array,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			}
		},
		created() {
			this.tabs = [{
				id: 'types',
				title: ''
			}];
		},
		watch: {
			currentTypeId(typeId) {
				this.types.forEach(item => {
					// eslint-disable-next-line no-param-reassign
					item.selected = item.id === typeId;
				});
			}
		},
		// language=Vue
		template: `
		<DialogWrapperComponent
			:items="types"
			:tabs="tabs"
			:read-only="readOnly"
			:width=510
		/>
	`
	};

	const CallAssessmentSelector = {
		props: {
			callAssessments: {
				type: Object,
				required: true
			},
			currentCallAssessmentId: {
				type: Number,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			}
		},
		created() {
			this.dialog = null;
			this.tabs = [{
				id: 'call_assessments',
				title: ''
			}];
			this.items = [];
			this.callAssessments.forEach((callAssessment, index) => {
				this.items.push({
					id: callAssessment.id,
					title: callAssessment.name,
					entityId: 'call_assessment',
					tabs: 'call_assessments',
					selected: callAssessment.id === this.currentCallAssessmentId
				});
			});
		},
		methods: {
			toggleDialog() {
				const dialog = this.getDialog();
				if (dialog.isOpen()) {
					dialog.hide();
				} else {
					dialog.show();
				}
			},
			getDialog() {
				if (this.dialog === null) {
					const targetNode = this.$refs.dialog;
					const parentPopupContainer = targetNode.closest('body');
					this.dialog = new ui_entitySelector.Dialog({
						targetNode,
						context: 'CRM_REPEAT_SALE_CALL_ASSESSMENT',
						multiple: false,
						dropdownMode: true,
						showAvatars: false,
						enableSearch: true,
						width: 450,
						zIndex: 2500,
						tabs: this.tabs,
						items: this.items,
						searchOptions: {
							allowCreateItem: false
						},
						events: {
							'Item:onSelect': event => {
								const {
									item: {
										id
									}
								} = event.getData();
								this.emitSelectItem(id);
							},
							onShow: event => {
								main_core.Event.bindOnce(parentPopupContainer, 'click', this.onPopupContainerClick.bind(this));
							}
						}
					});
				}
				return this.dialog;
			},
			emitSelectItem(itemId) {
				this.$emit('onSelectItem', itemId);
			},
			onPopupContainerClick() {
				this.getDialog().hide();
			}
		},
		// language=Vue
		template: `
		<div
			ref="dialog"
			@click="toggleDialog"
			class="crm-repeat-sale__segment_call-assessment"
		>
			{{ this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_CALL_ASSESSMENT_SELECTOR') }}
		</div>
	`
	};

	const CategorySelector = {
		components: {
			DialogWrapperComponent
		},
		props: {
			categories: {
				type: Object,
				required: true
			},
			currentCategoryId: {
				type: Number,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			}
		},
		data() {
			const items = [];
			this.categories.forEach((category, index) => {
				items.push({
					id: category.id,
					title: category.name,
					entityId: 'category',
					tabs: 'categories',
					selected: category.id === this.currentCategoryId
				});
			});
			return {
				items
			};
		},
		created() {
			this.tabs = [{
				id: 'categories',
				title: ''
			}];
		},
		watch: {
			currentCategoryId(categoryId) {
				this.items.forEach(item => {
					// eslint-disable-next-line no-param-reassign
					item.selected = item.id === categoryId;
				});
			}
		},
		// language=Vue
		template: `
		<DialogWrapperComponent
			:items="items"
			:tabs="tabs"
			:read-only="readOnly"
		/>
	`
	};

	const StageSelector = {
		components: {
			DialogWrapperComponent
		},
		props: {
			category: {
				type: Object
			},
			currentStageId: {
				type: String,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				items: this.getPreparedItems()
			};
		},
		created() {
			this.tabs = [{
				id: 'stages',
				title: ''
			}];
		},
		methods: {
			destroy() {
				this.$refs.dialog.destroy();
			},
			getPreparedItems(setSelectedFirst = false) {
				const items = [];
				if (this.category === null) {
					return items;
				}
				let hasSelected = true;
				Object.values(this.category.items).forEach(item => {
					items.push({
						id: item.id,
						title: item.name,
						entityId: 'stage',
						tabs: 'stages',
						selected: setSelectedFirst ? hasSelected : item.id === this.currentStageId,
						avatarOptions: {
							bgColor: item.color,
							borderRadius: 6,
							bgSize: 20,
							bgImage: 'none'
						},
						customData: {
							color: item.color
						}
					});
					hasSelected = false;
				});
				if (!items.some(item => item.selected === true)) {
					items.find(Boolean).selected = true;
				}
				return items;
			}
		},
		watch: {
			category(category) {
				this.items = this.getPreparedItems(true);
			},
			currentStageId(categoryId) {
				this.items.forEach(item => {
					// eslint-disable-next-line no-param-reassign
					item.selected = item.id === categoryId;
				});
			}
		},
		// language=Vue
		template: `
		<DialogWrapperComponent
			ref="dialog"
			:items="items"
			:tabs="tabs"
			:showAvatars="true"
			:read-only="readOnly"
		/>
	`
	};

	const TagSelectorWrapperComponent = {
		emits: ['change', 'onSelectItem', 'onDeselectItem'],
		props: {
			items: {
				type: Array,
				default: []
			},
			preselectedItems: {
				type: Array,
				default: []
			},
			tabs: {
				type: Array,
				default: []
			},
			entities: {
				type: Array,
				default: []
			},
			showAvatars: {
				type: Boolean,
				default: false
			},
			multiple: {
				type: Boolean,
				default: false
			},
			context: {
				type: String,
				default: ''
			},
			events: {
				type: Object,
				default: {}
			},
			readOnly: {
				type: Boolean,
				default: false
			}
		},
		mounted() {
			this.initDialog();
		},
		watch: {
			items(items) {
				this.tagSelector.getDialog().destroy();
				main_core.Dom.clean(this.$refs.dialog);
				this.initDialog();
			}
		},
		methods: {
			initDialog() {
				const targetNode = this.$refs.dialog;
				targetNode.closest('body');
				this.tagSelector = new ui_entitySelector.TagSelector({
					multiple: this.multiple,
					readonly: this.readOnly,
					hideOnSelect: false,
					dialogOptions: {
						targetNode,
						context: this.context,
						multiple: this.multiple,
						hideOnSelect: false,
						dropdownMode: true,
						showAvatars: this.showAvatars,
						enableSearch: true,
						width: 450,
						zIndex: 2500,
						items: this.items,
						preselectedItems: this.preselectedItems,
						entities: this.entities,
						tabs: this.tabs,
						searchOptions: {
							allowCreateItem: false
						},
						events: {
							'Item:onSelect': event => {
								const {
									item: selectedItem
								} = event.getData();
								this.emitSelectItem(selectedItem);
							},
							'Item:onDeselect': event => {
								const {
									item: deselectedItem
								} = event.getData();
								this.emitDeselectItem(deselectedItem);
							}
						}
					}
				});
				this.tagSelector.renderTo(this.$refs.dialog);
			},
			emitSelectItem(selectedItem) {
				this.$emit('onSelectItem', selectedItem);
			},
			emitDeselectItem(deselectedItem) {
				this.$emit('onDeselectItem', deselectedItem);
			},
			selectItem(itemId) {
				const item = this.tagSelector.getDialog().getItem(itemId);
				item?.select();
			}
		},
		// language=Vue
		template: `
		<div ref="dialog"></div>
	`
	};

	const UserSelector = {
		components: {
			TagSelectorWrapperComponent
		},
		props: {
			userIds: {
				type: Array,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				preselectedItems: this.userIds.map(userId => {
					return ['user', userId];
				})
			};
		},
		created() {
			this.entities = [{
				id: 'user',
				options: {
					inviteEmployeeLink: false,
					emailUsers: false,
					inviteGuestLink: false,
					intranetUsersOnly: true
				}
			}, {
				id: 'structure-node',
				options: {
					selectMode: 'usersOnly'
				}
			}];
		},
		// language=Vue
		template: `
		<TagSelectorWrapperComponent 
			:entities="entities"
			:preselected-items="preselectedItems"
			:show-avatars="true"
			:multiple="true"
			:read-only="readOnly"
		/>
	`
	};

	const InlinePlaceholderSelector = {
		props: {
			readOnly: {
				type: Boolean,
				required: true
			},
			entityTypeIds: {
				type: Array,
				default: [BX.CrmEntityType.enumeration.contact, BX.CrmEntityType.enumeration.company]
			},
			isMultipleSelector: {
				type: Boolean,
				default: false
			},
			value: {
				type: String,
				default: ''
			},
			mode: {
				type: String,
				default: crm_field_inlinePlaceholderSelector.InlinePlaceholderSelectorMode.INPUT
			}
		},
		emits: ['titlePatternChanged'],
		methods: {
			onChange() {
				this.$emit('titlePatternChanged', this.selector.getValue());
			}
		},
		created() {
			this.selector = null;
		},
		mounted() {
			this.selector = new crm_field_inlinePlaceholderSelector.InlinePlaceholderSelector({
				target: this.$el,
				mode: this.mode,
				value: this.value,
				multiple: this.isMultipleSelector,
				entityTypeIds: this.entityTypeIds,
				isReadOnly: this.readOnly
			});
			this.selector.show();
			if (!this.readOnly) {
				const input = this.selector.getInputElement();
				main_core.Event.bind(input, 'input', this.onChange);
			}
		},
		template: `
		<div class="crm-inline-placeholder-selector-component-wrapper">
		</div>
	`
	};

	const Segment$1 = {
		components: {
			Button,
			AdditionalInfoComponent,
			AiSwitcherComponent,
			AssignmentTypeSelector,
			TextEditorWrapperComponent,
			InlinePlaceholderSelector,
			CallAssessmentSelector,
			CategorySelector,
			StageSelector,
			UserSelector
		},
		props: {
			settings: {
				type: Object,
				default: {}
			},
			segment: {
				type: Object,
				required: true
			},
			categories: {
				type: Object,
				required: true
			},
			callAssessments: {
				type: Object,
				required: true
			},
			events: {
				type: Object,
				default: {}
			},
			analytics: {
				type: Object,
				default: {}
			},
			textEditor: ui_textEditor.TextEditor
		},
		data() {
			const {
				segment,
				textEditor,
				categories,
				settings
			} = this;
			const id = segment?.id ?? null;
			const isEnabled = segment?.isEnabled ?? null;
			const firstCategory = categories[0];
			let isAiEnabled = false;
			if (settings.ai?.isAvailable && settings.baas?.hasPackage) {
				isAiEnabled = segment.isAiEnabled ?? true;
			}
			return {
				id,
				isEnabled,
				text: textEditor.getText(),
				parser: new ui_bbcode_parser.BBCodeParser(),
				currentCategoryId: segment.entityCategoryId ?? firstCategory.id,
				currentStageId: segment.entityStageId ?? this.getFirstAvailableCategoryStageId(firstCategory),
				assignmentTypeId: segment.assignmentTypeId ?? AssignmentType.byUser,
				assignmentUserIds: new Set(segment.assignmentUserIds ?? []),
				currentEntityTitlePattern: segment.entityTitlePattern ?? null,
				currentCallAssessmentId: segment.callAssessmentId ?? null,
				currentIsAiEnabled: isAiEnabled,
				minimumDaysAfterLastClosedEntity: segment.minimumDaysAfterLastClosedEntity,
				placeholderSelectorTypes: [BX.CrmEntityType.enumeration.contact, BX.CrmEntityType.enumeration.company]
			};
		},
		created() {
			this.assignmentType = AssignmentType;
		},
		mounted() {
			this.$Bitrix.eventEmitter.subscribe(ButtonEvents.click, this.onNavigationButtonClick);
			this.sendViewAnalytics();
		},
		beforeUnmount() {
			this.$Bitrix.eventEmitter.unsubscribe(ButtonEvents.click, this.onNavigationButtonClick);
		},
		methods: {
			onSaveCallback() {
				if (main_core.Type.isFunction(this.events?.onSave)) {
					this.events.onSave();
				}
			},
			onNavigationButtonClick({
				data
			}) {
				const {
					id
				} = data;
				if (id === 'cancel' || id === 'close') {
					this.sendCancelAnalytics();
					this.closeSlider();
					return;
				}
				this.sendData();
			},
			sendData() {
				const data = {
					entityTypeId: 2,
					// temporary only deal
					entityCategoryId: this.currentCategoryId,
					entityStageId: this.currentStageId,
					assignmentUserIds: [...this.assignmentUserIds.values()],
					entityTitlePattern: this.currentEntityTitlePattern,
					assignmentTypeId: this.assignmentTypeId,
					callAssessmentId: this.currentCallAssessmentId,
					isAiEnabled: this.currentIsAiEnabled,
					minimumDaysAfterLastClosedEntity: Number(this.minimumDaysAfterLastClosedEntity)
				};
				if (!this.currentIsAiEnabled) {
					data.prompt = this.textEditor.getText();
				}
				if (!this.validate(data)) {
					return;
				}
				const dataParams = {
					id: this.id,
					data
				};
				top.BX.Event.EventEmitter.emit('crm:repeatSale:segment:beforeSave', dataParams);
				main_core.ajax.runAction('crm.repeatsale.segment.save', {
					json: dataParams
				}).then(response => {
					top.BX.Event.EventEmitter.emit('crm:repeatSale.segment:save', {
						...dataParams,
						status: response?.status
					});
					if (response?.status !== 'success') {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Text.encode(response.errors[0].message),
							autoHideDelay: 6000
						});
						return;
					}
					this.onSaveCallback();
					this.sendEditAnalytics();
					this.closeSlider();
				}, response => {
					const messageCode = 'CRM_REPEAT_SALE_SEGMENT_SAVE_ERROR';
					ui_notification.UI.Notification.Center.notify({
						content: this.$Bitrix.Loc.getMessage(messageCode),
						autoHideDelay: 6000
					});
				}).catch(response => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Text.encode(response.errors[0].message),
						autoHideDelay: 6000
					});
					throw response;
				});
			},
			validate(data) {
				if (!main_core.Type.isArrayFilled(data.assignmentUserIds) && data.assignmentTypeId === AssignmentType.byUser) {
					ui_notification.UI.Notification.Center.notify({
						content: this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_VALIDATE_ASSIGNMENT_USERS_ERROR'),
						autoHideDelay: 6000
					});
					return false;
				}
				if (!this.currentIsAiEnabled && !main_core.Type.isStringFilled(this.getPlainText())) {
					ui_notification.UI.Notification.Center.notify({
						content: this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_VALIDATE_TEXT_ERROR'),
						autoHideDelay: 6000
					});
					return false;
				}
				if (!main_core.Type.isInteger(Number(this.minimumDaysAfterLastClosedEntity)) || this.minimumDaysAfterLastClosedEntity < 0) {
					ui_notification.UI.Notification.Center.notify({
						content: this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_VALIDATE_MIN_DAYS_AFTER_LAST_CLOSED_ENTITY_ERROR', {
							'#MIN_DAYS#': 0
						}),
						autoHideDelay: 6000
					});
					return false;
				}
				return true;
			},
			closeSlider() {
				top.BX.SidePanel.Instance.getSliderByWindow(window).close();
			},
			getPlainText() {
				return this.parser.parse(this.textEditor.getText()).toPlainText().trim();
			},
			onSelectCategory(category) {
				if (this.currentCategoryId === category.id) {
					return;
				}
				this.$refs.stageSelector.destroy();
				this.currentCategoryId = category.id;
				void this.$nextTick(() => {
					const currentCategory = this.getCategoryById(this.currentCategoryId);
					this.currentStageId = this.getFirstAvailableCategoryStageId(currentCategory);
				});
			},
			onSelectStage(stage) {
				this.currentStageId = stage.id;
			},
			getCategoryById(id) {
				return this.categories.find(category => category.id === id);
			},
			getFirstAvailableCategoryStageId(category) {
				return category.items[0].id;
			},
			onSelectAssignmentType(type) {
				this.assignmentTypeId = type.id;
			},
			onSelectAssignmentUser(user) {
				this.assignmentUserIds.add(user.id);
			},
			onDeselectAssignmentUser(user) {
				this.assignmentUserIds.delete(user.id);
			},
			onTitlePatternChange(value) {
				this.currentEntityTitlePattern = value;
			},
			setCurrentCallAssessmentId(id) {
				this.currentCallAssessmentId = id;
			},
			getMessageByCode(code) {
				return this.$Bitrix.Loc.getMessage(code);
			},
			setCurrentIsAiEnabled(value) {
				this.currentIsAiEnabled = value;
			},
			sendViewAnalytics() {
				const section = this.analytics.section ?? '';
				const viewEvent = crm_integration_analytics.Builder.RepeatSale.Segment.ViewEvent.createDefault(section);
				ui_analytics.sendData(viewEvent.buildData());
			},
			sendCancelAnalytics() {
				const section = this.analytics.section ?? '';
				const viewEvent = crm_integration_analytics.Builder.RepeatSale.Segment.CancelEvent.createDefault(section);
				ui_analytics.sendData(viewEvent.buildData());
			},
			sendEditAnalytics() {
				const section = this.analytics.section ?? '';
				const editEvent = crm_integration_analytics.Builder.RepeatSale.Segment.EditEvent.createDefault(section);
				if (!this.currentIsAiEnabled && this.getPlainPromptText() !== this.getPlainSegmentText()) {
					editEvent.setIsActivityTextChanged(true);
				}
				if (this.segment.entityTitlePattern !== this.currentEntityTitlePattern) {
					editEvent.setIsEntityTitlePatternChanged(true);
				}
				if (this.segment.isAiEnabled !== this.currentIsAiEnabled) {
					editEvent.setIsCopilotEnabled(this.currentIsAiEnabled);
				}
				editEvent.setSegmentCode(this.segment.code);
				ui_analytics.sendData(editEvent.buildData());
			},
			getPlainPromptText() {
				return this.parseText(this.textEditor.getText());
			},
			getPlainSegmentText() {
				return this.parseText(this.segment.prompt);
			},
			parseText(text) {
				return this.parser.parse(text).toPlainText().trim();
			}
		},
		computed: {
			readOnly() {
				return this.settings.isReadOnly;
			},
			isAiAvailable() {
				return this.settings.ai?.isAvailable ?? false;
			},
			aiDisabledSliderCode() {
				return this.settings.ai?.aiDisabledSliderCode ?? null;
			},
			isBaasAvailable() {
				return this.settings.baas?.isAvailable ?? false;
			},
			isBaasHasPackage() {
				return this.settings.baas?.hasPackage ?? false;
			},
			packageEmptySliderCode() {
				return this.settings.baas?.aiPackagesEmptySliderCode ?? null;
			},
			aiCallEnabled() {
				return this.settings.isAiCallEnabled;
			},
			repeatSaleSegmentSection() {
				return ['crm-repeat-sale__segment-section'];
			},
			title() {
				const code = this.readOnly ? 'CRM_REPEAT_SALE_SEGMENT_TITLE_READ_ONLY' : 'CRM_REPEAT_SALE_SEGMENT_TITLE';
				return this.$Bitrix.Loc.getMessage(code);
			},
			currentCategory() {
				return this.categories.find(category => category.id === this.currentCategoryId) ?? null;
			},
			messages() {
				const minimumDaysAfterLastClosedEntityUnitLabel = this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_MANUAL_MIN_DAYS_AFTER_LAST_CLOSED_ENTITY_UNIT_LABEL');
				return {
					textAreaTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_MANUAL_TEXTAREA_TITLE'),
					dealHelp: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_DEAL_HELP'),
					sectionTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_MANUAL_SECTION_TITLE'),
					stageTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_MANUAL_STAGE_TITLE'),
					dealAssignedTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_DEAL_ASSIGNED_TITLE_MSGVER_1'),
					dealTitlePattern: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_DEAL_NAME_PATTERN_TITLE'),
					assessmentTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_CALL_ASSESSMENT_TITLE'),
					assessmentDescription: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_CALL_ASSESSMENT_DESCRIPTION'),
					minimumDaysAfterLastClosedEntityTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_MANUAL_MIN_DAYS_AFTER_LAST_CLOSED_ENTITY_TITLE'),
					minimumDaysAfterLastClosedEntityUnitLabel: minimumDaysAfterLastClosedEntityUnitLabel.split(/(#INPUT#)/)
				};
			},
			assignmentTypes() {
				const types = [{
					id: AssignmentType.byClient,
					message: 'CRM_REPEAT_SALE_SEGMENT_DEAL_ASSIGNED_TYPE_BY_CLIENT'
				}, {
					id: AssignmentType.byClientLastDeal,
					message: 'CRM_REPEAT_SALE_SEGMENT_DEAL_ASSIGNED_TYPE_BY_CLIENT_LAST_DEAL'
				}, {
					id: AssignmentType.byUser,
					message: 'CRM_REPEAT_SALE_SEGMENT_DEAL_ASSIGNED_TYPE_BY_USER'
				}];
				return types.map(({
					id,
					message
				}) => ({
					id,
					title: this.$Bitrix.Loc.getMessage(message),
					entityId: 'type',
					tabs: 'types',
					selected: this.assignmentTypeId === id
				}));
			}
		},
		watch: {
			currentIsAiEnabled(value) {
				if (this.isAiAvailable && this.isBaasHasPackage) {
					this.currentIsAiEnabled = value;
					return;
				}
				if (value === true) {
					if (!this.isAiAvailable && this.aiDisabledSliderCode) {
						ui_infoHelper.InfoHelper.show(this.aiDisabledSliderCode);
					} else if (!this.isBaasHasPackage && this.packageEmptySliderCode) {
						ui_infoHelper.InfoHelper.show(this.packageEmptySliderCode);
					}
					void this.$nextTick(() => {
						this.currentIsAiEnabled = false;
					});
				}
			}
		},
		// language=Vue
		template: `
		<div class="crm-repeat-sale__segment_container">
			<div class="crm-repeat-sale__segment-wrapper">
				<header class="crm-repeat-sale__segment-section-header">
					<div class="crm-repeat-sale__segment-section-header-title">
						<span>{{title}}</span>
					</div>
				</header>
				<div class="crm-repeat-sale__segment-section-body">
					<section class="crm-repeat-sale__segment-section --main --active">
						<h1 class="crm-repeat-sale__segment-section-title">
							{{segment.title}}
						</h1>
						<div class="crm-repeat-sale__segment-section-description">
							{{segment.description}}
						</div>
						<AdditionalInfoComponent
							:title="messages.dealHelp"
						/>
					</section>
					
					
					<section class="crm-repeat-sale__segment-section --active">
						<div
							class="crm-repeat-sale__segment-fields-row"
							v-if="isBaasAvailable"
						>
							<div class="crm-repeat-sale__segment-field">
								<AiSwitcherComponent
									ref="aiSwitcher"
									:checked="currentIsAiEnabled"
									:read-only="readOnly"
									@change="setCurrentIsAiEnabled"
								/>
							</div>
						</div>
						
						<div
							v-if="!currentIsAiEnabled"
							class="crm-repeat-sale__segment-fields-row"
						>
							<div class="crm-repeat-sale__segment-field">
								<div class="crm-repeat-sale__segment-field-title">
									{{messages.textAreaTitle}}
								</div>
								<TextEditorWrapperComponent
									:textEditor="textEditor"
								/>
							</div>
						</div>
						
						<div class="crm-repeat-sale__segment-fields-row">
							<div class="crm-repeat-sale__segment-field">
								<div class="crm-repeat-sale__segment-field-title">
									{{messages.sectionTitle}}
								</div>
								<CategorySelector 
									:current-category-id="currentCategoryId"
									:categories="categories"
									:read-only="readOnly"
									@onSelectItem="onSelectCategory"
								/>
							</div>
							<div class="crm-repeat-sale__segment-field">
								<div class="crm-repeat-sale__segment-field-title">
									{{messages.stageTitle}}
								</div>
								<StageSelector 
									ref="stageSelector"
									:current-stage-id="currentStageId"
									:category="currentCategory"
									:read-only="readOnly"
									@onSelectItem="onSelectStage"
								/>
							</div>
						</div>

						<div class="crm-repeat-sale__segment-fields-row">
							<div class="crm-repeat-sale__segment-field">
								<div class="crm-repeat-sale__segment-field-title">
									{{messages.dealAssignedTitle}}
								</div>
								<AssignmentTypeSelector
									:current-type-id="assignmentTypeId"
									:types="assignmentTypes"
									:read-only="readOnly"
									:half-width="true"
									:enable-search="false"
									:show-input-icon="false"
									:use-item-max-size="false"
									@onSelectItem="onSelectAssignmentType"
								/>
							</div>
						</div>
						
						<div 
							v-if="assignmentTypeId === assignmentType.byUser"
							class="crm-repeat-sale__segment-fields-row"
						>
							<div class="crm-repeat-sale__segment-field">
								<UserSelector
									:user-ids="[...assignmentUserIds.values()]"
									:read-only="readOnly"
									@onSelectItem="onSelectAssignmentUser"
									@onDeselectItem="onDeselectAssignmentUser"
								/>
							</div>
						</div>
						
						<div class="crm-repeat-sale__segment-fields-row">
							<div class="crm-repeat-sale__segment-field">
								<div class="crm-repeat-sale__segment-field-title">
									{{messages.dealTitlePattern}}
								</div>
								<InlinePlaceholderSelector
									@titlePatternChanged="onTitlePatternChange"
									:entity-type-ids="placeholderSelectorTypes"
									:is-multiple-selector="true"
									:value="currentEntityTitlePattern"
									:mode="'input'"
									:read-only="readOnly"
								/>
							</div>
						</div>

						<div class="crm-repeat-sale__segment-fields-row">
							<div class="crm-repeat-sale__segment-field">
								<div class="crm-repeat-sale__segment-field-title">
									{{messages.minimumDaysAfterLastClosedEntityTitle}}
								</div>
								<div class="crm-repeat-sale__segment-fields-input-flex-wrapper">
									<template v-for="(item, index) in messages.minimumDaysAfterLastClosedEntityUnitLabel" :key="index">
										<input
											v-if="item === '#INPUT#'"
											class="ui-ctl-element ui-ctl-w10"
											type="text"
											maxlength="3"
											v-model="minimumDaysAfterLastClosedEntity"
											:readonly="readOnly"
										/>
										<p
											v-else-if="item.length > 0"
											class="crm-repeat-sale__segment-fields-input-unit-label ui-typography-text-md"
										>
											{{ item }}
										</p>
									</template>
								</div>
							</div>
						</div>
					</section>

					<section 
						:class="repeatSaleSegmentSection"
						v-if="aiCallEnabled && false"
					>
						<h1 class="crm-repeat-sale__segment-section-title --level2">
							{{messages.assessmentTitle}}
						</h1>
						<div class="crm-repeat-sale__segment-section-description">
							{{messages.assessmentDescription}}
						</div>

						<div class="crm-repeat-sale__segment-field">
							<CallAssessmentSelector 
								:call-assessments="callAssessments"
								:current-call-assessment-id="currentCallAssessmentId"
								:read-only="readOnly"
								@onSelectItem="setCurrentCallAssessmentId"
							/>
							{{currentCallAssessmentId}}
						</div>
					</section>
				</div>
			</div>
			<div class="crm-repeat-sale__segment_navigation-container">
				<div class="crm-repeat-sale__segment_navigation-buttons-wrapper">
					<Button v-if="!readOnly" id="update" />
					<Button v-if="!readOnly" id="cancel" />
					<Button v-if="readOnly" id="close" />
				</div>
			</div>
		</div>
	`
	};

	class Segment {
		#container;
		#app = null;
		#textEditor = null;
		#isReadOnly = true;
		constructor(containerId, params = {}) {
			this.#container = document.getElementById(containerId);
			if (!main_core.Type.isDomNode(this.#container)) {
				throw new Error('container not found');
			}
			this.#isReadOnly = params.config?.readOnly ?? true;
			this.#app = ui_vue3.BitrixVue.createApp(Segment$1, {
				textEditor: this.#getTextEditor(params.data.segment, params.config ?? {}),
				title: params.config?.title ?? '',
				settings: {
					isReadOnly: this.#isReadOnly,
					isCopy: params.config?.isCopy ?? false,
					ai: params.data.aiSettings,
					baas: params.data.baasSettings,
					isAiCallEnabled: params.data.isAiCallEnabled
				},
				segment: params.data.segment,
				categories: params.data.categories,
				callAssessments: params.data.callAssessments,
				events: params.events,
				analytics: params.analytics
			});
			this.#app.mount(this.#container);
		}
		#getTextEditor({
			prompt: content
		}, {
			copilotSettings
		}) {
			if (this.#textEditor !== null) {
				return this.#textEditor;
			}
			const floatingToolbar = this.#isReadOnly ? [] : ['bold', 'italic', 'underline', 'strikethrough', '|', 'numbered-list', 'bulleted-list', 'copilot'];
			this.#textEditor = new ui_textEditor.BasicEditor({
				editable: !this.#isReadOnly,
				removePlugins: ['BlockToolbar'],
				minHeight: 250,
				maxHeight: 400,
				content,
				placeholder: main_core.Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_PLACEHOLDER'),
				paragraphPlaceholder: main_core.Loc.getMessage(main_core.Type.isPlainObject(copilotSettings) ? 'CRM_REPEAT_SALE_SEGMENT_PLACEHOLDER_WITH_COPILOT' : null, crm_ai_nameService.NameService.copilotNameReplacement()),
				toolbar: [],
				floatingToolbar,
				collapsingMode: false,
				copilot: {
					copilotOptions: main_core.Type.isPlainObject(copilotSettings) ? copilotSettings : null,
					triggerBySpace: true
				}
			});
			return this.#textEditor;
		}
	}

	exports.Segment = Segment;

})(this.BX.Crm.RepeatSale = this.BX.Crm.RepeatSale || {}, BX.Crm.AI, BX, BX.UI.TextEditor, BX.Vue3, BX.Crm.Integration.Analytics, BX.UI.Analytics, BX.UI.BBCode, BX.UI, BX, BX.UI, BX.UI, BX.UI, BX.Event, BX.UI.EntitySelector, BX.Crm.Field);
//# sourceMappingURL=segment.bundle.js.map
