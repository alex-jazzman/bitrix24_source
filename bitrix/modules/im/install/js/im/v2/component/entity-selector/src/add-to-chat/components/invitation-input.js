import { Dom, Loc, Validation, type JsonObject } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { TagSelector, type TagItem } from 'ui.entity-selector';
import { BIcon, Set as IconsSet } from 'ui.icon-set.api.vue';

import { type Candidate } from '../const/invitation.js';

import './invitation-input.css';

const InviteValueType = Object.freeze({
	email: 'email',
	phone: 'phone',
	error: 'error',
});

const ENTITY_ID = 'guest-invite';
const INPUT_DELIMITERS = new Set([' ', ',']);
const INPUT_SPLIT_PATTERN = /[\s,]+/;

// @vue/component
export const ChatInvitationInput = {
	name: 'ChatInvitationInput',
	components: { BIcon },
	props: {
		isPhoneAllowed: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['change', 'validityChange'],
	data(): JsonObject
	{
		return {
			candidates: [],
		};
	},
	computed: {
		IconsSet: () => IconsSet,
		hasInvalidCandidates(): boolean
		{
			return this.candidates.some((tag) => tag.type === InviteValueType.error);
		},
		placeholder(): string
		{
			if (this.isPhoneAllowed)
			{
				return Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_INPUT_PLACEHOLDER_WITH_PHONE');
			}

			return Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_INPUT_PLACEHOLDER_MSGVER_1');
		},
	},
	watch: {
		candidates(newValue: Candidate[])
		{
			this.$emit('change', newValue);
		},
	},
	created()
	{
		this.tagSelector = this.getTagSelector();
	},
	mounted()
	{
		this.tagSelector.renderTo(this.$refs['tag-selector']);
		this.tagSelector.focusTextBox();
	},
	methods: {
		getTagSelector(): TagSelector
		{
			return new TagSelector({
				showAddButton: false,
				showTextBox: true,
				showCreateButton: false,
				textBoxAutoHide: false,
				tagMaxWidth: 200,
				placeholder: this.placeholder,
				events: {
					onBeforeTagAdd: this.registerNewCandidate,
					onAfterTagRemove: this.unregisterCandidate,
					onInput: this.splitInputOnDelimiter,
					onEnter: this.commitInput,
					onBlur: this.commitInput,
					onContainerClick: this.focusTextBox,
				},
			});
		},
		resolveInvitationType(value: string): $Values<typeof InviteValueType>
		{
			if (this.isEmail(value))
			{
				return InviteValueType.email;
			}

			if (this.isPhone(value))
			{
				return InviteValueType.phone;
			}

			return InviteValueType.error;
		},
		isEmail(value: string): boolean
		{
			return Validation.isEmail(value);
		},
		isPhone(value: string): boolean
		{
			if (!this.isPhoneAllowed)
			{
				return false;
			}

			return BX.PhoneNumber.getValidNumberRegex().test(value);
		},
		commitInput(): void
		{
			const inputValue = this.tagSelector.getTextBoxValue();
			const inviteCandidates = inputValue.split(INPUT_SPLIT_PATTERN).filter((candidate) => candidate.length > 0);
			if (inviteCandidates.length === 0)
			{
				return;
			}

			for (const candidate of inviteCandidates)
			{
				const hasDuplicate = this.candidates.some((tagItem) => tagItem.value === candidate);
				if (hasDuplicate)
				{
					continue;
				}

				this.tagSelector.addTag({
					id: candidate,
					entityId: ENTITY_ID,
					entityType: this.resolveInvitationType(candidate),
					title: candidate,
				});
			}

			this.tagSelector.clearTextBox();
		},
		registerNewCandidate(event: BaseEvent<{ tag: TagItem }>): void
		{
			const { tag } = event.getData();
			const textBox = event.getTarget().getTextBox();
			textBox.placeholder = '';

			const tagType = tag.getEntityType();
			if (tagType === InviteValueType.error)
			{
				Dom.addClass(this.tagSelector.getOuterContainer(), '--error');
			}

			this.candidates = [...this.candidates, { value: tag.getTitle(), type: tagType }];
			this.emitValidity();
		},
		unregisterCandidate(event: BaseEvent<{ tag: TagItem }>): void
		{
			const { tag } = event.getData();
			this.candidates = this.candidates.filter((tagItem) => tagItem.value !== tag.getTitle());

			const remainingErrorTags = this.tagSelector.getTags().filter((tagItem) => {
				return tagItem.getEntityType() === InviteValueType.error;
			});

			if (remainingErrorTags.length === 0)
			{
				Dom.removeClass(this.tagSelector.getOuterContainer(), '--error');
			}
			this.emitValidity();
		},
		emitValidity(): void
		{
			this.$emit('validityChange', this.candidates.length > 0 && !this.hasInvalidCandidates);
		},
		splitInputOnDelimiter(event: BaseEvent<{ event: InputEvent }>): void
		{
			const { event: nativeInputEvent } = event.getData();
			const typedCharacter = nativeInputEvent.data;
			if (!INPUT_DELIMITERS.has(typedCharacter))
			{
				return;
			}
			const textBoxValue = this.tagSelector.getTextBoxValue();
			const valueWithoutTrailingDelimiter = textBoxValue.endsWith(typedCharacter)
				? textBoxValue.slice(0, -1)
				: textBoxValue;

			if (valueWithoutTrailingDelimiter.length > 0)
			{
				this.commitInput();
			}
		},
		focusTextBox(): void
		{
			this.tagSelector.getTextBox().focus();
		},
		loc(phraseCode: string): string
		{
			return Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-invitation-input__container">
			<div ref="tag-selector"></div>
			<div v-if="hasInvalidCandidates" class="bx-im-invitation-input__error">
				<BIcon :name="IconsSet.WARNING" class="bx-im-invitation-input__error-icon" />
				<span class="bx-im-invitation-input__error-text">
					{{ loc('INTRANET_INVITATION_INPUT_VALIDATION_MESSAGE') }}
				</span>
			</div>
		</div>
	`,
};
