import { Event, Text, Type } from 'main.core';
import { PopupManager } from 'main.popup';
import { FocusNavigator } from 'ui.a11y';
import { defineComponent, nextTick } from 'ui.vue3';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Hint } from 'ui.vue3.components.hint';
import { RichLoc } from 'ui.vue3.components.rich-loc';
import { Switcher } from 'ui.vue3.components.switcher';
import { HeadlineXl, TextMd, TextSm } from 'ui.system.typography.vue';

import { getMainToolImageUrl, getMainToolPresentation } from '../../model/picker/presentation';
import type { MainToolPresentation } from '../../model/picker/presentation';
import type { MainToolOpeningReason, MainToolPickerState, MainToolPreset } from '../../model/picker/types';
import { ToolTile } from '../tool-tile/tool-tile';

import './main-tool-picker.css';

export const MainToolPicker = defineComponent({
	name: 'IntranetMainToolPicker',
	components: { HeadlineXl, TextMd, TextSm, UiButton, Switcher, Hint, RichLoc, ToolTile },
	props: {
		state: {
			/** @type MainToolPickerState */
			type: Object,
			required: true,
		},
		openingReason: {
			/** @type MainToolOpeningReason */
			type: String,
			required: true,
		},
		busy: { type: Boolean, required: true },
	},
	emits: ['confirm', 'ready', 'closeRequested'],
	setup()
	{
		return {
			AirButtonStyle,
			ButtonSize,
			groupName: `intranet-main-tool-picker-${Text.getRandom(8)}`,
			baseImage: getMainToolImageUrl('background-base.svg'),
			preparation: {
				active: true,
				failed: false,
				mounted: false,
				readyEmitted: false,
				generation: 0,
				images: new Map(),
				cancelImages: new Set(),
			},
			hintInteraction: { focused: false, hovered: false, popupHovered: false, hideTimeout: 0 },
			switcherOptions: { useAirDesign: true, size: 'medium', showStateTitle: false },
		};
	},
	data()
	{
		let selectedPresetId: string | null = null;
		if (this.state.forced)
		{
			selectedPresetId = this.state.forcedPresetId;
		}
		else if (this.state.hasPersonalChoice)
		{
			selectedPresetId = this.state.currentPresetId;
		}

		return {
			selectedPresetId,
			applyForAll: this.state.canManageAll && this.state.forced,
			isPrepared: false,
			preparedImageUrls: [],
			confirmationPending: false,
		};
	},
	computed: {
		visiblePresets(): MainToolPreset[]
		{
			return this.state.availablePresets.filter((preset) => !this.applyForAll || preset.canApplyForAll);
		},
		presentation(): MainToolPresentation
		{
			return getMainToolPresentation(this.selectedPresetId);
		},
		requiredImageUrls(): string[]
		{
			return [
				this.baseImage,
				this.presentation.background,
				this.presentation.hero,
				getMainToolImageUrl('check.svg'),
				getMainToolImageUrl('close.svg'),
				...this.visiblePresets.map((preset) => getMainToolPresentation(preset.id).tile),
			].filter((url) => Type.isStringFilled(url));
		},
		isPresentationReady(): boolean
		{
			return this.isPrepared && this.requiredImageUrls.every((url) => this.preparedImageUrls.includes(url));
		},
		hintPopupOptions()
		{
			return {
				id: `${this.groupName}-hint`,
				className: 'intranet-main-tool-picker-hint-popup',
				role: 'tooltip',
				closeByEsc: true,
				focusTrap: false,
				animation: false,
				maxWidth: 280,
				targetContainer: document.body,
				events: {
					onShow: this.handleHintShow,
					onDestroy: this.handleHintDestroy,
				},
			};
		},
		controlsDisabled(): boolean
		{
			return this.busy
				|| this.confirmationPending
				|| !this.isPrepared
				|| !(this.state.canChangePersonal || this.state.canManageAll)
			;
		},
		canConfirm(): boolean
		{
			return !this.controlsDisabled
				&& this.isPresentationReady
				&& this.visiblePresets.some((preset) => preset.id === this.selectedPresetId)
			;
		},
		showFooter(): boolean
		{
			return Boolean(this.selectedPresetId) || this.applyForAll;
		},
	},
	watch: {
		visiblePresets: {
			immediate: true,
			async handler(): Promise<void>
			{
				const activeElement = FocusNavigator.getActiveElement();
				const hadFocus = this.$el?.contains(activeElement);
				this.validateVisiblePresets();
				await nextTick();
				if (
					this.preparation.active
					&& this.isPrepared
					&& hadFocus
					&& !activeElement.isConnected
					&& FocusNavigator.isFocusLost()
				)
				{
					FocusNavigator.focusBySelector(this.$el, 'input[type="radio"]:not(:disabled)', { preventScroll: false });
				}
			},
		},
		busy(busy: boolean): void
		{
			if (!busy)
			{
				this.confirmationPending = false;
			}
			else
			{
				this.closeHint();
			}
		},
		requiredImageUrls(): Promise<void> | undefined
		{
			if (this.preparation.mounted)
			{
				return this.prepareImages();
			}

			return undefined;
		},
	},
	async mounted(): Promise<void>
	{
		this.preparation.mounted = true;
		await this.prepareImages();
	},
	beforeUnmount(): void
	{
		this.preparation.active = false;
		this.preparation.cancelImages.forEach((cancel) => cancel());
		this.preparation.images.clear();
		clearTimeout(this.hintInteraction.hideTimeout);
		PopupManager.getPopupById(`${this.groupName}-hint`)?.destroy();
		this.isPrepared = false;
	},
	errorCaptured(): void
	{
		this.preparation.failed = true;
		this.isPrepared = false;
	},
	methods: {
		async prepareImages(): Promise<void>
		{
			if (!this.preparation.active || this.preparation.failed)
			{
				return;
			}

			const generation = ++this.preparation.generation;
			const imageUrls = this.requiredImageUrls;
			try
			{
				const loaded = await Promise.all(imageUrls.map((url) => this.loadImage(url)));
				if (
					!this.preparation.active
					|| this.preparation.failed
					|| generation !== this.preparation.generation
					|| loaded.includes(false)
				)
				{
					return;
				}

				this.isPrepared = true;
				this.preparedImageUrls = imageUrls;
				await nextTick();
				if (
					this.preparation.active
					&& !this.preparation.failed
					&& generation === this.preparation.generation
					&& !this.preparation.readyEmitted
				)
				{
					this.preparation.readyEmitted = true;
					this.$emit('ready');
				}
			}
			catch (error)
			{
				if (this.preparation.active && !this.preparation.failed && generation === this.preparation.generation)
				{
					this.preparation.failed = true;
					this.isPrepared = false;
					throw error;
				}
			}
		},
		loadImage(url: string): Promise<boolean>
		{
			if (this.preparation.images.has(url))
			{
				return this.preparation.images.get(url);
			}

			const promise = new Promise((resolve, reject) => {
				const image = new Image();
				let settled = false;
				let timeout = 0;
				const finish = (error: Error | null = null, loaded: boolean = true) => {
					if (settled)
					{
						return;
					}

					settled = true;
					image.onload = null;
					image.onerror = null;
					clearTimeout(timeout);
					this.preparation.cancelImages.delete(cancel);
					if (error)
					{
						reject(error);
					}
					else
					{
						resolve(loaded);
					}
				};
				const cancel = () => finish(null, false);
				const fail = () => finish(new Error('Main tool image could not be loaded.'));
				this.preparation.cancelImages.add(cancel);
				image.onload = () => {
					if (Type.isFunction(image.decode))
					{
						image.decode().then(() => finish()).catch(fail);
					}
					else
					{
						finish();
					}
				};
				image.onerror = fail;
				timeout = setTimeout(fail, 30000);
				image.src = url;
				if (image.complete && image.naturalWidth > 0)
				{
					image.onload();
				}
			});
			this.preparation.images.set(url, promise);

			return promise;
		},
		handleImageError(event): void
		{
			if (
				this.preparation.active
				&& !this.preparation.failed
				&& this.requiredImageUrls.includes(event.target.getAttribute('src'))
			)
			{
				this.preparation.failed = true;
				this.isPrepared = false;
				throw new Error('Main tool image could not be loaded.');
			}
		},
		validateVisiblePresets(): void
		{
			if (!this.preparation.active || this.preparation.failed)
			{
				return;
			}

			if (this.visiblePresets.length === 0)
			{
				this.preparation.failed = true;
				this.isPrepared = false;
				throw Object.assign(new Error(), { code: 'MAIN_TOOL_UNAVAILABLE' });
			}

			if (!this.visiblePresets.some((preset) => preset.id === this.selectedPresetId))
			{
				this.selectedPresetId = null;
			}
		},
		handleSelectPreset(presetId: string): void
		{
			if (!this.controlsDisabled && this.visiblePresets.some((preset) => preset.id === presetId))
			{
				this.selectedPresetId = presetId;
			}
		},
		handleApplyForAll(applyForAll: boolean): void
		{
			if (this.controlsDisabled || !this.state.canManageAll)
			{
				return;
			}

			this.applyForAll = applyForAll;
			this.validateVisiblePresets();
		},
		handleConfirm(): void
		{
			const presetId = this.selectedPresetId;
			if (!presetId || !this.canConfirm)
			{
				return;
			}

			this.confirmationPending = true;
			this.$emit('confirm', { presetId, applyForAll: this.applyForAll });
		},
		showHint(event: FocusEvent | KeyboardEvent): void
		{
			if (!this.controlsDisabled)
			{
				this.hintInteraction.focused = true;
				event.currentTarget.dispatchEvent(new MouseEvent('mouseenter'));
			}
		},
		hideHint(event: FocusEvent): void
		{
			this.hintInteraction.focused = false;
			event.currentTarget.dispatchEvent(new MouseEvent('mouseleave'));
		},
		handleHintPointerEnter(): void
		{
			this.hintInteraction.hovered = true;
			clearTimeout(this.hintInteraction.hideTimeout);
		},
		handleHintPointerLeave(): void
		{
			this.hintInteraction.hovered = false;
		},
		handleHintMouseEnter(event: MouseEvent): void
		{
			if (this.controlsDisabled || PopupManager.getPopupById(`${this.groupName}-hint`)?.isShown())
			{
				event.stopImmediatePropagation();
			}
		},
		handleHintMouseLeave(event: MouseEvent): void
		{
			if (
				!this.controlsDisabled
				&& (this.hintInteraction.focused || PopupManager.getPopupById(`${this.groupName}-hint`)?.isShown())
			)
			{
				event.stopImmediatePropagation();
				this.scheduleHintClose();
			}
		},
		handleHintShow(event): void
		{
			const popup = event.getTarget();
			popup.getPopupContainer().dataset.testid = 'intranet-main-tool-picker-hint-popup';
			Event.bind(popup.getPopupContainer(), 'pointerenter', this.handleHintPopupEnter);
			Event.bind(popup.getPopupContainer(), 'pointerleave', this.handleHintPopupLeave);
		},
		handleHintDestroy(event): void
		{
			Event.unbind(event.getTarget().getPopupContainer(), 'pointerenter', this.handleHintPopupEnter);
			Event.unbind(event.getTarget().getPopupContainer(), 'pointerleave', this.handleHintPopupLeave);
			if (this.preparation.active)
			{
				this.hintInteraction.popupHovered = false;
			}
		},
		handleHintPopupEnter(): void
		{
			this.hintInteraction.popupHovered = true;
			clearTimeout(this.hintInteraction.hideTimeout);
		},
		handleHintPopupLeave(): void
		{
			this.hintInteraction.popupHovered = false;
			this.scheduleHintClose();
		},
		scheduleHintClose(): void
		{
			clearTimeout(this.hintInteraction.hideTimeout);
			this.hintInteraction.hideTimeout = setTimeout(() => {
				if (
					this.preparation.active
					&& !this.hintInteraction.focused
					&& !this.hintInteraction.hovered
					&& !this.hintInteraction.popupHovered
				)
				{
					this.closeHint();
				}
			}, 100);
		},
		closeHint(): void
		{
			if (this.controlsDisabled)
			{
				this.$refs.hint?.$el.dispatchEvent(new MouseEvent('mouseleave'));
			}

			clearTimeout(this.hintInteraction.hideTimeout);
			PopupManager.getPopupById(`${this.groupName}-hint`)?.close();
		},
	},
	template: `
		<div
			class="intranet-main-tool-picker --ui-context-content-light"
			:class="'--' + presentation.id"
			data-testid="intranet-main-tool-picker"
			:data-state="presentation.id"
			:data-ready="isPresentationReady"
			:aria-busy="busy || confirmationPending || !isPresentationReady"
		>
			<img
				class="intranet-main-tool-picker__background"
				:src="baseImage"
				width="700"
				height="500"
				alt=""
				draggable="false"
				@error="handleImageError"
			/>
			<img
				:key="presentation.background"
				class="intranet-main-tool-picker__background"
				:src="presentation.background"
				width="700"
				height="500"
				alt=""
				draggable="false"
				@error="handleImageError"
			/>
			<div class="intranet-main-tool-picker__body" tabindex="-1">
				<div class="intranet-main-tool-picker__scene">
					<div class="intranet-main-tool-picker__hero">
						<img
							:key="presentation.hero"
							class="intranet-main-tool-picker__hero_image"
							:src="presentation.hero"
							width="340"
							height="310"
							alt=""
							draggable="false"
							@error="handleImageError"
						/>
					</div>
					<div class="intranet-main-tool-picker__introduction">
						<HeadlineXl
							tag="h2"
							:id="groupName + '-title'"
							class="intranet-main-tool-picker__title"
							data-testid="intranet-main-tool-picker-title"
						>
							<RichLoc :text="loc(presentation.title)" placeholder="[line]" tag="span">
								<template #line="{ text }">
									<HeadlineXl tag="span" class="intranet-main-tool-picker__title_line">
										<RichLoc :text="text" placeholder="[accent]" tag="span">
											<template #accent="{ text: accentText }">
												<HeadlineXl tag="span" class="intranet-main-tool-picker__title_accent" accent>
													{{ accentText }}
												</HeadlineXl>
											</template>
										</RichLoc>
									</HeadlineXl>
								</template>
							</RichLoc>
						</HeadlineXl>
						<TextMd
							tag="p"
							:id="groupName + '-description'"
							class="intranet-main-tool-picker__description"
							data-testid="intranet-main-tool-picker-description"
						>
							{{ loc(presentation.description) }}
						</TextMd>
					</div>
				</div>
				<div
					class="intranet-main-tool-picker__presets"
					role="radiogroup"
					data-testid="intranet-main-tool-picker-presets"
					:aria-label="loc('INTRANET_MAIN_TOOL_PICKER_TOOL_LABEL')"
				>
					<ToolTile
						v-for="preset in visiblePresets"
						:key="preset.id"
						:presetId="preset.id"
						:group="groupName"
						:selected="selectedPresetId === preset.id"
						:muted="Boolean(selectedPresetId) && selectedPresetId !== preset.id"
						:disabled="controlsDisabled"
						@select="handleSelectPreset"
						@imageError="handleImageError"
					/>
				</div>
			</div>
			<div class="intranet-main-tool-picker__footer">
				<template v-if="showFooter">
					<UiButton
						class="intranet-main-tool-picker__confirm"
						:text="loc('INTRANET_MAIN_TOOL_PICKER_CONFIRM')"
						:style="AirButtonStyle.FILLED"
						:size="ButtonSize.EXTRA_LARGE"
						:loading="busy"
						:disabled="!canConfirm"
						:dataset="{ testid: 'intranet-main-tool-picker-confirm' }"
						@click="handleConfirm"
					/>
					<div v-if="state.canManageAll" class="intranet-main-tool-picker__scope">
						<Switcher
							class="intranet-main-tool-picker__switcher"
							:isChecked="applyForAll"
							:isDisabled="controlsDisabled"
							:options="switcherOptions"
							role="switch"
							:tabindex="controlsDisabled ? -1 : 0"
							:aria-checked="applyForAll"
							:aria-disabled="controlsDisabled"
							:aria-labelledby="groupName + '-scope-label'"
							:aria-describedby="groupName + '-scope-description'"
							data-testid="intranet-main-tool-picker-for-all"
							@check="handleApplyForAll(true)"
							@uncheck="handleApplyForAll(false)"
							@keydown.space.prevent="handleApplyForAll(!applyForAll)"
							@keydown.enter.prevent="handleApplyForAll(!applyForAll)"
						/>
						<div class="intranet-main-tool-picker__scope_text">
							<TextSm :id="groupName + '-scope-label'" class="intranet-main-tool-picker__scope_label">
								{{ loc('INTRANET_MAIN_TOOL_PICKER_APPLY_FOR_ALL') }}
							</TextSm>
							<Hint
								ref="hint"
								class="intranet-main-tool-picker__hint"
								:text="loc('INTRANET_MAIN_TOOL_PICKER_APPLY_FOR_ALL_HINT')"
								:popupOptions="hintPopupOptions"
								:outline="true"
								role="button"
								:tabindex="controlsDisabled ? -1 : 0"
								:aria-label="loc('INTRANET_MAIN_TOOL_PICKER_APPLY_FOR_ALL_HINT_ARIA')"
								:aria-describedby="groupName + '-scope-description'"
								:aria-disabled="controlsDisabled"
								data-testid="intranet-main-tool-picker-hint"
								@focus="showHint"
								@blur="hideHint"
								@pointerenter="handleHintPointerEnter"
								@pointerleave="handleHintPointerLeave"
								@mouseenter="handleHintMouseEnter"
								@mouseleave="handleHintMouseLeave"
								@keydown.enter.prevent="showHint"
								@keydown.space.prevent="showHint"
							/>
						</div>
						<TextSm :id="groupName + '-scope-description'" class="intranet-main-tool-picker__hidden">
							{{ loc('INTRANET_MAIN_TOOL_PICKER_APPLY_FOR_ALL_HINT') }}
						</TextSm>
					</div>
				</template>
			</div>
		</div>
	`,
});
