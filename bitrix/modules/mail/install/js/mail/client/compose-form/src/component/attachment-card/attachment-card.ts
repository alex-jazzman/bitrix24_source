import { FocusNavigator } from 'ui.a11y';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.disk';
import 'ui.icon-set.outline';
import { TextSm, TextXs } from 'ui.system.typography.vue';
import { defineComponent, type PropType } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { Phrase } from '../../const';
import { useComposeEditor } from '../../infrastructure/adapter/editor/editor';
import { type EditorAttachment } from '../../infrastructure/adapter/editor/types';
import { resolveFileTypeIcon } from '../../lib/file-type/file-type';
import { loc } from '../../lib/loc/loc';

import './attachment-card.css';

const IconSize = 24;

type CardTestIds = {
	card: string,
	icon: string,
	name: string,
	size: string,
};

/**
 * Unnumbered on purpose, so the control is reached through the card that holds it. `ui.vue3.components.button`
 * hands `dataset` to the vanilla button in its constructor and watches the prop no further, and the node of a
 * card that outlived its neighbour is reused: a numbered id would keep the number of the removed card.
 */
const RemoveTestId = 'mail-compose-attachment-remove';

/**
 * Composed of an icon, typography and a button: the design system carries no file card. Removal goes
 * through the editor adapter rather than the surrounding list, because the Disk uploader control owns the
 * file: the list follows its removal event, and the editor drops the inline image of the file.
 */
// @vue/component
export const AttachmentCard = defineComponent({
	name: 'MailComposeAttachmentCard',

	components: {
		BIcon,
		TextSm,
		TextXs,
		UiButton,
	},

	props: {
		file: {
			type: Object as PropType<EditorAttachment>,
			required: true,
		},
		/** Position in the list; the test ids of the card are numbered by it. */
		index: {
			type: Number,
			required: true,
		},
	},

	setup()
	{
		return {
			editor: useComposeEditor(),
			iconSize: IconSize,
			removeIcon: Outline.CROSS_M,
			removeStyle: AirButtonStyle.PLAIN_NO_ACCENT,
			removeSize: ButtonSize.SMALL,
			removeTestId: RemoveTestId,
		};
	},

	computed: {
		iconName(): string
		{
			return resolveFileTypeIcon(this.file.name);
		},

		/**
		 * The button is icon-only, so this text becomes its accessible name; the name of the file is part of
		 * it, otherwise the buttons of a set differ by their position alone.
		 */
		removeText(): string
		{
			return loc(Phrase.AttachmentRemoveFile, { '#FILE_NAME#': this.file.name });
		},

		testIds(): CardTestIds
		{
			return {
				card: `mail-compose-attachment-card-${this.index}`,
				icon: `mail-compose-attachment-icon-${this.index}`,
				name: `mail-compose-attachment-name-${this.index}`,
				size: `mail-compose-attachment-size-${this.index}`,
			};
		},
	},

	methods: {
		handleRemoveClick(): void
		{
			this.moveFocusOffCard();
			this.editor.removeFile(this.file.fileId);
		},

		/**
		 * The card goes away together with the control that holds the focus, so the focus leaves first:
		 * onto the removal control of the neighbouring card, and — when this card was the only one — onto
		 * the control that follows the list, where the keyboard would have gone anyway. A focus the user
		 * has meanwhile put elsewhere stays where it is.
		 */
		moveFocusOffCard(): void
		{
			const card = this.$el as HTMLElement;
			const active = FocusNavigator.getActiveElement();
			if (!active || !card.contains(active))
			{
				return;
			}

			const neighbour = (card.nextElementSibling ?? card.previousElementSibling) as HTMLElement | null;
			if (neighbour && FocusNavigator.focusFirst(neighbour))
			{
				return;
			}

			const form = card.closest('.mail-compose-form') as HTMLElement | null;
			if (form)
			{
				FocusNavigator.focusNext(form, { from: active });
			}
		},
	},

	template: `
		<div class="mail-compose-attachment-card" :data-testid="testIds.card">
			<BIcon
				class="mail-compose-attachment-card__icon"
				:name="iconName"
				:size="iconSize"
				:data-testid="testIds.icon"
			/>
			<TextSm
				className="mail-compose-attachment-card__name"
				wrap="truncate"
				:data-testid="testIds.name"
			>{{ file.name }}</TextSm>
			<TextXs
				className="mail-compose-attachment-card__size"
				:data-testid="testIds.size"
			>{{ file.sizeFormatted }}</TextXs>
			<UiButton
				:text="removeText"
				:style="removeStyle"
				:size="removeSize"
				:collapsedIcon="removeIcon"
				collapsed
				:dataset="{ testid: removeTestId }"
				@click="handleRemoveClick"
			/>
		</div>
	`,
});
