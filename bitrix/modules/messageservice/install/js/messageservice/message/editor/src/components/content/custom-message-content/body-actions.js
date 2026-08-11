import { Runtime } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import { type MenuItemOptions, type MenuOptions } from 'ui.system.menu';
import { BitrixVue } from 'ui.vue3';
import { AirButtonStyle, Button as BButton } from 'ui.vue3.components.button';
import { mapGetters, mapState } from 'ui.vue3.vuex';

import { ContentProvider } from '../../../content-provider/content-provider';

// @vue/component
export const BodyActions = {
	name: 'BodyActions',
	components: {
		BButton,
		BMenu: BitrixVue.defineAsyncComponent('ui.system.menu.vue', 'BMenu'),
		Popup: BitrixVue.defineAsyncComponent('ui.vue3.components.popup', 'Popup'),
		Smiles: BitrixVue.defineAsyncComponent('ui.vue3.components.smiles', 'Smiles'),
	},
	props: {
		providerInstances: {
			type: Array,
			required: true,
			validator: (value) => value.every((x) => x instanceof ContentProvider),
		},
		insertContext: {
			type: Object,
			required: true,
		},
	},
	emits: ['showCopilot'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			Outline,
		};
	},
	data(): Object
	{
		return {
			isAddMenuShown: false,
			isSmilesShown: false,
		};
	},
	computed: {
		...mapGetters({
			/** @type boolean */
			isProgress: 'application/isProgress',
		}),
		...mapState({
			/** @type {Layout} */
			layout: (state) => state.application.layout,
		}),
		isShowActionsButton(): boolean
		{
			return this.layout.isContentProvidersShown && this.menuItems.length > 0;
		},
		isShowCopilot(): boolean
		{
			return this.layout.isContentProvidersShown
				&& this.providerInstances.some((p) => p.getId() === 'copilot');
		},
		menuItems(): MenuItemOptions[]
		{
			if (!this.layout.isContentProvidersShown)
			{
				return [];
			}

			const items = [];
			for (const provider of this.providerInstances)
			{
				const providerItems = provider.getMenuItems(this.insertContext);
				const providerId = provider.getId();

				for (let i = 0; i < providerItems.length; i++)
				{
					const item = providerItems[i];
					if (!item.id)
					{
						item.id = providerItems.length === 1 ? providerId : `${providerId}~${i}`;
					}
					else if (item.id !== providerId)
					{
						item.id = `${providerId}~${item.id}`;
					}
				}

				items.push(...providerItems);
			}

			return items;
		},
		menuOptions(): MenuOptions
		{
			const sections = [];
			const seenCodes = new Set();

			for (const item of this.menuItems)
			{
				if (item.sectionCode && !seenCodes.has(item.sectionCode))
				{
					seenCodes.add(item.sectionCode);
					sections.push({ code: item.sectionCode });
				}
			}

			return {
				bindElement: this.$refs.actions,
				sections,
				items: this.menuItems,
			};
		},
	},
	methods: {
		async showCopilot(): void
		{
			const copilotProvider = this.providerInstances.find((p) => p.getId() === 'copilot');
			if (!copilotProvider)
			{
				return;
			}

			if (copilotProvider.getCustomData().isLocked)
			{
				/** @see BX.UI.FeaturePromotersRegistry */
				const { FeaturePromotersRegistry } = await Runtime.loadExtension('ui.info-helper');
				FeaturePromotersRegistry.getPromoter({ code: copilotProvider.getCustomData().sliderCode }).show();

				return;
			}

			this.getAnalyticsService().onAddCopilot();
			this.$emit('showCopilot');
		},
		toggleSmiles(): void
		{
			if (this.isProgress)
			{
				return;
			}

			this.isSmilesShown = !this.isSmilesShown;
		},
		getAnalyticsService(): AnalyticsService
		{
			return this.$Bitrix.Data.get('locator').getAnalyticsService();
		},
	},
	template: `
		<div ref="actions" v-if="isShowActionsButton || isShowCopilot || layout.isEmojiButtonShown" class="messageservice-message-editor__content__body__actions">
			<div class="messageservice-message-editor__content__body__actions__left">
				<BButton
					v-if="isShowActionsButton"
					:text="$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_BUTTON_ADD')"
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
					class="messageservice-message-editor__content__body__actions__copilot"
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
					<Smiles :isOnlyEmoji="true" @selectSmile="insertContext.insertText($event.text.trim())"/>
				</Popup>
			</div>
		</div>
	`,
};
