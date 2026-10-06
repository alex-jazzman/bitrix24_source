import { mapActions, mapState } from 'ui.vue3.pinia';
import { LiveAnnouncer } from 'ui.a11y';
import { Animated, BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.animated';
import {
	DropdownMenuOption,
	PersonIcon,
	diagramStore as useDiagramStore,
	usePublishMenuStore,
	TEMPLATE_PUBLISH_STATUSES,
} from '../../../../entities/blocks';

import './publish-user-dropdown-option.css';

const PROGRESS_ICON_SIZE = 32;

type PublishUserDropdownOptionData = {
	runningPublications: number,
};

/**
 * The item of the publish menu that starts a publication to a chosen audience. It is an action and not
 * a switch of the main button: the choice of the audience opens right away, and the mode of publication
 * changes only after the server has accepted the pilot.
 */
// @vue/components
export const PublishUserDropdownOption = {
	name: 'PublishUserDropdownOption',
	components:
	{
		BIcon,
		DropdownMenuOption,
		PersonIcon,
	},
	inject:
	{
		// Outside the publish menu there is nothing to close and no publication to start.
		dropdownMenu: { default: null },
		publishToPilotAudience: { default: null },
	},
	setup(): Object
	{
		return { Animated, PROGRESS_ICON_SIZE };
	},
	data(): PublishUserDropdownOptionData
	{
		return {
			runningPublications: 0,
		};
	},
	computed:
	{
		...mapState(useDiagramStore, ['templatePublishStatus']),
		isActive(): boolean
		{
			return this.templatePublishStatus === TEMPLATE_PUBLISH_STATUSES.USER;
		},
		/**
		 * The mark of the menu belongs to the mode of publication in force, and the choice of the audience
		 * with its confirmations runs long before the server changes that mode. So the item answers the
		 * click with the progress of its own operation: a mark of its own would light two items at once.
		 */
		isPublishing(): boolean
		{
			return this.runningPublications > 0;
		},
	},
	methods:
	{
		...mapActions(usePublishMenuStore, {
			holdPublishMenu: 'hold',
			releasePublishMenu: 'release',
		}),
		/**
		 * The choice of the audience, the confirmations and the answer of the server come over the editor,
		 * and the menu the item was chosen in stays open behind them: it tells the publisher where the
		 * publication came from. The menu goes away when the publication is over, whatever its outcome.
		 */
		async handleClick(): Promise<void>
		{
			// The scenario answers whether it began. A start it refused - another publication is already
			// running, or the template has nowhere to keep a pilot - leaves the item as it was: there is
			// no wait to show, nothing to tell the screen reader about and no menu to close.
			const publication = this.publishToPilotAudience?.();
			if (!publication)
			{
				return;
			}

			const isFirstRun = !this.isPublishing;

			this.runningPublications += 1;
			this.holdPublishMenu();

			if (isFirstRun)
			{
				this.announceProgress(true);
			}

			try
			{
				await publication;
			}
			finally
			{
				this.releasePublishMenu();
				this.runningPublications -= 1;

				if (!this.isPublishing)
				{
					this.announceProgress(false);
				}

				// Closing takes away the button the keyboard stands on, and the menu gives the focus back
				// to the caret it was opened from: the item keeps no way of its own to move the focus.
				this.dropdownMenu?.close();
			}
		},
		/**
		 * The indicator on the item is the only sign the scenario runs, and it is hidden from the screen
		 * reader: the beginning and the end of the wait are told through a live region instead.
		 */
		announceProgress(isRunning: boolean): void
		{
			LiveAnnouncer.announce(this.$Bitrix.Loc.getMessage(
				isRunning
					? 'BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_STARTED_ANNOUNCE'
					: 'BIZPROCDESIGNER_EDITOR_PILOT_PUBLISH_ENDED_ANNOUNCE',
			));
		},
	},
	template: `
		<DropdownMenuOption
			data-testid="bizprocdesigner-editor-publish-user-option"
			:title="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_PERSONAL_TITLE')"
			:description="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_PERSONAL_DESCR')"
			:isActive="isActive"
			:busy="isPublishing"
			@click="handleClick"
		>
			<template #icon>
				<span
					v-if="isPublishing"
					class="editor-chart-publish-user-dropdown-option__progress"
					data-testid="bizprocdesigner-editor-publish-user-option-progress"
				>
					<BIcon :name="Animated.LOADER_WAIT" :size="PROGRESS_ICON_SIZE" aria-hidden="true"/>
				</span>
				<PersonIcon v-else :active="isActive"/>
			</template>
		</DropdownMenuOption>
	`,
};
