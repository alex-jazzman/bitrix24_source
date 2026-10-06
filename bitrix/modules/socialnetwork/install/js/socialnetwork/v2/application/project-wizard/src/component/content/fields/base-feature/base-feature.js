import { Outline } from 'ui.icon-set.api.core';
import { mapWritableState } from 'ui.vue3.pinia';

import { BInput } from 'ui.system.input.vue';
import { BMenu, MenuItemDesign, type MenuOptions } from 'ui.system.menu.vue';

import { UiField } from 'socialnetwork.v2.components.elements.ui-field';
import { type ProjectFeature, useProjectStore } from 'socialnetwork.v2.model.project';

import { InjectionKey } from '../../../../const/index.js';

import './base-feature.css';

type BaseFeatureItem = {
	id: string,
	title: string,
	icon: string,
};

const whiteList = [
	'chat',
	'tasks',
	'files',
	'calendar',
	'blog',
	'flows',
	'landing_knowledge',
];

const whiteListOrder = new Map(whiteList.map((featureId, index) => [featureId, index]));

const featureIconMap = Object.freeze({
	chat: Outline.CHATS,
	tasks: Outline.TASK,
	files: Outline.ATTACH,
	calendar: Outline.CALENDAR,
	blog: Outline.NEWSFEED,
	flows: Outline.BOTTLENECK,
	landing_knowledge: Outline.KNOWLEDGE_BASE,
});

// @vue/component
export const BaseFeatureField = {
	name: 'ProjectWizardBaseFeatureField',
	components: {
		BInput,
		BMenu,
		UiField,
	},
	inject: {
		getWizardBodyContainer: {
			from: InjectionKey.GetWizardBodyContainer,
		},
	},
	data(): { isMounted: boolean, isMenuShown: boolean }
	{
		return {
			isMounted: false,
			isMenuShown: false,
		};
	},
	computed: {
		...mapWritableState(useProjectStore, ['baseFeatureId', 'availableFeatures']),
		baseFeatures(): BaseFeatureItem[]
		{
			if (!this.availableFeatures)
			{
				return [];
			}

			return this.availableFeatures
				.filter((feature: ProjectFeature) => whiteListOrder.has(feature.id))
				.sort((firstFeature, secondFeature) => {
					return whiteListOrder.get(firstFeature.id) - whiteListOrder.get(secondFeature.id);
				})
				.map((feature) => ({
					id: feature.id,
					title: feature.name,
					icon: featureIconMap[feature.id] ?? Outline.TASK,
				}))
			;
		},
		selectedFeature(): ?BaseFeatureItem
		{
			return this.baseFeatures.find((feature) => feature.id === this.baseFeatureId) ?? null;
		},
		menuOptions(): MenuOptions
		{
			return {
				bindElement: this.$refs.input.$el,
				closeOnItemClick: false,
				targetContainer: this.targetContainer,
				items: this.baseFeatures.map((feature) => ({
					title: feature.title,
					icon: feature.icon,
					isSelected: feature.id === this.baseFeatureId,
					design: MenuItemDesign.Default,
					onClick: () => {
						this.update(feature.id);
						this.closeMenu();
					},
				})),
			};
		},
		targetContainer(): ?HTMLElement
		{
			// `isMounted` makes this recompute once the wizard body ref is available
			// (it is null while the field renders inside the layout's body slot).
			return (this.isMounted ? this.getWizardBodyContainer() : null) ?? document.body;
		},
	},
	mounted(): void
	{
		this.isMounted = true;
	},
	methods: {
		update(featureId: string): void
		{
			this.baseFeatureId = featureId;
		},
		openMenu(): void
		{
			if (this.isMenuShown)
			{
				return;
			}

			this.isMenuShown = true;

			void this.$nextTick(() => {
				this.focusActiveMenuItem();
			});
		},
		closeMenu(): void
		{
			if (!this.isMenuShown)
			{
				return;
			}

			const container = this.getMenuContainer();
			const focusWasInMenu = container?.contains(document.activeElement) ?? false;

			this.isMenuShown = false;

			if (focusWasInMenu)
			{
				this.$refs.input?.focus();
			}
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (this.isMenuShown)
			{
				return;
			}

			if (['Enter', ' ', 'Spacebar', 'ArrowDown', 'ArrowUp'].includes(event.key))
			{
				event.preventDefault();
				this.openMenu();
			}
		},
		focusActiveMenuItem(): void
		{
			const container = this.getMenuContainer();
			if (!container)
			{
				return;
			}

			const buttons = container.querySelectorAll('.ui-popup-menu-item-action');
			if (buttons.length === 0)
			{
				return;
			}

			const selectedIndex = this.baseFeatures.findIndex((feature) => feature.id === this.baseFeatureId);
			const target = (selectedIndex >= 0 ? buttons[selectedIndex] : null) ?? buttons[0];
			target.focus();
		},
		getMenuContainer(): ?HTMLElement
		{
			const fromInstance = this.$refs.menu?.menu?.getPopupContainer?.();
			if (fromInstance)
			{
				return fromInstance;
			}

			const root = this.targetContainer ?? document.body;

			return root.querySelector?.('.ui-popup-menu-container') ?? null;
		},
	},
	template: `
		<UiField
			:label="loc('SONET_EXT_PROJECT_WIZARD_BASE_FEATURE_LABEL')"
			labelFor="sonet-project-wizard-base-feature"
			data-testid="base-feature-target"
		>
			<div class="sonet--project-wizard--base-feature-field-content">
				<div class="sonet--project-wizard--base-feature-item">
					<BInput
						v-if="isMounted"
						:modelValue="selectedFeature?.title ?? ''"
						:placeholder="loc('SONET_EXT_PROJECT_WIZARD_BASE_FEATURE_INFO')"
						readonly
						dropdown
						stretched
						:active="isMenuShown"
						ref="input"
						data-testid="base-feature-select"
						@click="openMenu"
						@keydown="handleKeydown"
					/>
					<BMenu
						v-if="isMenuShown"
						ref="menu"
						:options="menuOptions"
						@close="closeMenu"
					/>
				</div>
			</div>
		</UiField>
	`,
};
