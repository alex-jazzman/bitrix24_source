import { Runtime, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { Dialog } from 'ui.entity-selector';
import { Outline } from 'ui.icon-set.api.vue';
import { type MenuItemOptions, type MenuOptions } from 'ui.system.menu.vue';
import { Text as BText } from 'ui.system.typography.vue';
import { BitrixVue } from 'ui.vue3';
import { AirButtonStyle, Button as BButton } from 'ui.vue3.components.button';
import { mapGetters, mapState } from 'ui.vue3.vuex';
import type { Document, DocumentService } from '../../service/document-service';
import { type File, type FileService } from '../../service/file-service';
import { type ApplicationResult, type SalescenterService } from '../../service/salescenter-service';
import { LengthCounter } from './custom-message-content/length-counter';
import { ContentBody } from './layout/content-body';
import { ContentFooter } from './layout/content-footer';
import { MessagePreview } from './message-preview';

const MAX_TEXTAREA_HEIGHT = 150;

// @vue/component
export const CustomMessageContent = {
	name: 'CustomMessageContent',
	components: {
		BButton,
		BText,
		BMenu: BitrixVue.defineAsyncComponent('ui.system.menu.vue', 'BMenu'),
		Popup: BitrixVue.defineAsyncComponent('ui.vue3.components.popup', 'Popup'),
		Smiles: BitrixVue.defineAsyncComponent('ui.vue3.components.smiles', 'Smiles'),
		MessagePreview,
		ContentBody,
		ContentFooter,
		LengthCounter,
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			Outline,
		};
	},
	placeholdersDialog: null,
	data(): Object
	{
		return {
			isAddMenuShown: false,
			isSmilesShown: false,
			textAreaHeight: 'auto',
		};
	},
	computed: {
		...mapGetters({
			/** @type boolean */
			isProgress: 'application/isProgress',
		}),
		...mapState({
			contentProviders: (state) => state.application.contentProviders,
			/** @type {Layout} */
			layout: (state) => state.application.layout,
			context: (state) => state.application.context,
		}),
		message: {
			get(): string
			{
				return this.$store.state.message.text;
			},
			set(text: string): void
			{
				this.$store.dispatch('message/setText', { text });
			},
		},
		isShowActionsButton(): boolean
		{
			return this.layout.isContentProvidersShown && this.menuItems.length > 0;
		},
		isShowCopilot(): boolean
		{
			return this.layout.isContentProvidersShown && this.contentProviders.copilot?.isShown;
		},
		menuOptions(): MenuOptions
		{
			return {
				bindElement: this.$refs.actions,
				sections: [
					{
						code: 'crmValues',
					},
				],
				items: this.menuItems,
			};
		},
		menuItems(): MenuItemOptions[]
		{
			const items = [];
			if (this.contentProviders.files?.isShown)
			{
				const item = {
					title: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_FILE'),
					icon: Outline.ATTACH,
					isLocked: this.contentProviders.files.isLocked,
				};

				if (this.contentProviders.files.isEnabled && !this.contentProviders.files.isLocked)
				{
					item.subMenu = {};
					item.subMenu.items = [
						{
							title: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_FILE_UPLOAD'),
							onClick: () => {
								if (this.isProgress)
								{
									return;
								}

								this.getFileService().uploadNewFile(this.processFileResult);
							},
						},
						{
							title: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_FILE_DISK'),
							onClick: () => {
								if (this.isProgress)
								{
									return;
								}

								this.getFileService().pickFromDisk(this.processFileResult);
							},
						},
					];
				}
				else if (this.contentProviders.files.isLocked)
				{
					item.onClick = () => {
						void this.showLimitSlider(this.contentProviders.files.sliderCode);
					};
				}

				items.push(item);
			}

			if (this.contentProviders.salescenter?.isShown)
			{
				items.push({
					title: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_PAYMENT'),
					icon: Outline.MONEY,
					isLocked: this.contentProviders.salescenter.isLocked,
					onClick: async () => {
						if (this.isProgress)
						{
							return;
						}

						if (this.contentProviders.salescenter.isLocked)
						{
							this.getSalescenterService().showSalescenterDisabledSlider();

							return;
						}

						if (!this.contentProviders.salescenter.isEnabled)
						{
							this.$Bitrix.Data.get('locator').getLogger().warn('salescenter is not enabled');

							return;
						}

						const result = await this.getSalescenterService().openApplication();
						this.processSalescenterResult(result);
					},
				});
			}

			if (this.contentProviders.documents?.isEnabled)
			{
				items.push({
					title: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_DOCUMENT'),
					icon: Outline.FILE,
					onClick: async () => {
						if (this.isProgress)
						{
							return;
						}

						const document = await this.getDocumentService().selectOrCreateDocument(this.$refs.actions);
						if (!Type.isNil(document))
						{
							this.processDocumentResult(document);
						}
					},
				});
			}

			if (this.contentProviders.crmValues?.isEnabled)
			{
				items.push({
					title: this.$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_CRM'),
					sectionCode: 'crmValues',
					icon: Outline.PROMPT_VAR,
					onClick: () => {
						if (this.isProgress)
						{
							return;
						}

						this.openPlaceholdersDialog();
					},
				});
			}

			return items;
		},
		bgColor(): string
		{
			return this.layout.isMessageTextReadOnly ? 'var(--ui-color-accent-soft-blue-3)' : undefined;
		},
	},
	watch: {
		'message.length': function(): void
		{
			this.textAreaHeight = 'auto';

			void this.$nextTick(() => {
				const height = Math.min(this.$refs.textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);

				this.textAreaHeight = `${height}px`;
			});
		},
	},
	beforeUnmount()
	{
		this.placeholdersDialog?.destroy();
	},
	methods: {
		getFileService(): FileService
		{
			return this.$Bitrix.Data.get('locator').getFileService();
		},
		getSalescenterService(): SalescenterService
		{
			return this.$Bitrix.Data.get('locator').getSalescenterService();
		},
		getDocumentService(): DocumentService
		{
			return this.$Bitrix.Data.get('locator').getDocumentService();
		},
		getAnalyticsService(): AnalyticsService
		{
			return this.$Bitrix.Data.get('locator').getAnalyticsService();
		},
		processFileResult(file: File): void
		{
			this.$store.dispatch('message/setSource', { source: 'file' });

			this.insertText(`${file.name} ${file.externalLink}`);

			this.getAnalyticsService().onAddFile();
		},
		processDocumentResult(document: Document): void
		{
			this.$store.dispatch('message/setSource', { source: 'document' });

			this.insertText(`${document.title} ${document.publicUrl}`);

			this.getAnalyticsService().onAddDocument();
		},
		processSalescenterResult(result: ApplicationResult): void
		{
			if (Type.isStringFilled(result.source))
			{
				this.$store.dispatch('message/setSource', { source: result.source });
			}

			if (Type.isPlainObject(result.page))
			{
				this.insertText(`${result.page.name} ${result.page.url}`);

				this.getAnalyticsService().onAddSalescenterPage();
			}
			else if (Type.isPlainObject(result.payment))
			{
				this.insertText(result.payment.name);

				if (!Type.isNil(result.payment.paymentId))
				{
					this.$store.dispatch('message/setPaymentId', { paymentId: result.payment.paymentId });
				}

				if (!Type.isNil(result.payment.shipmentId))
				{
					this.$store.dispatch('message/setShipmentId', { shipmentId: result.payment.shipmentId });
				}

				this.getAnalyticsService().onAddSalescenterPayment();
			}
			else if (Type.isPlainObject(result.compilation))
			{
				this.insertText(result.compilation.name);

				if (Type.isArray(result.compilation.productIds))
				{
					this.$store.dispatch(
						'message/setCompilationProductIds',
						{ compilationProductIds: result.compilation.productIds },
					);
				}

				this.getAnalyticsService().onAddSalescenterCompilation();
			}
		},
		openPlaceholdersDialog(): void
		{
			this.placeholdersDialog ??= new Dialog({
				targetNode: this.$refs.actions,
				multiple: false,
				showAvatars: false,
				dropdownMode: true,
				compactView: true,
				enableSearch: true,
				entities: [
					{
						id: 'placeholder',
						dynamicLoad: true,
						dynamicSearch: false,
						searchable: true,
						options: this.context,
					},
				],
				events: {
					'Item:onSelect': (event: BaseEvent) => {
						const { item: selectedItem } = event.getData();

						this.insertText(`{${selectedItem.getCustomData().get('text')}}`);

						this.getAnalyticsService().onAddCrmValue();

						selectedItem.deselect();
					},
				},
			});

			this.placeholdersDialog.show();
		},
		async showCopilot(): void
		{
			if (this.isProgress)
			{
				return;
			}

			if (this.contentProviders.copilot?.isLocked)
			{
				void this.showLimitSlider(this.contentProviders.copilot.sliderCode);

				return;
			}

			if (!this.contentProviders.copilot?.isEnabled)
			{
				this.$Bitrix.Data.get('locator').getLogger().warn('copilot is not enabled');

				return;
			}

			const result = await this.$Bitrix.Data.get('locator').getCopilotService().showCopilot(
				this.$refs.textarea,
				'',
				this.message,
			);
			if (Type.isStringFilled(result.textReplace))
			{
				this.message = result.textReplace;
				this.getAnalyticsService().onAddCopilot();
			}
			else if (Type.isStringFilled(result.textBelow))
			{
				this.message = `${this.message}\n${result.textBelow}`;
				this.getAnalyticsService().onAddCopilot();
			}
		},
		async showLimitSlider(code: string): Promise<void>
		{
			try
			{
				/** @see BX.UI.FeaturePromotersRegistry */
				const { FeaturePromotersRegistry } = await Runtime.loadExtension('ui.info-helper');
				FeaturePromotersRegistry.getPromoter({ code }).show();
			}
			catch (error)
			{
				this.$Bitrix.Data.get('locator').getLogger().error('failed to show ui.info-helper', error);
			}
		},
		toggleSmiles(): void
		{
			if (this.isProgress)
			{
				return;
			}

			this.isSmilesShown = !this.isSmilesShown;
		},
		// inserts text at the cursor position
		insertText(text: string): void
		{
			const start = this.$refs.textarea.selectionStart;
			const end = this.$refs.textarea.selectionEnd;

			const messageStart = this.message.slice(0, start);
			const messageEnd = this.message.slice(end);

			let paddedText = text;

			if (messageStart.length > 0 && !messageStart.endsWith(' ') && !paddedText.startsWith(' '))
			{
				paddedText = ` ${paddedText}`;
			}

			if (messageEnd.length > 0 && !messageEnd.startsWith(' ') && !paddedText.endsWith(' '))
			{
				paddedText = `${paddedText} `;
			}

			this.message = messageStart + paddedText + messageEnd;

			void this.$nextTick(() => {
				const position = start + paddedText.length;

				this.$refs.textarea.selectionStart = position;
				this.$refs.textarea.selectionEnd = position;
				this.$refs.textarea.focus();
			});
		},
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
	`,
};
