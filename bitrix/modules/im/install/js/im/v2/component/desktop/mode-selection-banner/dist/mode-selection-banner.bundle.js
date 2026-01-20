/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,im_v2_const,im_v2_lib_analytics,im_v2_lib_promo,im_v2_lib_desktopApi,ui_vue3_components_button) {
	'use strict';

	// @vue/component
	const SelectButton = {
	  name: 'SelectConfirm',
	  components: {
	    ConfirmButton: ui_vue3_components_button.Button
	  },
	  emits: ['click'],
	  computed: {
	    ButtonSize: () => ui_vue3_components_button.ButtonSize
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-desktop-mode-selection-banner__select-confirm_container">
			<span class="bx-im-desktop-mode-selection-banner__select-confirm_description">
				{{ loc('IM_DESKTOP_MODE_SELECTION_BANNER_MORE_DESCRIPTION_SELECT_CONFIRM') }}
			</span>
			<ConfirmButton
				class="bx-im-desktop-mode-selection-banner__select-confirm_button"
				:text="loc('IM_DESKTOP_MODE_SELECTION_BANNER_BUTTON_SELECT_CONFIRM')"
				:size="ButtonSize.EXTRA_LARGE"
				@click="$emit('click')"
			/>
		</div>
	`
	};

	// @vue/component
	const ModeOption = {
	  name: 'ModeOption',
	  props: {
	    isSelected: {
	      type: Boolean,
	      required: true
	    },
	    labels: {
	      type: Object,
	      required: true
	    },
	    descriptionTitle: {
	      type: String,
	      required: true
	    },
	    descriptionText: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['click'],
	  computed: {
	    labelsCollection() {
	      return this.labels;
	    }
	  },
	  template: `
		<li @click="$emit('click')" class="bx-im-desktop-mode-selection-banner__mode-option" :class="{'--selected': isSelected}">
			<div class="bx-im-desktop-mode-selection-banner__selected-icon"></div>
			<div class="bx-im-desktop-mode-selection-banner__image_container">
				<span class="bx-im-desktop-mode-selection-banner__image"></span>
				<ul class="bx-im-desktop-mode-selection-banner__label-list">
					<li v-for="label in labelsCollection" :class="['bx-im-desktop-mode-selection-banner__label-item', '--' + label.value]">
						{{ label.text }}
					</li>
				</ul>
				<slot name="extra-information"></slot>
			</div>
			<div class="bx-im-desktop-mode-selection-banner__description_container">
				<h2 class="bx-im-desktop-mode-selection-banner__description_title">
					{{ descriptionTitle }}
				</h2>
				<p class="bx-im-desktop-mode-selection-banner__description_text">
					{{ descriptionText }}
				</p>
			</div>
		</li>
	`
	};

	const FeatureLabel = {
	  clients: 'clients',
	  tasks: 'tasks',
	  other: 'other',
	  documents: 'documents',
	  channels: 'channels',
	  chats: 'chats',
	  calls: 'calls'
	};
	const ONE_WINDOW_CARD_CLASS = '--one-window';
	const TWO_WINDOW_CARD_CLASS = '--two-window';

	// @vue/component
	const ModeOptionList = {
	  name: 'ModeOptionList',
	  components: {
	    ModeOption
	  },
	  props: {
	    isTwoWindowModeSelected: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['twoWindowClick', 'oneWindowClick'],
	  computed: {
	    OneWindowCardClass: () => ONE_WINDOW_CARD_CLASS,
	    TwoWindowCardClass: () => TWO_WINDOW_CARD_CLASS,
	    twoWindowModeLabels() {
	      return [{
	        value: FeatureLabel.clients,
	        text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CLIENTS')
	      }, {
	        value: FeatureLabel.tasks,
	        text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_TASKS')
	      }, {
	        value: FeatureLabel.other,
	        text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_OTHER')
	      }, {
	        value: FeatureLabel.documents,
	        text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_DOCUMENTS')
	      }, {
	        value: FeatureLabel.channels,
	        text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CHANNELS')
	      }, {
	        value: FeatureLabel.chats,
	        text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CHATS')
	      }, {
	        value: FeatureLabel.calls,
	        text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CALLS')
	      }];
	    },
	    oneWindowModeLabels() {
	      return [{
	        value: FeatureLabel.channels,
	        text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CHANNELS')
	      }, {
	        value: FeatureLabel.chats,
	        text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CHATS')
	      }, {
	        value: FeatureLabel.calls,
	        text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CALLS')
	      }];
	    }
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<ul class="bx-im-desktop-mode-selection-banner__mode-option-list">
			<ModeOption
				:isSelected="isTwoWindowModeSelected"
				:labels="twoWindowModeLabels"
				:class="TwoWindowCardClass"
				:descriptionTitle="loc('IM_DESKTOP_MODE_SELECTION_BANNER_TITLE_TWO_WINDOW')"
				:descriptionText="loc('IM_DESKTOP_MODE_SELECTION_BANNER_DESCRIPTION_TWO_WINDOW')"
				@click="$emit('twoWindowClick')"
			/>
			<ModeOption
				:isSelected="!isTwoWindowModeSelected"
				:labels="oneWindowModeLabels"
				:class="OneWindowCardClass"
				:descriptionTitle="loc('IM_DESKTOP_MODE_SELECTION_BANNER_TITLE_ONE_WINDOW')"
				:descriptionText="loc('IM_DESKTOP_MODE_SELECTION_BANNER_DESCRIPTION_ONE_WINDOW')"
				@click="$emit('oneWindowClick')"
			>
				<template #extra-information>
					<span class="bx-im-desktop-mode-selection-banner__extra-information">{{ loc('IM_DESKTOP_MODE_SELECTION_BANNER_NOTE') }}</span>
				</template>
			</ModeOption>
		</ul>
	`
	};

	// @vue/component
	const DesktopModeSelectionBanner = {
	  name: 'ModeSelectionBanner',
	  components: {
	    SelectButton,
	    ModeOptionList
	  },
	  emits: ['close'],
	  data() {
	    return {
	      isTwoWindowModeSelected: true
	    };
	  },
	  computed: {
	    isTwoWindowMode() {
	      return im_v2_lib_desktopApi.DesktopApi.isTwoWindowMode();
	    }
	  },
	  created() {
	    this.isTwoWindowModeSelected = this.isTwoWindowMode;
	  },
	  methods: {
	    onTwoWindowClick() {
	      this.isTwoWindowModeSelected = true;
	    },
	    onOneWindowClick() {
	      this.isTwoWindowModeSelected = false;
	    },
	    onSelectionConfirm() {
	      void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.desktopModeSelection);
	      if (this.isTwoWindowModeSelected) {
	        im_v2_lib_analytics.Analytics.getInstance().desktopMode.onBannerTwoWindowEnable();
	      } else {
	        im_v2_lib_analytics.Analytics.getInstance().desktopMode.onBannerOneWindowEnable();
	      }
	      if (this.isTwoWindowModeSelected !== this.isTwoWindowMode) {
	        im_v2_lib_desktopApi.DesktopApi.setTwoWindowMode(this.isTwoWindowModeSelected);
	        im_v2_lib_desktopApi.DesktopApi.restart();
	        return;
	      }
	      this.$emit('close');
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-messenger__scope bx-im-desktop-mode-selection-banner__container">
			<div class="bx-im-desktop-mode-selection-banner__content-container">
				<h1 class="bx-im-desktop-mode-selection-banner__title">{{ loc('IM_DESKTOP_MODE_SELECTION_BANNER_TITLE') }}</h1>
				<ModeOptionList 
					@twoWindowClick="onTwoWindowClick"
					@oneWindowClick='onOneWindowClick'
					:isTwoWindowModeSelected="isTwoWindowModeSelected"
				/>
				<SelectButton @click="onSelectionConfirm" />
			</div>
		</div>
	`
	};

	exports.DesktopModeSelectionBanner = DesktopModeSelectionBanner;

}((this.BX.Messenger.v2.Component.Desktop = this.BX.Messenger.v2.Component.Desktop || {}),BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Vue3.Components));
//# sourceMappingURL=mode-selection-banner.bundle.js.map
