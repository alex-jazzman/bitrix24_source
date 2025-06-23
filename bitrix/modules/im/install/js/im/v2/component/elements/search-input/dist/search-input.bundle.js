/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,im_v2_lib_utils,im_v2_component_elements_loader) {
	'use strict';

	// @vue/component
	const SearchInput = {
	  name: 'SearchInput',
	  components: {
	    Spinner: im_v2_component_elements_loader.Spinner
	  },
	  props: {
	    placeholder: {
	      type: String,
	      default: ''
	    },
	    searchMode: {
	      type: Boolean,
	      default: true
	    },
	    withIcon: {
	      type: Boolean,
	      default: true
	    },
	    withLoader: {
	      type: Boolean,
	      default: false
	    },
	    isLoading: {
	      type: Boolean,
	      default: false
	    },
	    delayForFocusOnStart: {
	      type: Number || null,
	      default: null
	    }
	  },
	  emits: ['queryChange', 'inputFocus', 'inputBlur', 'keyPressed', 'close'],
	  data() {
	    return {
	      query: '',
	      hasFocus: false
	    };
	  },
	  computed: {
	    SpinnerSize: () => im_v2_component_elements_loader.SpinnerSize,
	    SpinnerColor: () => im_v2_component_elements_loader.SpinnerColor,
	    isEmptyQuery() {
	      return this.query.length === 0;
	    }
	  },
	  watch: {
	    searchMode(newValue) {
	      if (newValue === true) {
	        this.focus();
	      } else {
	        this.query = '';
	        this.blur();
	      }
	    }
	  },
	  mounted() {
	    if (this.delayForFocusOnStart === 0) {
	      this.focus();
	    } else if (this.delayForFocusOnStart > 0) {
	      setTimeout(() => {
	        this.focus();
	      }, this.delayForFocusOnStart);
	    }
	  },
	  methods: {
	    onInputUpdate() {
	      this.$emit('queryChange', this.query);
	    },
	    onFocus() {
	      this.focus();
	      this.$emit('inputFocus');
	    },
	    onCloseClick() {
	      this.query = '';
	      this.hasFocus = false;
	      this.$emit('queryChange', this.query);
	      this.$emit('close');
	    },
	    onClearInput() {
	      this.query = '';
	      this.focus();
	      this.$emit('queryChange', this.query);
	    },
	    onKeyUp(event) {
	      if (im_v2_lib_utils.Utils.key.isCombination(event, 'Escape')) {
	        this.onEscapePressed();
	        return;
	      }
	      this.$emit('keyPressed', event);
	    },
	    onEscapePressed() {
	      if (this.isEmptyQuery) {
	        this.onCloseClick();
	        this.blur();
	      } else {
	        this.onClearInput();
	      }
	    },
	    focus() {
	      this.hasFocus = true;
	      this.$refs.searchInput.focus();
	    },
	    blur() {
	      this.hasFocus = false;
	      this.$refs.searchInput.blur();
	    }
	  },
	  template: `
		<div class="bx-im-search-input__scope bx-im-search-input__container" :class="{'--has-focus': hasFocus}">
			<div v-if="!isLoading" class="bx-im-search-input__search-icon"></div>
			<Spinner 
				v-if="withLoader && isLoading" 
				:size="SpinnerSize.XXS" 
				:color="SpinnerColor.grey" 
				class="bx-im-search-input__loader"
			/>
			<input
				@focus="onFocus"
				@input="onInputUpdate"
				@keyup="onKeyUp"
				v-model="query"
				class="bx-im-search-input__element"
				:class="{'--with-icon': withIcon}"
				:placeholder="placeholder"
				ref="searchInput"
			/>
			<div v-if="hasFocus" class="bx-im-search-input__close-icon" @click="onCloseClick"></div>
		</div>
	`
	};

	exports.SearchInput = SearchInput;

}((this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}),BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Elements));
//# sourceMappingURL=search-input.bundle.js.map
