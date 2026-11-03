import { Type } from 'main.core';
import { BIcon } from 'ui.icon-set.api.vue';
import { Text2Xs, TextMd } from 'ui.system.typography.vue';
import { Switcher } from 'ui.vue3.components.switcher';

import 'ui.design-tokens.air';
import 'ui.icon-set.solid';

import { FolderManager } from 'im.v2.lib.folder';
import { type ImModelFolder } from 'im.v2.model';

import './css/source-item.css';

// `showStateTitle: false` keeps ui.switcher from printing both state captions at once: the air design
// hides them with `font-size: 0`, which leaves them in the accessibility tree and makes every source
// read as "on off". The state the row is really in comes from `aria-checked` below.
const SWITCHER_OPTIONS = { size: 'small', useAirDesign: true, showStateTitle: false };

// @vue/component
export const SourceItem = {
	name: 'SourceItem',
	components: { BIcon, Switcher, Text2Xs, TextMd },
	props: {
		item: {
			type: Object,
			required: true,
		},
	},
	emits: ['toggle'],
	setup(): Object
	{
		return { SWITCHER_OPTIONS };
	},
	computed: {
		folder(): ImModelFolder
		{
			return this.$store.getters['recent/folders/getById'](this.item.folderId);
		},
		icon(): string
		{
			return FolderManager.getFolderIcon(this.item.code);
		},
		// Every source is explained by its own folder, a locked one included.
		description(): string
		{
			return Type.isStringFilled(this.folder.description) ? this.folder.description : '';
		},
		// A source that cannot be switched says so under its own description: a tooltip would be out
		// of reach of the keyboard and of touch, and the reason why the switch is dead has to be
		// readable straight from the row.
		lockedNote(): string
		{
			return this.item.togglable ? '' : this.loc('IM_FOLDER_ALL_SETTINGS_SOURCE_LOCKED_NOTE');
		},
		containerClasses(): Object
		{
			return { '--locked': !this.item.togglable };
		},
		testId(): string
		{
			return `all-folder-settings-source-${this.item.code}`;
		},
		// Deliberately not suffixes of `testId`: a label built on top of the row one would make the row
		// prefix match the nodes inside it too, and every count of the rows would come out doubled.
		switcherTestId(): string
		{
			return `all-folder-settings-switcher-${this.item.code}`;
		},
		titleTestId(): string
		{
			return `all-folder-settings-title-${this.item.code}`;
		},
		subtitleTestId(): string
		{
			return `all-folder-settings-subtitle-${this.item.code}`;
		},
		noteTestId(): string
		{
			return `all-folder-settings-note-${this.item.code}`;
		},
	},
	methods: {
		// The whole row switches the source. The switcher reports the change on its own, and its click
		// is kept from reaching the row in the template - caught here as well, it would switch the
		// source twice and land it back where it started.
		onRowClick(): void
		{
			this.onToggle(!this.item.enabled);
		},
		// The single gate of both ways to switch the source: a locked one stays as the server sent it.
		onToggle(enabled: boolean): void
		{
			if (!this.item.togglable)
			{
				return;
			}

			this.$emit('toggle', this.item.folderId, enabled);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	// The row itself is the switch: a native button carries the role, the state and the lock, gets the
	// keyboard and the focus for free, and takes its accessible name from the captions inside it. The
	// switcher stays as the visual of the state alone and is hidden from screen readers, so the pair is
	// announced as one control.
	template: `
		<button
			type="button"
			role="switch"
			class="bx-im-content-folder-source-item"
			:class="containerClasses"
			:aria-checked="item.enabled ? 'true' : 'false'"
			:disabled="!item.togglable"
			:data-testid="testId"
			@click="onRowClick"
		>
			<BIcon :name="icon" class="bx-im-content-folder-source-item__icon" />
			<div class="bx-im-content-folder-source-item__text">
				<TextMd
					tag="div"
					wrap="truncate"
					:title="folder.title"
					className="bx-im-content-folder-source-item__title"
					:data-testid="titleTestId"
				>
					{{ folder.title }}
				</TextMd>
				<Text2Xs
					v-if="description"
					tag="div"
					wrap="truncate"
					:title="description"
					className="bx-im-content-folder-source-item__subtitle"
					:data-testid="subtitleTestId"
				>
					{{ description }}
				</Text2Xs>
				<Text2Xs
					v-if="lockedNote"
					tag="div"
					wrap="break-words"
					className="bx-im-content-folder-source-item__note"
					:data-testid="noteTestId"
				>
					{{ lockedNote }}
				</Text2Xs>
			</div>
			<Switcher
				class="bx-im-content-folder-source-item__switcher"
				aria-hidden="true"
				:data-testid="switcherTestId"
				:isChecked="item.enabled"
				:isDisabled="!item.togglable"
				:options="SWITCHER_OPTIONS"
				@click.stop
				@check="onToggle(true)"
				@uncheck="onToggle(false)"
			/>
		</button>
	`,
};
