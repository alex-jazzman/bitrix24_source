import { Runtime, Tag, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Dialog } from 'ui.entity-selector';
import { Outline } from 'ui.icon-set.api.vue';
import { Chip } from 'ui.system.chip.vue';
import { mapState } from 'ui.vue3.vuex';

import {
	CUSTOM_TEMPLATE_CACHE_INVALIDATE_EVENT,
	INSERT_PLACEHOLDER_TEXT_EVENT,
} from '../../const/editor-events';
import { placeholderService, type TextToken } from '../../service/placeholder-service';

const ENTITY_ID = 'messageservice-custom-template';

export type TemplatePlaceholder = {
	code: string,
	caption: string,
	attrs: { [key: string]: string },
};

// Per-placeholder hook fired while inserting a template body. A zone
// subscriber calls `event.preventDefault()` to cut the placeholder out for the
// current recipient; the platform never interprets placeholder origin itself.
export const TEMPLATE_PLACEHOLDER_INSERT_EVENT = 'onTemplatePlaceholderInsert';
const TEMPLATE_AVATAR = '/bitrix/js/messageservice/message/editor/images/template.svg';
const TEMPLATE_AVATAR_BG_COLOR = 'var(--ui-color-accent-soft-blue-3)';

const toTemplatePlaceholder = (token: TextToken): TemplatePlaceholder => Object.freeze({
	code: token.attrs.code,
	caption: token.caption,
	attrs: Object.freeze({ ...token.attrs }),
});

/**
 * Selector of user-managed (custom) message templates.
 *
 * Inserts the selected template body into the editor by emitting a domain
 * intent on the per-app bus; the active content owner inserts the text at the
 * caret. The create/edit form is still externally rendered: we emit
 * `CustomTemplate:onFormRequested` / `CustomTemplate:onListRequested`
 * for embedders to handle.
 *
 * @emits BX.MessageService.Message.Editor:CustomTemplate:onFormRequested
 * @emits BX.MessageService.Message.Editor:CustomTemplate:onListRequested
 *
 * @vue/component
 */
export const CustomTemplateSelector = {
	name: 'CustomTemplateSelector',
	components: {
		Chip,
	},
	props: {
		binding: {
			/** @type {import('../../editor').TemplateBinding} */
			type: Object,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			isDialogOpen: false,
		};
	},
	dialog: null,
	computed: {
		...mapState({
			/** @type {import('../../editor').Layout} */
			layout: (state) => state.application.layout,
		}),
		canCreateInSelector(): boolean
		{
			return Boolean(this.layout?.isCustomTemplateCreateInSelectorShown);
		},
	},
	mounted(): void
	{
		const emitter = this.$Bitrix.Data.get('locator').getEventEmitter();
		emitter.subscribe('onSendSuccess', this.handleTemplateCacheInvalidate);
		emitter.subscribe(CUSTOM_TEMPLATE_CACHE_INVALIDATE_EVENT, this.handleTemplateCacheInvalidate);
	},
	beforeUnmount(): void
	{
		const emitter = this.$Bitrix.Data.get('locator').getEventEmitter();
		emitter.unsubscribe('onSendSuccess', this.handleTemplateCacheInvalidate);
		emitter.unsubscribe(CUSTOM_TEMPLATE_CACHE_INVALIDATE_EVENT, this.handleTemplateCacheInvalidate);

		this.dialog?.destroy();
		this.dialog = null;
	},
	methods: {
		handleTemplateCacheInvalidate(): void
		{
			this.invalidateCache();
		},

		toggleDialog(): void
		{
			if (this.dialog)
			{
				if (this.dialog.isOpen())
				{
					this.dialog.hide();
				}
				else
				{
					this.dialog.show();
				}

				return;
			}

			const dialogConfig = {
				targetNode: this.$el,
				context: `messageservice.custom-template:${this.binding.zoneId}`,
				entities: [{
					id: ENTITY_ID,
					dynamicLoad: true,
					dynamicSearch: true,
					itemOptions: {
						default: {
							avatar: TEMPLATE_AVATAR,
							avatarOptions: {
								bgColor: TEMPLATE_AVATAR_BG_COLOR,
							},
						},
					},
					options: {
						zoneId: this.binding.zoneId,
						sceneId: this.binding.sceneId,
						targetId: this.binding.targetId,
					},
				}],
				width: 400,
				height: 350,
				enableSearch: true,
				hideOnSelect: true,
				autoHide: true,
				dropdownMode: false,
				multiple: false,
				recentItemsLimit: 10,
				recentTabOptions: {
					stubOptions: {
						title: this.$Bitrix.Loc.getMessage('MSGSVC_CT_SELECTOR_EMPTY_TITLE'),
						// Arrow points at the footer "+ New template" action, so the
						// empty state still leads the user to template creation.
						arrow: this.canCreateInSelector,
					},
				},
				events: {
					'Item:onSelect': (event) => {
						const item = event.getData().item;
						const body = item.getCustomData().get('body') || '';
						if (!Type.isStringFilled(body))
						{
							return;
						}

						this.insertTemplate(body, {
							id: Number(item.getId()),
							title: item.getTitle(),
							isForeign: Boolean(item.getCustomData().get('isForeign')),
						});
					},
					onShow: () => {
						this.isDialogOpen = true;
					},
					onHide: () => {
						this.isDialogOpen = false;
					},
					onDestroy: () => {
						this.isDialogOpen = false;
						this.dialog = null;
					},
				},
			};

			dialogConfig.footer = this.buildDialogFooter();

			this.dialog = new Dialog(dialogConfig);

			this.dialog.show();
		},

		/**
		 * Build a footer for the entity-selector Dialog containing template
		 * management actions. Returns an array of HTMLElements consumable
		 * by `Dialog`'s `footer` option (mirrors `template-selector.js`).
		 *
		 * The "Open templates" link is always present so it stays reachable in
		 * the empty state and in scenes that hide creation. The
		 * "+ New template" link is added only when creation is allowed.
		 */
		buildDialogFooter(): Array<HTMLElement>
		{
			const onSettingsClick = () => {
				this.openList();
			};

			const footer = [];

			if (this.canCreateInSelector)
			{
				const onCreateClick = () => {
					this.openCreateForm();
				};

				const createBtn = Tag.render`
					<span
						class="ui-selector-footer-link ui-selector-footer-link-add"
						data-testid="custom-template-selector-create-btn"
						tabindex="0"
						role="button"
						onclick="${onCreateClick}"
					>${this.$Bitrix.Loc.getMessage('MSGSVC_CT_SELECTOR_CREATE_BUTTON')}</span>
				`;
				createBtn.addEventListener('keydown', (event) => {
					if (event.key === 'Enter' || event.key === ' ')
					{
						event.preventDefault();
						onCreateClick();
					}
				});

				footer.push(createBtn);
			}

			const settingsBtn = Tag.render`
				<span
					class="ui-selector-footer-link"
					data-testid="custom-template-selector-open-list-btn"
					tabindex="0"
					role="button"
					onclick="${onSettingsClick}"
				>${this.$Bitrix.Loc.getMessage('MSGSVC_CT_SELECTOR_SETTINGS_BUTTON')}</span>
			`;
			settingsBtn.addEventListener('keydown', (event) => {
				if (event.key === 'Enter' || event.key === ' ')
				{
					event.preventDefault();
					onSettingsClick();
				}
			});

			footer.push(
				Tag.render`<span style="width: 100%;"></span>`,
				settingsBtn,
			);

			return footer;
		},

		/**
		 * Insert a template body at the caret. Every placeholder of the body is
		 * offered to the zone via the per-placeholder hook before the
		 * text is inserted: a subscriber that calls `preventDefault()` cuts the
		 * placeholder out together with its caption; without a subscriber the
		 * body is inserted as is. The platform never interprets placeholder
		 * origin — the zone decides keep/remove for its own zone.
		 *
		 * The hook data carries `existingPlaceholders` — the placeholders the
		 * editor body already holds, followed by the ones kept earlier in this
		 * very insert. It is context for the zone's own rules (deduplication,
		 * mutual exclusion), not a platform-level decision.
		 */
		insertTemplate(body: string, template: { id: number, title: string, isForeign: boolean }): void
		{
			// $Bitrix.Data is the idiomatic per-app DI store for Vue-Bitrix:
			// the Editor seeds it with the ServiceLocator in beforeCreate(),
			// and components reach it without prop drilling.
			const locator = this.$Bitrix.Data.get('locator');

			// Host bus (the embedder subscribes here) — used only for the
			// per-placeholder keep/remove hook below, not for the actual insert.
			const emitter = locator.getEventEmitter();

			const bodyBeforeInsert = this.$store.getters['message/body'] ?? '';
			const wasEmptyBeforeInsert = !Type.isStringFilled(bodyBeforeInsert);

			// Scanned once: the body is only written after this loop, so it cannot
			// change while placeholders are offered to the zone.
			const existingPlaceholders = placeholderService.scan(bodyBeforeInsert)
				.filter((token) => token.type === 'placeholder')
				.map((token) => toTemplatePlaceholder(token))
			;

			let removedCount = 0;
			const kept = placeholderService.scan(body).filter((token) => {
				if (token.type !== 'placeholder')
				{
					return true;
				}

				const event = new BaseEvent({
					data: {
						placeholder: {
							code: token.attrs.code,
							caption: token.caption,
							attrs: token.attrs,
						},
						// Per-call copy of frozen entries: a subscriber must not be able
						// to skew the context of the placeholders still to be offered.
						existingPlaceholders: [...existingPlaceholders],
						binding: { ...this.binding },
					},
				});
				emitter.emit(TEMPLATE_PLACEHOLDER_INSERT_EVENT, event);

				if (event.isDefaultPrevented())
				{
					removedCount++;

					return false;
				}

				existingPlaceholders.push(toTemplatePlaceholder(token));

				return true;
			});

			this.$Bitrix.eventEmitter.emit(INSERT_PLACEHOLDER_TEXT_EVENT, {
				text: placeholderService.serialize(kept),
			});

			// The editor body is updated by the lexical onChange listener, which
			// may settle after this synchronous frame — read it on the next tick
			// so `bodyAtInsert` matches what `message/body` reports at send time.
			void this.$nextTick(() => {
				void this.$store.dispatch('message/onTemplateInsert', {
					id: template.id,
					title: template.title,
					isForeign: template.isForeign,
					bodyAtInsert: this.$store.getters['message/body'],
					wasEmptyBeforeInsert,
				});
			});

			if (removedCount > 0)
			{
				const removedMessage = this.$Bitrix.Loc.getMessage('MSGSVC_CT_SELECTOR_PLACEHOLDERS_REMOVED');
				// Lazy-load so the base editor bundle does not eagerly pull a11y/notification.
				Runtime.loadExtension('ui.notification')
					.then(({ Center }) => {
						Center.notify({ content: removedMessage, useAirDesign: true });
					})
					.catch(() => {})
				;
				Runtime.loadExtension('ui.a11y')
					.then(({ LiveAnnouncer }) => {
						LiveAnnouncer.announce(removedMessage, 'assertive');
					})
					.catch(() => {})
				;
			}
		},

		invalidateCache(): void
		{
			this.dialog?.destroy();
			this.dialog = null;
		},

		/**
		 * Request the embedder to open the "create custom template" form.
		 * Intended to be wired to a footer action button or external trigger.
		 */
		openCreateForm(): void
		{
			this.invalidateCache();

			// Raw editor text, not the `message/body` getter: the footer button
			// only appears on non-template-based channels, so the user-typed
			// text in `state.message.text` is exactly what should pre-fill the
			// new template.
			const bodyInitial = this.$store.state.message.text ?? '';

			const emitter = this.$Bitrix.Data.get('locator').getEventEmitter();
			emitter.emit('CustomTemplate:onFormRequested', new BaseEvent({
				data: {
					mode: 'create',
					templateId: null,
					titleInitial: '',
					bodyInitial,
					bindElement: this.$el,
					binding: { ...this.binding },
				},
			}));
		},

		openList(): void
		{
			this.invalidateCache();

			const emitter = this.$Bitrix.Data.get('locator').getEventEmitter();
			emitter.emit('CustomTemplate:onListRequested', new BaseEvent({
				data: {
					bindElement: this.$el,
					binding: { ...this.binding },
				},
			}));
		},
	},
	template: `
		<Chip
			:icon="Outline.TEXT_FORMAT_BOTTOM"
			:dropdown="true"
			:text="$Bitrix.Loc.getMessage('MSGSVC_CT_SELECTOR_BUTTON')"
			data-testid="custom-template-selector-trigger"
			aria-haspopup="listbox"
			:aria-expanded="isDialogOpen ? 'true' : 'false'"
			@click="toggleDialog"
		/>
	`,
};
