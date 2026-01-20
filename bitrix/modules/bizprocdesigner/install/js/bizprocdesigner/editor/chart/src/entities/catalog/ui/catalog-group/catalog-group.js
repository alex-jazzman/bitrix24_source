import { BIcon, Outline } from 'ui.icon-set.api.vue';
import './catalog-group.css';
// eslint-disable-next-line no-unused-vars
import type { CatalogMenuGroup } from '../types';

// @vue/component
export const CatalogGroup = {
	name: 'CatalogGroup',
	components: {
		BIcon,
	},
	props: {
		/** @type CatalogMenuGroup */
		group: {
			type: Object,
			required: true,
		},
		showItems: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['changeGroup'],
	setup(): { iconSet: { [string]: string } }
	{
		return { iconSet: Outline };
	},
	template: `
		<div class="editor-chart-catalog-group">
			<div
				:data-test-id="$testId('catalogGroup', group.id)"
				class="editor-chart-catalog-group__header"
				@click="$emit('changeGroup', group)"
			>
				<div class="editor-chart-catalog-group__icon-wrapper">
					<slot name="icon"/>
				</div>

				<p class="editor-chart-catalog-group__title">{{ group.title }}</p>

				<BIcon
					:name="iconSet.ARROW_RIGHT_XS"
					:size="30"
					class="editor-chart-catalog-group__arrow"
				/>
			</div>

			<Transition name="catalog-items-transition">
				<div
					v-if="showItems"
					class="editor-chart-catalog-group__content"
				>
					<div class="editor-chart-catalog-group__back-groups">
						<slot name="back"/>
					</div>

					<div
						v-if="group.items.length > 0"
						class="editor-chart-catalog-group__items"
					>
						<slot name="items"/>
					</div>

					<div
						v-else
						class="editor-chart-catalog-group__empty-label">
						<slot name="empty-label"/>
					</div>
				</div>
			</Transition>
		</div>
	`,
};
