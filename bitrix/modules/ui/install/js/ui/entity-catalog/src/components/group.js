import { Type } from 'main.core';
import { type GroupData } from '../types/group';
import { CounterStyle } from 'ui.cnt';
import { Counter } from 'ui.vue3.components.counter';

import '../css/group.css';

export const Group = {
	emits: ['selected', 'unselected'],

	name: 'ui-entity-catalog-group',
	components: {
		Counter,
	},
	props: {
		/** @type GroupData */
		groupData: {
			required: true,
		},
	},
	computed: {
		hasIcon(): boolean
		{
			return Type.isStringFilled(this.groupData.icon);
		},
		getCounterStyle(): string
		{
			return CounterStyle.FILLED_SUCCESS;
		},
		getCounterValue(): ?number
		{
			const custom = this.groupData?.customData ?? {};
			const value = custom.counterValue;
			const isValueInteger = Number.isInteger(value);

			return isValueInteger && value > 0 ? value : null;
		}
	},
	methods: {
		isKeyboardActivation(originalEvent): boolean
		{
			if (originalEvent instanceof KeyboardEvent)
			{
				return true;
			}

			if (originalEvent instanceof MouseEvent)
			{
				return originalEvent.detail === 0;
			}

			return document.activeElement?.matches(':focus-visible') === true;
		},
		handleClick(originalEvent = null)
		{
			if (this.groupData.disabled)
			{
				return;
			}

			if (this.groupData.deselectable)
			{
				this.$emit(
					!this.groupData.selected ? 'selected' : 'unselected',
					this.groupData,
					this.isKeyboardActivation(originalEvent),
				);
			}
			else if (!this.groupData.selected)
			{
				this.$emit('selected', this.groupData, this.isKeyboardActivation(originalEvent));
			}
		},
	},
	template: `
		<slot name="group" v-bind:groupData="groupData" v-bind:handleClick="handleClick">
			<li
				:class="{
					'ui-entity-catalog__menu_item': true,
					'--native-action': true,
					'--active': groupData.selected,
					'--disabled': groupData.disabled,
				}"
			>
				<button
					type="button"
					data-testid="entity-catalog-group-action"
					class="ui-entity-catalog__menu_item-button"
					:disabled="groupData.disabled"
					:aria-current="groupData.selected ? 'true' : null"
					@click="handleClick"
				>
					<span class="ui-entity-catalog__menu_item-icon" v-if="hasIcon" v-html="groupData.icon"/>
					<span class="ui-entity-catalog__menu_item-text">{{ groupData.name }}</span>
				</button>
				<span
					v-if="getCounterValue !== null"
					class="ui-entity-catalog__menu_item-entity-count"
				>
					<Counter
						:value="getCounterValue"
						:style="getCounterStyle"
					>
					</Counter>
				</span>
			</li>
		</slot>
	`,
};
