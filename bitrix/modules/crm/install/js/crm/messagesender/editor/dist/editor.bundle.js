/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_messagesender, crm_messagesender_editor_skeleton, main_core, main_core_events, ui_vue3, ui_vue3_vuex, ui_entitySelector, ui_iconSet_api_vue, ui_system_typography_vue, ui_vue3_components_button, crm_template_editor, ui_vue3_directives_hint, ui_alerts, crm_messagesender_channelSelector, ui_iconSet_outline, ui_system_chip_vue, ui_iconSet_social, crm_integration_analytics, ui_analytics) {
	'use strict';

	// @vue/component
	const LengthCounter = {
		name: 'LengthCounter',
		components: {
			BText: ui_system_typography_vue.Text
		},
		computed: {
			...ui_vue3_vuex.mapState({
				message: state => state.message.text
			}),
			messageLengthCounter() {
				const colorStart = this.isOverflow ? '<span style="color: #d0011b;">' : '<span>';
				const colorEnd = '</span>';
				return main_core.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_COUNTER', {
					'[color]': colorStart,
					'#COUNT#': main_core.Text.toInteger(this.message.length),
					'[/color]': colorEnd,
					'#MAX#': this.recommendedMaxMessageLength
				});
			},
			isOverflow() {
				return this.message.length > this.recommendedMaxMessageLength;
			},
			recommendedMaxMessageLength() {
				return main_core.Text.toInteger(main_core.Extension.getSettings('crm.messagesender.editor').get('recommendedMaxMessageLength'));
			}
		},
		template: `
		<BText 
			size="sm"
			tag="div"
			className="crm-messagesender-editor__content__footer__text"
		><span v-html="messageLengthCounter"></span></BText>
	`
	};

	// @vue/component
	const ContentBody = {
		name: 'ContentBody',
		props: {
			bgColor: {
				type: String,
				default: null
			},
			borderColor: {
				type: String,
				default: 'var(--ui-color-divider-accent)'
			},
			padding: {
				type: String,
				default: 'var(--ui-space-inset-md)'
			}
		},
		template: `
		<div
			class="crm-messagesender-editor__content__body"
			:style="{
				backgroundColor: bgColor,
				border: 'var(--ui-border-width-thin) var(--ui-text-decoration-style-solid) ' + borderColor,
				padding: padding,
			}"
		>
			<slot/>
		</div>
	`
	};

	// @vue/component
	const ContentFooter = {
		name: 'ContentFooter',
		template: `
		<div class="crm-messagesender-editor__content__footer">
			<slot/>
		</div>
	`
	};

	// @vue/component
	const MessagePreview = {
		name: 'MessagePreview',
		components: {
			BText: ui_system_typography_vue.Text
		},
		placeholdersPreviewer: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type boolean */
				isProgress: 'application/isProgress',
				/** @type string */
				messageBody: 'message/body',
				/** @type Channel */
				currentChannel: 'channels/current'
			}),
			...ui_vue3_vuex.mapState({
				context: state => state.application.context
			})
		},
		beforeUnmount() {
			this.placeholdersPreviewer?.destroy();
		},
		methods: {
			togglePreviewer() {
				if (this.isProgress || this.messageBody.trim().length === 0) {
					return;
				}
				this.placeholdersPreviewer ??= new crm_template_editor.Previewer({
					...this.context,
					bindElement: this.$refs.preview.$el,
					isDisplayFormat: !this.currentChannel?.isTemplatesBased
				});
				if (this.placeholdersPreviewer.isShown()) {
					this.placeholdersPreviewer.close();
				} else {
					this.$Bitrix.Data.get('locator').getAnalyticsService().onPreviewShow();
					this.placeholdersPreviewer.preview(this.messageBody);
				}
			}
		},
		template: `
		<BText
			ref="preview"
			size="sm"
			tag="div"
			:className="{
				'crm-messagesender-editor__content__footer__text': true, 
				'--pointer': !isProgress && messageBody.trim().length > 0,
				'--disabled': isProgress || messageBody.trim().length <= 0,
			}"
			data-test-role="preview"
			@click="togglePreviewer"
		>{{ $Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_PREVIEW') }}</BText>
	`
	};

	const MAX_TEXTAREA_HEIGHT = 150;

	// @vue/component
	const CustomMessageContent = {
		name: 'CustomMessageContent',
		components: {
			BButton: ui_vue3_components_button.Button,
			BText: ui_system_typography_vue.Text,
			BMenu: ui_vue3.BitrixVue.defineAsyncComponent('ui.system.menu.vue', 'BMenu'),
			Popup: ui_vue3.BitrixVue.defineAsyncComponent('ui.vue3.components.popup', 'Popup'),
			Smiles: ui_vue3.BitrixVue.defineAsyncComponent('ui.vue3.components.smiles', 'Smiles'),
			MessagePreview,
			ContentBody,
			ContentFooter,
			LengthCounter
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		placeholdersDialog: null,
		data() {
			return {
				isAddMenuShown: false,
				isSmilesShown: false,
				textAreaHeight: 'auto'
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type boolean */
				isProgress: 'application/isProgress'
			}),
			...ui_vue3_vuex.mapState({
				contentProviders: state => state.application.contentProviders,
				/** @type {Layout} */
				layout: state => state.application.layout,
				context: state => state.application.context
			}),
			message: {
				get() {
					return this.$store.state.message.text;
				},
				set(text) {
					this.$store.dispatch('message/setText', {
						text
					});
				}
			},
			isShowActionsButton() {
				return this.layout.isContentProvidersShown && this.menuItems.length > 0;
			},
			isShowCopilot() {
				return this.layout.isContentProvidersShown && this.contentProviders.copilot?.isShown;
			},
			menuOptions() {
				return {
					bindElement: this.$refs.actions,
					sections: [{
						code: 'crmValues'
					}],
					items: this.menuItems
				};
			},
			menuItems() {
				const items = [];
				if (this.contentProviders.files?.isShown) {
					const item = {
						title: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_FILE'),
						icon: ui_iconSet_api_vue.Outline.ATTACH,
						isLocked: this.contentProviders.files.isLocked
					};
					if (this.contentProviders.files.isEnabled && !this.contentProviders.files.isLocked) {
						item.subMenu = {};
						item.subMenu.items = [{
							title: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_FILE_UPLOAD'),
							onClick: () => {
								if (this.isProgress) {
									return;
								}
								this.getFileService().uploadNewFile(this.processFileResult);
							}
						}, {
							title: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_FILE_DISK'),
							onClick: () => {
								if (this.isProgress) {
									return;
								}
								this.getFileService().pickFromDisk(this.processFileResult);
							}
						}];
					} else if (this.contentProviders.files.isLocked) {
						item.onClick = () => {
							void this.showLimitSlider(this.contentProviders.files.sliderCode);
						};
					}
					items.push(item);
				}
				if (this.contentProviders.salescenter?.isShown) {
					items.push({
						title: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_PAYMENT'),
						icon: ui_iconSet_api_vue.Outline.MONEY,
						isLocked: this.contentProviders.salescenter.isLocked,
						onClick: async () => {
							if (this.isProgress) {
								return;
							}
							if (this.contentProviders.salescenter.isLocked) {
								this.getSalescenterService().showSalescenterDisabledSlider();
								return;
							}
							if (!this.contentProviders.salescenter.isEnabled) {
								this.$Bitrix.Data.get('locator').getLogger().warn('salescenter is not enabled');
								return;
							}
							const result = await this.getSalescenterService().openApplication();
							this.processSalescenterResult(result);
						}
					});
				}
				if (this.contentProviders.documents?.isEnabled) {
					items.push({
						title: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_DOCUMENT'),
						icon: ui_iconSet_api_vue.Outline.FILE,
						onClick: async () => {
							if (this.isProgress) {
								return;
							}
							const document = await this.getDocumentService().selectOrCreateDocument(this.$refs.actions);
							if (!main_core.Type.isNil(document)) {
								this.processDocumentResult(document);
							}
						}
					});
				}
				if (this.contentProviders.crmValues?.isEnabled) {
					items.push({
						title: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_CRM'),
						sectionCode: 'crmValues',
						icon: ui_iconSet_api_vue.Outline.PROMPT_VAR,
						onClick: () => {
							if (this.isProgress) {
								return;
							}
							this.openPlaceholdersDialog();
						}
					});
				}
				return items;
			},
			bgColor() {
				return this.layout.isMessageTextReadOnly ? 'var(--ui-color-accent-soft-blue-3)' : undefined;
			}
		},
		watch: {
			'message.length': function () {
				this.textAreaHeight = 'auto';
				void this.$nextTick(() => {
					const height = Math.min(this.$refs.textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
					this.textAreaHeight = `${height}px`;
				});
			}
		},
		beforeUnmount() {
			this.placeholdersDialog?.destroy();
		},
		methods: {
			getFileService() {
				return this.$Bitrix.Data.get('locator').getFileService();
			},
			getSalescenterService() {
				return this.$Bitrix.Data.get('locator').getSalescenterService();
			},
			getDocumentService() {
				return this.$Bitrix.Data.get('locator').getDocumentService();
			},
			getAnalyticsService() {
				return this.$Bitrix.Data.get('locator').getAnalyticsService();
			},
			processFileResult(file) {
				this.$store.dispatch('message/setSource', {
					source: 'file'
				});
				this.insertText(`${file.name} ${file.externalLink}`);
				this.getAnalyticsService().onAddFile();
			},
			processDocumentResult(document) {
				this.$store.dispatch('message/setSource', {
					source: 'document'
				});
				this.insertText(`${document.title} ${document.publicUrl}`);
				this.getAnalyticsService().onAddDocument();
			},
			processSalescenterResult(result) {
				if (main_core.Type.isStringFilled(result.source)) {
					this.$store.dispatch('message/setSource', {
						source: result.source
					});
				}
				if (main_core.Type.isPlainObject(result.page)) {
					this.insertText(`${result.page.name} ${result.page.url}`);
					this.getAnalyticsService().onAddSalescenterPage();
				} else if (main_core.Type.isPlainObject(result.payment)) {
					this.insertText(result.payment.name);
					if (!main_core.Type.isNil(result.payment.paymentId)) {
						this.$store.dispatch('message/setPaymentId', {
							paymentId: result.payment.paymentId
						});
					}
					if (!main_core.Type.isNil(result.payment.shipmentId)) {
						this.$store.dispatch('message/setShipmentId', {
							shipmentId: result.payment.shipmentId
						});
					}
					this.getAnalyticsService().onAddSalescenterPayment();
				} else if (main_core.Type.isPlainObject(result.compilation)) {
					this.insertText(result.compilation.name);
					if (main_core.Type.isArray(result.compilation.productIds)) {
						this.$store.dispatch('message/setCompilationProductIds', {
							compilationProductIds: result.compilation.productIds
						});
					}
					this.getAnalyticsService().onAddSalescenterCompilation();
				}
			},
			openPlaceholdersDialog() {
				this.placeholdersDialog ??= new ui_entitySelector.Dialog({
					targetNode: this.$refs.actions,
					multiple: false,
					showAvatars: false,
					dropdownMode: true,
					compactView: true,
					enableSearch: true,
					entities: [{
						id: 'placeholder',
						dynamicLoad: true,
						dynamicSearch: false,
						searchable: true,
						options: this.context
					}],
					events: {
						'Item:onSelect': event => {
							const {
								item: selectedItem
							} = event.getData();
							this.insertText(`{${selectedItem.getCustomData().get('text')}}`);
							this.getAnalyticsService().onAddCrmValue();
							selectedItem.deselect();
						}
					}
				});
				this.placeholdersDialog.show();
			},
			async showCopilot() {
				if (this.isProgress) {
					return;
				}
				if (this.contentProviders.copilot?.isLocked) {
					void this.showLimitSlider(this.contentProviders.copilot.sliderCode);
					return;
				}
				if (!this.contentProviders.copilot?.isEnabled) {
					this.$Bitrix.Data.get('locator').getLogger().warn('copilot is not enabled');
					return;
				}
				const result = await this.$Bitrix.Data.get('locator').getCopilotService().showCopilot(this.$refs.textarea, '', this.message);
				if (main_core.Type.isStringFilled(result.textReplace)) {
					this.message = result.textReplace;
					this.getAnalyticsService().onAddCopilot();
				} else if (main_core.Type.isStringFilled(result.textBelow)) {
					this.message = `${this.message}\n${result.textBelow}`;
					this.getAnalyticsService().onAddCopilot();
				}
			},
			async showLimitSlider(code) {
				try {
					/** @see BX.UI.FeaturePromotersRegistry */
					const {
						FeaturePromotersRegistry
					} = await main_core.Runtime.loadExtension('ui.info-helper');
					FeaturePromotersRegistry.getPromoter({
						code
					}).show();
				} catch (error) {
					this.$Bitrix.Data.get('locator').getLogger().error('failed to show ui.info-helper', error);
				}
			},
			toggleSmiles() {
				if (this.isProgress) {
					return;
				}
				this.isSmilesShown = !this.isSmilesShown;
			},
			// inserts text at the cursor position
			insertText(text) {
				const start = this.$refs.textarea.selectionStart;
				const end = this.$refs.textarea.selectionEnd;
				const messageStart = this.message.slice(0, start);
				const messageEnd = this.message.slice(end);
				let paddedText = text;
				if (messageStart.length > 0 && !messageStart.endsWith(' ') && !paddedText.startsWith(' ')) {
					paddedText = ` ${paddedText}`;
				}
				if (messageEnd.length > 0 && !messageEnd.startsWith(' ') && !paddedText.endsWith(' ')) {
					paddedText = `${paddedText} `;
				}
				this.message = messageStart + paddedText + messageEnd;
				void this.$nextTick(() => {
					const position = start + paddedText.length;
					this.$refs.textarea.selectionStart = position;
					this.$refs.textarea.selectionEnd = position;
					this.$refs.textarea.focus();
				});
			}
		},
		template: `
		<ContentBody
			padding="0 0 var(--ui-space-inset-xs) 0"
			:bgColor="bgColor"
			:borderColor="bgColor"
		>
				<div class="crm-messagesender-editor__content__body__textarea-container">
					<textarea
						ref="textarea"
						v-model="message"
						class="crm-messagesender-editor__content__body__textarea"
						:placeholder="$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_PLACEHOLDER')"
						:disabled="isProgress || layout.isMessageTextReadOnly"
						:style="{ 
							height: textAreaHeight,
							backgroundColor: bgColor, 
						}"
						data-test-role="message-text-input"
					></textarea>
				</div>
			<div ref="actions" v-if="isShowActionsButton || isShowCopilot || layout.isEmojiButtonShown" class="crm-messagesender-editor__content__body__actions">
				<div class="crm-messagesender-editor__content__body__actions__left">
					<BButton
						v-if="isShowActionsButton"
						:text="$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_BUTTON_ADD')"
						:style="AirButtonStyle.PLAIN"
						:leftIcon="Outline.PLUS_M"
						:disabled="isProgress || layout.isMessageTextReadOnly"
						@click="isAddMenuShown = true"
					/>
					<BMenu v-if="isAddMenuShown && !isProgress" :options="menuOptions" @close="isAddMenuShown = false"/>
					<BButton
						v-if="isShowCopilot"
						@click="showCopilot"
						:style="AirButtonStyle.PLAIN"
						:leftIcon="Outline.COPILOT"
						:disabled="isProgress || layout.isMessageTextReadOnly"
						class="crm-messagesender-editor__content__body__actions__copilot"
					/>
				</div>
				<div ref="buttons-right">
					<BButton
						v-if="layout.isEmojiButtonShown"
						:style="AirButtonStyle.PLAIN"
						:leftIcon="Outline.SMILE"
						@click="toggleSmiles"
						:disabled="isProgress || layout.isMessageTextReadOnly"
					/>
					<Popup
						v-if="isSmilesShown && !isProgress"
						:options="{ 
								bindElement: $refs['buttons-right'],
								width: 332,
								height: 360,
								offsetLeft: -133,
								padding: 0,
								background: '#F7F9FA',
							}"
						@close="isSmilesShown = false"
					>
						<Smiles :isOnlyEmoji="true" @selectSmile="insertText($event.text)"/>
					</Popup>
				</div>
			</div>
		</ContentBody>
		<ContentFooter>
			<MessagePreview v-if="layout.isMessagePreviewShown"/>
			<div v-else></div>
			<LengthCounter/>
		</ContentFooter>
	`
	};

	// @vue/component
	const ContentContainer = {
		name: 'ContentContainer',
		template: `
		<div class="crm-messagesender-editor__content" data-role="content-container">
			<slot/>
		</div>
	`
	};

	// @vue/component
	const NotificationMessageContent = {
		name: 'NotificationMessageContent',
		components: {
			BText: ui_system_typography_vue.Text,
			ContentBody
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		editor: null,
		computed: {
			...ui_vue3_vuex.mapState({
				notificationTemplate: state => state.application.notificationTemplate
			}),
			title() {
				return this.notificationTemplate?.translation?.TITLE || '';
			},
			placeholders() {
				return this.notificationTemplate?.placeholders ?? [];
			},
			previewPlaceholders() {
				return this.placeholders.map(placeholder => this.makeTranslationPlaceholderName(placeholder.name));
			},
			filledPlaceholders() {
				return this.placeholders.map(placeholder => {
					return {
						PLACEHOLDER_ID: this.makeTranslationPlaceholderName(placeholder.name),
						FIELD_VALUE: placeholder.value ?? placeholder.caption ?? ''
					};
				});
			},
			hasNotFilledPlaceholders() {
				return this.placeholders.some(placeholder => main_core.Type.isNil(placeholder.value));
			},
			hint() {
				if (!this.hasNotFilledPlaceholders) {
					return null;
				}
				return {
					text: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_PLACEHOLDER_FILLED_LATER_HINT'),
					position: 'top'
				};
			}
		},
		mounted() {
			this.editor = new crm_template_editor.Editor({
				...this.context,
				target: this.$refs.body,
				canUsePreview: false,
				isReadOnly: true
			});
			this.editor.setPlaceholders({
				PREVIEW: this.previewPlaceholders
			}).setFilledPlaceholders(this.filledPlaceholders).setBody(this.notificationTemplate?.translation?.TEXT || this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_TEMPLATE_MESSAGE'));
		},
		beforeUnmount() {
			this.editor?.destroy();
		},
		methods: {
			makeTranslationPlaceholderName(placeholderName) {
				return `#${placeholderName}#`;
			}
		},
		template: `
		<ContentBody bgColor="var(--ui-color-accent-soft-blue-3)" borderColor="var(--ui-color-accent-soft-blue-3)">
			<BText
				v-if="title"
				tag="div"
				size="md"
				style="
					color: var(--ui-color-base-4);
					margin-bottom: 8px;
				"
			>{{ title }}</BText>
			<div
				ref="body"
				v-hint="hint"
			></div>
		</ContentBody>
	`
	};

	// @vue/component
	const TemplateMessageContent = {
		name: 'TemplateMessageContent',
		components: {
			BText: ui_system_typography_vue.Text,
			ContentBody,
			ContentFooter,
			MessagePreview
		},
		editor: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Channel */
				currentChannel: 'channels/current',
				/** @type ?Template */
				template: 'templates/current'
			}),
			...ui_vue3_vuex.mapState({
				context: state => state.application.context,
				isMessagePreviewShown: state => state.application.layout.isMessagePreviewShown
			}),
			templateTitle() {
				if (main_core.Type.isNil(this.template)) {
					return this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_NO_TEMPLATE_TITLE');
				}
				return this.template.TITLE ?? '';
			},
			templateBody() {
				if (main_core.Type.isNil(this.template)) {
					return this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_NO_TEMPLATE_BODY');
				}
				return this.template.PREVIEW.replaceAll('\n', '<br>') ?? '';
			}
		},
		watch: {
			'currentChannel.id': function () {
				this.ensureTemplatesLoaded();
			},
			template() {
				this.adjustEditor();
			}
		},
		created() {
			this.ensureTemplatesLoaded();
		},
		mounted() {
			this.editor = new crm_template_editor.Editor({
				...this.context,
				target: this.$refs.body,
				canUsePreview: false,
				// we render it ourselves
				canUseFieldsDialog: true,
				canUseFieldValueInput: true,
				onSelect: params => {
					this.createOrUpdatePlaceholder(params);
					this.$store.dispatch('templates/setFilledPlaceholder', {
						filledPlaceholder: {
							PLACEHOLDER_ID: params.id,
							FIELD_NAME: params.value,
							FIELD_VALUE: params.text,
							PARENT_TITLE: params.parentTitle,
							TITLE: params.title
						}
					});
				}
			});
			this.adjustEditor();
		},
		beforeUnmount() {
			this.editor?.destroy();
		},
		methods: {
			ensureTemplatesLoaded() {
				// hack to load templates only when we start working with the specific channel
				this.$Bitrix.Data.get('locator').getTemplateService().loadTemplates();
			},
			createOrUpdatePlaceholder(params) {
				this.$Bitrix.Data.get('locator').getTemplateService().createOrUpdatePlaceholder(params);
			},
			adjustEditor() {
				this.editor.setPlaceholders(main_core.Runtime.clone(this.template?.PLACEHOLDERS ?? [])).setFilledPlaceholders(main_core.Runtime.clone(this.template?.FILLED_PLACEHOLDERS ?? [])).setBody(this.templateBody);
			}
		},
		template: `
		<ContentBody bgColor="var(--ui-color-accent-soft-blue-3)" borderColor="var(--ui-color-accent-soft-blue-3)">
			<BText
				tag="div"
				size="md"
				style="
						color: var(--ui-color-base-4);
						margin-bottom: 8px;
					"
			>{{ templateTitle }}</BText>
			<div ref="body"></div>
		</ContentBody>
		<ContentFooter>
			<MessagePreview v-if="isMessagePreviewShown"/>
		</ContentFooter>
	`
	};

	// @vue/component
	const EditorAlert = {
		name: 'EditorAlert',
		alertInstance: null,
		data() {
			return {
				isAlertRendered: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapState({
				/** @type AlertState */
				alert: state => state.application.alert
			}),
			isAlertShown() {
				return main_core.Type.isStringFilled(this.alert?.error);
			}
		},
		watch: {
			alert(newAlert, oldAlert) {
				if (!main_core.Type.isStringFilled(newAlert?.error)) {
					this.alertInstance?.hide();
					this.isAlertRendered = false;
					return;
				}
				if (!this.alertInstance) {
					this.alertInstance = new ui_alerts.Alert({
						color: ui_alerts.AlertColor.DANGER,
						icon: ui_alerts.AlertIcon.DANGER,
						// closeBtn: true,
						animated: false
					});

					// Event.bind(this.alertInstance.getCloseBtn(), 'click', () => {
					// 	this.$store.dispatch('application/resetAlert');
					// });
				}
				if (newAlert.error !== oldAlert.error) {
					this.alertInstance.setText(main_core.Text.encode(newAlert.error));
				}
				if (!this.isAlertRendered) {
					this.alertInstance.show();
					this.alertInstance.renderTo(this.$el);
					this.isAlertRendered = true;
				}
			}
		},
		beforeUnmount() {
			this.alertInstance?.destroy();
		},
		template: `
		<div class="crm-messagesender-editor__alert" data-test-role="alert" :style="{
			marginTop: isAlertShown ? 'var(--ui-space-stack-xs2)' : null,
		}"></div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	const ENTITY_ID$2 = 'crm-from';

	// @vue/component
	const EditorFooter = {
		name: 'EditorFooter',
		components: {
			BButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon,
			BText: ui_system_typography_vue.Text
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		dialog: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Channel */
				channel: 'channels/current',
				/** @type From */
				from: 'channels/from',
				receiver: 'channels/receiver',
				/** @type boolean */
				isReadyToSend: 'message/isReadyToSend',
				isProgress: 'application/isProgress'
			}),
			...ui_vue3_vuex.mapState({
				/** @type boolean */
				isSending: state => state.application.progress.isSending,
				/** @type Layout */
				layout: state => state.application.layout
			}),
			fromText() {
				return this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_FROM', {
					'#FROM#': this.from.name || ''
				});
			},
			isSelectable() {
				return this.fromList.length > 1;
			},
			fromList() {
				return this.channel?.fromList ?? [];
			},
			dialogItems() {
				return this.fromList.map(from => {
					return {
						id: from.id,
						entityId: ENTITY_ID$2,
						title: from.name,
						subtitle: from.description,
						selected: from.id === this.from.id,
						tabs: ['recents']
					};
				});
			}
		},
		methods: {
			toggleDialog() {
				if (!this.isSelectable) {
					return;
				}
				if (this.dialog) {
					this.dialog.hide();
					this.dialog = null;
					return;
				}
				this.dialog = new ui_entitySelector.Dialog({
					targetNode: this.$refs.from,
					entities: [{
						id: ENTITY_ID$2,
						searchable: true
					}],
					items: this.dialogItems,
					width: 400,
					height: 300,
					enableSearch: true,
					hideOnSelect: true,
					autoHide: true,
					dropdownMode: true,
					showAvatars: false,
					multiple: false,
					cacheable: false,
					events: {
						'Item:onSelect': event => {
							this.$store.dispatch('channels/setFrom', {
								fromId: event.getData().item.id
							});
						},
						onDestroy: () => {
							this.dialog = null;
						}
					}
				});
				this.dialog.show();
			},
			send() {
				if (this.isProgress) {
					return;
				}
				this.$Bitrix.Data.get('locator').getSendService().sendMessage().catch(response => {
					this.$Bitrix.Data.get('locator').getAlertService().showError(response?.errors?.[0]?.message);
				});
			},
			cancel() {
				if (this.isProgress) {
					return;
				}
				this.$Bitrix.Data.get('locator').getAnalyticsService().onCancel();
				this.$Bitrix.Data.get('locator').getMessageModel().clearState();
				this.$store.dispatch('application/resetAlert');
				this.$Bitrix.eventEmitter.emit('crm:messagesender:editor:onCancel');
			}
		},
		template: `
		<div class="crm-messagesender-editor__footer">
			<div class="crm-messagesender-editor__footer__buttons">
				<BButton
					v-if="layout.isSendButtonShown"
					:text="$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_BUTTON_SEND')"
					@click="send"
					:disabled="!isReadyToSend || (isProgress && !isSending)" 
					:loading="isSending"
				/>
				<BButton
					v-if="layout.isCancelButtonShown"
					:text="$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_BUTTON_CANCEL')"
					@click="cancel"
					:style="AirButtonStyle.PLAIN"
					:disabled="isProgress"
				/>
			</div>
			<div v-if="from" ref="from" class="crm-messagesender-editor__footer__from" data-test-role="from-selector" @click="toggleDialog" :style="{
				cursor: isSelectable ? 'pointer' : 'default',
			}">
				<BText 
					tag="div"
					size="xs"
					align="right"
					className="crm-messagesender-editor__footer__from__text"
				>{{ fromText }}</BText>
				<BIcon v-if="isSelectable" :name="Outline.CHEVRON_DOWN_S"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const ChannelSelector = {
		name: 'ChannelSelector',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		selector: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Channel */
				currentChannel: 'channels/current',
				itemsSort: 'preferences/channelsSortOrDefault'
			}),
			...ui_vue3_vuex.mapState({
				/** @type Channel[] */
				allChannels: state => state.channels.collection,
				promoBanners: state => state.application.promoBanners
			}),
			selectorItems() {
				return this.allChannels.map(channel => {
					return {
						id: channel.id,
						appearance: channel.appearance,
						onclick: item => {
							this.$store.dispatch('channels/setChannel', {
								channelId: item.id
							});
							this.$Bitrix.Data.get('locator').getAnalyticsService().onSelectChannel();
							this.selector?.close();
						}
					};
				});
			}
		},
		watch: {
			allChannels() {
				this.destroySelector();
			},
			promoBanners() {
				this.destroySelector();
			}
		},
		beforeUnmount() {
			this.destroySelector();
		},
		methods: {
			toggleSelector() {
				if (this.selector?.isShown()) {
					this.selector.close();
					return;
				}
				this.selector ??= new crm_messagesender_channelSelector.Selector({
					bindElement: this.$el,
					items: main_core.Runtime.clone(this.selectorItems),
					banners: main_core.Runtime.clone(this.promoBanners),
					itemsSort: main_core.Runtime.clone(this.itemsSort),
					analytics: main_core.Runtime.clone(this.$store.state.analytics.analytics),
					events: {
						onSave: event => {
							const {
								itemsSort
							} = event.getData();
							if (this.isSortChanged(itemsSort)) {
								this.$Bitrix.Data.get('locator').getAnalyticsService().onSaveChannelsSort();
							}
							this.getPreferencesService().saveChannelsSort(itemsSort);
						},
						onConnectionsSliderClose: () => {
							this.$Bitrix.Data.get('locator').getAnalyticsService().onAddChannelClick();
							this.$Bitrix.eventEmitter.emit('crm:messagesender:editor:onConnectionsSliderClose');
						},
						onPromoBannerSliderClose: event => {
							const {
								bannerId,
								connectStatus
							} = event.getData();
							this.$Bitrix.Data.get('locator').getAnalyticsService().onBannerConnectClick(bannerId, connectStatus);
							this.$Bitrix.eventEmitter.emit('crm:messagesender:editor:onPromoBannerSliderClose');
						},
						onDestroy: () => {
							this.selector = null;
						}
					}
				});
				this.selector.show();
			},
			isSortChanged(newSort) {
				if (newSort.length !== this.itemsSort.length) {
					return true;
				}
				return !this.itemsSort.every((channelId, index) => channelId === newSort[index]);
			},
			destroySelector() {
				this.selector?.destroy();
				this.selector = null;
			},
			getPreferencesService() {
				return this.$Bitrix.Data.get('locator').getPreferencesService();
			}
		},
		template: `
		<Chip
			:icon="currentChannel.appearance.icon.title"
			:iconColor="currentChannel.appearance.icon.color"
			:iconBackground="currentChannel.appearance.icon.background"
			:dropdown="true"
			:text="currentChannel.appearance.title"
			:trimmable="true"
			data-test-role="channel-selector"
			@click="toggleSelector"
		/>
	`
	};

	const ENTITY_ID$1 = 'crm-receiver';

	// @vue/component
	const ReceiverSelector = {
		name: 'ReceiverSelector',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				ChipDesign: ui_system_chip_vue.ChipDesign
			};
		},
		dialog: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Channel */
				channel: 'channels/current',
				/** @type ?Receiver */
				receiver: 'channels/receiver'
			}),
			hasReceivers() {
				return main_core.Type.isArrayFilled(this.channel?.toList);
			},
			chipText() {
				if (!this.hasReceivers) {
					return this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_NO_RECEIVER');
				}
				return `${this.receiver.addressSourceData.title} ${this.receiver.address.valueFormatted}`;
			},
			dialogItems() {
				return this.channel.toList.map(receiver => {
					return {
						id: receiver.address.id,
						entityId: ENTITY_ID$1,
						title: receiver.addressSourceData.title,
						subtitle: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_RECEIVER_SUBTITLE_TEMPLATE', {
							'#ADDRESS#': receiver.address.valueFormatted,
							'#TYPE#': receiver.address.valueTypeCaption
						}),
						avatar: `/bitrix/js/crm/messagesender/editor/images/${receiver.addressSource.entityTypeName.toLowerCase()}.svg`,
						selected: this.receiver?.address.id === receiver.address.id,
						tabs: ['recents']
					};
				});
			}
		},
		methods: {
			toggleDialog() {
				if (!this.hasReceivers) {
					return;
				}
				if (this.dialog) {
					this.dialog.hide();
					this.dialog = null;
					return;
				}
				this.dialog = new ui_entitySelector.Dialog({
					targetNode: this.$el,
					entities: [{
						id: ENTITY_ID$1,
						searchable: true
					}],
					items: this.dialogItems,
					width: 400,
					height: 300,
					enableSearch: true,
					hideOnSelect: true,
					autoHide: true,
					dropdownMode: true,
					multiple: false,
					cacheable: false,
					events: {
						'Item:onSelect': event => {
							this.$store.dispatch('channels/setReceiver', {
								receiverAddressId: event.getData().item.id
							});
						},
						onDestroy: () => {
							this.dialog = null;
						}
					}
				});
				this.dialog.show();
			}
		},
		template: `
		<Chip 
			:icon="Outline.PERSON" 
			iconColor="var(--ui-color-accent-main-primary-alt)"
			iconBackground="var(--ui-color-accent-soft-blue-3)"
			:design="hasReceivers ? ChipDesign.Outline : ChipDesign.ShadowDisabled"
			:dropdown="true"
			:trimmable="true"
			:text="chipText"
			data-test-role="receiver-selector"
			@click="toggleDialog"
		/>
	`
	};

	const ENTITY_ID = 'crm-hsm';

	// @vue/component
	const TemplateSelector = {
		name: 'TemplateSelector',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		dialog: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Template[] */
				templates: 'templates/listForChannel',
				/** @type ?Template */
				current: 'templates/current'
			}),
			dialogItems() {
				return this.templates.map(template => {
					return {
						id: template.ORIGINAL_ID,
						entityId: ENTITY_ID,
						title: template.TITLE,
						subtitle: template.PREVIEW,
						avatar: '/bitrix/js/crm/messagesender/editor/images/template.svg',
						avatarOptions: {
							bgColor: 'var(--ui-color-accent-soft-blue-3)'
						},
						selected: this.current?.ORIGINAL_ID === template.ORIGINAL_ID,
						tabs: ['recents']
					};
				});
			},
			dialogFooter() {
				return [main_core.Tag.render`<span style="width: 100%;"></span>`, main_core.Tag.render`
					<span onclick="${this.showFeedbackForm}" class="ui-selector-footer-link">${this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_SUGGEST_TEMPLATE')}</span>
				`];
			}
		},
		methods: {
			toggleDialog() {
				if (this.dialog) {
					this.dialog.hide();
					this.dialog = null;
					return;
				}
				this.dialog = new ui_entitySelector.Dialog({
					targetNode: this.$el,
					entities: [{
						id: ENTITY_ID,
						searchable: true
					}],
					items: this.dialogItems,
					width: 400,
					height: 350,
					enableSearch: true,
					hideOnSelect: true,
					autoHide: true,
					dropdownMode: true,
					multiple: false,
					cacheable: false,
					footer: this.dialogFooter,
					events: {
						'Item:onSelect': event => {
							this.$store.dispatch('templates/setTemplate', {
								templateOriginalId: event.getData().item.id
							});
							this.$Bitrix.Data.get('locator').getAnalyticsService().onSelectTemplate();
						},
						onDestroy: () => {
							this.dialog = null;
						}
					}
				});
				this.dialog.show();
			},
			async showFeedbackForm() {
				this.$Bitrix.Data.get('locator').getAnalyticsService().onSuggestTemplate();
				const {
					Form
				} = await main_core.Runtime.loadExtension('ui.feedback.form');

				/** @see BX.UI.Feedback.Form.open */
				Form.open({
					id: 'b24_crm_timeline_whatsapp_template_suggest_form',
					forms: [{
						zones: ['ru', 'by', 'kz'],
						id: 758,
						lang: 'ru',
						sec: 'jyafqa'
					}, {
						zones: ['en'],
						id: 760,
						lang: 'en',
						sec: 'culzcq'
					}, {
						zones: ['de'],
						id: 764,
						lang: 'de',
						sec: '9h74xf'
					}, {
						zones: ['com.br'],
						id: 766,
						lang: 'com.br',
						sec: 'ddkhcc'
					}, {
						zones: ['es'],
						id: 762,
						lang: 'es',
						sec: '6ni833'
					}, {
						zones: ['en'],
						id: 760,
						lang: 'en',
						sec: 'culzcq'
					}]
				});
			}
		},
		template: `
		<Chip 
			:icon="Outline.TEXT_FORMAT_BOTTOM"
			:dropdown="true"
			:text="$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_TEMPLATES')"
			data-test-role="template-selector"
			@click="toggleDialog"
		/>
	`
	};

	// @vue/component
	const EditorHeader = {
		name: 'EditorHeader',
		components: {
			BButton: ui_vue3_components_button.Button,
			ChannelSelector,
			ReceiverSelector,
			TemplateSelector
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Channel */
				currentChannel: 'channels/current'
			}),
			hasChannels() {
				return !main_core.Type.isNil(this.currentChannel);
			},
			isTemplatesSelectorShown() {
				// todo templates for custom text
				return Boolean(this.currentChannel?.isTemplatesBased);
			}
		},
		methods: {
			async openConnectionsSlider() {
				const {
					Router
				} = await main_core.Runtime.loadExtension('crm.router');

				/** @see BX.Crm.Router.openMessageSenderConnectionsSlider */
				await Router.Instance.openMessageSenderConnectionsSlider(this.$store.state.analytics.analytics);
				this.$Bitrix.Data.get('locator').getAnalyticsService().onNoChannelsButtonClick();
				this.$Bitrix.eventEmitter.emit('crm:messagesender:editor:onConnectionsSliderClose');
			}
		},
		template: `
		<div class="crm-messagesender-editor__header">
			<div class="crm-messagesender-editor__header-left" data-role="header-left">
				<ChannelSelector v-if="hasChannels"/>
				<BButton
					v-else
					:style="AirButtonStyle.FILLED"
					:leftIcon="Outline.MESSAGES"
					:shimmer="true"
					:text="$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_BUTTON_NO_CHANNELS')"
					@click="openConnectionsSlider"
				/>
				<ReceiverSelector v-if="hasChannels"/>
			</div>
			<div class="crm-messagesender-editor__header-right">
				<TemplateSelector v-if="isTemplatesSelectorShown"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const MessageEditor = {
		name: 'MessageEditor',
		components: {
			EditorHeader,
			ContentContainer,
			CustomMessageContent,
			TemplateMessageContent,
			NotificationMessageContent,
			EditorFooter,
			EditorAlert
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Channel */
				currentChannel: 'channels/current'
			}),
			...ui_vue3_vuex.mapState({
				/** @type Layout */
				layout: state => state.application.layout
			}),
			contentComponent() {
				if (this.currentChannel?.backend.senderCode === 'bitrix24') {
					return 'NotificationMessageContent';
				}
				if (this.currentChannel?.isTemplatesBased) {
					return 'TemplateMessageContent';
				}
				return 'CustomMessageContent';
			},
			paddingStyle() {
				return {
					paddingTop: this.layout.paddingTop ?? this.layout.padding,
					paddingBottom: this.layout.paddingBottom ?? this.layout.padding,
					paddingLeft: this.layout.paddingLeft ?? this.layout.padding,
					paddingRight: this.layout.paddingRight ?? this.layout.padding
				};
			}
		},
		template: `
		<div class="crm-messagesender-editor" data-test-role="crm-messagesender-editor" :style="paddingStyle">
			<EditorHeader v-if="layout.isHeaderShown"/>
			<ContentContainer>
				<component :is="contentComponent"/>
			</ContentContainer>
			<EditorFooter v-if="layout.isFooterShown"/>
			<EditorAlert/>
		</div>
	`
	};

	class AnalyticsModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'analytics';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			return {
				analytics: {
					c_section: this.getVariable('analytics.c_section', null),
					c_sub_section: this.getVariable('analytics.c_sub_section', null)
				}
			};
		}
	}

	function makeFrozenClone(source) {
		return deepFreeze(main_core.Runtime.clone(source));
	}
	function deepFreeze(target) {
		if (main_core.Type.isObject(target)) {
			Object.values(target).forEach(value => {
				deepFreeze(value);
			});
			return Object.freeze(target);
		}
		return target;
	}

	class ApplicationModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'application';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			return {
				context: makeFrozenClone(this.getVariable('context', {})),
				contentProviders: makeFrozenClone(this.getVariable('contentProviders', {})),
				notificationTemplate: makeFrozenClone(this.getVariable('notificationTemplate', null)),
				promoBanners: makeFrozenClone(this.getVariable('promoBanners', null)),
				layout: makeFrozenClone(this.getVariable('layout', {
					isHeaderShown: true,
					isFooterShown: true,
					isSendButtonShown: true,
					isCancelButtonShown: true,
					isMessagePreviewShown: true,
					isContentProvidersShown: true,
					isEmojiButtonShown: true,
					isMessageTextReadOnly: false,
					padding: 'var(--ui-space-inset-lg)'
				})),
				scene: makeFrozenClone(this.getVariable('scene', {
					id: ''
				})),
				progress: {
					isSending: false,
					isLoading: false
				},
				alert: {
					error: ''
				}
			};
		}
		getGetters() {
			return {
				/** @function application/isProgress */
				isProgress: state => {
					for (const value of Object.values(state.progress)) {
						if (value) {
							return true;
						}
					}
					return false;
				}
			};
		}
		getActions() {
			return {
				/** @function application/actualizeState */
				actualizeState: (store, payload) => {
					store.commit('actualizeState', makeFrozenClone(payload));
				},
				/** @function application/setProgress */
				setProgress: (store, payload) => {
					const allowedKeys = new Set(['isSending', 'isLoading']);
					const filteredPayload = {};
					for (const key of Object.keys(payload)) {
						if (allowedKeys.has(key)) {
							filteredPayload[key] = payload[key];
						}
					}
					for (const [key, value] of Object.entries(filteredPayload)) {
						if (!main_core.Type.isBoolean(value)) {
							this.#logger.warn(`setProgress: ${key} should be boolean`, {
								payload
							});
							return;
						}
					}
					store.commit('updateProgress', {
						progress: filteredPayload
					});
				},
				/** @function application/setAlert */
				setAlert: (store, payload) => {
					if (!main_core.Type.isString(payload.error)) {
						this.#logger.warn('setError: error should be string', {
							payload
						});
						return;
					}
					store.commit('actualizeState', {
						alert: {
							error: payload.error
						}
					});
				},
				resetAlert: store => {
					store.commit('actualizeState', {
						alert: {
							error: ''
						}
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				actualizeState: (state, payload) => {
					for (const [key, value] of Object.entries(payload)) {
						if (key in state) {
							state[key] = value;
						}
					}
				},
				updateProgress: (state, payload) => {
					state.progress = {
						...state.progress,
						...payload.progress
					};
				}
			};
		}
	}

	class ChannelsModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'channels';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			const collection = this.getVariable('collection', []);
			deepFreeze(collection);
			return {
				collection,
				selected: {
					channelId: this.getVariable('selected.channelId'),
					fromId: this.getVariable('selected.fromId'),
					receiverAddressId: this.getVariable('selected.receiverAddressId', collection[0]?.toList[0]?.address.id)
				}
			};
		}
		getGetters() {
			return {
				/** @function channels/canSendMessage */
				canSendMessage: state => {
					return state.collection.some(chan => chan.isConnected);
				},
				/** @function channels/current */
				current: (state, getters, rootState, rootGetters) => {
					const selected = state.collection.find(channel => channel.id === state.selected.channelId);
					if (selected) {
						return selected;
					}
					const firstId = rootGetters['preferences/firstVisibleChannelId'];
					return state.collection.find(chan => chan.id === firstId) || state.collection[0];
				},
				/** @function channels/from */
				from: (state, getters, rootState, rootGetters) => {
					const channel = getters.current;
					if (!channel) {
						return null;
					}
					const channelsLastUsedFrom = rootGetters['preferences/channelsLastUsedFrom'];
					const channelId = channel.id;
					const lastUsed = channelsLastUsedFrom?.find(item => item.channelId === channelId);
					const fromId = state.selected.fromId ?? lastUsed?.fromId;
					return channel.fromList.find(from => from.id === fromId) || channel.fromList[0];
				},
				/** @function channels/receiver */
				receiver: (state, getters) => {
					const channel = getters.current;
					if (!channel) {
						return null;
					}
					const selected = channel.toList.find(receiver => receiver.address.id === state.selected.receiverAddressId);
					if (selected) {
						return selected;
					}
					return channel.toList[0];
				}
			};
		}
		getActions() {
			return {
				/** @function channels/actualizeState */
				actualizeState: (store, payload) => {
					store.commit('actualizeState', deepFreeze(payload));
				},
				/** @function channels/setChannel */
				setChannel: (store, payload) => {
					const {
						channelId
					} = payload;
					if (!main_core.Type.isStringFilled(channelId)) {
						this.#logger.warn('setChannel: channelId should be a string', {
							payload
						});
						return;
					}
					const channel = store.state.collection.find(ch => ch.id === channelId);
					if (!channel) {
						this.#logger.warn('setChannel: channel not found', {
							payload
						});
						return;
					}
					store.commit('updateSelected', {
						selected: {
							channelId
						}
					});
				},
				/** @function channels/setFrom */
				setFrom: (store, payload) => {
					const {
						fromId
					} = payload;
					if (!main_core.Type.isStringFilled(fromId)) {
						this.#logger.warn('setFrom: fromId should be a string', {
							payload
						});
						return;
					}
					const currentChannel = store.getters.current;
					const from = currentChannel.fromList.find(fc => fc.id === fromId);
					if (!from) {
						this.#logger.warn('setFrom: from not found', {
							payload
						});
						return;
					}
					store.commit('updateSelected', {
						selected: {
							fromId
						}
					});
				},
				/** @function channels/setReceiver */
				setReceiver: (store, payload) => {
					const {
						receiverAddressId
					} = payload;
					if (!main_core.Type.isInteger(receiverAddressId)) {
						this.#logger.warn('setReceiver: receiverAddressId should be an integer', {
							payload
						});
						return;
					}
					const currentChannel = store.getters.current;
					const receiver = currentChannel.toList.find(rc => rc.address.id === receiverAddressId);
					if (!receiver) {
						this.#logger.warn('setReceiver: receiver not found', {
							payload
						});
						return;
					}
					store.commit('updateSelected', {
						selected: {
							receiverAddressId
						}
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				actualizeState: (state, payload) => {
					for (const [key, value] of Object.entries(payload)) {
						if (key in state) {
							state[key] = value;
						}
					}
				},
				updateSelected: (state, payload) => {
					state.selected = {
						...state.selected,
						...payload.selected
					};
				}
			};
		}
	}

	class MessageModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'message';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			return {
				text: String(this.getVariable('text', '') ?? ''),
				source: null,
				paymentId: null,
				shipmentId: null,
				compilationProductIds: null
			};
		}
		getGetters() {
			return {
				/** @function message/body */
				body: (state, getters, rootState, rootGetters) => {
					const channel = rootGetters['channels/current'];
					if (channel?.backend.senderCode === 'bitrix24') {
						const notificationTemplate = rootState.application.notificationTemplate;
						if (main_core.Type.isNil(notificationTemplate)) {
							return '';
						}
						return this.#compileNotificationBody(notificationTemplate);
					}
					if (!channel?.isTemplatesBased) {
						return state.text.trim();
					}
					const template = rootGetters['templates/current'];
					if (main_core.Type.isNil(template)) {
						return '';
					}
					return this.#compileTemplateBody(template);
				},
				/** @function message/isReadyToSend */
				isReadyToSend: (state, getters, rootState, rootGetters) => {
					if (main_core.Type.isNil(rootGetters['channels/current']) || main_core.Type.isNil(rootGetters['channels/from']) || main_core.Type.isNil(rootGetters['channels/receiver'])) {
						return false;
					}
					const channel = rootGetters['channels/current'];
					if (channel.backend.senderCode === 'bitrix24') {
						return main_core.Type.isStringFilled(rootState.application.notificationTemplate?.code);
					}
					return main_core.Type.isStringFilled(getters.body);
				}
			};
		}
		#compileNotificationBody(notificationTemplate) {
			let text = notificationTemplate.translation?.TEXT || '';
			for (const placeholder of notificationTemplate.placeholders || []) {
				if (!main_core.Type.isNil(placeholder.value)) {
					text = text.replace(`#${placeholder.name}#`, placeholder.value);
				} else if (!main_core.Type.isNil(placeholder.caption)) {
					text = text.replace(`#${placeholder.name}#`, placeholder.caption);
				}
			}
			return text;
		}
		#compileTemplateBody(template) {
			// todo position
			// todo tight coupling with template editor
			return crm_template_editor.getPlainText(template.PREVIEW, template.PLACEHOLDERS?.PREVIEW ?? [], template.FILLED_PLACEHOLDERS ?? []);
		}
		getActions() {
			return {
				/** @function message/setText */
				setText: (store, payload) => {
					const {
						text
					} = payload;
					if (!main_core.Type.isString(text)) {
						this.#logger.warn('setText: text should be a string', {
							payload
						});
						return;
					}
					store.commit('setText', {
						text
					});
				},
				/** @function message/setSource */
				setSource: (store, payload) => {
					const {
						source
					} = payload;
					if (!main_core.Type.isStringFilled(source)) {
						this.#logger.warn('setSource: source should be a string', {
							payload
						});
						return;
					}
					store.commit('setSource', {
						source
					});
				},
				/** @function message/setPaymentId */
				setPaymentId: (store, payload) => {
					const {
						paymentId
					} = payload;
					if (!main_core.Type.isInteger(paymentId)) {
						this.#logger.warn('setPaymentId: paymentId should be an int', {
							payload
						});
						return;
					}
					store.commit('setPaymentId', {
						paymentId
					});
				},
				/** @function message/setShipmentId */
				setShipmentId: (store, payload) => {
					const {
						shipmentId
					} = payload;
					if (!main_core.Type.isInteger(shipmentId)) {
						this.#logger.warn('setShipmentId: shipmentId should be an int', {
							payload
						});
						return;
					}
					store.commit('setShipmentId', {
						shipmentId
					});
				},
				/** @function message/setCompilationProductIds */
				setCompilationProductIds: (store, payload) => {
					const {
						compilationProductIds
					} = payload;
					if (!main_core.Type.isArray(compilationProductIds)) {
						this.#logger.warn('setCompilationProductIds: compilationProductIds should be an array', {
							payload
						});
						return;
					}
					if (compilationProductIds.some(id => !main_core.Type.isInteger(id))) {
						this.#logger.warn('setCompilationProductIds: compilationProductIds should contain only integers', {
							payload
						});
						return;
					}
					store.commit('setCompilationProductIds', {
						compilationProductIds
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				setText: (state, payload) => {
					state.text = payload.text;
				},
				setSource: (state, payload) => {
					state.source = payload.source;
				},
				setPaymentId: (state, payload) => {
					state.paymentId = payload.paymentId;
				},
				setShipmentId: (state, payload) => {
					state.shipmentId = payload.shipmentId;
				},
				setCompilationProductIds: (state, payload) => {
					state.compilationProductIds = payload.compilationProductIds;
				}
			};
		}
	}

	class PreferencesModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'preferences';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			return {
				channelsSort: main_core.Runtime.clone(this.getVariable('channelsSort', [])),
				channelsLastUsedFrom: main_core.Runtime.clone(this.getVariable('channelsLastUsedFrom', []))
			};
		}
		getGetters() {
			return {
				/** @function preferences/channelsSortOrDefault */
				channelsSortOrDefault: (state, getters, rootState) => {
					const savedSort = main_core.Runtime.clone(state.channelsSort ?? []);
					for (const channel of rootState.channels.collection) {
						if (!savedSort.some(x => x.channelId === channel.id)) {
							savedSort.unshift({
								channelId: channel.id,
								isHidden: false
							});
						}
					}
					return savedSort;
				},
				firstVisibleChannelId: (state, getters) => {
					const sort = getters.channelsSortOrDefault;
					const visible = sort.filter(position => !position.isHidden);
					if (main_core.Type.isArrayFilled(visible)) {
						return visible[0].channelId;
					}
					return null;
				},
				channelsLastUsedFrom: state => {
					const channelsLastUsedFrom = [...(state.channelsLastUsedFrom ?? [])];
					return channelsLastUsedFrom.filter(channelLastUsedFrom => main_core.Type.isString(channelLastUsedFrom.fromId));
				}
			};
		}
		getActions() {
			return {
				/** @function preferences/actualizeState */
				actualizeState: (store, payload) => {
					store.commit('actualizeState', main_core.Runtime.clone(payload));
				},
				/** @function preferences/setChannelsSort */
				setChannelsSort: (store, payload) => {
					const {
						channelsSort
					} = payload;
					if (!main_core.Type.isArray(channelsSort)) {
						this.#logger.warn('setChannelsSort: channelsSort should be an array', {
							payload
						});
						return;
					}
					const normalized = channelsSort.filter(position => main_core.Type.isPlainObject(position)).map(position => main_core.Runtime.clone(position));
					if (!main_core.Type.isArrayFilled(normalized)) {
						this.#logger.warn('setChannelsSort: channelsSort should contain at least one position', {
							payload
						});
						return;
					}
					store.commit('setChannelsSort', {
						channelsSort: normalized
					});
				},
				/** @function preferences/setChannelsLastUsedFrom */
				setChannelsLastUsedFrom: (store, payload) => {
					const {
						channelsLastUsedFrom
					} = payload;
					if (!main_core.Type.isArray(channelsLastUsedFrom)) {
						this.#logger.warn('setChannelsLastUsedFrom: channelsLastUsedFrom should be an array', {
							payload
						});
						return;
					}
					const normalized = channelsLastUsedFrom.filter(channelLastUsedFrom => main_core.Type.isPlainObject(channelLastUsedFrom) && main_core.Type.isString(channelLastUsedFrom?.fromId)).map(channelLastUsedFrom => main_core.Runtime.clone(channelLastUsedFrom));
					if (!main_core.Type.isArrayFilled(normalized)) {
						this.#logger.warn('setChannelsLastUsedFrom: channelsLastUsedFrom should contain at least one channelLastUsedFrom', {
							payload
						});
						return;
					}
					store.commit('setChannelsLastUsedFrom', {
						channelsLastUsedFrom
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				actualizeState: (state, payload) => {
					for (const [key, value] of Object.entries(payload)) {
						if (key in state) {
							state[key] = value;
						}
					}
				},
				setChannelsSort: (state, {
					channelsSort
				}) => {
					state.channelsSort = channelsSort;
				},
				setChannelsLastUsedFrom: (state, {
					channelsLastUsedFrom
				}) => {
					state.channelsLastUsedFrom = channelsLastUsedFrom;
				}
			};
		}
	}

	const POSITION = 'PREVIEW';
	const MAX_COLLECTION_SIZE = 100;

	/**
	 * This model uses in-browser DB for caching and can contain data from other (previous) instances of the application.
	 * Be careful.
	 */
	class TemplatesModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'templates';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			return {
				collection: {},
				selected: {}
			};
		}
		getGetters() {
			return {
				/** @function templates/listForChannel */
				listForChannel: (state, getters, rootState, rootGetters) => {
					const chan = rootGetters['channels/current'];
					if (!chan?.isTemplatesBased) {
						return [];
					}
					return state.collection[getters.cacheContextId] ?? [];
				},
				/** @function templates/current */
				current: (state, getters, rootState, rootGetters) => {
					const list = getters.listForChannel;
					const templateOriginalId = state.selected[rootGetters['channels/current']?.id];
					if (main_core.Type.isNil(templateOriginalId)) {
						return list[0];
					}
					return list.find(template => template.ORIGINAL_ID === templateOriginalId) || list[0];
				},
				/** @function templates/cacheContextId */
				cacheContextId: (state, getters, rootState, rootGetters) => {
					const chan = rootGetters['channels/current'];
					if (main_core.Type.isNil(chan)) {
						return '';
					}
					const context = rootState.application.context;
					const parts = [chan.backend.senderCode, chan.backend.id, context.entityTypeId, context.entityId, context.categoryId];
					return parts.filter(part => !main_core.Type.isNil(part)).join('_');
				}
			};
		}
		getActions() {
			return {
				/** @function templates/addTemplates */
				addTemplates: (store, payload) => {
					const {
						templates
					} = payload;
					if (!main_core.Type.isArray(templates)) {
						this.#logger.warn('addTemplates: templates should be a empty array', {
							payload
						});
						return;
					}
					if (Object.keys(store.state.collection).length >= MAX_COLLECTION_SIZE) {
						// dont overflow browser DB and memory
						store.commit('clearCollection');
					}
					store.commit('addTemplates', {
						contextId: store.getters.cacheContextId,
						templates: main_core.Runtime.clone(templates)
					});
					this.saveState(store.state);
				},
				/** @function templates/setTemplate */
				setTemplate: (store, payload) => {
					const {
						templateOriginalId
					} = payload;
					if (!main_core.Type.isInteger(templateOriginalId) || templateOriginalId <= 0) {
						this.#logger.warn('setTemplate: templateOriginalId should be a positive int', {
							payload
						});
						return;
					}
					const chan = store.rootGetters['channels/current'];
					if (main_core.Type.isNil(chan)) {
						this.#logger.warn('setTemplate: no current channel');
						return;
					}
					if (!chan.isTemplatesBased) {
						this.#logger.warn('setTemplate: channel is not templates based', {
							payload
						});
						return;
					}
					store.commit('select', {
						channelId: chan.id,
						templateOriginalId
					});
					this.saveState(store.state);
				},
				/** @function templates/setFilledPlaceholder */
				setFilledPlaceholder: (store, payload) => {
					const {
						filledPlaceholder
					} = payload;
					if (!main_core.Type.isPlainObject(filledPlaceholder)) {
						this.#logger.warn('setFilledPlaceholder: filledPlaceholder should be a valid object', {
							payload
						});
						return;
					}
					const template = store.getters.current;
					if (!template) {
						this.#logger.warn('setFilledPlaceholder: current template is not set', {
							payload
						});
						return;
					}
					const isPlaceholderExists = template.PLACEHOLDERS[POSITION].includes(filledPlaceholder.PLACEHOLDER_ID);
					if (!isPlaceholderExists) {
						this.#logger.warn('setFilledPlaceholder: filledPlaceholder.PLACEHOLDER_ID references non-existent placeholder', {
							payload
						});
						return;
					}
					store.commit('upsertFilledPlaceholder', {
						contextId: store.getters.cacheContextId,
						templateOriginalId: template.ORIGINAL_ID,
						filledPlaceholder: makeFrozenClone(filledPlaceholder)
					});
					this.saveState(store.state);
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				addTemplates: (state, {
					contextId,
					templates
				}) => {
					state.collection[contextId] = templates;
				},
				clearCollection: state => {
					state.collection = {};
				},
				select: (state, {
					channelId,
					templateOriginalId
				}) => {
					state.selected[channelId] = templateOriginalId;
				},
				upsertFilledPlaceholder: (state, {
					contextId,
					templateOriginalId,
					filledPlaceholder
				}) => {
					const templates = state.collection[contextId];
					const template = templates.find(t => t.ORIGINAL_ID === templateOriginalId);
					template.FILLED_PLACEHOLDERS ??= [];
					template.FILLED_PLACEHOLDERS = template.FILLED_PLACEHOLDERS.filter(fp => fp.PLACEHOLDER_ID !== filledPlaceholder.PLACEHOLDER_ID);
					template.FILLED_PLACEHOLDERS.push(filledPlaceholder);
				}
			};
		}
	}

	class AlertService {
		#store;
		constructor(params) {
			this.#store = params.store;
		}
		showError(message = null) {
			void this.#store.dispatch('application/setAlert', {
				error: message || main_core.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_GENERIC_ERROR')
			});
		}
	}

	class AnalyticsService {
		#store;
		constructor(params) {
			this.#store = params.store;
		}
		onRender() {
			const event = new crm_integration_analytics.Builder.Communication.Editor.ViewEvent();
			event.setSection(this.#store.state.analytics.analytics.c_section).setSubSection(this.#store.state.analytics.analytics.c_sub_section);
			ui_analytics.sendData(event.buildData());
		}
		onAddChannelClick() {
			this.#sendChannelConnect(crm_integration_analytics.Dictionary.ELEMENT_MENU_BUTTON);
		}
		onBannerConnectClick(id, connectStatus) {
			this.#sendChannelConnect(crm_integration_analytics.Dictionary.ELEMENT_BANNER_BUTTON, id, connectStatus);
		}
		onNoChannelsButtonClick() {
			this.#sendChannelConnect(crm_integration_analytics.Dictionary.ELEMENT_NO_CONNECTION_BUTTON);
		}
		#sendChannelConnect(element, id, connectStatus) {
			const event = new crm_integration_analytics.Builder.Communication.Channel.ConnectEvent();
			event.setSection(this.#store.state.analytics.analytics.c_section).setSubSection(this.#store.state.analytics.analytics.c_sub_section).setElement(element).setChannelId(id).setConnectStatus(connectStatus);
			ui_analytics.sendData(event.buildData());
		}
		onPreviewShow() {
			this.#sendEditorInteraction(crm_integration_analytics.Dictionary.ELEMENT_PREVIEW);
		}
		onSelectTemplate() {
			this.#sendEditorInteraction(crm_integration_analytics.Dictionary.ELEMENT_TEMPLATE_SELECTOR);
		}
		onSuggestTemplate() {
			this.#sendEditorInteraction(crm_integration_analytics.Dictionary.ELEMENT_TEMPLATE_OFFER);
		}
		onSelectChannel() {
			this.#sendEditorInteraction(crm_integration_analytics.Dictionary.ELEMENT_CHANNEL_SELECTOR);
		}
		onSaveChannelsSort() {
			this.#sendEditorInteraction(crm_integration_analytics.Dictionary.ELEMENT_CHANNEL_LIST_CHANGE);
		}
		onAddFile() {
			this.#sendEditorInteraction(crm_integration_analytics.Dictionary.ELEMENT_ELEMENT_ADD, 'file');
		}
		onAddDocument() {
			this.#sendEditorInteraction(crm_integration_analytics.Dictionary.ELEMENT_ELEMENT_ADD, 'document');
		}
		onAddSalescenterPage() {
			this.#sendEditorInteraction(crm_integration_analytics.Dictionary.ELEMENT_ELEMENT_ADD, 'salescenterPage');
		}
		onAddSalescenterPayment() {
			this.#sendEditorInteraction(crm_integration_analytics.Dictionary.ELEMENT_ELEMENT_ADD, 'salescenterPayment');
		}
		onAddSalescenterCompilation() {
			this.#sendEditorInteraction(crm_integration_analytics.Dictionary.ELEMENT_ELEMENT_ADD, 'salescenterCompilation');
		}
		onAddCrmValue() {
			this.#sendEditorInteraction(crm_integration_analytics.Dictionary.ELEMENT_ELEMENT_ADD, 'crmValue');
		}
		#sendEditorInteraction(element, addedElement) {
			const event = crm_integration_analytics.Builder.Communication.Editor.InteractionEvent.createDefault(this.#store.getters['channels/current']?.id);
			event.setSection(this.#store.state.analytics.analytics.c_section).setSubSection(this.#store.state.analytics.analytics.c_sub_section).setElement(element).setAddedElement(addedElement);
			ui_analytics.sendData(event.buildData());
		}
		onAddCopilot() {
			const event = new crm_integration_analytics.Builder.Communication.Editor.CopilotEvent();
			event.setSection(this.#store.state.analytics.analytics.c_section).setSubSection(this.#store.state.analytics.analytics.c_sub_section);
			ui_analytics.sendData(event.buildData());
		}
		onSend() {
			const event = crm_integration_analytics.Builder.Communication.Editor.SendEvent.createDefault(this.#store.getters['channels/current']?.id);
			event.setSection(this.#store.state.analytics.analytics.c_section).setSubSection(this.#store.state.analytics.analytics.c_sub_section);
			if (this.#store.getters['channels/current']?.isTemplatesBased) {
				event.setTemplateId(this.#store.getters['templates/current']?.ORIGINAL_ID);
			}
			ui_analytics.sendData(event.buildData());
		}
		onCancel() {
			const event = new crm_integration_analytics.Builder.Communication.Editor.CancelEvent();
			event.setSection(this.#store.state.analytics.analytics.c_section).setSubSection(this.#store.state.analytics.analytics.c_sub_section);
			ui_analytics.sendData(event.buildData());
		}
	}

	class CopilotService {
		#logger;
		#store;
		#copilot = null;
		#copilotEvents = null;
		constructor(params) {
			this.#logger = params.logger;
			this.#store = params.store;
		}

		/**
		 * Show copilot dialog and resolve when it's closed. Resolve result will contain text that should be added to the
		 * message.
		 */
		showCopilot(bindElement, selectedText, allText) {
			return new Promise((resolve, reject) => {
				this.#getCopilot().then(copilot => {
					const handlers = this.#getHandlers();
					for (const [event, handler] of Object.entries(handlers)) {
						// mega-hack to remember all references to the handler functions so we can unsubscribe them later
						handlers[event] = handler.bind(this, copilot, resolve);
					}
					for (const [event, handler] of Object.entries(handlers)) {
						copilot.subscribeOnce(event, handler);
					}
					if (main_core.Type.isStringFilled(selectedText.trim())) {
						copilot.setSelectedText(selectedText.trim());
					} else if (main_core.Type.isStringFilled(allText.trim())) {
						copilot.setContext(allText.trim());
					}
					copilot.show({
						bindElement
					});
				}).catch(error => {
					this.#logger.error('CopilotService: Failed to show AI Copilot', error);
					reject(error);
				});
			});
		}
		#getCopilot() {
			if (this.#copilot) {
				return Promise.resolve(this.#copilot);
			}
			return new Promise((resolve, reject) => {
				this.#loadExtension().then(exports$1 => {
					/** @see BX.AI.CopilotEvents */
					this.#copilotEvents = exports$1.CopilotEvents;

					/** @see BX.AI.Copilot */
					/** @see BX.AI.CopilotMode */
					this.#copilot = new exports$1.Copilot({
						moduleId: 'crm',
						contextId: 'crm.messagesender.editor',
						category: this.#store.state.application.contentProviders.copilot?.category,
						mode: exports$1.CopilotMode.TEXT,
						autoHide: true,
						showResultInCopilot: true,
						responseFormat: 'plaintext'
					});
					this.#copilot.subscribeOnce(this.#copilotEvents.START_INIT, () => {
						void this.#store.dispatch('application/setProgress', {
							isLoading: true
						});
					});
					this.#copilot.subscribeOnce(this.#copilotEvents.FINISH_INIT, () => {
						void this.#store.dispatch('application/setProgress', {
							isLoading: false
						});
						resolve(this.#copilot);
					});
					this.#copilot.subscribeOnce(this.#copilotEvents.FAILED_INIT, () => {
						void this.#store.dispatch('application/setProgress', {
							isLoading: false
						});
						reject(this.#copilot);
					});
					this.#copilot.init();
				}).catch(error => {
					this.#logger.error('CopilotService: Failed to initialize AI Copilot', error);
					reject(error);
				});
			});
		}
		#loadExtension() {
			return main_core.Runtime.loadExtension('ai.copilot').catch(error => {
				this.#logger.error('CopilotService: Failed to load AI Copilot extension', error);
				throw error;
			});
		}
		#getHandlers() {
			// whichever fires first will resolve the promise and unsubscribe all handlers
			const handlers = {
				[this.#copilotEvents.TEXT_SAVE]: (copilot, resolve, event) => {
					const {
						result
					} = event.getData();
					unsubscribeAllHandlers(copilot);
					resolve({
						textReplace: result
					});
					copilot.hide();
				},
				[this.#copilotEvents.TEXT_PLACE_BELOW]: (copilot, resolve, event) => {
					const {
						result
					} = event.getData();
					unsubscribeAllHandlers(copilot);
					resolve({
						textBelow: result
					});
					copilot.hide();
				},
				[this.#copilotEvents.HIDE]: (copilot, resolve) => {
					unsubscribeAllHandlers(copilot);
					resolve({});
				}
			};
			const unsubscribeAllHandlers = copilot => {
				for (const [event, handler] of Object.entries(handlers)) {
					copilot.unsubscribe(event, handler);
				}
			};
			return handlers;
		}
	}

	class DocumentService {
		#logger;
		#store;
		#menu = null;
		constructor(params) {
			this.#logger = params.logger;
			this.#store = params.store;
		}
		async selectOrCreateDocument(bindElement) {
			void this.#store.dispatch('application/setProgress', {
				isLoading: true
			});
			try {
				const menu = await this.#getMenu();
				const result = await menu.show(bindElement);
				if (await this.#isDocument(result)) {
					return {
						title: result.getTitle(),
						publicUrl: await this.#getPublicUrl(result)
					};
				}
				if (await this.#isTemplate(result)) {
					let document = null;
					try {
						document = await menu.createDocument(result);
					} catch (error) {
						this.#logger.error('Failed to create document from template', {
							template: result,
							error
						});
						throw error;
					}
					if (main_core.Type.isNil(document)) {
						return null;
					}
					return {
						title: document.getTitle(),
						publicUrl: await this.#getPublicUrl(document)
					};
				}
				return null;
			} finally {
				void this.#store.dispatch('application/setProgress', {
					isLoading: false
				});
			}
		}
		async #getMenu() {
			if (this.#menu) {
				return this.#menu;
			}
			const exports$1 = await this.#loadExtension();

			/** @see BX.DocumentGenerator.Selector.Menu */
			this.#menu = new exports$1.Selector.Menu({
				moduleId: 'crm',
				provider: this.#store.state.application.contentProviders.documents.provider,
				value: this.#store.state.application.context.entityId,
				analyticsLabelPrefix: 'crmTimelineSmsEditor'
			});
			return this.#menu;
		}
		#getPublicUrl(document) {
			return this.#getMenu().then(menu => {
				return menu.getDocumentPublicUrl(document);
			}).catch(error => {
				this.#logger.error('Failed to get document public URL', {
					document,
					error
				});
				throw error;
			});
		}
		async #isDocument(object) {
			const exports$1 = await this.#loadExtension();

			/** @see BX.DocumentGenerator.Selector.Document */
			return object instanceof exports$1.Selector.Document;
		}
		async #isTemplate(object) {
			const exports$1 = await this.#loadExtension();

			/** @see BX.DocumentGenerator.Selector.Template */
			return object instanceof exports$1.Selector.Template;
		}
		#loadExtension() {
			return main_core.Runtime.loadExtension('documentgenerator.selector').catch(error => {
				this.#logger.error('Failed to load documentgenerator.selector', error);
				throw error;
			});
		}
	}

	class FileService {
		#logger;
		#store;
		#uploader = null;
		#browseElement = null;
		#fileWatcher = null;
		constructor(params) {
			this.#logger = params.logger;
			this.#store = params.store;
		}

		/**
		 * @param onSuccess can be called multiple times if user selects multiple files
		 */
		uploadNewFile(onSuccess) {
			if (this.#store.getters['application/isProgress']) {
				this.#logger.warn('Cannot upload file while in progress');
				return;
			}
			this.#fileWatcher = onSuccess;
			void this.#openFileBrowser();
		}

		/**
		 * @param onSuccess can be called multiple times if user selects multiple files
		 */
		pickFromDisk(onSuccess) {
			if (this.#store.getters['application/isProgress']) {
				this.#logger.warn('Cannot pick file from disk while in progress');
				return;
			}
			this.#fileWatcher = onSuccess;
			void this.#openDiskFileDialog();
		}
		async #openFileBrowser() {
			if (this.#browseElement) {
				this.#browseElement.click();
				return;
			}
			const uploader = await this.#getUploader();
			this.#browseElement = document.createElement('div');
			uploader.assignBrowse(this.#browseElement);
			this.#browseElement.click();
		}
		async #openDiskFileDialog() {
			const uploader = await this.#getUploader();
			const {
				openDiskFileDialog
			} = await main_core.Runtime.loadExtension('disk.uploader.user-field-widget');
			openDiskFileDialog({
				dialogId: 'crm-messagesender-editor',
				uploader
			});
		}
		#getUploader() {
			if (this.#uploader) {
				return Promise.resolve(this.#uploader);
			}
			return main_core.Runtime.loadExtension('ui.uploader.core').then(exports$1 => {
				let linkLoadsCount = 0;

				/** @see { BX.UI.Uploader.Uploader } */
				this.#uploader = new exports$1.Uploader({
					controller: 'disk.uf.integration.diskUploaderController',
					multiple: true,
					events: {
						[exports$1.UploaderEvent.FILE_ADD_START]: () => {
							void this.#store.dispatch('application/setProgress', {
								isLoading: true
							});
						},
						[exports$1.UploaderEvent.FILE_ERROR]: event => {
							this.#logger.error('Failed to upload file', event.getData());
							if (linkLoadsCount <= 0 && !this.#isUploaderBusy(this.#uploader)) {
								void this.#store.dispatch('application/setProgress', {
									isLoading: false
								});
							}
						},
						// fires both on upload complete (from browser) and load complete (from disk dialog)
						[exports$1.UploaderEvent.FILE_COMPLETE]: event => {
							const file = event.getData().file;
							linkLoadsCount++;
							void this.#getExternalLink(file.getCustomData('fileId'))
							// eslint-disable-next-line promise/no-nesting
							.then(link => {
								this.#fileWatcher?.({
									name: file.getName(),
									externalLink: link
								});
							}).finally(() => {
								linkLoadsCount--;
								if (linkLoadsCount <= 0 && !this.#isUploaderBusy(this.#uploader)) {
									void this.#store.dispatch('application/setProgress', {
										isLoading: false
									});
								}
							});
						}
					}
				});
				return this.#uploader;
			}).catch(error => {
				this.#logger.error('Failed to load ui.uploader.core', error);
				throw error;
			});
		}
		#isUploaderBusy(uploader) {
			if (!main_core.Type.isFunction(uploader.getUploadingFileCount)) {
				// already destroyed

				return false;
			}
			if (uploader.getUploadingFileCount() > 0) {
				return true;
			}
			if (uploader.getPendingFileCount() > 0) {
				return true;
			}
			return uploader.getFiles().some(file => file.isLoading());
		}
		#getExternalLink(fileId) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('disk.file.generateExternalLink', {
					analyticsLabel: 'crmTimelineSmsEditorGetFilePublicUrl',
					data: {
						fileId
					}
				}).then(response => {
					if (main_core.Type.isStringFilled(response?.data?.externalLink?.link)) {
						resolve(response.data.externalLink.link);
					} else {
						reject(new Error('No external link in response'));
					}
				}).catch(error => {
					this.#logger.error('Failed to get external link', error);
					reject(error);
				});
			});
		}
	}

	class Logger {
		#prefix;
		constructor(params = {}) {
			this.#prefix = params.prefix || '';
		}
		error(...args) {
			this.#prepareArgs(args);
			console.error(...args);
		}
		warn(...args) {
			this.#prepareArgs(args);

			// eslint-disable-next-line no-console
			console.warn(...args);
		}
		#prepareArgs(args) {
			const [message] = args;
			if (main_core.Type.isString(message)) {
				// eslint-disable-next-line no-param-reassign
				args[0] = `${this.#prefix}${message}`;
			} else {
				args.unshift(this.#prefix);
			}
		}
	}

	// default logger
	const logger = new Logger({
		prefix: 'crm.messagesender.editor: '
	});

	const OPTIONS_CATEGORY = 'crm';
	const OPTIONS_NAME = 'crm.messagesender.editor';
	class PreferencesService {
		#store;
		constructor(params) {
			this.#store = params.store;
		}
		saveChannelLastUsedFrom(channel, fromId) {
			const channelsLastUsedFrom = this.#store.getters['preferences/channelsLastUsedFrom'];
			const index = channelsLastUsedFrom.findIndex(item => item.channelId === channel.id);
			if (index >= 0) {
				if (channelsLastUsedFrom[index].fromId === fromId) {
					return;
				}
				channelsLastUsedFrom[index].fromId = fromId;
			} else {
				channelsLastUsedFrom.push({
					channelId: channel.id,
					fromId: fromId
				});
			}
			this.saveChannelsLastUsedFrom(channelsLastUsedFrom);
		}
		saveChannelsLastUsedFrom(channelsLastUsedFrom) {
			void this.#store.dispatch('preferences/setChannelsLastUsedFrom', {
				channelsLastUsedFrom
			});
			this.#savePreferences();
		}
		saveChannelsSort(sort) {
			void this.#store.dispatch('preferences/setChannelsSort', {
				channelsSort: sort
			});
			this.#savePreferences();
		}
		#savePreferences() {
			const scene = this.#store.state.application.scene;
			BX.userOptions.save(OPTIONS_CATEGORY, OPTIONS_NAME, scene.id, JSON.stringify(this.#store.state.preferences));
		}
	}

	class SalescenterService {
		#logger;
		#store;
		constructor(params) {
			this.#logger = params.logger;
			this.#store = params.store;
		}
		showSalescenterDisabledSlider() {
			main_core.Runtime.loadExtension('salescenter.tool-availability-manager').then(({
				ToolAvailabilityManager
			}) => {
				/** @see BX.Salescenter.ToolAvailabilityManager.openSalescenterToolDisabledSlider */
				ToolAvailabilityManager.openSalescenterToolDisabledSlider();
			}).catch(error => {
				this.#logger.error('Failed to load salescenter.tool-availability-manager', error);
			});
		}
		openApplication() {
			return main_core.Runtime.loadExtension('salescenter.manager').then(({
				Manager
			}) => {
				/** @see BX.Salescenter.Manager.openApplication */
				return Manager.openApplication({
					disableSendButton: this.#store.getters['channels/canSendMessage'] ? '' : 'y',
					context: 'sms',
					ownerTypeId: this.#store.state.application.context.entityTypeId,
					ownerId: this.#store.state.application.context.entityId,
					mode: this.#store.state.application.contentProviders.salescenter.mode,
					st: {
						tool: 'crm',
						category: 'payments',
						event: 'payment_create_click',
						c_section: 'crm_sms',
						c_sub_section: 'web',
						type: 'delivery_payment'
					}
				});
			}).then(result => {
				if (result.get('action') === 'sendPage' && main_core.Type.isStringFilled(result.get('page')?.url)) {
					return {
						page: {
							name: String(result.get('page').name),
							url: String(result.get('page').url)
						}
					};
				}
				if (result.get('action') === 'sendPayment' && main_core.Type.isObject(result.get('order'))) {
					const order = result.get('order');
					return {
						source: 'order',
						payment: {
							name: String(order.title),
							paymentId: main_core.Type.isNil(order.paymentId) ? null : main_core.Text.toInteger(order.paymentId),
							shipmentId: main_core.Type.isNil(order.shipmentId) ? null : main_core.Text.toInteger(order.shipmentId)
						}
					};
				}
				if (result.get('action') === 'sendCompilation' && main_core.Type.isObject(result.get('compilation'))) {
					const compilation = result.get('compilation');
					let productIds = null;
					if (main_core.Type.isArray(compilation.productIds)) {
						productIds = compilation.productIds.map(id => main_core.Text.toInteger(id));
					}
					return {
						source: 'deal',
						compilation: {
							name: String(compilation.title),
							productIds
						}
					};
				}
				return {};
			}).catch(error => {
				this.#logger.error('Failed to open salescenter application', error);
				throw error;
			});
		}
	}

	class SendService {
		#logger;
		#store;
		#messageModel;
		#emitter;
		#analyticsService;
		#preferencesService;
		constructor(params) {
			this.#logger = params.logger;
			this.#store = params.store;
			this.#messageModel = params.messageModel;
			this.#emitter = params.eventEmitter;
			this.#analyticsService = params.analyticsService;
			this.#preferencesService = params.preferencesService;
		}
		sendMessage() {
			if (this.#store.getters['application/isProgress']) {
				this.#logger.warn('sendMessage: already in progress');
				return Promise.resolve();
			}
			void this.#store.dispatch('application/setProgress', {
				isSending: true
			});
			const channel = this.#store.getters['channels/current'];
			const from = this.#store.getters['channels/from'];
			const receiver = this.#store.getters['channels/receiver'];
			const params = this.#prepareParams(channel, from, receiver);
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.activity.sms.send', {
					data: {
						ownerTypeId: this.#store.state.application.context.entityTypeId,
						ownerId: this.#store.state.application.context.entityId,
						params
					}
				}).then(resolve).catch(reject);
			}).then(() => {
				this.#analyticsService.onSend();
				this.#messageModel.clearState();
				void this.#store.dispatch('application/resetAlert');
				this.#emitter.emit('crm:messagesender:editor:onSendSuccess');
				this.#preferencesService.saveChannelLastUsedFrom(channel, from.id);
			}).catch(response => {
				this.#logger.error('sendMessage: error', {
					response
				});
				throw response;
			}).finally(() => {
				void this.#store.dispatch('application/setProgress', {
					isSending: false
				});
			});
		}
		#prepareParams(channel, from, receiver) {
			if (channel.backend.senderCode === 'bitrix24') {
				return this.#prepareNotificationParams(channel, from, receiver);
			}
			if (channel.isTemplatesBased) {
				return this.#prepareTemplateParams(channel, from, receiver);
			}
			return this.#prepareCustomTextParams(channel, from, receiver);
		}
		#prepareNotificationParams(channel, from, receiver) {
			return {
				...this.#prepareCommonParams(channel, from, receiver),
				signedTemplate: this.#store.state.application.notificationTemplate.signed
			};
		}
		#prepareTemplateParams(channel, from, receiver) {
			const template = this.#store.getters['templates/current'];
			return {
				...this.#prepareCommonParams(channel, from, receiver),
				body: this.#store.getters['message/body'],
				template: template.ID,
				templateOriginalId: template.ORIGINAL_ID,
				isTemplateWithPlaceholders: main_core.Type.isPlainObject(template.PLACEHOLDERS),
				isReplacePlaceholders: true,
				isPlaceholdersInDisplayFormat: false
			};
		}
		#prepareCustomTextParams(channel, from, receiver) {
			return {
				...this.#prepareCommonParams(channel, from, receiver),
				body: this.#store.getters['message/body'],
				paymentId: this.#store.state.message.paymentId,
				shipmentId: this.#store.state.message.shipmentId,
				source: this.#store.state.message.source,
				compilationProductIds: this.#store.state.message.compilationProductIds,
				isReplacePlaceholders: true,
				isPlaceholdersInDisplayFormat: true
			};
		}
		#prepareCommonParams(channel, from, receiver) {
			return {
				senderId: channel.backend.id,
				from: from.id,
				to: receiver.address.value,
				entityTypeId: receiver.addressSource.entityTypeId,
				entityId: receiver.addressSource.entityId
			};
		}
	}

	class TemplateService {
		#sessionCache = new main_core.Cache.MemoryCache();
		#logger;
		#store;
		constructor(params) {
			this.#logger = params.logger;
			this.#store = params.store;
		}
		loadTemplates() {
			this.#doOnce(() => {
				const chan = this.#getCurrentChannel();
				if (!chan || !chan.isTemplatesBased || !chan.backend.senderCode === 'sms_provider') {
					return;
				}
				main_core.ajax.runAction('crm.activity.sms.getTemplates', {
					data: {
						senderId: chan.backend.id,
						context: {
							entityTypeId: this.#getContext().entityTypeId,
							entityId: this.#getContext().entityId,
							entityCategoryId: this.#getContext().categoryId
						}
					}
				}).then(response => {
					this.#cacheTemplates(response.data.templates);
				}).catch(response => {
					this.#logger.error('Error while loading templates', response);
					throw response;
				});
			});
		}
		#doOnce(callback) {
			this.#sessionCache.remember(this.#store.getters['templates/cacheContextId'], callback);
		}
		#getCurrentChannel() {
			return this.#store.getters['channels/current'];
		}
		#getCurrentTemplate() {
			return this.#store.getters['templates/current'];
		}
		#getContext() {
			return this.#store.state.application.context;
		}
		#cacheTemplates(templates) {
			void this.#store.dispatch('templates/addTemplates', {
				templates
			});
		}
		createOrUpdatePlaceholder(params) {
			const template = this.#getCurrentTemplate();
			if (!template) {
				return;
			}
			const context = this.#getContext();
			if (main_core.Type.isNil(context.entityTypeId)) {
				return;
			}
			const {
				id,
				value,
				entityType,
				text
			} = params;
			main_core.ajax.runAction('crm.activity.smsplaceholder.createOrUpdatePlaceholder', {
				data: {
					placeholderId: id,
					fieldName: main_core.Type.isStringFilled(value) ? value : null,
					entityType: main_core.Type.isStringFilled(entityType) ? entityType : null,
					fieldValue: main_core.Type.isStringFilled(text) ? text : null,
					templateId: template.ORIGINAL_ID,
					entityTypeId: context.entityTypeId,
					entityCategoryId: context.categoryId
				}
			}).catch(response => {
				this.#logger.warn('Error while remembering placeholder', response);
			});
		}
	}

	/**
	 * One instance of this class per editor instance. Some services can be shared between editors.
	 */
	class ServiceLocator {
		#services = new main_core.Cache.MemoryCache();
		#store = null;
		#messageModel = null;
		#emitter = null;
		setStore(store) {
			this.#store = store;
			return this;
		}
		setMessageModel(messageModel) {
			this.#messageModel = messageModel;
			return this;
		}
		getMessageModel() {
			return this.#messageModel;
		}
		setEventEmitter(emitter) {
			this.#emitter = emitter;
			return this;
		}
		getLogger() {
			return logger;
		}
		getSendService() {
			return this.#services.remember('sendService', () => {
				return new SendService({
					logger: this.getLogger(),
					store: this.#store,
					messageModel: this.getMessageModel(),
					eventEmitter: this.#emitter,
					analyticsService: this.getAnalyticsService(),
					preferencesService: this.getPreferencesService()
				});
			});
		}
		getAlertService() {
			return this.#services.remember('alertService', () => {
				return new AlertService({
					store: this.#store
				});
			});
		}
		getFileService() {
			return this.#services.remember('fileService', () => {
				return new FileService({
					logger: this.getLogger(),
					store: this.#store
				});
			});
		}
		getSalescenterService() {
			return this.#services.remember('salescenterService', () => {
				return new SalescenterService({
					logger: this.getLogger(),
					store: this.#store
				});
			});
		}
		getDocumentService() {
			return this.#services.remember('documentService', () => {
				return new DocumentService({
					logger: this.getLogger(),
					store: this.#store
				});
			});
		}
		getCopilotService() {
			return this.#services.remember('copilotService', () => {
				return new CopilotService({
					logger: this.getLogger(),
					store: this.#store
				});
			});
		}
		getTemplateService() {
			return this.#services.remember('templateService', () => {
				return new TemplateService({
					logger: this.getLogger(),
					store: this.#store
				});
			});
		}
		getPreferencesService() {
			return this.#services.remember('preferencesService', () => {
				return new PreferencesService({
					store: this.#store
				});
			});
		}
		getAnalyticsService() {
			return this.#services.remember('analyticsService', () => {
				return new AnalyticsService({
					store: this.#store
				});
			});
		}
	}

	class StateExporter {
		#store;
		#emitter;
		#unwatches = [];
		#emitStateChangeDebounced = null;
		constructor({
			store,
			eventEmitter
		}) {
			this.#store = store;
			this.#emitter = eventEmitter;
			this.#bindEvents();
		}
		#bindEvents() {
			this.#watchChannel();
			this.#watchFrom();
			this.#watchReceiver();
			this.#watchMessageBody();
			this.#watchTemplate();
		}
		#watchChannel() {
			this.#unwatches.push(this.#store.watch((state, getters) => getters['channels/current'], (newValue, oldValue) => {
				if (newValue?.id !== oldValue?.id) {
					this.#emitOnStateChange();
					this.#emit('onChannelChange', {
						channel: newValue,
						oldChannel: oldValue
					});
				}
			}));
		}
		#watchFrom() {
			this.#unwatches.push(this.#store.watch((state, getters) => getters['channels/from'], (newValue, oldValue) => {
				if (newValue?.id !== oldValue?.id) {
					this.#emitOnStateChange();
					this.#emit('onFromChange', {
						from: newValue,
						oldFrom: oldValue
					});
				}
			}));
		}
		#watchReceiver() {
			const emit = (newValue, oldValue) => {
				this.#emitOnStateChange();
				this.#emit('onToChange', {
					to: newValue,
					oldTo: oldValue
				});
			};
			this.#unwatches.push(this.#store.watch((state, getters) => getters['channels/receiver'], (newValue, oldValue) => {
				if (!newValue && oldValue) {
					emit(newValue, oldValue);
				}
				if (newValue && !oldValue) {
					emit(newValue, oldValue);
				}
				if (newValue && oldValue && !newValue.isEqualTo(oldValue)) {
					emit(newValue, oldValue);
				}
			}));
		}
		#watchMessageBody() {
			let lastNewValue = null;
			let lastOldValue = null;
			const throttledWatcher = main_core.Runtime.throttle(() => {
				if (lastNewValue !== lastOldValue) {
					this.#emitOnStateChange();
					this.#emit('onMessageBodyChange', {
						body: lastNewValue,
						oldBody: lastOldValue
					});
				}
			}, 200);
			this.#unwatches.push(this.#store.watch((state, getters) => getters['message/body'], (newValue, oldValue) => {
				// noinspection ReuseOfLocalVariableJS
				lastNewValue = newValue;
				// noinspection ReuseOfLocalVariableJS
				lastOldValue = oldValue;
				throttledWatcher();
			}));
		}
		#watchTemplate() {
			this.#unwatches.push(this.#store.watch((state, getters) => getters['templates/current'], (newValue, oldValue) => {
				if (newValue?.ORIGINAL_ID !== oldValue?.ORIGINAL_ID) {
					this.#emitOnStateChange();
					this.#emit('onTemplateChange', {
						// clone mutable data to avoid external mutations
						template: main_core.Runtime.clone(newValue),
						oldTemplate: main_core.Runtime.clone(oldValue)
					});
				}
			}));
		}
		#emitOnStateChange() {
			// on channel change there usually from, to, template and message body changes
			// fire only one event in such cases
			this.#emitStateChangeDebounced ??= main_core.Runtime.debounce(() => {
				this.#emit('onStateChange');
			}, 25);
			this.#emitStateChangeDebounced();
		}
		#emit(eventName, eventData = {}) {
			this.#emitter.emit(eventName, eventData);
		}
		destroy() {
			this.#unwatches.forEach(unwatch => unwatch());
			this.#unwatches = null;
			this.#emitter = null;
			main_core.Runtime.destroy(this);
		}
		getState() {
			const state = {
				channel: this.#store.getters['channels/current'],
				from: this.#store.getters['channels/from'],
				to: this.#store.getters['channels/receiver'],
				message: {
					body: this.#store.getters['message/body']
				}
			};
			const chan = this.#store.getters['channels/current'];
			if (chan?.backend.senderCode === 'bitrix24') {
				state.notificationTemplate = this.#store.state.application.notificationTemplate;
			} else if (chan?.isTemplatesBased) {
				// clone mutable data to avoid external mutations
				state.template = main_core.Runtime.clone(this.#store.getters['templates/current']);
			}
			return state;
		}
	}

	// to avoid skeleton flickering for fast loads
	const SKELETON_SHOW_DELAY = 200;

	/**
	 * @memberOf BX.Crm.MessageSender
	 *
	 * @emits BX.Crm.MessageSender.Editor:onBeforeReload
	 * @emits BX.Crm.MessageSender.Editor:onSendSuccess
	 * @emits BX.Crm.MessageSender.Editor:onCancel
	 * @emits BX.Crm.MessageSender.Editor:onChannelChange
	 * @emits BX.Crm.MessageSender.Editor:onFromChange
	 * @emits BX.Crm.MessageSender.Editor:onToChange
	 * @emits BX.Crm.MessageSender.Editor:onMessageBodyChange
	 * @emits BX.Crm.MessageSender.Editor:onTemplateChange
	 * @emits BX.Crm.MessageSender.Editor:onStateChange
	 */
	class Editor extends main_core_events.EventEmitter {
		#options;
		#skeleton = null;
		#locator = null;
		#store = null;
		#app = null;
		#rootComponent = null;
		#stateExporter = null;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Crm.MessageSender.Editor');
			this.#options = options;
			this.#normalizeOptions(this.#options);
		}
		#normalizeOptions(options) {
			if (!main_core.Type.isArray(options.channels)) {
				// eslint-disable-next-line no-param-reassign
				options.channels = [];
			}
			for (const channel of options.channels) {
				if (!main_core.Type.isArray(channel.toList)) {
					channel.toList = [];
				}
				channel.toList = channel.toList.map(to => {
					if (main_core.Type.isPlainObject(to)) {
						return crm_messagesender.Receiver.fromJSON(to);
					}
					return to;
				});
			}
		}
		#mergeOptions(newOptions, oldOptions) {
			const overrideKeys = new Set(['channels', 'promoBanners', 'dynamicLoad', 'contentProviders', 'preferences']);

			// shared references ok, but don't modify the original
			const result = {
				...oldOptions
			};
			for (const [key, value] of Object.entries(newOptions)) {
				if (overrideKeys.has(key)) {
					result[key] = value;
				}
			}
			return result;
		}
		getOptions() {
			return this.#options;
		}

		/**
		 * Export current editor state.
		 */
		getState() {
			return this.#stateExporter?.getState() ?? null;
		}

		/**
		 * WARNING! Don't modify the element, don't style.
		 * You can only use it for popup binding.
		 *
		 * Returns null if not rendered.
		 */
		getContainer() {
			return this.#rootComponent?.$el ?? null;
		}

		/**
		 * WARNING! Don't modify the element, don't style.
		 * You can only use it for popup binding.
		 *
		 * Returns null if not rendered.
		 */
		getContentContainer() {
			return this.getContainer()?.querySelector('[data-role="content-container"]') ?? null;
		}
		setChannel(id) {
			void this.#store?.dispatch('channels/setChannel', {
				channelId: id
			});
			return this;
		}
		setFrom(id) {
			void this.#store?.dispatch('channels/setFrom', {
				fromId: id
			});
			return this;
		}
		setTo(addressId) {
			void this.#store?.dispatch('channels/setReceiver', {
				receiverAddressId: addressId
			});
			return this;
		}
		setMessageText(text) {
			void this.#store?.dispatch('message/setText', {
				text
			});
			return this;
		}
		setTemplate(templateOriginalId) {
			void this.#store?.dispatch('templates/setTemplate', {
				templateOriginalId
			});
			return this;
		}
		setFilledPlaceholder(filledPlaceholder) {
			void this.#store?.dispatch('templates/setFilledPlaceholder', {
				filledPlaceholder
			});
			return this;
		}
		setError(error) {
			void this.#store?.dispatch('application/setAlert', {
				error
			});
			return this;
		}
		resetAlert() {
			void this.#store?.dispatch('application/resetAlert');
			return this;
		}
		async render() {
			const target = main_core.Type.isElementNode(this.#options.renderTo) ? this.#options.renderTo : document.querySelector(this.#options.renderTo);
			if (main_core.Type.isNil(target)) {
				throw new TypeError(`Render container "${this.#options.renderTo}" not found`);
			}
			const skeletonTimeoutId = setTimeout(() => {
				main_core.Dom.clean(target);
				this.#skeleton ??= new crm_messagesender_editor_skeleton.Skeleton({
					layout: this.#options.layout
				});
				this.#skeleton.renderTo(target);
			}, SKELETON_SHOW_DELAY);
			await this.#load();
			this.#locator = new ServiceLocator();
			const locator = this.#locator;
			this.#app = ui_vue3.BitrixVue.createApp({
				name: 'CrmMessageSenderEditor',
				components: {
					MessageEditor
				},
				beforeCreate() {
					this.$bitrix.Data.set('locator', locator);
				},
				template: '<MessageEditor/>'
			});
			const {
				store,
				models: {
					messageModel
				}
			} = await this.#buildStore();
			this.#store = store;
			this.#locator.setStore(store);
			this.#locator.setMessageModel(messageModel);
			this.#app.use(store);
			clearTimeout(skeletonTimeoutId);
			main_core.Dom.clean(target);
			this.#rootComponent = this.#app.mount(target);
			this.#locator.setEventEmitter(this.#rootComponent.$Bitrix.eventEmitter);
			this.#stateExporter = new StateExporter({
				store,
				eventEmitter: this
			});
			this.#bindEvents();
			this.#locator.getAnalyticsService().onRender();
		}
		async #buildStore() {
			const messageModel = MessageModel.create().useDatabase(false).setLogger(this.#locator.getLogger()).setVariables({
				text: this.#options.message.text
			});
			const {
				store
			} = await ui_vue3_vuex.Builder.init().addModel(ApplicationModel.create().useDatabase(false).setLogger(this.#locator.getLogger()).setVariables({
				context: this.#options.context,
				contentProviders: this.#options.contentProviders,
				notificationTemplate: this.#options.notificationTemplate,
				promoBanners: this.#options.promoBanners,
				layout: this.#options.layout,
				scene: this.#options.scene
			})).addModel(ChannelsModel.create().useDatabase(false).setLogger(this.#locator.getLogger()).setVariables({
				collection: this.#options.channels
			})).addModel(messageModel).addModel(TemplatesModel.create().useDatabase(true) // cache for faster render, actualize on template load
			.setLogger(this.#locator.getLogger())).addModel(PreferencesModel.create().useDatabase(false).setLogger(this.#locator.getLogger()).setVariables({
				channelsSort: this.#options.preferences?.channelsSort,
				channelsLastUsedFrom: this.#options.preferences?.channelsLastUsedFrom
			})).addModel(AnalyticsModel.create().useDatabase(false).setLogger(this.#locator.getLogger()).setVariables({
				analytics: this.#options.analytics
			})).setDatabaseConfig({
				name: 'crm-messagesender-editor',
				type: ui_vue3_vuex.BuilderDatabaseType.indexedDb,
				siteId: main_core.Loc.getMessage('SITE_ID'),
				userId: main_core.Loc.getMessage('USER_ID')
			}).build();
			return {
				store,
				models: {
					messageModel
				}
			};
		}
		#load() {
			if (!this.#options.dynamicLoad) {
				return Promise.resolve();
			}
			return this.#actualizeOptions().then(() => {
				this.#options.dynamicLoad = false;
			});
		}

		/**
		 * Actualize editor options from the server.
		 * Editor state is not lost.
		 */
		reload() {
			const event = new main_core_events.BaseEvent();
			this.emit('onBeforeReload', event);
			if (event.isDefaultPrevented()) {
				return Promise.resolve();
			}
			void this.#store?.dispatch('application/setProgress', {
				isLoading: true
			});
			return this.#actualizeOptions().then(() => {
				void this.#store?.dispatch('application/actualizeState', {
					context: this.#options.context,
					contentProviders: this.#options.contentProviders,
					notificationTemplate: this.#options.notificationTemplate,
					promoBanners: this.#options.promoBanners,
					layout: this.#options.layout,
					scene: this.#options.scene
				});
				void this.#store?.dispatch('channels/actualizeState', {
					collection: this.#options.channels
				});
				void this.#store?.dispatch('preferences/actualizeState', {
					channelsSort: this.#options.preferences?.channelsSort,
					channelsLastUsedFrom: this.#options.preferences?.channelsLastUsedFrom
				});
			}).finally(() => {
				void this.#store?.dispatch('application/setProgress', {
					isLoading: false
				});
			});
		}
		#actualizeOptions() {
			return this.#loadOptions().then(options => {
				this.#options = this.#mergeOptions(options, this.#options);
			});
		}
		#loadOptions() {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.messagesender.editor.load', {
					json: {
						sceneId: this.#options.scene?.id,
						entityTypeId: this.#options.context.entityTypeId,
						entityId: this.#options.context.entityId,
						categoryId: this.#options.context.categoryId
					}
				}).then(response => {
					const options = response.data.editor;
					this.#normalizeOptions(options);
					resolve(options);
				}).catch(reject);
			});
		}
		#bindEvents() {
			this.#rootComponent.$Bitrix.eventEmitter.subscribe('crm:messagesender:editor:onConnectionsSliderClose', this.reload.bind(this));
			this.#rootComponent.$Bitrix.eventEmitter.subscribe('crm:messagesender:editor:onPromoBannerSliderClose', this.reload.bind(this));
			this.#rootComponent.$Bitrix.eventEmitter.subscribe('crm:messagesender:editor:onSendSuccess', () => {
				this.emit('onSendSuccess');
			});
			this.#rootComponent.$Bitrix.eventEmitter.subscribe('crm:messagesender:editor:onCancel', () => {
				this.emit('onCancel');
			});
		}
		destroy() {
			this.#app?.unmount();
			this.#app = null;
			this.#rootComponent.$Bitrix.eventEmitter.unsubscribeAll();
			this.#rootComponent = null;
			this.#stateExporter?.destroy();
			this.#stateExporter = null;
			this.unsubscribeAll();
			this.#store = null;
			this.#locator = null;
			main_core.Runtime.destroy(this);
		}
	}

	exports.Editor = Editor;

})(this.BX.Crm.MessageSender = this.BX.Crm.MessageSender || {}, BX.Crm.MessageSender, BX.Crm.MessageSender.Editor.Skeleton, BX, BX.Event, BX.Vue3, BX.Vue3.Vuex, BX.UI.EntitySelector, BX.UI.IconSet, BX.UI.System.Typography.Vue, BX.Vue3.Components, BX.Crm.Template, BX.Vue3.Directives, BX.UI, BX.Crm.MessageSender.ChannelSelector, BX, BX.UI.System.Chip.Vue, BX, BX.Crm.Integration.Analytics, BX.UI.Analytics);
//# sourceMappingURL=editor.bundle.js.map
