import { type JsonObject } from 'main.core';

import { PromoId } from 'im.v2.const';
import { PromoManager } from 'im.v2.lib.promo';
import { EntityButton } from 'im.v2.component.content.elements';

import { TaskCardPromo } from './promo';

// @vue/component
export const TaskHeaderButton = {
	name: 'TaskHeaderButton',
	components: { EntityButton, TaskCardPromo },
	props: {
		text: {
			type: String,
			default: '',
		},
		compactMode: {
			type: Boolean,
			default: false,
		},
		withEmbeddedTaskCard: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	data(): JsonObject
	{
		return {
			showPromo: false,
		};
	},
	mounted()
	{
		if (!this.withEmbeddedTaskCard)
		{
			return;
		}

		this.initPromo();
	},
	methods: {
		initPromo()
		{
			this.showPromo = true;
			this.showPromo = PromoManager.getInstance().needToShow(PromoId.taskSideCard);
		},
		onClosePromo(): void
		{
			this.showPromo = false;
			void PromoManager.getInstance().markAsWatched(PromoId.taskSideCard);
		},
	},
	template: `
		<div class="bx-im-task-comments-header-button__container">
			<div ref="entity-button">
				<EntityButton :text="text" :compactMode="compactMode" @click="$emit('click')" />
			</div>
			<TaskCardPromo
				v-if="showPromo"
				:bindElement="$refs['entity-button']"
				@close="onClosePromo"
			/>
		</div>
	`,
};
