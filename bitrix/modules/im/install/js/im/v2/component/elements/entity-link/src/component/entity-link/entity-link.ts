import { defineComponent, type PropType } from 'ui.vue3';

import { type ImModelChat } from 'im.v2.model';

import { EntityButton } from '../entity-button/entity-button';
import { EntityLinkAppearance, type EntityLinkAppearanceItem } from '../../const/appearance';
import { PhraseByLinkType } from '../../const/phrase-by-link-type';

// @vue/component
export const EntityLink = defineComponent({
	name: 'ImEntityLink',
	components: { EntityButton },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		appearance: {
			type: String as PropType<EntityLinkAppearanceItem>,
			default: EntityLinkAppearance.link,
		},
		withEntityName: {
			type: Boolean,
			default: true,
		},
		compactMode: {
			type: Boolean,
			default: false,
		},
		withUnreadBadge: {
			type: Boolean,
			default: false,
		},
		isChatMuted: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		entityUrl(): string
		{
			return this.dialog.entityLink?.url ?? '';
		},
		text(): string
		{
			if (!this.withEntityName)
			{
				return PhraseByLinkType.default;
			}

			return PhraseByLinkType[this.dialog.entityLink?.type] ?? PhraseByLinkType.default;
		},
	},
	template: `
		<EntityButton
			:text="text"
			:url="entityUrl"
			:appearance="appearance"
			:compactMode="compactMode"
			:withUnreadBadge="withUnreadBadge"
			:isChatMuted="isChatMuted"
			:data-testid="'im-entity-link-' + dialogId"
		/>
	`,
});
