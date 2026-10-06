import { Loc } from 'main.core';
import { Popup } from 'main.popup';
import type { BaseEvent } from 'main.core.events';

import { LiveAnnouncer } from 'ui.a11y';
import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import type { BitrixVueComponentProps } from 'ui.vue3';

import '../css/insert-into-text-button.css';

// @vue/component
export const InsertIntoTextButton: BitrixVueComponentProps = {
	name: 'InsertIntoTextButton',
	components: {
		BIcon,
	},
	inject: {
		emitter: {},
		// the tile owns the hidden status and tells whether it was rendered at all
		tileInsertedStatus: {
			default: null,
		},
	},
	props: {
		item: {
			type: Object,
			default: () => {},
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	computed: {
		isInserted(): boolean
		{
			return this.item.customData?.tileSelected === true;
		},
		buttonLabel(): string
		{
			return Loc.getMessage('TILE_UPLOADER_INSERT_INTO_THE_TEXT');
		},
		insertedStatusId(): ?string
		{
			return this.tileInsertedStatus?.getId() ?? null;
		},
	},
	methods: {
		handleClick(): void
		{
			this.emitter.emit('onInsertIntoText', { item: this.item });

			LiveAnnouncer.announce(Loc.getMessage('TILE_UPLOADER_FILE_INSERTED_STATUS'));
		},
		handleMouseEnter(event: MouseEvent): void
		{
			if (this.hintPopup)
			{
				return;
			}

			const targetNode: HTMLElement = event.currentTarget;
			const targetNodeWidth: number = targetNode.offsetWidth;

			this.hintPopup = new Popup({
				content: this.buttonLabel,
				cacheable: false,
				closeByEsc: true,
				animation: 'fading-slide',
				bindElement: targetNode,
				targetContainer: document.body,
				offsetTop: 0,
				bindOptions: {
					position: 'top',
					forceBindPosition: true,
				},
				darkMode: true,
				events: {
					onClose: (): void => {
						this.hintPopup.destroy();
						this.hintPopup = null;
					},
					onShow: (baseEvent: BaseEvent): void => {
						const popup = baseEvent.getTarget();
						const popupWidth = popup.getPopupContainer().offsetWidth;
						const offsetLeft: number = (targetNodeWidth / 2) - (popupWidth / 2);
						const angleShift: number = Popup.getOption('angleLeftOffset') - Popup.getOption('angleMinTop');

						popup.setAngle({ offset: popupWidth / 2 - angleShift });
						popup.setOffset({ offsetLeft: offsetLeft + Popup.getOption('angleLeftOffset') });
					},
				},
			});

			this.hintPopup.show();
		},
		handleMouseLeave(): void
		{
			if (this.hintPopup)
			{
				this.hintPopup.close();
				this.hintPopup = null;
			}
		},
	},
	template: `
		<button
			type="button"
			class="ui-tile-uploader-insert-into-text-button"
			data-testid="ui-tile-uploader-item-insert-btn"
			:class="{ '--inserted': isInserted }"
			:aria-label="buttonLabel"
			:aria-describedby="insertedStatusId"
			@click="handleClick"
			@mouseenter="handleMouseEnter"
			@mouseleave="handleMouseLeave"
		>
			<BIcon :name="Outline.PROMPT_VAR" aria-hidden="true"/>
		</button>
	`,
};
