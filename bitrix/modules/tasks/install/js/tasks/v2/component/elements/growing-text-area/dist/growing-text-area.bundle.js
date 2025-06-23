/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_vue3_components_popup,main_core) {
	'use strict';

	// @vue/component
	const GrowingTextArea = {
	  name: 'GrowingTextArea',
	  components: {
	    Popup: ui_vue3_components_popup.Popup
	  },
	  props: {
	    initialValue: {
	      type: String,
	      default: ''
	    },
	    placeholderValue: {
	      type: String,
	      default: ''
	    },
	    fontColor: {
	      type: String,
	      default: 'var(--ui-color-base-1)'
	    },
	    fontSize: {
	      type: Number,
	      default: 21
	    },
	    fontWeight: {
	      type: [Number, String],
	      default: 'inherit'
	    },
	    lineHeight: {
	      type: Number,
	      default: 29
	    },
	    readonly: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['update', 'input', 'focus', 'blur', 'emptyFocus', 'emptyBlur', 'enterBlur'],
	  data() {
	    return {
	      areaId: main_core.Text.getRandom(),
	      editableValue: this.initialValue,
	      focus: false,
	      mouseover: false,
	      isOverflowing: false
	    };
	  },
	  computed: {
	    value: {
	      get() {
	        if (this.readonlyPlaceholder) {
	          return this.placeholderValue.trim();
	        }
	        return this.editableValue.trim();
	      },
	      set(name) {
	        this.editableValue = name;
	        this.$emit('input', this.value);
	      }
	    },
	    isEmpty() {
	      return this.value.trim() === '';
	    },
	    isDisplay() {
	      return this.readonly || this.isOverflowing && !this.isEmpty && !this.focus;
	    },
	    popupId() {
	      return `growing-text-area-value-hint-${this.areaId}`;
	    },
	    popupOptions() {
	      return {
	        bindElement: this.$refs.container,
	        offsetLeft: 40,
	        maxWidth: 440,
	        angle: {
	          offset: 40
	        },
	        targetContainer: document.body
	      };
	    },
	    showHint() {
	      return this.focus === false && this.mouseover === true && this.isOverflowing === true;
	    },
	    readonlyPlaceholder() {
	      return this.readonly === true && this.initialValue === '';
	    },
	    color() {
	      if (this.readonlyPlaceholder) {
	        return 'var(--ui-color-base-4)';
	      }
	      return this.fontColor;
	    }
	  },
	  watch: {
	    initialValue() {
	      this.editableValue = this.initialValue;
	      this.value = this.editableValue;
	    }
	  },
	  mounted() {
	    requestAnimationFrame(() => {
	      if (this.isEmpty) {
	        this.focusToEnd();
	      }
	      void this.adjustTextareaHeight();
	    });
	  },
	  methods: {
	    async adjustTextareaHeight() {
	      const textarea = this.$refs.textarea;
	      if (!textarea) {
	        return;
	      }
	      main_core.Dom.style(textarea, 'height', 'auto');
	      const maxHeight = this.lineHeight * 3;
	      const height = Math.min(textarea.scrollHeight, maxHeight);
	      this.isOverflowing = textarea.scrollHeight > maxHeight;
	      main_core.Dom.style(textarea, 'height', `${height}px`);
	      main_core.Dom.style(textarea, 'maxHeight', `${maxHeight}px`);
	    },
	    async focusToTextarea() {
	      this.focusToEnd();
	    },
	    clearValue() {
	      this.$refs.textarea.value = '';
	      this.value = '';
	      void this.adjustTextareaHeight();
	    },
	    focusToEnd() {
	      if (this.readonly === true) {
	        return;
	      }
	      const textarea = this.$refs.textarea;
	      textarea.focus({
	        preventScroll: true
	      });
	      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
	      this.scrollToBeginning();
	      this.scrollToEnd();
	    },
	    focusTextarea() {
	      if (this.readonly === true) {
	        return;
	      }
	      this.focus = true;
	      void this.$nextTick(() => {
	        this.$refs.textarea.focus();
	      });
	    },
	    scrollToBeginning() {
	      if (!this.$refs.textarea) {
	        return;
	      }
	      this.$refs.textarea.scrollTop = 0;
	    },
	    scrollToEnd() {
	      const textarea = this.$refs.textarea;
	      textarea.scrollTo({
	        top: textarea.scrollHeight,
	        behavior: 'smooth'
	      });
	    },
	    handleInput(event) {
	      this.value = event.target.value;
	      this.$emit('update', this.value);
	      void this.adjustTextareaHeight();
	    },
	    handleKeyDown(event) {
	      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
	        event.stopPropagation();
	        return;
	      }
	      if (event.key === 'Enter') {
	        this.$refs.textarea.dataset.enterBlur = 'true';
	        event.target.blur();
	        event.preventDefault();
	      }
	      if (event.key === 'Escape') {
	        event.target.blur();
	        event.stopPropagation();
	      }
	    },
	    async handleFocus(event) {
	      this.focus = true;
	      await this.adjustTextareaHeight();
	      this.focusToEnd();
	      if (this.value === '') {
	        this.$emit('emptyFocus');
	      }
	      this.$emit('focus', event);
	    },
	    async handleBlur(event) {
	      var _this$$refs$textarea, _this$$refs$textarea2;
	      const wasEnterBlur = ((_this$$refs$textarea = this.$refs.textarea) == null ? void 0 : _this$$refs$textarea.dataset.enterBlur) === 'true';
	      (_this$$refs$textarea2 = this.$refs.textarea) == null ? true : delete _this$$refs$textarea2.dataset.enterBlur;
	      this.focus = false;
	      this.mouseover = false;
	      if (!this.isOverflowing) {
	        await this.adjustTextareaHeight();
	        this.scrollToBeginning();
	      }
	      if (this.value === '') {
	        this.$emit('emptyBlur');
	      }
	      if (wasEnterBlur) {
	        this.$emit('enterBlur', this.value === '');
	      }
	      this.$emit('blur', event);
	    }
	  },
	  template: `
		<div ref="container" class="b24-growing-text-area-content">
			<div
				v-if="isDisplay"
				class="b24-growing-text-area-display"
				:class="{ '--readonly': readonly }"
				:data-id="'b24-growing-text-area-display-' + areaId"
				:style="{
					lineHeight: lineHeight + 'px',
					color: color,
					fontSize: fontSize + 'px',
					fontWeight: fontWeight,
				}"
				@click="focusTextarea"
				@mouseover="mouseover = true"
				@mouseleave="mouseover = false"
			>
				{{ value }}
			</div>
			<textarea
				v-else
				v-model="editableValue"
				ref="textarea"
				class="b24-growing-text-area-edit"
				:placeholder="placeholderValue"
				:data-id="'b24-growing-text-area-edit-' + areaId"
				:style="{
					lineHeight: lineHeight + 'px',
					color: fontColor,
					fontSize: fontSize + 'px',
					fontWeight: fontWeight,
				}"
				rows="1"
				@input="handleInput"
				@keydown="handleKeyDown"
				@focus="handleFocus"
				@blur="handleBlur"
			></textarea>
			<Popup
				v-if="showHint"
				ref="hint"
				:id="popupId"
				:options="popupOptions"
			>
				<div class="b24-growing-text-area-popup-content">
					{{ value }}
				</div>
			</Popup>
		</div>
	`
	};

	exports.GrowingTextArea = GrowingTextArea;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.UI.Vue3.Components,BX));
//# sourceMappingURL=growing-text-area.bundle.js.map
