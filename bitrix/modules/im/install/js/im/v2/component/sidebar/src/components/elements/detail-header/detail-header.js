import { Button as ChatButton, ButtonSize, ButtonColor } from 'im.v2.component.elements';

import './detail-header.css';
import { Layout } from 'im.v2.const';

// @vue/component
export const DetailHeader = {
	name: 'DetailHeader',
	components: { ChatButton },
	props:
	{
		title: {
			type: String,
			required: true,
		},
		secondLevel: {
			type: Boolean,
			default: false,
		},
		withAddButton: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['back', 'addClick'],
	computed:
	{
		ButtonSize: () => ButtonSize,
		ButtonColor: () => ButtonColor,
		isCopilotLayout(): boolean
		{
			const { name: currentLayoutName } = this.$store.getters['application/getLayout'];

			return currentLayoutName === Layout.copilot.name;
		},
		addButtonColor(): ButtonColor
		{
			if (this.isCopilotLayout)
			{
				return this.ButtonColor.Copilot;
			}

			return this.ButtonColor.PrimaryLight;
		},
	},
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-sidebar-detail-header__container bx-im-sidebar-detail-header__scope">
			<div class="bx-im-sidebar-detail-header__title-container">
				<button
					:class="{'bx-im-messenger__cross-icon': !secondLevel, 'bx-im-sidebar__back-icon': secondLevel}"
					@click="$emit('back')"
				/>
				<div class="bx-im-sidebar-detail-header__title-text">{{ title }}</div>
				<slot name="action">
					<div v-if="withAddButton" class="bx-im-sidebar-detail-header__add-button" ref="add-button">
						<ChatButton
							:text="loc('IM_SIDEBAR_ADD_BUTTON_TEXT')"
							:size="ButtonSize.S"
							:color="addButtonColor"
							:isRounded="true"
							:isUppercase="false"
							icon="plus"
							@click="$emit('addClick', {target: $refs['add-button']})"
						/>
					</div>
				</slot>
			</div>
		</div>
	`,
};
