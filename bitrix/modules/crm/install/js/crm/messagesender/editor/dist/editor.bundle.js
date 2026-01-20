/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports,crm_messagesender,crm_messagesender_editor_skeleton,main_core_events,ui_vue3,ui_vue3_directives_hint,ui_alerts,ui_system_typography_vue,ui_vue3_components_button,crm_messagesender_channelSelector,ui_iconSet_outline,ui_iconSet_social,ui_entitySelector,ui_iconSet_api_vue,ui_system_chip_vue,crm_template_editor,ui_vue3_vuex,crm_integration_analytics,ui_analytics,main_core) {
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
	    var _this$placeholdersPre;
	    (_this$placeholdersPre = this.placeholdersPreviewer) == null ? void 0 : _this$placeholdersPre.destroy();
	  },
	  methods: {
	    togglePreviewer() {
	      var _this$placeholdersPre2, _this$currentChannel;
	      if (this.isProgress || this.messageBody.trim().length === 0) {
	        return;
	      }
	      (_this$placeholdersPre2 = this.placeholdersPreviewer) != null ? _this$placeholdersPre2 : this.placeholdersPreviewer = new crm_template_editor.Previewer({
	        ...this.context,
	        bindElement: this.$refs.preview.$el,
	        isDisplayFormat: !((_this$currentChannel = this.currentChannel) != null && _this$currentChannel.isTemplatesBased)
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
	      var _this$contentProvider;
	      return this.layout.isContentProvidersShown && ((_this$contentProvider = this.contentProviders.copilot) == null ? void 0 : _this$contentProvider.isShown);
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
	      var _this$contentProvider2, _this$contentProvider3, _this$contentProvider4, _this$contentProvider5;
	      const items = [];
	      if ((_this$contentProvider2 = this.contentProviders.files) != null && _this$contentProvider2.isShown) {
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
	      if ((_this$contentProvider3 = this.contentProviders.salescenter) != null && _this$contentProvider3.isShown) {
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
	      if ((_this$contentProvider4 = this.contentProviders.documents) != null && _this$contentProvider4.isEnabled) {
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
	      if ((_this$contentProvider5 = this.contentProviders.crmValues) != null && _this$contentProvider5.isEnabled) {
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
	    var _this$placeholdersDia;
	    (_this$placeholdersDia = this.placeholdersDialog) == null ? void 0 : _this$placeholdersDia.destroy();
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
	      var _this$placeholdersDia2;
	      (_this$placeholdersDia2 = this.placeholdersDialog) != null ? _this$placeholdersDia2 : this.placeholdersDialog = new ui_entitySelector.Dialog({
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
	      var _this$contentProvider6, _this$contentProvider7;
	      if (this.isProgress) {
	        return;
	      }
	      if ((_this$contentProvider6 = this.contentProviders.copilot) != null && _this$contentProvider6.isLocked) {
	        void this.showLimitSlider(this.contentProviders.copilot.sliderCode);
	        return;
	      }
	      if (!((_this$contentProvider7 = this.contentProviders.copilot) != null && _this$contentProvider7.isEnabled)) {
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
								width: 300,
								height: 300,
								offsetLeft: -133,
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
	      var _this$notificationTem, _this$notificationTem2;
	      return ((_this$notificationTem = this.notificationTemplate) == null ? void 0 : (_this$notificationTem2 = _this$notificationTem.translation) == null ? void 0 : _this$notificationTem2.TITLE) || '';
	    },
	    placeholders() {
	      var _this$notificationTem3, _this$notificationTem4;
	      return (_this$notificationTem3 = (_this$notificationTem4 = this.notificationTemplate) == null ? void 0 : _this$notificationTem4.placeholders) != null ? _this$notificationTem3 : [];
	    },
	    previewPlaceholders() {
	      return this.placeholders.map(placeholder => this.makeTranslationPlaceholderName(placeholder.name));
	    },
	    filledPlaceholders() {
	      return this.placeholders.map(placeholder => {
	        var _ref, _placeholder$value;
	        return {
	          PLACEHOLDER_ID: this.makeTranslationPlaceholderName(placeholder.name),
	          FIELD_VALUE: (_ref = (_placeholder$value = placeholder.value) != null ? _placeholder$value : placeholder.caption) != null ? _ref : ''
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
	    var _this$notificationTem5, _this$notificationTem6;
	    this.editor = new crm_template_editor.Editor({
	      ...this.context,
	      target: this.$refs.body,
	      canUsePreview: false,
	      isReadOnly: true
	    });
	    this.editor.setPlaceholders({
	      PREVIEW: this.previewPlaceholders
	    }).setFilledPlaceholders(this.filledPlaceholders).setBody(((_this$notificationTem5 = this.notificationTemplate) == null ? void 0 : (_this$notificationTem6 = _this$notificationTem5.translation) == null ? void 0 : _this$notificationTem6.TEXT) || this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_TEMPLATE_MESSAGE'));
	  },
	  beforeUnmount() {
	    var _this$editor;
	    (_this$editor = this.editor) == null ? void 0 : _this$editor.destroy();
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
	      var _this$template$TITLE;
	      if (main_core.Type.isNil(this.template)) {
	        return this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_NO_TEMPLATE_TITLE');
	      }
	      return (_this$template$TITLE = this.template.TITLE) != null ? _this$template$TITLE : '';
	    },
	    templateBody() {
	      var _this$template$PREVIE;
	      if (main_core.Type.isNil(this.template)) {
	        return this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_NO_TEMPLATE_BODY');
	      }
	      return (_this$template$PREVIE = this.template.PREVIEW.replaceAll('\n', '<br>')) != null ? _this$template$PREVIE : '';
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
	    var _this$editor;
	    (_this$editor = this.editor) == null ? void 0 : _this$editor.destroy();
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
	      var _this$template$PLACEH, _this$template, _this$template$FILLED, _this$template2;
	      this.editor.setPlaceholders(main_core.Runtime.clone((_this$template$PLACEH = (_this$template = this.template) == null ? void 0 : _this$template.PLACEHOLDERS) != null ? _this$template$PLACEH : [])).setFilledPlaceholders(main_core.Runtime.clone((_this$template$FILLED = (_this$template2 = this.template) == null ? void 0 : _this$template2.FILLED_PLACEHOLDERS) != null ? _this$template$FILLED : [])).setBody(this.templateBody);
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
	      var _this$alert;
	      return main_core.Type.isStringFilled((_this$alert = this.alert) == null ? void 0 : _this$alert.error);
	    }
	  },
	  watch: {
	    alert(newAlert, oldAlert) {
	      if (!main_core.Type.isStringFilled(newAlert == null ? void 0 : newAlert.error)) {
	        var _this$alertInstance;
	        (_this$alertInstance = this.alertInstance) == null ? void 0 : _this$alertInstance.hide();
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
	    var _this$alertInstance2;
	    (_this$alertInstance2 = this.alertInstance) == null ? void 0 : _this$alertInstance2.destroy();
	  },
	  template: `
		<div class="crm-messagesender-editor__alert" data-test-role="alert" :style="{
			marginTop: isAlertShown ? 'var(--ui-space-stack-xs2)' : null,
		}"></div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	const ENTITY_ID = 'crm-from';

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
	      var _this$channel$fromLis, _this$channel;
	      return (_this$channel$fromLis = (_this$channel = this.channel) == null ? void 0 : _this$channel.fromList) != null ? _this$channel$fromLis : [];
	    },
	    dialogItems() {
	      return this.fromList.map(from => {
	        return {
	          id: from.id,
	          entityId: ENTITY_ID,
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
	          id: ENTITY_ID,
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
	        var _response$errors, _response$errors$;
	        this.$Bitrix.Data.get('locator').getAlertService().showError(response == null ? void 0 : (_response$errors = response.errors) == null ? void 0 : (_response$errors$ = _response$errors[0]) == null ? void 0 : _response$errors$.message);
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
	            var _this$selector;
	            this.$store.dispatch('channels/setChannel', {
	              channelId: item.id
	            });
	            this.$Bitrix.Data.get('locator').getAnalyticsService().onSelectChannel();
	            (_this$selector = this.selector) == null ? void 0 : _this$selector.close();
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
	      var _this$selector2, _this$selector3;
	      if ((_this$selector2 = this.selector) != null && _this$selector2.isShown()) {
	        this.selector.close();
	        return;
	      }
	      (_this$selector3 = this.selector) != null ? _this$selector3 : this.selector = new crm_messagesender_channelSelector.Selector({
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
	      var _this$selector4;
	      (_this$selector4 = this.selector) == null ? void 0 : _this$selector4.destroy();
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
	      var _this$channel;
	      return main_core.Type.isArrayFilled((_this$channel = this.channel) == null ? void 0 : _this$channel.toList);
	    },
	    chipText() {
	      if (!this.hasReceivers) {
	        return this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_NO_RECEIVER');
	      }
	      return `${this.receiver.addressSourceData.title} ${this.receiver.address.valueFormatted}`;
	    },
	    dialogItems() {
	      return this.channel.toList.map(receiver => {
	        var _this$receiver;
	        return {
	          id: receiver.address.id,
	          entityId: ENTITY_ID$1,
	          title: receiver.addressSourceData.title,
	          subtitle: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_RECEIVER_SUBTITLE_TEMPLATE', {
	            '#ADDRESS#': receiver.address.valueFormatted,
	            '#TYPE#': receiver.address.valueTypeCaption
	          }),
	          avatar: `/bitrix/js/crm/messagesender/editor/images/${receiver.addressSource.entityTypeName.toLowerCase()}.svg`,
	          selected: ((_this$receiver = this.receiver) == null ? void 0 : _this$receiver.address.id) === receiver.address.id,
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

	let _ = t => t,
	  _t,
	  _t2;
	const ENTITY_ID$2 = 'crm-hsm';

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
	        var _this$current;
	        return {
	          id: template.ORIGINAL_ID,
	          entityId: ENTITY_ID$2,
	          title: template.TITLE,
	          subtitle: template.PREVIEW,
	          avatar: '/bitrix/js/crm/messagesender/editor/images/template.svg',
	          avatarOptions: {
	            bgColor: 'var(--ui-color-accent-soft-blue-3)'
	          },
	          selected: ((_this$current = this.current) == null ? void 0 : _this$current.ORIGINAL_ID) === template.ORIGINAL_ID,
	          tabs: ['recents']
	        };
	      });
	    },
	    dialogFooter() {
	      return [main_core.Tag.render(_t || (_t = _`<span style="width: 100%;"></span>`)), main_core.Tag.render(_t2 || (_t2 = _`
					<span onclick="${0}" class="ui-selector-footer-link">${0}</span>
				`), this.showFeedbackForm, this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_SUGGEST_TEMPLATE'))];
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
	          id: ENTITY_ID$2,
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
	      var _this$currentChannel;
	      // todo templates for custom text
	      return Boolean((_this$currentChannel = this.currentChannel) == null ? void 0 : _this$currentChannel.isTemplatesBased);
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
	      var _this$currentChannel, _this$currentChannel2;
	      if (((_this$currentChannel = this.currentChannel) == null ? void 0 : _this$currentChannel.backend.senderCode) === 'bitrix24') {
	        return 'NotificationMessageContent';
	      }
	      if ((_this$currentChannel2 = this.currentChannel) != null && _this$currentChannel2.isTemplatesBased) {
	        return 'TemplateMessageContent';
	      }
	      return 'CustomMessageContent';
	    },
	    paddingStyle() {
	      var _this$layout$paddingT, _this$layout$paddingB, _this$layout$paddingL, _this$layout$paddingR;
	      return {
	        paddingTop: (_this$layout$paddingT = this.layout.paddingTop) != null ? _this$layout$paddingT : this.layout.padding,
	        paddingBottom: (_this$layout$paddingB = this.layout.paddingBottom) != null ? _this$layout$paddingB : this.layout.padding,
	        paddingLeft: (_this$layout$paddingL = this.layout.paddingLeft) != null ? _this$layout$paddingL : this.layout.padding,
	        paddingRight: (_this$layout$paddingR = this.layout.paddingRight) != null ? _this$layout$paddingR : this.layout.padding
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

	var _logger = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logger");
	class AnalyticsModel extends ui_vue3_vuex.BuilderModel {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _logger, {
	      writable: true,
	      value: void 0
	    });
	  }
	  getName() {
	    return 'analytics';
	  }
	  setLogger(logger) {
	    babelHelpers.classPrivateFieldLooseBase(this, _logger)[_logger] = logger;
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

	var _logger$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logger");
	class ApplicationModel extends ui_vue3_vuex.BuilderModel {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _logger$1, {
	      writable: true,
	      value: void 0
	    });
	  }
	  getName() {
	    return 'application';
	  }
	  setLogger(logger) {
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$1)[_logger$1] = logger;
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
	            babelHelpers.classPrivateFieldLooseBase(this, _logger$1)[_logger$1].warn(`setProgress: ${key} should be boolean`, {
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
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$1)[_logger$1].warn('setError: error should be string', {
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

	var _logger$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logger");
	class ChannelsModel extends ui_vue3_vuex.BuilderModel {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _logger$2, {
	      writable: true,
	      value: void 0
	    });
	  }
	  getName() {
	    return 'channels';
	  }
	  setLogger(logger) {
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$2)[_logger$2] = logger;
	    return this;
	  }
	  getState() {
	    var _collection$, _collection$$fromList, _collection$2, _collection$2$toList$;
	    const collection = this.getVariable('collection', []);
	    deepFreeze(collection);
	    return {
	      collection,
	      selected: {
	        channelId: this.getVariable('selected.channelId'),
	        fromId: this.getVariable('selected.fromId', (_collection$ = collection[0]) == null ? void 0 : (_collection$$fromList = _collection$.fromList[0]) == null ? void 0 : _collection$$fromList.id),
	        receiverAddressId: this.getVariable('selected.receiverAddressId', (_collection$2 = collection[0]) == null ? void 0 : (_collection$2$toList$ = _collection$2.toList[0]) == null ? void 0 : _collection$2$toList$.address.id)
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
	      from: (state, getters) => {
	        const channel = getters.current;
	        if (!channel) {
	          return null;
	        }
	        return channel.fromList.find(from => from.id === state.selected.fromId) || channel.fromList[0];
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
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$2)[_logger$2].warn('setChannel: channelId should be a string', {
	            payload
	          });
	          return;
	        }
	        const channel = store.state.collection.find(ch => ch.id === channelId);
	        if (!channel) {
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$2)[_logger$2].warn('setChannel: channel not found', {
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
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$2)[_logger$2].warn('setFrom: fromId should be a string', {
	            payload
	          });
	          return;
	        }
	        const currentChannel = store.getters.current;
	        const from = currentChannel.fromList.find(fc => fc.id === fromId);
	        if (!from) {
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$2)[_logger$2].warn('setFrom: from not found', {
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
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$2)[_logger$2].warn('setReceiver: receiverAddressId should be an integer', {
	            payload
	          });
	          return;
	        }
	        const currentChannel = store.getters.current;
	        const receiver = currentChannel.toList.find(rc => rc.address.id === receiverAddressId);
	        if (!receiver) {
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$2)[_logger$2].warn('setReceiver: receiver not found', {
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

	var _logger$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logger");
	var _compileNotificationBody = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("compileNotificationBody");
	var _compileTemplateBody = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("compileTemplateBody");
	class MessageModel extends ui_vue3_vuex.BuilderModel {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _compileTemplateBody, {
	      value: _compileTemplateBody2
	    });
	    Object.defineProperty(this, _compileNotificationBody, {
	      value: _compileNotificationBody2
	    });
	    Object.defineProperty(this, _logger$3, {
	      writable: true,
	      value: void 0
	    });
	  }
	  getName() {
	    return 'message';
	  }
	  setLogger(logger) {
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$3)[_logger$3] = logger;
	    return this;
	  }
	  getState() {
	    var _this$getVariable;
	    return {
	      text: String((_this$getVariable = this.getVariable('text', '')) != null ? _this$getVariable : ''),
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
	        if ((channel == null ? void 0 : channel.backend.senderCode) === 'bitrix24') {
	          const notificationTemplate = rootState.application.notificationTemplate;
	          if (main_core.Type.isNil(notificationTemplate)) {
	            return '';
	          }
	          return babelHelpers.classPrivateFieldLooseBase(this, _compileNotificationBody)[_compileNotificationBody](notificationTemplate);
	        }
	        if (!(channel != null && channel.isTemplatesBased)) {
	          return state.text.trim();
	        }
	        const template = rootGetters['templates/current'];
	        if (main_core.Type.isNil(template)) {
	          return '';
	        }
	        return babelHelpers.classPrivateFieldLooseBase(this, _compileTemplateBody)[_compileTemplateBody](template);
	      },
	      /** @function message/isReadyToSend */
	      isReadyToSend: (state, getters, rootState, rootGetters) => {
	        if (main_core.Type.isNil(rootGetters['channels/current']) || main_core.Type.isNil(rootGetters['channels/from']) || main_core.Type.isNil(rootGetters['channels/receiver'])) {
	          return false;
	        }
	        const channel = rootGetters['channels/current'];
	        if (channel.backend.senderCode === 'bitrix24') {
	          var _rootState$applicatio;
	          return main_core.Type.isStringFilled((_rootState$applicatio = rootState.application.notificationTemplate) == null ? void 0 : _rootState$applicatio.code);
	        }
	        return main_core.Type.isStringFilled(getters.body);
	      }
	    };
	  }
	  getActions() {
	    return {
	      /** @function message/setText */
	      setText: (store, payload) => {
	        const {
	          text
	        } = payload;
	        if (!main_core.Type.isString(text)) {
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$3)[_logger$3].warn('setText: text should be a string', {
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
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$3)[_logger$3].warn('setSource: source should be a string', {
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
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$3)[_logger$3].warn('setPaymentId: paymentId should be an int', {
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
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$3)[_logger$3].warn('setShipmentId: shipmentId should be an int', {
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
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$3)[_logger$3].warn('setCompilationProductIds: compilationProductIds should be an array', {
	            payload
	          });
	          return;
	        }
	        if (compilationProductIds.some(id => !main_core.Type.isInteger(id))) {
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$3)[_logger$3].warn('setCompilationProductIds: compilationProductIds should contain only integers', {
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
	function _compileNotificationBody2(notificationTemplate) {
	  var _notificationTemplate;
	  let text = ((_notificationTemplate = notificationTemplate.translation) == null ? void 0 : _notificationTemplate.TEXT) || '';
	  for (const placeholder of notificationTemplate.placeholders || []) {
	    if (!main_core.Type.isNil(placeholder.value)) {
	      text = text.replace(`#${placeholder.name}#`, placeholder.value);
	    } else if (!main_core.Type.isNil(placeholder.caption)) {
	      text = text.replace(`#${placeholder.name}#`, placeholder.caption);
	    }
	  }
	  return text;
	}
	function _compileTemplateBody2(template) {
	  var _template$PLACEHOLDER, _template$PLACEHOLDER2, _template$FILLED_PLAC;
	  // todo position
	  // todo tight coupling with template editor
	  return crm_template_editor.getPlainText(template.PREVIEW, (_template$PLACEHOLDER = (_template$PLACEHOLDER2 = template.PLACEHOLDERS) == null ? void 0 : _template$PLACEHOLDER2.PREVIEW) != null ? _template$PLACEHOLDER : [], (_template$FILLED_PLAC = template.FILLED_PLACEHOLDERS) != null ? _template$FILLED_PLAC : []);
	}

	var _logger$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logger");
	class PreferencesModel extends ui_vue3_vuex.BuilderModel {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _logger$4, {
	      writable: true,
	      value: void 0
	    });
	  }
	  getName() {
	    return 'preferences';
	  }
	  setLogger(logger) {
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$4)[_logger$4] = logger;
	    return this;
	  }
	  getState() {
	    return {
	      channelsSort: main_core.Runtime.clone(this.getVariable('channelsSort', null))
	    };
	  }
	  getGetters() {
	    return {
	      /** @function preferences/channelsSortOrDefault */
	      channelsSortOrDefault: (state, getters, rootState) => {
	        var _state$channelsSort;
	        const savedSort = main_core.Runtime.clone((_state$channelsSort = state.channelsSort) != null ? _state$channelsSort : []);
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
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$4)[_logger$4].warn('setChannelsSort: channelsSort should be an array', {
	            payload
	          });
	          return;
	        }
	        const normalized = channelsSort.filter(position => main_core.Type.isPlainObject(position)).map(position => main_core.Runtime.clone(position));
	        if (!main_core.Type.isArrayFilled(normalized)) {
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$4)[_logger$4].warn('setChannelsSort: channelsSort should contain at least one position', {
	            payload
	          });
	          return;
	        }
	        store.commit('setChannelsSort', {
	          channelsSort: normalized
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
	var _logger$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logger");
	class TemplatesModel extends ui_vue3_vuex.BuilderModel {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _logger$5, {
	      writable: true,
	      value: void 0
	    });
	  }
	  getName() {
	    return 'templates';
	  }
	  setLogger(logger) {
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$5)[_logger$5] = logger;
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
	        var _state$collection$get;
	        const chan = rootGetters['channels/current'];
	        if (!(chan != null && chan.isTemplatesBased)) {
	          return [];
	        }
	        return (_state$collection$get = state.collection[getters.cacheContextId]) != null ? _state$collection$get : [];
	      },
	      /** @function templates/current */
	      current: (state, getters, rootState, rootGetters) => {
	        var _rootGetters$channels;
	        const list = getters.listForChannel;
	        const templateOriginalId = state.selected[(_rootGetters$channels = rootGetters['channels/current']) == null ? void 0 : _rootGetters$channels.id];
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
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$5)[_logger$5].warn('addTemplates: templates should be a empty array', {
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
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$5)[_logger$5].warn('setTemplate: templateOriginalId should be a positive int', {
	            payload
	          });
	          return;
	        }
	        const chan = store.rootGetters['channels/current'];
	        if (main_core.Type.isNil(chan)) {
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$5)[_logger$5].warn('setTemplate: no current channel');
	          return;
	        }
	        if (!chan.isTemplatesBased) {
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$5)[_logger$5].warn('setTemplate: channel is not templates based', {
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
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$5)[_logger$5].warn('setFilledPlaceholder: filledPlaceholder should be a valid object', {
	            payload
	          });
	          return;
	        }
	        const template = store.getters.current;
	        if (!template) {
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$5)[_logger$5].warn('setFilledPlaceholder: current template is not set', {
	            payload
	          });
	          return;
	        }
	        const isPlaceholderExists = template.PLACEHOLDERS[POSITION].includes(filledPlaceholder.PLACEHOLDER_ID);
	        if (!isPlaceholderExists) {
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$5)[_logger$5].warn('setFilledPlaceholder: filledPlaceholder.PLACEHOLDER_ID references non-existent placeholder', {
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
	        var _template$FILLED_PLAC;
	        const templates = state.collection[contextId];
	        const template = templates.find(t => t.ORIGINAL_ID === templateOriginalId);
	        (_template$FILLED_PLAC = template.FILLED_PLACEHOLDERS) != null ? _template$FILLED_PLAC : template.FILLED_PLACEHOLDERS = [];
	        template.FILLED_PLACEHOLDERS = template.FILLED_PLACEHOLDERS.filter(fp => fp.PLACEHOLDER_ID !== filledPlaceholder.PLACEHOLDER_ID);
	        template.FILLED_PLACEHOLDERS.push(filledPlaceholder);
	      }
	    };
	  }
	}

	var _store = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	class AlertService {
	  constructor(params) {
	    Object.defineProperty(this, _store, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store] = params.store;
	  }
	  showError(message = null) {
	    void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('application/setAlert', {
	      error: message || main_core.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_GENERIC_ERROR')
	    });
	  }
	}

	var _store$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _sendChannelConnect = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendChannelConnect");
	var _sendEditorInteraction = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendEditorInteraction");
	class AnalyticsService {
	  constructor(params) {
	    Object.defineProperty(this, _sendEditorInteraction, {
	      value: _sendEditorInteraction2
	    });
	    Object.defineProperty(this, _sendChannelConnect, {
	      value: _sendChannelConnect2
	    });
	    Object.defineProperty(this, _store$1, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1] = params.store;
	  }
	  onRender() {
	    const event = new crm_integration_analytics.Builder.Communication.Editor.ViewEvent();
	    event.setSection(babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].state.analytics.analytics.c_section).setSubSection(babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].state.analytics.analytics.c_sub_section);
	    ui_analytics.sendData(event.buildData());
	  }
	  onAddChannelClick() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendChannelConnect)[_sendChannelConnect](crm_integration_analytics.Dictionary.ELEMENT_MENU_BUTTON);
	  }
	  onBannerConnectClick(id, connectStatus) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendChannelConnect)[_sendChannelConnect](crm_integration_analytics.Dictionary.ELEMENT_BANNER_BUTTON, id, connectStatus);
	  }
	  onNoChannelsButtonClick() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendChannelConnect)[_sendChannelConnect](crm_integration_analytics.Dictionary.ELEMENT_NO_CONNECTION_BUTTON);
	  }
	  onPreviewShow() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendEditorInteraction)[_sendEditorInteraction](crm_integration_analytics.Dictionary.ELEMENT_PREVIEW);
	  }
	  onSelectTemplate() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendEditorInteraction)[_sendEditorInteraction](crm_integration_analytics.Dictionary.ELEMENT_TEMPLATE_SELECTOR);
	  }
	  onSuggestTemplate() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendEditorInteraction)[_sendEditorInteraction](crm_integration_analytics.Dictionary.ELEMENT_TEMPLATE_OFFER);
	  }
	  onSelectChannel() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendEditorInteraction)[_sendEditorInteraction](crm_integration_analytics.Dictionary.ELEMENT_CHANNEL_SELECTOR);
	  }
	  onSaveChannelsSort() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendEditorInteraction)[_sendEditorInteraction](crm_integration_analytics.Dictionary.ELEMENT_CHANNEL_LIST_CHANGE);
	  }
	  onAddFile() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendEditorInteraction)[_sendEditorInteraction](crm_integration_analytics.Dictionary.ELEMENT_ELEMENT_ADD, 'file');
	  }
	  onAddDocument() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendEditorInteraction)[_sendEditorInteraction](crm_integration_analytics.Dictionary.ELEMENT_ELEMENT_ADD, 'document');
	  }
	  onAddSalescenterPage() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendEditorInteraction)[_sendEditorInteraction](crm_integration_analytics.Dictionary.ELEMENT_ELEMENT_ADD, 'salescenterPage');
	  }
	  onAddSalescenterPayment() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendEditorInteraction)[_sendEditorInteraction](crm_integration_analytics.Dictionary.ELEMENT_ELEMENT_ADD, 'salescenterPayment');
	  }
	  onAddSalescenterCompilation() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendEditorInteraction)[_sendEditorInteraction](crm_integration_analytics.Dictionary.ELEMENT_ELEMENT_ADD, 'salescenterCompilation');
	  }
	  onAddCrmValue() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendEditorInteraction)[_sendEditorInteraction](crm_integration_analytics.Dictionary.ELEMENT_ELEMENT_ADD, 'crmValue');
	  }
	  onAddCopilot() {
	    const event = new crm_integration_analytics.Builder.Communication.Editor.CopilotEvent();
	    event.setSection(babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].state.analytics.analytics.c_section).setSubSection(babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].state.analytics.analytics.c_sub_section);
	    ui_analytics.sendData(event.buildData());
	  }
	  onSend() {
	    var _babelHelpers$classPr, _babelHelpers$classPr2;
	    const event = crm_integration_analytics.Builder.Communication.Editor.SendEvent.createDefault((_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].getters['channels/current']) == null ? void 0 : _babelHelpers$classPr.id);
	    event.setSection(babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].state.analytics.analytics.c_section).setSubSection(babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].state.analytics.analytics.c_sub_section);
	    if ((_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].getters['channels/current']) != null && _babelHelpers$classPr2.isTemplatesBased) {
	      var _babelHelpers$classPr3;
	      event.setTemplateId((_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].getters['templates/current']) == null ? void 0 : _babelHelpers$classPr3.ORIGINAL_ID);
	    }
	    ui_analytics.sendData(event.buildData());
	  }
	  onCancel() {
	    const event = new crm_integration_analytics.Builder.Communication.Editor.CancelEvent();
	    event.setSection(babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].state.analytics.analytics.c_section).setSubSection(babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].state.analytics.analytics.c_sub_section);
	    ui_analytics.sendData(event.buildData());
	  }
	}
	function _sendChannelConnect2(element, id, connectStatus) {
	  const event = new crm_integration_analytics.Builder.Communication.Channel.ConnectEvent();
	  event.setSection(babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].state.analytics.analytics.c_section).setSubSection(babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].state.analytics.analytics.c_sub_section).setElement(element).setChannelId(id).setConnectStatus(connectStatus);
	  ui_analytics.sendData(event.buildData());
	}
	function _sendEditorInteraction2(element, addedElement) {
	  var _babelHelpers$classPr4;
	  const event = crm_integration_analytics.Builder.Communication.Editor.InteractionEvent.createDefault((_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].getters['channels/current']) == null ? void 0 : _babelHelpers$classPr4.id);
	  event.setSection(babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].state.analytics.analytics.c_section).setSubSection(babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].state.analytics.analytics.c_sub_section).setElement(element).setAddedElement(addedElement);
	  ui_analytics.sendData(event.buildData());
	}

	var _logger$6 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logger");
	var _store$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _copilot = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("copilot");
	var _copilotEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("copilotEvents");
	var _getCopilot = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCopilot");
	var _loadExtension = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadExtension");
	var _getHandlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getHandlers");
	class CopilotService {
	  constructor(params) {
	    Object.defineProperty(this, _getHandlers, {
	      value: _getHandlers2
	    });
	    Object.defineProperty(this, _loadExtension, {
	      value: _loadExtension2
	    });
	    Object.defineProperty(this, _getCopilot, {
	      value: _getCopilot2
	    });
	    Object.defineProperty(this, _logger$6, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _store$2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _copilot, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _copilotEvents, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$6)[_logger$6] = params.logger;
	    babelHelpers.classPrivateFieldLooseBase(this, _store$2)[_store$2] = params.store;
	  }

	  /**
	   * Show copilot dialog and resolve when it's closed. Resolve result will contain text that should be added to the
	   * message.
	   */
	  showCopilot(bindElement, selectedText, allText) {
	    return new Promise((resolve, reject) => {
	      babelHelpers.classPrivateFieldLooseBase(this, _getCopilot)[_getCopilot]().then(copilot => {
	        const handlers = babelHelpers.classPrivateFieldLooseBase(this, _getHandlers)[_getHandlers]();
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
	        babelHelpers.classPrivateFieldLooseBase(this, _logger$6)[_logger$6].error('CopilotService: Failed to show AI Copilot', error);
	        reject(error);
	      });
	    });
	  }
	}
	function _getCopilot2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot]) {
	    return Promise.resolve(babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot]);
	  }
	  return new Promise((resolve, reject) => {
	    babelHelpers.classPrivateFieldLooseBase(this, _loadExtension)[_loadExtension]().then(exports => {
	      var _babelHelpers$classPr;
	      /** @see BX.AI.CopilotEvents */
	      babelHelpers.classPrivateFieldLooseBase(this, _copilotEvents)[_copilotEvents] = exports.CopilotEvents;

	      /** @see BX.AI.Copilot */
	      /** @see BX.AI.CopilotMode */
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot] = new exports.Copilot({
	        moduleId: 'crm',
	        contextId: 'crm.messagesender.editor',
	        category: (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _store$2)[_store$2].state.application.contentProviders.copilot) == null ? void 0 : _babelHelpers$classPr.category,
	        mode: exports.CopilotMode.TEXT,
	        autoHide: true,
	        showResultInCopilot: true
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].subscribeOnce(babelHelpers.classPrivateFieldLooseBase(this, _copilotEvents)[_copilotEvents].START_INIT, () => {
	        void babelHelpers.classPrivateFieldLooseBase(this, _store$2)[_store$2].dispatch('application/setProgress', {
	          isLoading: true
	        });
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].subscribeOnce(babelHelpers.classPrivateFieldLooseBase(this, _copilotEvents)[_copilotEvents].FINISH_INIT, () => {
	        void babelHelpers.classPrivateFieldLooseBase(this, _store$2)[_store$2].dispatch('application/setProgress', {
	          isLoading: false
	        });
	        resolve(babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot]);
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].subscribeOnce(babelHelpers.classPrivateFieldLooseBase(this, _copilotEvents)[_copilotEvents].FAILED_INIT, () => {
	        void babelHelpers.classPrivateFieldLooseBase(this, _store$2)[_store$2].dispatch('application/setProgress', {
	          isLoading: false
	        });
	        reject(babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot]);
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].init();
	    }).catch(error => {
	      babelHelpers.classPrivateFieldLooseBase(this, _logger$6)[_logger$6].error('CopilotService: Failed to initialize AI Copilot', error);
	      reject(error);
	    });
	  });
	}
	function _loadExtension2() {
	  return main_core.Runtime.loadExtension('ai.copilot').catch(error => {
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$6)[_logger$6].error('CopilotService: Failed to load AI Copilot extension', error);
	    throw error;
	  });
	}
	function _getHandlers2() {
	  // whichever fires first will resolve the promise and unsubscribe all handlers
	  const handlers = {
	    [babelHelpers.classPrivateFieldLooseBase(this, _copilotEvents)[_copilotEvents].TEXT_SAVE]: (copilot, resolve, event) => {
	      const {
	        result
	      } = event.getData();
	      unsubscribeAllHandlers(copilot);
	      resolve({
	        textReplace: result
	      });
	      copilot.hide();
	    },
	    [babelHelpers.classPrivateFieldLooseBase(this, _copilotEvents)[_copilotEvents].TEXT_PLACE_BELOW]: (copilot, resolve, event) => {
	      const {
	        result
	      } = event.getData();
	      unsubscribeAllHandlers(copilot);
	      resolve({
	        textBelow: result
	      });
	      copilot.hide();
	    },
	    [babelHelpers.classPrivateFieldLooseBase(this, _copilotEvents)[_copilotEvents].HIDE]: (copilot, resolve) => {
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

	var _logger$7 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logger");
	var _store$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _menu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("menu");
	var _getMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMenu");
	var _getPublicUrl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPublicUrl");
	var _isDocument = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isDocument");
	var _isTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isTemplate");
	var _loadExtension$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadExtension");
	class DocumentService {
	  constructor(params) {
	    Object.defineProperty(this, _loadExtension$1, {
	      value: _loadExtension2$1
	    });
	    Object.defineProperty(this, _isTemplate, {
	      value: _isTemplate2
	    });
	    Object.defineProperty(this, _isDocument, {
	      value: _isDocument2
	    });
	    Object.defineProperty(this, _getPublicUrl, {
	      value: _getPublicUrl2
	    });
	    Object.defineProperty(this, _getMenu, {
	      value: _getMenu2
	    });
	    Object.defineProperty(this, _logger$7, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _store$3, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _menu, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$7)[_logger$7] = params.logger;
	    babelHelpers.classPrivateFieldLooseBase(this, _store$3)[_store$3] = params.store;
	  }
	  async selectOrCreateDocument(bindElement) {
	    void babelHelpers.classPrivateFieldLooseBase(this, _store$3)[_store$3].dispatch('application/setProgress', {
	      isLoading: true
	    });
	    try {
	      const menu = await babelHelpers.classPrivateFieldLooseBase(this, _getMenu)[_getMenu]();
	      const result = await menu.show(bindElement);
	      if (await babelHelpers.classPrivateFieldLooseBase(this, _isDocument)[_isDocument](result)) {
	        return {
	          title: result.getTitle(),
	          publicUrl: await babelHelpers.classPrivateFieldLooseBase(this, _getPublicUrl)[_getPublicUrl](result)
	        };
	      }
	      if (await babelHelpers.classPrivateFieldLooseBase(this, _isTemplate)[_isTemplate](result)) {
	        let document = null;
	        try {
	          document = await menu.createDocument(result);
	        } catch (error) {
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$7)[_logger$7].error('Failed to create document from template', {
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
	          publicUrl: await babelHelpers.classPrivateFieldLooseBase(this, _getPublicUrl)[_getPublicUrl](document)
	        };
	      }
	      return null;
	    } finally {
	      void babelHelpers.classPrivateFieldLooseBase(this, _store$3)[_store$3].dispatch('application/setProgress', {
	        isLoading: false
	      });
	    }
	  }
	}
	async function _getMenu2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _menu)[_menu]) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _menu)[_menu];
	  }
	  const exports = await babelHelpers.classPrivateFieldLooseBase(this, _loadExtension$1)[_loadExtension$1]();

	  /** @see BX.DocumentGenerator.Selector.Menu */
	  babelHelpers.classPrivateFieldLooseBase(this, _menu)[_menu] = new exports.Selector.Menu({
	    moduleId: 'crm',
	    provider: babelHelpers.classPrivateFieldLooseBase(this, _store$3)[_store$3].state.application.contentProviders.documents.provider,
	    value: babelHelpers.classPrivateFieldLooseBase(this, _store$3)[_store$3].state.application.context.entityId,
	    analyticsLabelPrefix: 'crmTimelineSmsEditor'
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _menu)[_menu];
	}
	function _getPublicUrl2(document) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _getMenu)[_getMenu]().then(menu => {
	    return menu.getDocumentPublicUrl(document);
	  }).catch(error => {
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$7)[_logger$7].error('Failed to get document public URL', {
	      document,
	      error
	    });
	    throw error;
	  });
	}
	async function _isDocument2(object) {
	  const exports = await babelHelpers.classPrivateFieldLooseBase(this, _loadExtension$1)[_loadExtension$1]();

	  /** @see BX.DocumentGenerator.Selector.Document */
	  return object instanceof exports.Selector.Document;
	}
	async function _isTemplate2(object) {
	  const exports = await babelHelpers.classPrivateFieldLooseBase(this, _loadExtension$1)[_loadExtension$1]();

	  /** @see BX.DocumentGenerator.Selector.Template */
	  return object instanceof exports.Selector.Template;
	}
	function _loadExtension2$1() {
	  return main_core.Runtime.loadExtension('documentgenerator.selector').catch(error => {
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$7)[_logger$7].error('Failed to load documentgenerator.selector', error);
	    throw error;
	  });
	}

	var _logger$8 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logger");
	var _store$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _uploader = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("uploader");
	var _browseElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("browseElement");
	var _fileWatcher = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fileWatcher");
	var _openFileBrowser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openFileBrowser");
	var _openDiskFileDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openDiskFileDialog");
	var _getUploader = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getUploader");
	var _isUploaderBusy = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isUploaderBusy");
	var _getExternalLink = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getExternalLink");
	class FileService {
	  constructor(params) {
	    Object.defineProperty(this, _getExternalLink, {
	      value: _getExternalLink2
	    });
	    Object.defineProperty(this, _isUploaderBusy, {
	      value: _isUploaderBusy2
	    });
	    Object.defineProperty(this, _getUploader, {
	      value: _getUploader2
	    });
	    Object.defineProperty(this, _openDiskFileDialog, {
	      value: _openDiskFileDialog2
	    });
	    Object.defineProperty(this, _openFileBrowser, {
	      value: _openFileBrowser2
	    });
	    Object.defineProperty(this, _logger$8, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _store$4, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _uploader, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _browseElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _fileWatcher, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$8)[_logger$8] = params.logger;
	    babelHelpers.classPrivateFieldLooseBase(this, _store$4)[_store$4] = params.store;
	  }

	  /**
	   * @param onSuccess can be called multiple times if user selects multiple files
	   */
	  uploadNewFile(onSuccess) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _store$4)[_store$4].getters['application/isProgress']) {
	      babelHelpers.classPrivateFieldLooseBase(this, _logger$8)[_logger$8].warn('Cannot upload file while in progress');
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _fileWatcher)[_fileWatcher] = onSuccess;
	    void babelHelpers.classPrivateFieldLooseBase(this, _openFileBrowser)[_openFileBrowser]();
	  }

	  /**
	   * @param onSuccess can be called multiple times if user selects multiple files
	   */
	  pickFromDisk(onSuccess) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _store$4)[_store$4].getters['application/isProgress']) {
	      babelHelpers.classPrivateFieldLooseBase(this, _logger$8)[_logger$8].warn('Cannot pick file from disk while in progress');
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _fileWatcher)[_fileWatcher] = onSuccess;
	    void babelHelpers.classPrivateFieldLooseBase(this, _openDiskFileDialog)[_openDiskFileDialog]();
	  }
	}
	async function _openFileBrowser2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _browseElement)[_browseElement]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _browseElement)[_browseElement].click();
	    return;
	  }
	  const uploader = await babelHelpers.classPrivateFieldLooseBase(this, _getUploader)[_getUploader]();
	  babelHelpers.classPrivateFieldLooseBase(this, _browseElement)[_browseElement] = document.createElement('div');
	  uploader.assignBrowse(babelHelpers.classPrivateFieldLooseBase(this, _browseElement)[_browseElement]);
	  babelHelpers.classPrivateFieldLooseBase(this, _browseElement)[_browseElement].click();
	}
	async function _openDiskFileDialog2() {
	  const uploader = await babelHelpers.classPrivateFieldLooseBase(this, _getUploader)[_getUploader]();
	  const {
	    openDiskFileDialog
	  } = await main_core.Runtime.loadExtension('disk.uploader.user-field-widget');
	  openDiskFileDialog({
	    dialogId: 'crm-messagesender-editor',
	    uploader
	  });
	}
	function _getUploader2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _uploader)[_uploader]) {
	    return Promise.resolve(babelHelpers.classPrivateFieldLooseBase(this, _uploader)[_uploader]);
	  }
	  return main_core.Runtime.loadExtension('ui.uploader.core').then(exports => {
	    let linkLoadsCount = 0;

	    /** @see { BX.UI.Uploader.Uploader } */
	    babelHelpers.classPrivateFieldLooseBase(this, _uploader)[_uploader] = new exports.Uploader({
	      controller: 'disk.uf.integration.diskUploaderController',
	      multiple: true,
	      events: {
	        [exports.UploaderEvent.FILE_ADD_START]: () => {
	          void babelHelpers.classPrivateFieldLooseBase(this, _store$4)[_store$4].dispatch('application/setProgress', {
	            isLoading: true
	          });
	        },
	        [exports.UploaderEvent.FILE_ERROR]: event => {
	          babelHelpers.classPrivateFieldLooseBase(this, _logger$8)[_logger$8].error('Failed to upload file', event.getData());
	          if (linkLoadsCount <= 0 && !babelHelpers.classPrivateFieldLooseBase(this, _isUploaderBusy)[_isUploaderBusy](babelHelpers.classPrivateFieldLooseBase(this, _uploader)[_uploader])) {
	            void babelHelpers.classPrivateFieldLooseBase(this, _store$4)[_store$4].dispatch('application/setProgress', {
	              isLoading: false
	            });
	          }
	        },
	        // fires both on upload complete (from browser) and load complete (from disk dialog)
	        [exports.UploaderEvent.FILE_COMPLETE]: event => {
	          const file = event.getData().file;
	          linkLoadsCount++;
	          void babelHelpers.classPrivateFieldLooseBase(this, _getExternalLink)[_getExternalLink](file.getCustomData('fileId')) // eslint-disable-next-line promise/no-nesting
	          .then(link => {
	            var _babelHelpers$classPr, _babelHelpers$classPr2;
	            (_babelHelpers$classPr = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _fileWatcher))[_fileWatcher]) == null ? void 0 : _babelHelpers$classPr.call(_babelHelpers$classPr2, {
	              name: file.getName(),
	              externalLink: link
	            });
	          }).finally(() => {
	            linkLoadsCount--;
	            if (linkLoadsCount <= 0 && !babelHelpers.classPrivateFieldLooseBase(this, _isUploaderBusy)[_isUploaderBusy](babelHelpers.classPrivateFieldLooseBase(this, _uploader)[_uploader])) {
	              void babelHelpers.classPrivateFieldLooseBase(this, _store$4)[_store$4].dispatch('application/setProgress', {
	                isLoading: false
	              });
	            }
	          });
	        }
	      }
	    });
	    return babelHelpers.classPrivateFieldLooseBase(this, _uploader)[_uploader];
	  }).catch(error => {
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$8)[_logger$8].error('Failed to load ui.uploader.core', error);
	    throw error;
	  });
	}
	function _isUploaderBusy2(uploader) {
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
	function _getExternalLink2(fileId) {
	  return new Promise((resolve, reject) => {
	    main_core.ajax.runAction('disk.file.generateExternalLink', {
	      analyticsLabel: 'crmTimelineSmsEditorGetFilePublicUrl',
	      data: {
	        fileId
	      }
	    }).then(response => {
	      var _response$data, _response$data$extern;
	      if (main_core.Type.isStringFilled(response == null ? void 0 : (_response$data = response.data) == null ? void 0 : (_response$data$extern = _response$data.externalLink) == null ? void 0 : _response$data$extern.link)) {
	        resolve(response.data.externalLink.link);
	      } else {
	        reject(new Error('No external link in response'));
	      }
	    }).catch(error => {
	      babelHelpers.classPrivateFieldLooseBase(this, _logger$8)[_logger$8].error('Failed to get external link', error);
	      reject(error);
	    });
	  });
	}

	var _prefix = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prefix");
	var _prepareArgs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareArgs");
	class Logger {
	  constructor(params = {}) {
	    Object.defineProperty(this, _prepareArgs, {
	      value: _prepareArgs2
	    });
	    Object.defineProperty(this, _prefix, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _prefix)[_prefix] = params.prefix || '';
	  }
	  error(...args) {
	    babelHelpers.classPrivateFieldLooseBase(this, _prepareArgs)[_prepareArgs](args);
	    console.error(...args);
	  }
	  warn(...args) {
	    babelHelpers.classPrivateFieldLooseBase(this, _prepareArgs)[_prepareArgs](args);

	    // eslint-disable-next-line no-console
	    console.warn(...args);
	  }
	}

	// default logger
	function _prepareArgs2(args) {
	  const [message] = args;
	  if (main_core.Type.isString(message)) {
	    // eslint-disable-next-line no-param-reassign
	    args[0] = `${babelHelpers.classPrivateFieldLooseBase(this, _prefix)[_prefix]}${message}`;
	  } else {
	    args.unshift(babelHelpers.classPrivateFieldLooseBase(this, _prefix)[_prefix]);
	  }
	}
	const logger = new Logger({
	  prefix: 'crm.messagesender.editor: '
	});

	const OPTIONS_CATEGORY = 'crm';
	const OPTIONS_NAME = 'crm.messagesender.editor';
	var _store$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _savePreferences = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("savePreferences");
	class PreferencesService {
	  constructor(params) {
	    Object.defineProperty(this, _savePreferences, {
	      value: _savePreferences2
	    });
	    Object.defineProperty(this, _store$5, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store$5)[_store$5] = params.store;
	  }
	  saveChannelsSort(sort) {
	    void babelHelpers.classPrivateFieldLooseBase(this, _store$5)[_store$5].dispatch('preferences/setChannelsSort', {
	      channelsSort: sort
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _savePreferences)[_savePreferences]();
	  }
	}
	function _savePreferences2() {
	  const scene = babelHelpers.classPrivateFieldLooseBase(this, _store$5)[_store$5].state.application.scene;
	  BX.userOptions.save(OPTIONS_CATEGORY, OPTIONS_NAME, scene.id, JSON.stringify(babelHelpers.classPrivateFieldLooseBase(this, _store$5)[_store$5].state.preferences));
	}

	var _logger$9 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logger");
	var _store$6 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	class SalescenterService {
	  constructor(params) {
	    Object.defineProperty(this, _logger$9, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _store$6, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$9)[_logger$9] = params.logger;
	    babelHelpers.classPrivateFieldLooseBase(this, _store$6)[_store$6] = params.store;
	  }
	  showSalescenterDisabledSlider() {
	    main_core.Runtime.loadExtension('salescenter.tool-availability-manager').then(({
	      ToolAvailabilityManager
	    }) => {
	      /** @see BX.Salescenter.ToolAvailabilityManager.openSalescenterToolDisabledSlider */
	      ToolAvailabilityManager.openSalescenterToolDisabledSlider();
	    }).catch(error => {
	      babelHelpers.classPrivateFieldLooseBase(this, _logger$9)[_logger$9].error('Failed to load salescenter.tool-availability-manager', error);
	    });
	  }
	  openApplication() {
	    return main_core.Runtime.loadExtension('salescenter.manager').then(({
	      Manager
	    }) => {
	      /** @see BX.Salescenter.Manager.openApplication */
	      return Manager.openApplication({
	        disableSendButton: babelHelpers.classPrivateFieldLooseBase(this, _store$6)[_store$6].getters['channels/canSendMessage'] ? '' : 'y',
	        context: 'sms',
	        ownerTypeId: babelHelpers.classPrivateFieldLooseBase(this, _store$6)[_store$6].state.application.context.entityTypeId,
	        ownerId: babelHelpers.classPrivateFieldLooseBase(this, _store$6)[_store$6].state.application.context.entityId,
	        mode: babelHelpers.classPrivateFieldLooseBase(this, _store$6)[_store$6].state.application.contentProviders.salescenter.mode,
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
	      var _result$get;
	      if (result.get('action') === 'sendPage' && main_core.Type.isStringFilled((_result$get = result.get('page')) == null ? void 0 : _result$get.url)) {
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
	      babelHelpers.classPrivateFieldLooseBase(this, _logger$9)[_logger$9].error('Failed to open salescenter application', error);
	      throw error;
	    });
	  }
	}

	var _logger$a = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logger");
	var _store$7 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _messageModel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("messageModel");
	var _emitter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("emitter");
	var _analyticsService = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("analyticsService");
	var _prepareParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareParams");
	var _prepareNotificationParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareNotificationParams");
	var _prepareTemplateParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareTemplateParams");
	var _prepareCustomTextParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareCustomTextParams");
	var _prepareCommonParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareCommonParams");
	class SendService {
	  constructor(params) {
	    Object.defineProperty(this, _prepareCommonParams, {
	      value: _prepareCommonParams2
	    });
	    Object.defineProperty(this, _prepareCustomTextParams, {
	      value: _prepareCustomTextParams2
	    });
	    Object.defineProperty(this, _prepareTemplateParams, {
	      value: _prepareTemplateParams2
	    });
	    Object.defineProperty(this, _prepareNotificationParams, {
	      value: _prepareNotificationParams2
	    });
	    Object.defineProperty(this, _prepareParams, {
	      value: _prepareParams2
	    });
	    Object.defineProperty(this, _logger$a, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _store$7, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _messageModel, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _emitter, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _analyticsService, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$a)[_logger$a] = params.logger;
	    babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7] = params.store;
	    babelHelpers.classPrivateFieldLooseBase(this, _messageModel)[_messageModel] = params.messageModel;
	    babelHelpers.classPrivateFieldLooseBase(this, _emitter)[_emitter] = params.eventEmitter;
	    babelHelpers.classPrivateFieldLooseBase(this, _analyticsService)[_analyticsService] = params.analyticsService;
	  }
	  sendMessage() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].getters['application/isProgress']) {
	      babelHelpers.classPrivateFieldLooseBase(this, _logger$a)[_logger$a].warn('sendMessage: already in progress');
	      return Promise.resolve();
	    }
	    void babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].dispatch('application/setProgress', {
	      isSending: true
	    });
	    const channel = babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].getters['channels/current'];
	    const from = babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].getters['channels/from'];
	    const receiver = babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].getters['channels/receiver'];
	    const params = babelHelpers.classPrivateFieldLooseBase(this, _prepareParams)[_prepareParams](channel, from, receiver);
	    return new Promise((resolve, reject) => {
	      main_core.ajax.runAction('crm.activity.sms.send', {
	        data: {
	          ownerTypeId: babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].state.application.context.entityTypeId,
	          ownerId: babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].state.application.context.entityId,
	          params
	        }
	      }).then(resolve).catch(reject);
	    }).then(() => {
	      babelHelpers.classPrivateFieldLooseBase(this, _analyticsService)[_analyticsService].onSend();
	      babelHelpers.classPrivateFieldLooseBase(this, _messageModel)[_messageModel].clearState();
	      void babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].dispatch('application/resetAlert');
	      babelHelpers.classPrivateFieldLooseBase(this, _emitter)[_emitter].emit('crm:messagesender:editor:onSendSuccess');
	    }).catch(response => {
	      babelHelpers.classPrivateFieldLooseBase(this, _logger$a)[_logger$a].error('sendMessage: error', {
	        response
	      });
	      throw response;
	    }).finally(() => {
	      void babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].dispatch('application/setProgress', {
	        isSending: false
	      });
	    });
	  }
	}
	function _prepareParams2(channel, from, receiver) {
	  if (channel.backend.senderCode === 'bitrix24') {
	    return babelHelpers.classPrivateFieldLooseBase(this, _prepareNotificationParams)[_prepareNotificationParams](channel, from, receiver);
	  }
	  if (channel.isTemplatesBased) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _prepareTemplateParams)[_prepareTemplateParams](channel, from, receiver);
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _prepareCustomTextParams)[_prepareCustomTextParams](channel, from, receiver);
	}
	function _prepareNotificationParams2(channel, from, receiver) {
	  return {
	    ...babelHelpers.classPrivateFieldLooseBase(this, _prepareCommonParams)[_prepareCommonParams](channel, from, receiver),
	    signedTemplate: babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].state.application.notificationTemplate.signed
	  };
	}
	function _prepareTemplateParams2(channel, from, receiver) {
	  const template = babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].getters['templates/current'];
	  return {
	    ...babelHelpers.classPrivateFieldLooseBase(this, _prepareCommonParams)[_prepareCommonParams](channel, from, receiver),
	    body: babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].getters['message/body'],
	    template: template.ID,
	    templateOriginalId: template.ORIGINAL_ID,
	    isTemplateWithPlaceholders: main_core.Type.isPlainObject(template.PLACEHOLDERS),
	    isReplacePlaceholders: true,
	    isPlaceholdersInDisplayFormat: false
	  };
	}
	function _prepareCustomTextParams2(channel, from, receiver) {
	  return {
	    ...babelHelpers.classPrivateFieldLooseBase(this, _prepareCommonParams)[_prepareCommonParams](channel, from, receiver),
	    body: babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].getters['message/body'],
	    paymentId: babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].state.message.paymentId,
	    shipmentId: babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].state.message.shipmentId,
	    source: babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].state.message.source,
	    compilationProductIds: babelHelpers.classPrivateFieldLooseBase(this, _store$7)[_store$7].state.message.compilationProductIds,
	    isReplacePlaceholders: true,
	    isPlaceholdersInDisplayFormat: true
	  };
	}
	function _prepareCommonParams2(channel, from, receiver) {
	  return {
	    senderId: channel.backend.id,
	    from: from.id,
	    to: receiver.address.value,
	    entityTypeId: receiver.addressSource.entityTypeId,
	    entityId: receiver.addressSource.entityId
	  };
	}

	var _sessionCache = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sessionCache");
	var _logger$b = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("logger");
	var _store$8 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _doOnce = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("doOnce");
	var _getCurrentChannel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCurrentChannel");
	var _getCurrentTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCurrentTemplate");
	var _getContext = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContext");
	var _cacheTemplates = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cacheTemplates");
	class TemplateService {
	  constructor(params) {
	    Object.defineProperty(this, _cacheTemplates, {
	      value: _cacheTemplates2
	    });
	    Object.defineProperty(this, _getContext, {
	      value: _getContext2
	    });
	    Object.defineProperty(this, _getCurrentTemplate, {
	      value: _getCurrentTemplate2
	    });
	    Object.defineProperty(this, _getCurrentChannel, {
	      value: _getCurrentChannel2
	    });
	    Object.defineProperty(this, _doOnce, {
	      value: _doOnce2
	    });
	    Object.defineProperty(this, _sessionCache, {
	      writable: true,
	      value: new main_core.Cache.MemoryCache()
	    });
	    Object.defineProperty(this, _logger$b, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _store$8, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _logger$b)[_logger$b] = params.logger;
	    babelHelpers.classPrivateFieldLooseBase(this, _store$8)[_store$8] = params.store;
	  }
	  loadTemplates() {
	    babelHelpers.classPrivateFieldLooseBase(this, _doOnce)[_doOnce](() => {
	      const chan = babelHelpers.classPrivateFieldLooseBase(this, _getCurrentChannel)[_getCurrentChannel]();
	      if (!chan || !chan.isTemplatesBased || !chan.backend.senderCode === 'sms_provider') {
	        return;
	      }
	      main_core.ajax.runAction('crm.activity.sms.getTemplates', {
	        data: {
	          senderId: chan.backend.id,
	          context: {
	            entityTypeId: babelHelpers.classPrivateFieldLooseBase(this, _getContext)[_getContext]().entityTypeId,
	            entityId: babelHelpers.classPrivateFieldLooseBase(this, _getContext)[_getContext]().entityId,
	            entityCategoryId: babelHelpers.classPrivateFieldLooseBase(this, _getContext)[_getContext]().categoryId
	          }
	        }
	      }).then(response => {
	        babelHelpers.classPrivateFieldLooseBase(this, _cacheTemplates)[_cacheTemplates](response.data.templates);
	      }).catch(response => {
	        babelHelpers.classPrivateFieldLooseBase(this, _logger$b)[_logger$b].error('Error while loading templates', response);
	        throw response;
	      });
	    });
	  }
	  createOrUpdatePlaceholder(params) {
	    const template = babelHelpers.classPrivateFieldLooseBase(this, _getCurrentTemplate)[_getCurrentTemplate]();
	    if (!template) {
	      return;
	    }
	    const context = babelHelpers.classPrivateFieldLooseBase(this, _getContext)[_getContext]();
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
	      babelHelpers.classPrivateFieldLooseBase(this, _logger$b)[_logger$b].warn('Error while remembering placeholder', response);
	    });
	  }
	}
	function _doOnce2(callback) {
	  babelHelpers.classPrivateFieldLooseBase(this, _sessionCache)[_sessionCache].remember(babelHelpers.classPrivateFieldLooseBase(this, _store$8)[_store$8].getters['templates/cacheContextId'], callback);
	}
	function _getCurrentChannel2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _store$8)[_store$8].getters['channels/current'];
	}
	function _getCurrentTemplate2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _store$8)[_store$8].getters['templates/current'];
	}
	function _getContext2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _store$8)[_store$8].state.application.context;
	}
	function _cacheTemplates2(templates) {
	  void babelHelpers.classPrivateFieldLooseBase(this, _store$8)[_store$8].dispatch('templates/addTemplates', {
	    templates
	  });
	}

	/**
	 * One instance of this class per editor instance. Some services can be shared between editors.
	 */
	var _services = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("services");
	var _store$9 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _messageModel$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("messageModel");
	var _emitter$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("emitter");
	class ServiceLocator {
	  constructor() {
	    Object.defineProperty(this, _services, {
	      writable: true,
	      value: new main_core.Cache.MemoryCache()
	    });
	    Object.defineProperty(this, _store$9, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _messageModel$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _emitter$1, {
	      writable: true,
	      value: null
	    });
	  }
	  setStore(store) {
	    babelHelpers.classPrivateFieldLooseBase(this, _store$9)[_store$9] = store;
	    return this;
	  }
	  setMessageModel(messageModel) {
	    babelHelpers.classPrivateFieldLooseBase(this, _messageModel$1)[_messageModel$1] = messageModel;
	    return this;
	  }
	  getMessageModel() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _messageModel$1)[_messageModel$1];
	  }
	  setEventEmitter(emitter) {
	    babelHelpers.classPrivateFieldLooseBase(this, _emitter$1)[_emitter$1] = emitter;
	    return this;
	  }
	  getLogger() {
	    return logger;
	  }
	  getSendService() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _services)[_services].remember('sendService', () => {
	      return new SendService({
	        logger: this.getLogger(),
	        store: babelHelpers.classPrivateFieldLooseBase(this, _store$9)[_store$9],
	        messageModel: this.getMessageModel(),
	        eventEmitter: babelHelpers.classPrivateFieldLooseBase(this, _emitter$1)[_emitter$1],
	        analyticsService: this.getAnalyticsService()
	      });
	    });
	  }
	  getAlertService() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _services)[_services].remember('alertService', () => {
	      return new AlertService({
	        store: babelHelpers.classPrivateFieldLooseBase(this, _store$9)[_store$9]
	      });
	    });
	  }
	  getFileService() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _services)[_services].remember('fileService', () => {
	      return new FileService({
	        logger: this.getLogger(),
	        store: babelHelpers.classPrivateFieldLooseBase(this, _store$9)[_store$9]
	      });
	    });
	  }
	  getSalescenterService() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _services)[_services].remember('salescenterService', () => {
	      return new SalescenterService({
	        logger: this.getLogger(),
	        store: babelHelpers.classPrivateFieldLooseBase(this, _store$9)[_store$9]
	      });
	    });
	  }
	  getDocumentService() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _services)[_services].remember('documentService', () => {
	      return new DocumentService({
	        logger: this.getLogger(),
	        store: babelHelpers.classPrivateFieldLooseBase(this, _store$9)[_store$9]
	      });
	    });
	  }
	  getCopilotService() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _services)[_services].remember('copilotService', () => {
	      return new CopilotService({
	        logger: this.getLogger(),
	        store: babelHelpers.classPrivateFieldLooseBase(this, _store$9)[_store$9]
	      });
	    });
	  }
	  getTemplateService() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _services)[_services].remember('templateService', () => {
	      return new TemplateService({
	        logger: this.getLogger(),
	        store: babelHelpers.classPrivateFieldLooseBase(this, _store$9)[_store$9]
	      });
	    });
	  }
	  getPreferencesService() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _services)[_services].remember('preferencesService', () => {
	      return new PreferencesService({
	        store: babelHelpers.classPrivateFieldLooseBase(this, _store$9)[_store$9]
	      });
	    });
	  }
	  getAnalyticsService() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _services)[_services].remember('analyticsService', () => {
	      return new AnalyticsService({
	        store: babelHelpers.classPrivateFieldLooseBase(this, _store$9)[_store$9]
	      });
	    });
	  }
	}

	var _store$a = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _emitter$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("emitter");
	var _unwatches = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unwatches");
	var _emitStateChangeDebounced = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("emitStateChangeDebounced");
	var _bindEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindEvents");
	var _watchChannel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("watchChannel");
	var _watchFrom = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("watchFrom");
	var _watchReceiver = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("watchReceiver");
	var _watchMessageBody = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("watchMessageBody");
	var _watchTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("watchTemplate");
	var _emitOnStateChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("emitOnStateChange");
	var _emit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("emit");
	class StateExporter {
	  constructor({
	    store,
	    eventEmitter
	  }) {
	    Object.defineProperty(this, _emit, {
	      value: _emit2
	    });
	    Object.defineProperty(this, _emitOnStateChange, {
	      value: _emitOnStateChange2
	    });
	    Object.defineProperty(this, _watchTemplate, {
	      value: _watchTemplate2
	    });
	    Object.defineProperty(this, _watchMessageBody, {
	      value: _watchMessageBody2
	    });
	    Object.defineProperty(this, _watchReceiver, {
	      value: _watchReceiver2
	    });
	    Object.defineProperty(this, _watchFrom, {
	      value: _watchFrom2
	    });
	    Object.defineProperty(this, _watchChannel, {
	      value: _watchChannel2
	    });
	    Object.defineProperty(this, _bindEvents, {
	      value: _bindEvents2
	    });
	    Object.defineProperty(this, _store$a, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _emitter$2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _unwatches, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _emitStateChangeDebounced, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a] = store;
	    babelHelpers.classPrivateFieldLooseBase(this, _emitter$2)[_emitter$2] = eventEmitter;
	    babelHelpers.classPrivateFieldLooseBase(this, _bindEvents)[_bindEvents]();
	  }
	  destroy() {
	    babelHelpers.classPrivateFieldLooseBase(this, _unwatches)[_unwatches].forEach(unwatch => unwatch());
	    babelHelpers.classPrivateFieldLooseBase(this, _unwatches)[_unwatches] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _emitter$2)[_emitter$2] = null;
	    main_core.Runtime.destroy(this);
	  }
	  getState() {
	    const state = {
	      channel: babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a].getters['channels/current'],
	      from: babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a].getters['channels/from'],
	      to: babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a].getters['channels/receiver'],
	      message: {
	        body: babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a].getters['message/body']
	      }
	    };
	    const chan = babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a].getters['channels/current'];
	    if ((chan == null ? void 0 : chan.backend.senderCode) === 'bitrix24') {
	      state.notificationTemplate = babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a].state.application.notificationTemplate;
	    } else if (chan != null && chan.isTemplatesBased) {
	      // clone mutable data to avoid external mutations
	      state.template = main_core.Runtime.clone(babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a].getters['templates/current']);
	    }
	    return state;
	  }
	}
	function _bindEvents2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _watchChannel)[_watchChannel]();
	  babelHelpers.classPrivateFieldLooseBase(this, _watchFrom)[_watchFrom]();
	  babelHelpers.classPrivateFieldLooseBase(this, _watchReceiver)[_watchReceiver]();
	  babelHelpers.classPrivateFieldLooseBase(this, _watchMessageBody)[_watchMessageBody]();
	  babelHelpers.classPrivateFieldLooseBase(this, _watchTemplate)[_watchTemplate]();
	}
	function _watchChannel2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _unwatches)[_unwatches].push(babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a].watch((state, getters) => getters['channels/current'], (newValue, oldValue) => {
	    if ((newValue == null ? void 0 : newValue.id) !== (oldValue == null ? void 0 : oldValue.id)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _emitOnStateChange)[_emitOnStateChange]();
	      babelHelpers.classPrivateFieldLooseBase(this, _emit)[_emit]('onChannelChange', {
	        channel: newValue,
	        oldChannel: oldValue
	      });
	    }
	  }));
	}
	function _watchFrom2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _unwatches)[_unwatches].push(babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a].watch((state, getters) => getters['channels/from'], (newValue, oldValue) => {
	    if ((newValue == null ? void 0 : newValue.id) !== (oldValue == null ? void 0 : oldValue.id)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _emitOnStateChange)[_emitOnStateChange]();
	      babelHelpers.classPrivateFieldLooseBase(this, _emit)[_emit]('onFromChange', {
	        from: newValue,
	        oldFrom: oldValue
	      });
	    }
	  }));
	}
	function _watchReceiver2() {
	  const emit = (newValue, oldValue) => {
	    babelHelpers.classPrivateFieldLooseBase(this, _emitOnStateChange)[_emitOnStateChange]();
	    babelHelpers.classPrivateFieldLooseBase(this, _emit)[_emit]('onToChange', {
	      to: newValue,
	      oldTo: oldValue
	    });
	  };
	  babelHelpers.classPrivateFieldLooseBase(this, _unwatches)[_unwatches].push(babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a].watch((state, getters) => getters['channels/receiver'], (newValue, oldValue) => {
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
	function _watchMessageBody2() {
	  let lastNewValue = null;
	  let lastOldValue = null;
	  const throttledWatcher = main_core.Runtime.throttle(() => {
	    if (lastNewValue !== lastOldValue) {
	      babelHelpers.classPrivateFieldLooseBase(this, _emitOnStateChange)[_emitOnStateChange]();
	      babelHelpers.classPrivateFieldLooseBase(this, _emit)[_emit]('onMessageBodyChange', {
	        body: lastNewValue,
	        oldBody: lastOldValue
	      });
	    }
	  }, 200);
	  babelHelpers.classPrivateFieldLooseBase(this, _unwatches)[_unwatches].push(babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a].watch((state, getters) => getters['message/body'], (newValue, oldValue) => {
	    // noinspection ReuseOfLocalVariableJS
	    lastNewValue = newValue;
	    // noinspection ReuseOfLocalVariableJS
	    lastOldValue = oldValue;
	    throttledWatcher();
	  }));
	}
	function _watchTemplate2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _unwatches)[_unwatches].push(babelHelpers.classPrivateFieldLooseBase(this, _store$a)[_store$a].watch((state, getters) => getters['templates/current'], (newValue, oldValue) => {
	    if ((newValue == null ? void 0 : newValue.ORIGINAL_ID) !== (oldValue == null ? void 0 : oldValue.ORIGINAL_ID)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _emitOnStateChange)[_emitOnStateChange]();
	      babelHelpers.classPrivateFieldLooseBase(this, _emit)[_emit]('onTemplateChange', {
	        // clone mutable data to avoid external mutations
	        template: main_core.Runtime.clone(newValue),
	        oldTemplate: main_core.Runtime.clone(oldValue)
	      });
	    }
	  }));
	}
	function _emitOnStateChange2() {
	  var _babelHelpers$classPr, _babelHelpers$classPr2;
	  // on channel change there usually from, to, template and message body changes
	  // fire only one event in such cases
	  (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _emitStateChangeDebounced))[_emitStateChangeDebounced]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_emitStateChangeDebounced] = main_core.Runtime.debounce(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _emit)[_emit]('onStateChange');
	  }, 25);
	  babelHelpers.classPrivateFieldLooseBase(this, _emitStateChangeDebounced)[_emitStateChangeDebounced]();
	}
	function _emit2(eventName, eventData = {}) {
	  babelHelpers.classPrivateFieldLooseBase(this, _emitter$2)[_emitter$2].emit(eventName, eventData);
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
	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _skeleton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("skeleton");
	var _locator = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("locator");
	var _store$b = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _app = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("app");
	var _rootComponent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("rootComponent");
	var _stateExporter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("stateExporter");
	var _normalizeOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("normalizeOptions");
	var _mergeOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mergeOptions");
	var _buildStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buildStore");
	var _load = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("load");
	var _actualizeOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("actualizeOptions");
	var _loadOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadOptions");
	var _bindEvents$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindEvents");
	class Editor extends main_core_events.EventEmitter {
	  constructor(_options2) {
	    super();
	    Object.defineProperty(this, _bindEvents$1, {
	      value: _bindEvents2$1
	    });
	    Object.defineProperty(this, _loadOptions, {
	      value: _loadOptions2
	    });
	    Object.defineProperty(this, _actualizeOptions, {
	      value: _actualizeOptions2
	    });
	    Object.defineProperty(this, _load, {
	      value: _load2
	    });
	    Object.defineProperty(this, _buildStore, {
	      value: _buildStore2
	    });
	    Object.defineProperty(this, _mergeOptions, {
	      value: _mergeOptions2
	    });
	    Object.defineProperty(this, _normalizeOptions, {
	      value: _normalizeOptions2
	    });
	    Object.defineProperty(this, _options, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _skeleton, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _locator, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _store$b, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _app, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _rootComponent, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _stateExporter, {
	      writable: true,
	      value: null
	    });
	    this.setEventNamespace('BX.Crm.MessageSender.Editor');
	    babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = _options2;
	    babelHelpers.classPrivateFieldLooseBase(this, _normalizeOptions)[_normalizeOptions](babelHelpers.classPrivateFieldLooseBase(this, _options)[_options]);
	  }
	  getOptions() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _options)[_options];
	  }

	  /**
	   * Export current editor state.
	   */
	  getState() {
	    var _babelHelpers$classPr, _babelHelpers$classPr2;
	    return (_babelHelpers$classPr = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _stateExporter)[_stateExporter]) == null ? void 0 : _babelHelpers$classPr2.getState()) != null ? _babelHelpers$classPr : null;
	  }

	  /**
	   * WARNING! Don't modify the element, don't style.
	   * You can only use it for popup binding.
	   *
	   * Returns null if not rendered.
	   */
	  getContainer() {
	    var _babelHelpers$classPr3, _babelHelpers$classPr4;
	    return (_babelHelpers$classPr3 = (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _rootComponent)[_rootComponent]) == null ? void 0 : _babelHelpers$classPr4.$el) != null ? _babelHelpers$classPr3 : null;
	  }

	  /**
	   * WARNING! Don't modify the element, don't style.
	   * You can only use it for popup binding.
	   *
	   * Returns null if not rendered.
	   */
	  getContentContainer() {
	    var _this$getContainer$qu, _this$getContainer;
	    return (_this$getContainer$qu = (_this$getContainer = this.getContainer()) == null ? void 0 : _this$getContainer.querySelector('[data-role="content-container"]')) != null ? _this$getContainer$qu : null;
	  }
	  setChannel(id) {
	    var _babelHelpers$classPr5;
	    void ((_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr5.dispatch('channels/setChannel', {
	      channelId: id
	    }));
	    return this;
	  }
	  setFrom(id) {
	    var _babelHelpers$classPr6;
	    void ((_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr6.dispatch('channels/setFrom', {
	      fromId: id
	    }));
	    return this;
	  }
	  setTo(addressId) {
	    var _babelHelpers$classPr7;
	    void ((_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr7.dispatch('channels/setReceiver', {
	      receiverAddressId: addressId
	    }));
	    return this;
	  }
	  setMessageText(text) {
	    var _babelHelpers$classPr8;
	    void ((_babelHelpers$classPr8 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr8.dispatch('message/setText', {
	      text
	    }));
	    return this;
	  }
	  setTemplate(templateOriginalId) {
	    var _babelHelpers$classPr9;
	    void ((_babelHelpers$classPr9 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr9.dispatch('templates/setTemplate', {
	      templateOriginalId
	    }));
	    return this;
	  }
	  setFilledPlaceholder(filledPlaceholder) {
	    var _babelHelpers$classPr10;
	    void ((_babelHelpers$classPr10 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr10.dispatch('templates/setFilledPlaceholder', {
	      filledPlaceholder
	    }));
	    return this;
	  }
	  setError(error) {
	    var _babelHelpers$classPr11;
	    void ((_babelHelpers$classPr11 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr11.dispatch('application/setAlert', {
	      error
	    }));
	    return this;
	  }
	  resetAlert() {
	    var _babelHelpers$classPr12;
	    void ((_babelHelpers$classPr12 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr12.dispatch('application/resetAlert'));
	    return this;
	  }
	  async render() {
	    const target = main_core.Type.isElementNode(babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].renderTo) ? babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].renderTo : document.querySelector(babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].renderTo);
	    if (main_core.Type.isNil(target)) {
	      throw new TypeError(`Render container "${babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].renderTo}" not found`);
	    }
	    const skeletonTimeoutId = setTimeout(() => {
	      var _babelHelpers$classPr13, _babelHelpers$classPr14;
	      main_core.Dom.clean(target);
	      (_babelHelpers$classPr14 = (_babelHelpers$classPr13 = babelHelpers.classPrivateFieldLooseBase(this, _skeleton))[_skeleton]) != null ? _babelHelpers$classPr14 : _babelHelpers$classPr13[_skeleton] = new crm_messagesender_editor_skeleton.Skeleton({
	        layout: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].layout
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _skeleton)[_skeleton].renderTo(target);
	    }, SKELETON_SHOW_DELAY);
	    await babelHelpers.classPrivateFieldLooseBase(this, _load)[_load]();
	    babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator] = new ServiceLocator();
	    const locator = babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator];
	    babelHelpers.classPrivateFieldLooseBase(this, _app)[_app] = ui_vue3.BitrixVue.createApp({
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
	    } = await babelHelpers.classPrivateFieldLooseBase(this, _buildStore)[_buildStore]();
	    babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b] = store;
	    babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator].setStore(store);
	    babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator].setMessageModel(messageModel);
	    babelHelpers.classPrivateFieldLooseBase(this, _app)[_app].use(store);
	    clearTimeout(skeletonTimeoutId);
	    main_core.Dom.clean(target);
	    babelHelpers.classPrivateFieldLooseBase(this, _rootComponent)[_rootComponent] = babelHelpers.classPrivateFieldLooseBase(this, _app)[_app].mount(target);
	    babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator].setEventEmitter(babelHelpers.classPrivateFieldLooseBase(this, _rootComponent)[_rootComponent].$Bitrix.eventEmitter);
	    babelHelpers.classPrivateFieldLooseBase(this, _stateExporter)[_stateExporter] = new StateExporter({
	      store,
	      eventEmitter: this
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _bindEvents$1)[_bindEvents$1]();
	    babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator].getAnalyticsService().onRender();
	  }
	  /**
	   * Actualize editor options from the server.
	   * Editor state is not lost.
	   */
	  reload() {
	    var _babelHelpers$classPr15;
	    const event = new main_core_events.BaseEvent();
	    this.emit('onBeforeReload', event);
	    if (event.isDefaultPrevented()) {
	      return Promise.resolve();
	    }
	    void ((_babelHelpers$classPr15 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr15.dispatch('application/setProgress', {
	      isLoading: true
	    }));
	    return babelHelpers.classPrivateFieldLooseBase(this, _actualizeOptions)[_actualizeOptions]().then(() => {
	      var _babelHelpers$classPr16, _babelHelpers$classPr17, _babelHelpers$classPr18, _babelHelpers$classPr19;
	      void ((_babelHelpers$classPr16 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr16.dispatch('application/actualizeState', {
	        context: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].context,
	        contentProviders: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].contentProviders,
	        notificationTemplate: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].notificationTemplate,
	        promoBanners: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].promoBanners,
	        layout: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].layout,
	        scene: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].scene
	      }));
	      void ((_babelHelpers$classPr17 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr17.dispatch('channels/actualizeState', {
	        collection: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].channels
	      }));
	      void ((_babelHelpers$classPr18 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr18.dispatch('preferences/actualizeState', {
	        channelsSort: (_babelHelpers$classPr19 = babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].preferences) == null ? void 0 : _babelHelpers$classPr19.channelsSort
	      }));
	    }).finally(() => {
	      var _babelHelpers$classPr20;
	      void ((_babelHelpers$classPr20 = babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b]) == null ? void 0 : _babelHelpers$classPr20.dispatch('application/setProgress', {
	        isLoading: false
	      }));
	    });
	  }
	  destroy() {
	    var _babelHelpers$classPr21, _babelHelpers$classPr22;
	    (_babelHelpers$classPr21 = babelHelpers.classPrivateFieldLooseBase(this, _app)[_app]) == null ? void 0 : _babelHelpers$classPr21.unmount();
	    babelHelpers.classPrivateFieldLooseBase(this, _app)[_app] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _rootComponent)[_rootComponent].$Bitrix.eventEmitter.unsubscribeAll();
	    babelHelpers.classPrivateFieldLooseBase(this, _rootComponent)[_rootComponent] = null;
	    (_babelHelpers$classPr22 = babelHelpers.classPrivateFieldLooseBase(this, _stateExporter)[_stateExporter]) == null ? void 0 : _babelHelpers$classPr22.destroy();
	    babelHelpers.classPrivateFieldLooseBase(this, _stateExporter)[_stateExporter] = null;
	    this.unsubscribeAll();
	    babelHelpers.classPrivateFieldLooseBase(this, _store$b)[_store$b] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator] = null;
	    main_core.Runtime.destroy(this);
	  }
	}
	function _normalizeOptions2(options) {
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
	function _mergeOptions2(newOptions, oldOptions) {
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
	async function _buildStore2() {
	  var _babelHelpers$classPr23;
	  const messageModel = MessageModel.create().useDatabase(false).setLogger(babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator].getLogger()).setVariables({
	    text: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].message.text
	  });
	  const {
	    store
	  } = await ui_vue3_vuex.Builder.init().addModel(ApplicationModel.create().useDatabase(false).setLogger(babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator].getLogger()).setVariables({
	    context: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].context,
	    contentProviders: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].contentProviders,
	    notificationTemplate: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].notificationTemplate,
	    promoBanners: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].promoBanners,
	    layout: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].layout,
	    scene: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].scene
	  })).addModel(ChannelsModel.create().useDatabase(false).setLogger(babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator].getLogger()).setVariables({
	    collection: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].channels
	  })).addModel(messageModel).addModel(TemplatesModel.create().useDatabase(true) // cache for faster render, actualize on template load
	  .setLogger(babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator].getLogger())).addModel(PreferencesModel.create().useDatabase(false).setLogger(babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator].getLogger()).setVariables({
	    channelsSort: (_babelHelpers$classPr23 = babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].preferences) == null ? void 0 : _babelHelpers$classPr23.channelsSort
	  })).addModel(AnalyticsModel.create().useDatabase(false).setLogger(babelHelpers.classPrivateFieldLooseBase(this, _locator)[_locator].getLogger()).setVariables({
	    analytics: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].analytics
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
	function _load2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].dynamicLoad) {
	    return Promise.resolve();
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _actualizeOptions)[_actualizeOptions]().then(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].dynamicLoad = false;
	  });
	}
	function _actualizeOptions2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _loadOptions)[_loadOptions]().then(options => {
	    babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = babelHelpers.classPrivateFieldLooseBase(this, _mergeOptions)[_mergeOptions](options, babelHelpers.classPrivateFieldLooseBase(this, _options)[_options]);
	  });
	}
	function _loadOptions2() {
	  return new Promise((resolve, reject) => {
	    var _babelHelpers$classPr24;
	    main_core.ajax.runAction('crm.messagesender.editor.load', {
	      json: {
	        sceneId: (_babelHelpers$classPr24 = babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].scene) == null ? void 0 : _babelHelpers$classPr24.id,
	        entityTypeId: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].context.entityTypeId,
	        entityId: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].context.entityId,
	        categoryId: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].context.categoryId
	      }
	    }).then(response => {
	      const options = response.data.editor;
	      babelHelpers.classPrivateFieldLooseBase(this, _normalizeOptions)[_normalizeOptions](options);
	      resolve(options);
	    }).catch(reject);
	  });
	}
	function _bindEvents2$1() {
	  babelHelpers.classPrivateFieldLooseBase(this, _rootComponent)[_rootComponent].$Bitrix.eventEmitter.subscribe('crm:messagesender:editor:onConnectionsSliderClose', this.reload.bind(this));
	  babelHelpers.classPrivateFieldLooseBase(this, _rootComponent)[_rootComponent].$Bitrix.eventEmitter.subscribe('crm:messagesender:editor:onPromoBannerSliderClose', this.reload.bind(this));
	  babelHelpers.classPrivateFieldLooseBase(this, _rootComponent)[_rootComponent].$Bitrix.eventEmitter.subscribe('crm:messagesender:editor:onSendSuccess', () => {
	    this.emit('onSendSuccess');
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _rootComponent)[_rootComponent].$Bitrix.eventEmitter.subscribe('crm:messagesender:editor:onCancel', () => {
	    this.emit('onCancel');
	  });
	}

	exports.Editor = Editor;

}((this.BX.Crm.MessageSender = this.BX.Crm.MessageSender || {}),BX.Crm.MessageSender,BX.Crm.MessageSender.Editor.Skeleton,BX.Event,BX.Vue3,BX.Vue3.Directives,BX.UI,BX.UI.System.Typography.Vue,BX.Vue3.Components,BX.Crm.MessageSender.ChannelSelector,BX,BX,BX.UI.EntitySelector,BX.UI.IconSet,BX.UI.System.Chip.Vue,BX.Crm.Template,BX.Vue3.Vuex,BX.Crm.Integration.Analytics,BX.UI.Analytics,BX));
//# sourceMappingURL=editor.bundle.js.map
