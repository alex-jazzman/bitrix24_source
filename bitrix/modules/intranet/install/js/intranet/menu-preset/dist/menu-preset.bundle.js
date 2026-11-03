/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, ui_vue3, main_core_events, ui_vue3_mixins_locMixin, main_popup, ui_a11y, ui_vue3_components_button, ui_vue3_components_hint, ui_vue3_components_richLoc, ui_vue3_components_switcher, ui_system_typography_vue, ui_system_radiobutton) {
	'use strict';

	// @vue/component
	const Preset = {
		props: {
			presetData: {
				type: Object,
				default: () => ({})
			},
			currentPresetId: {
				type: String,
				default: 'social'
			}
		},
		data() {
			return {
				PRESET_ID: {
					CRM: 'crm',
					TASKS: 'tasks',
					SOCIAL: 'social',
					SITES: 'sites',
					SYNC: 'sync'
				},
				activePresetId: this.currentPresetId
			};
		},
		computed: {
			isCurrentPresetCrm() {
				return this.activePresetId === this.PRESET_ID.CRM;
			},
			isCurrentPresetTasks() {
				return this.activePresetId === this.PRESET_ID.TASKS;
			},
			isCurrentPresetSocial() {
				return this.activePresetId === this.PRESET_ID.SOCIAL;
			},
			isCurrentPresetLanding() {
				return this.activePresetId === this.PRESET_ID.SITES;
			},
			isCurrentPresetSync() {
				return this.activePresetId === this.PRESET_ID.SYNC;
			}
		},
		methods: {
			setCurrentPreset(presetId) {
				this.activePresetId = presetId;
			}
		},
		template: `
		<form method="POST" name="left-menu-preset-form">
			<div class="left-menu-popup-header">
				<span class="left-menu-popup-header-item" id="preset-popup-title">
					{{ $Bitrix.Loc.getMessage('MENU_PRESET_TITLE') }}
				</span>
			</div><!--left-menu-popup-header-->
			<div class="left-menu-popup-description">
				<span class="left-menu-popup-description-item">
					{{ $Bitrix.Loc.getMessage('MENU_PRESET_DESC') }}
				</span>
			</div><!--left-menu-popup-description-->
			<div class="left-menu-popup-card-container" role="radiogroup" aria-labelledby="preset-popup-title">
				<template v-if="presetData.CRM_PRESET_AVAILABLE">
					<label 
						class="left-menu-popup-card-item js-left-menu-preset-item"
						:class="{'left-menu-popup-selected': isCurrentPresetCrm}"
						for="presetTypeCrm"
						@click="setCurrentPreset(PRESET_ID.CRM)"
					>
						<div class="left-menu-popup-card-item-title">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_CRM_TITLE') }}
						</div>
						<div class="left-menu-popup-card-item-icon-box left-menu-popup-icon-crm" aria-hidden="true">
							<div class="left-menu-popup-card-item-icon"></div>
						</div>
						<div class="left-menu-popup-card-item-info" id="presetCrmDesc">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_CRM_DESC11') }}
						</div>
						<div class="left-menu-popup-card-item-description">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_CRM_DESC2') }}
						</div>
						<input 
							type="radio" 
							name="presetType"
							:value="PRESET_ID.CRM"
							id="presetTypeCrm" 
							class="menu-visually-hidden"
							aria-describedby="presetCrmDesc"
							:checked="isCurrentPresetCrm"
						>
					</label>
				</template>

				<template v-if="presetData.TASKS_PRESET_AVAILABLE">
					<label 
						class="left-menu-popup-card-item js-left-menu-preset-item"
						:class="{'left-menu-popup-selected': isCurrentPresetTasks}"
						for="presetTypeTasks"
						@click="setCurrentPreset(PRESET_ID.TASKS)"
					>
						<div class="left-menu-popup-card-item-title">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_TASKS_TITLE1') }}
						</div>
						<div class="left-menu-popup-card-item-icon-box left-menu-popup-icon-task" aria-hidden="true">
							<div class="left-menu-popup-card-item-icon"></div>
						</div>
						<div class="left-menu-popup-card-item-info" id="presetTasksDesc">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_TASKS_DESC11') }}
						</div>
						<div class="left-menu-popup-card-item-description">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_TASKS_DESC2') }}
						</div>
						<input 
							type="radio" 
							name="presetType"
							:value="PRESET_ID.TASKS"
							id="presetTypeTasks"
							class="menu-visually-hidden"
							aria-describedby="presetTasksDesc"
							:checked="isCurrentPresetTasks"
						>
					</label>
				</template>

				<label 
					class="left-menu-popup-card-item js-left-menu-preset-item"
					:class="{'left-menu-popup-selected': isCurrentPresetSocial}"
					for="presetTypeSocial"
					@click="setCurrentPreset(PRESET_ID.SOCIAL)"
				>
					<div class="left-menu-popup-card-item-title">
						{{ $Bitrix.Loc.getMessage('MENU_PRESET_SOCIAL_TITLE1_1') }}
					</div>
					<div class="left-menu-popup-card-item-icon-box left-menu-popup-icon-communication"
						 aria-hidden="true">
						<div class="left-menu-popup-card-item-icon"></div>
					</div>
					<div class="left-menu-popup-card-item-info" id="presetSocialDesc">
						{{ $Bitrix.Loc.getMessage('MENU_PRESET_SOCIAL_DESC11') }}
					</div>
					<div class="left-menu-popup-card-item-description">
						{{ $Bitrix.Loc.getMessage('MENU_PRESET_SOCIAL_DESC2') }}
					</div>
					<input 
						type="radio" 
						name="presetType"
						:value="PRESET_ID.SOCIAL"
						id="presetTypeSocial"
						class="menu-visually-hidden"
						aria-describedby="presetSocialDesc"
						:checked="isCurrentPresetSocial"
					>
				</label>

				<template v-if="presetData.SITES_PRESET_AVAILABLE">
					<label 
						class="left-menu-popup-card-item js-left-menu-preset-item"
						:class="{'left-menu-popup-selected': isCurrentPresetLanding}"
						for="presetTypeSites"
						@click="setCurrentPreset(PRESET_ID.SITES)"
					>
						<div class="left-menu-popup-card-item-title">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_SITES_TITLE') }}
						</div>
						<div class="left-menu-popup-card-item-icon-box left-menu-popup-icon-website" aria-hidden="true">
							<div class="left-menu-popup-card-item-icon"></div>
						</div>
						<div class="left-menu-popup-card-item-info" id="presetSitesDesc">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_SITES_DESC1') }}
						</div>
						<div class="left-menu-popup-card-item-description">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_SITES_DESC2') }}
						</div>
						<input 
							type="radio" 
							name="presetType"
							:value="PRESET_ID.SITES"
							id="presetTypeSites"
							class="menu-visually-hidden"
							aria-describedby="presetSitesDesc"
							:checked="isCurrentPresetLanding"
						>	   
					</label>
				</template>

				<template v-if="presetData.SYNC_PRESET_AVAILABLE">
					<label
						class="left-menu-popup-card-item js-left-menu-preset-item"
						:class="{'left-menu-popup-selected': isCurrentPresetSync}"
						for="presetTypeSync"
						@click="setCurrentPreset(PRESET_ID.SYNC)"
					>
						<div class="left-menu-popup-card-item-title">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_SYNC_TITLE') }}
						</div>
						<div class="left-menu-popup-card-item-icon-box left-menu-popup-icon-sync" aria-hidden="true">
							<div class="left-menu-popup-card-item-icon"></div>
						</div>
						<div class="left-menu-popup-card-item-info" id="presetSyncDesc">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_SYNC_DESC1') }}
						</div>
						<div class="left-menu-popup-card-item-description">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_SYNC_DESC2') }}
						</div>
						<input
							type="radio"
							name="presetType"
							:value="PRESET_ID.SYNC"
							id="presetTypeSync"
							class="menu-visually-hidden"
							aria-describedby="presetSyncDesc"
							:checked="isCurrentPresetSync"
						>
					</label>
				</template>
			</div><!--left-menu-popup-card-container-->
		</form>
		<div class="left-menu-popup-border"></div>
	`
	};

	const presentation = {
		crm: {
			label: 'INTRANET_MAIN_TOOL_PICKER_CRM_LABEL',
			title: 'INTRANET_MAIN_TOOL_PICKER_CRM_TITLE',
			description: 'INTRANET_MAIN_TOOL_PICKER_CRM_DESCRIPTION'
		},
		tasks: {
			label: 'INTRANET_MAIN_TOOL_PICKER_TASKS_LABEL',
			title: 'INTRANET_MAIN_TOOL_PICKER_TASKS_TITLE',
			description: 'INTRANET_MAIN_TOOL_PICKER_TASKS_DESCRIPTION'
		},
		social: {
			label: 'INTRANET_MAIN_TOOL_PICKER_SOCIAL_LABEL',
			title: 'INTRANET_MAIN_TOOL_PICKER_SOCIAL_TITLE',
			description: 'INTRANET_MAIN_TOOL_PICKER_SOCIAL_DESCRIPTION'
		},
		sites: {
			label: 'INTRANET_MAIN_TOOL_PICKER_SITES_LABEL',
			title: 'INTRANET_MAIN_TOOL_PICKER_SITES_TITLE',
			description: 'INTRANET_MAIN_TOOL_PICKER_SITES_DESCRIPTION'
		},
		sync: {
			label: 'INTRANET_MAIN_TOOL_PICKER_SYNC_LABEL',
			title: 'INTRANET_MAIN_TOOL_PICKER_SYNC_TITLE',
			description: 'INTRANET_MAIN_TOOL_PICKER_SYNC_DESCRIPTION'
		}
	};
	function getMainToolPresentation(presetId) {
		const id = presetId && Object.hasOwn(presentation, presetId) ? presetId : 'intro';
		const messages = presentation[id] ?? {
			label: 'INTRANET_MAIN_TOOL_PICKER_TOOL_LABEL',
			title: 'INTRANET_MAIN_TOOL_PICKER_INTRO_TITLE',
			description: 'INTRANET_MAIN_TOOL_PICKER_INTRO_DESCRIPTION'
		};
		return {
			...messages,
			id,
			hero: getMainToolImageUrl(`hero-${id}.webp`),
			background: getMainToolImageUrl(`background-${id}.svg`),
			tile: id === 'intro' ? null : getMainToolImageUrl(`tile-${id}.webp`)
		};
	}
	function getMainToolImageUrl(fileName) {
		return `/bitrix/js/intranet/menu-preset/src/images/main-tool-picker/${fileName}`;
	}

	const ToolTile = ui_vue3.defineComponent({
		name: 'IntranetMainToolTile',
		components: {
			RadioButton: ui_system_radiobutton.Vue.RadioButton,
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			presetId: {
				type: String,
				required: true
			},
			group: {
				type: String,
				required: true
			},
			selected: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			muted: {
				type: Boolean,
				default: false
			}
		},
		emits: ['select', 'imageError'],
		setup() {
			return {
				checkImage: getMainToolImageUrl('check.svg')
			};
		},
		computed: {
			inputId() {
				return `${this.group}-${this.presetId}`;
			},
			captionId() {
				return `${this.inputId}-caption`;
			},
			presentation() {
				return getMainToolPresentation(this.presetId);
			}
		},
		methods: {
			handleChecked(checked) {
				if (checked && !this.disabled) {
					this.$emit('select', this.presetId);
				}
			}
		},
		template: `
		<div
			class="intranet-main-tool-tile"
			:class="{ '--selected': selected, '--disabled': disabled, '--muted': muted }"
			:data-testid="'intranet-main-tool-picker-tile-' + presetId"
		>
			<RadioButton
				:id="inputId"
				:group="group"
				:value="presetId"
				:aria-labelledby="captionId"
				:modelValue="selected"
				:disabled="disabled"
				:data-testid="'intranet-main-tool-picker-radio-' + presetId"
				@update:modelValue="handleChecked"
			/>
			<img
				v-if="presentation.tile"
				class="intranet-main-tool-tile__image"
				:src="presentation.tile"
				width="78"
				height="78"
				alt=""
				draggable="false"
				@error="$emit('imageError', $event)"
			/>
			<TextSm :id="captionId" class="intranet-main-tool-tile__caption" accent>
				{{ loc(presentation.label) }}
			</TextSm>
			<div v-show="selected" class="intranet-main-tool-tile__check" aria-hidden="true">
				<img :src="checkImage" width="16" height="16" alt="" draggable="false" @error="$emit('imageError', $event)"/>
			</div>
		</div>
	`
	});

	const MainToolPicker = ui_vue3.defineComponent({
		name: 'IntranetMainToolPicker',
		components: {
			HeadlineXl: ui_system_typography_vue.HeadlineXl,
			TextMd: ui_system_typography_vue.TextMd,
			TextSm: ui_system_typography_vue.TextSm,
			UiButton: ui_vue3_components_button.Button,
			Switcher: ui_vue3_components_switcher.Switcher,
			Hint: ui_vue3_components_hint.Hint,
			RichLoc: ui_vue3_components_richLoc.RichLoc,
			ToolTile
		},
		props: {
			state: {
				/** @type MainToolPickerState */
				type: Object,
				required: true
			},
			openingReason: {
				/** @type MainToolOpeningReason */
				type: String,
				required: true
			},
			busy: {
				type: Boolean,
				required: true
			}
		},
		emits: ['confirm', 'ready', 'closeRequested'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				groupName: `intranet-main-tool-picker-${main_core.Text.getRandom(8)}`,
				baseImage: getMainToolImageUrl('background-base.svg'),
				preparation: {
					active: true,
					failed: false,
					mounted: false,
					readyEmitted: false,
					generation: 0,
					images: new Map(),
					cancelImages: new Set()
				},
				hintInteraction: {
					focused: false,
					hovered: false,
					popupHovered: false,
					hideTimeout: 0
				},
				switcherOptions: {
					useAirDesign: true,
					size: 'medium',
					showStateTitle: false
				}
			};
		},
		data() {
			let selectedPresetId = null;
			if (this.state.forced) {
				selectedPresetId = this.state.forcedPresetId;
			} else if (this.state.hasPersonalChoice) {
				selectedPresetId = this.state.currentPresetId;
			}
			return {
				selectedPresetId,
				applyForAll: this.state.canManageAll && this.state.forced,
				isPrepared: false,
				preparedImageUrls: [],
				confirmationPending: false
			};
		},
		computed: {
			visiblePresets() {
				return this.state.availablePresets.filter(preset => !this.applyForAll || preset.canApplyForAll);
			},
			presentation() {
				return getMainToolPresentation(this.selectedPresetId);
			},
			requiredImageUrls() {
				return [this.baseImage, this.presentation.background, this.presentation.hero, getMainToolImageUrl('check.svg'), getMainToolImageUrl('close.svg'), ...this.visiblePresets.map(preset => getMainToolPresentation(preset.id).tile)].filter(url => main_core.Type.isStringFilled(url));
			},
			isPresentationReady() {
				return this.isPrepared && this.requiredImageUrls.every(url => this.preparedImageUrls.includes(url));
			},
			hintPopupOptions() {
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
						onDestroy: this.handleHintDestroy
					}
				};
			},
			controlsDisabled() {
				return this.busy || this.confirmationPending || !this.isPrepared || !(this.state.canChangePersonal || this.state.canManageAll);
			},
			canConfirm() {
				return !this.controlsDisabled && this.isPresentationReady && this.visiblePresets.some(preset => preset.id === this.selectedPresetId);
			},
			showFooter() {
				return Boolean(this.selectedPresetId) || this.applyForAll;
			}
		},
		watch: {
			visiblePresets: {
				immediate: true,
				async handler() {
					const activeElement = ui_a11y.FocusNavigator.getActiveElement();
					const hadFocus = this.$el?.contains(activeElement);
					this.validateVisiblePresets();
					await ui_vue3.nextTick();
					if (this.preparation.active && this.isPrepared && hadFocus && !activeElement.isConnected && ui_a11y.FocusNavigator.isFocusLost()) {
						ui_a11y.FocusNavigator.focusBySelector(this.$el, 'input[type="radio"]:not(:disabled)', {
							preventScroll: false
						});
					}
				}
			},
			busy(busy) {
				if (!busy) {
					this.confirmationPending = false;
				} else {
					this.closeHint();
				}
			},
			requiredImageUrls() {
				if (this.preparation.mounted) {
					return this.prepareImages();
				}
				return undefined;
			}
		},
		async mounted() {
			this.preparation.mounted = true;
			await this.prepareImages();
		},
		beforeUnmount() {
			this.preparation.active = false;
			this.preparation.cancelImages.forEach(cancel => cancel());
			this.preparation.images.clear();
			clearTimeout(this.hintInteraction.hideTimeout);
			main_popup.PopupManager.getPopupById(`${this.groupName}-hint`)?.destroy();
			this.isPrepared = false;
		},
		errorCaptured() {
			this.preparation.failed = true;
			this.isPrepared = false;
		},
		methods: {
			async prepareImages() {
				if (!this.preparation.active || this.preparation.failed) {
					return;
				}
				const generation = ++this.preparation.generation;
				const imageUrls = this.requiredImageUrls;
				try {
					const loaded = await Promise.all(imageUrls.map(url => this.loadImage(url)));
					if (!this.preparation.active || this.preparation.failed || generation !== this.preparation.generation || loaded.includes(false)) {
						return;
					}
					this.isPrepared = true;
					this.preparedImageUrls = imageUrls;
					await ui_vue3.nextTick();
					if (this.preparation.active && !this.preparation.failed && generation === this.preparation.generation && !this.preparation.readyEmitted) {
						this.preparation.readyEmitted = true;
						this.$emit('ready');
					}
				} catch (error) {
					if (this.preparation.active && !this.preparation.failed && generation === this.preparation.generation) {
						this.preparation.failed = true;
						this.isPrepared = false;
						throw error;
					}
				}
			},
			loadImage(url) {
				if (this.preparation.images.has(url)) {
					return this.preparation.images.get(url);
				}
				const promise = new Promise((resolve, reject) => {
					const image = new Image();
					let settled = false;
					let timeout = 0;
					const finish = (error = null, loaded = true) => {
						if (settled) {
							return;
						}
						settled = true;
						image.onload = null;
						image.onerror = null;
						clearTimeout(timeout);
						this.preparation.cancelImages.delete(cancel);
						if (error) {
							reject(error);
						} else {
							resolve(loaded);
						}
					};
					const cancel = () => finish(null, false);
					const fail = () => finish(new Error('Main tool image could not be loaded.'));
					this.preparation.cancelImages.add(cancel);
					image.onload = () => {
						if (main_core.Type.isFunction(image.decode)) {
							image.decode().then(() => finish()).catch(fail);
						} else {
							finish();
						}
					};
					image.onerror = fail;
					timeout = setTimeout(fail, 30000);
					image.src = url;
					if (image.complete && image.naturalWidth > 0) {
						image.onload();
					}
				});
				this.preparation.images.set(url, promise);
				return promise;
			},
			handleImageError(event) {
				if (this.preparation.active && !this.preparation.failed && this.requiredImageUrls.includes(event.target.getAttribute('src'))) {
					this.preparation.failed = true;
					this.isPrepared = false;
					throw new Error('Main tool image could not be loaded.');
				}
			},
			validateVisiblePresets() {
				if (!this.preparation.active || this.preparation.failed) {
					return;
				}
				if (this.visiblePresets.length === 0) {
					this.preparation.failed = true;
					this.isPrepared = false;
					throw Object.assign(new Error(), {
						code: 'MAIN_TOOL_UNAVAILABLE'
					});
				}
				if (!this.visiblePresets.some(preset => preset.id === this.selectedPresetId)) {
					this.selectedPresetId = null;
				}
			},
			handleSelectPreset(presetId) {
				if (!this.controlsDisabled && this.visiblePresets.some(preset => preset.id === presetId)) {
					this.selectedPresetId = presetId;
				}
			},
			handleApplyForAll(applyForAll) {
				if (this.controlsDisabled || !this.state.canManageAll) {
					return;
				}
				this.applyForAll = applyForAll;
				this.validateVisiblePresets();
			},
			handleConfirm() {
				const presetId = this.selectedPresetId;
				if (!presetId || !this.canConfirm) {
					return;
				}
				this.confirmationPending = true;
				this.$emit('confirm', {
					presetId,
					applyForAll: this.applyForAll
				});
			},
			showHint(event) {
				if (!this.controlsDisabled) {
					this.hintInteraction.focused = true;
					event.currentTarget.dispatchEvent(new MouseEvent('mouseenter'));
				}
			},
			hideHint(event) {
				this.hintInteraction.focused = false;
				event.currentTarget.dispatchEvent(new MouseEvent('mouseleave'));
			},
			handleHintPointerEnter() {
				this.hintInteraction.hovered = true;
				clearTimeout(this.hintInteraction.hideTimeout);
			},
			handleHintPointerLeave() {
				this.hintInteraction.hovered = false;
			},
			handleHintMouseEnter(event) {
				if (this.controlsDisabled || main_popup.PopupManager.getPopupById(`${this.groupName}-hint`)?.isShown()) {
					event.stopImmediatePropagation();
				}
			},
			handleHintMouseLeave(event) {
				if (!this.controlsDisabled && (this.hintInteraction.focused || main_popup.PopupManager.getPopupById(`${this.groupName}-hint`)?.isShown())) {
					event.stopImmediatePropagation();
					this.scheduleHintClose();
				}
			},
			handleHintShow(event) {
				const popup = event.getTarget();
				popup.getPopupContainer().dataset.testid = 'intranet-main-tool-picker-hint-popup';
				main_core.Event.bind(popup.getPopupContainer(), 'pointerenter', this.handleHintPopupEnter);
				main_core.Event.bind(popup.getPopupContainer(), 'pointerleave', this.handleHintPopupLeave);
			},
			handleHintDestroy(event) {
				main_core.Event.unbind(event.getTarget().getPopupContainer(), 'pointerenter', this.handleHintPopupEnter);
				main_core.Event.unbind(event.getTarget().getPopupContainer(), 'pointerleave', this.handleHintPopupLeave);
				if (this.preparation.active) {
					this.hintInteraction.popupHovered = false;
				}
			},
			handleHintPopupEnter() {
				this.hintInteraction.popupHovered = true;
				clearTimeout(this.hintInteraction.hideTimeout);
			},
			handleHintPopupLeave() {
				this.hintInteraction.popupHovered = false;
				this.scheduleHintClose();
			},
			scheduleHintClose() {
				clearTimeout(this.hintInteraction.hideTimeout);
				this.hintInteraction.hideTimeout = setTimeout(() => {
					if (this.preparation.active && !this.hintInteraction.focused && !this.hintInteraction.hovered && !this.hintInteraction.popupHovered) {
						this.closeHint();
					}
				}, 100);
			},
			closeHint() {
				if (this.controlsDisabled) {
					this.$refs.hint?.$el.dispatchEvent(new MouseEvent('mouseleave'));
				}
				clearTimeout(this.hintInteraction.hideTimeout);
				main_popup.PopupManager.getPopupById(`${this.groupName}-hint`)?.close();
			}
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
	`
	});

	class MainToolPickerApplication {
		#events;
		#options;
		#status;
		#content = null;
		#application = null;
		#destroyed = false;
		#failed = false;
		#ready = false;
		constructor(options) {
			this.#options = options;
			this.#status = ui_vue3.reactive({
				busy: options.busy
			});
			this.#events = new main_core_events.EventEmitter();
			this.#events.setEventNamespace('BX.Intranet.MainToolPicker');
		}
		getContent() {
			if (this.#destroyed || !this.#options || !this.#status) {
				throw new Error('Main tool picker has been destroyed.');
			}
			if (this.#content) {
				return this.#content;
			}
			const content = main_core.Tag.render`<div class="intranet-main-tool-picker-application"></div>`;
			this.#content = content;
			const {
				state,
				openingReason
			} = this.#options;
			const status = this.#status;
			try {
				this.#application = ui_vue3.BitrixVue.createApp(ui_vue3.defineComponent({
					name: 'IntranetMainToolPickerApplication',
					components: {
						MainToolPicker
					},
					data: () => ({
						state,
						openingReason,
						status
					}),
					methods: {
						handleConfirm: this.#handleConfirm,
						handleReady: this.#handleReady,
						handleCloseRequested: this.#handleCloseRequested
					},
					template: `
					<MainToolPicker
						:state="state"
						:openingReason="openingReason"
						:busy="status.busy"
						@confirm="handleConfirm"
						@ready="handleReady"
						@closeRequested="handleCloseRequested"
					/>
				`
				}));
				this.#application.mixin(ui_vue3_mixins_locMixin.locMixin);
				this.#application.config.errorHandler = this.#handleError;
				this.#application.mount(content);
			} catch (error) {
				void this.#handleError(error);
			}
			return content;
		}
		setBusy(busy) {
			if (!this.#destroyed && this.#status) {
				this.#status.busy = busy;
			}
		}
		subscribe(eventName, handler) {
			if (!this.#destroyed) {
				this.#events.subscribe(eventName, handler);
			}
		}
		unsubscribeAll() {
			this.#events.unsubscribeAll();
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.unsubscribeAll();
			const application = this.#application;
			const content = this.#content;
			this.#application = null;
			this.#content = null;
			this.#options = null;
			this.#status = null;
			try {
				application?.unmount();
			} finally {
				if (content) {
					main_core.Dom.clean(content);
					main_core.Dom.remove(content);
				}
			}
		}
		#handleConfirm = selection => {
			if (this.#destroyed || this.#failed || !this.#ready || this.#status?.busy) {
				return;
			}
			this.#events.emit('confirm', new main_core_events.BaseEvent({
				data: selection
			}));
		};
		#handleReady = async () => {
			await ui_vue3.nextTick();
			if (this.#destroyed || this.#failed || this.#ready) {
				return;
			}
			this.#ready = true;
			this.#events.emit('ready', new main_core_events.BaseEvent());
		};
		#handleCloseRequested = () => {
			if (!this.#destroyed && !this.#failed) {
				this.#events.emit('closeRequested', new main_core_events.BaseEvent());
			}
		};
		#handleError = async error => {
			if (this.#destroyed || this.#failed) {
				return;
			}
			this.#failed = true;
			await ui_vue3.nextTick();
			if (!this.#destroyed) {
				const unavailable = main_core.Type.isObject(error) && 'code' in error && error.code === 'MAIN_TOOL_UNAVAILABLE';
				const data = unavailable ? {
					errors: [{
						code: 'MAIN_TOOL_UNAVAILABLE'
					}]
				} : {};
				this.#events.emit('error', new main_core_events.BaseEvent({
					data
				}));
			}
		};
	}
	function createMainToolPicker(options) {
		return new MainToolPickerApplication(options);
	}

	class MenuPreset {
		#templateNode = null;
		#application = null;
		constructor(params) {
			const containerNode = params?.containerNode;
			if (!main_core.Type.isDomNode(containerNode)) {
				return;
			}
			this.#templateNode = containerNode.cloneNode(true);
			this.#application = ui_vue3.BitrixVue.createApp(Preset, {
				rootNode: this.#templateNode,
				currentPresetId: params.currentPresetId,
				presetData: main_core.Extension.getSettings('intranet.menu-preset').presetData
			});
			this.#application.mount(this.#templateNode);
		}
		getContent() {
			return this.#templateNode;
		}
	}

	exports.MenuPreset = MenuPreset;
	exports.createMainToolPicker = createMainToolPicker;

})(this.BX.Intranet.MenuPreset = this.BX.Intranet.MenuPreset || {}, BX, BX.Vue3, BX.Event, BX.Vue3.Mixins, BX.Main, BX.UI.Accessibility, BX.Vue3.Components, BX.Vue3.Components, BX.UI.Vue3.Components, BX.UI.Vue3.Components, BX.UI.System.Typography.Vue, BX.UI.System.RadioButton);
//# sourceMappingURL=menu-preset.bundle.js.map
