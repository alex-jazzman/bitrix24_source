/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core,ui_vue3_directives_hint) {
	'use strict';

	const URL_REGEXP = /((https?:\/\/(www\.)?)|(www\.))[\w#%+.:=@~-]{1,256}\.[\d()A-Za-z]{1,6}\b([\w#%&()+./:=?@[\]~-]*)(?<![%()+.:\]-])/;
	const EMAIL_REGEXP = /(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))/;
	const PUNCTUATION_OR_SPACE = /[\s(),.;[\]]/;
	function createLinkMatcherWithRegExp(regExp, urlTransformer = text => text) {
	  return text => {
	    const match = regExp.exec(text);
	    if (match === null) {
	      return null;
	    }
	    return {
	      index: match.index,
	      length: match[0].length,
	      text: match[0],
	      url: urlTransformer(match[0])
	    };
	  };
	}
	const LINK_MATCHERS = [createLinkMatcherWithRegExp(URL_REGEXP, text => text.startsWith('http') ? text : `https://${text}`), createLinkMatcherWithRegExp(EMAIL_REGEXP, text => `mailto:${text}`)];

	// @vue/component
	const GrowingTextArea = {
	  name: 'GrowingTextArea',
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  props: {
	    modelValue: {
	      type: String,
	      default: ''
	    },
	    placeholder: {
	      type: String,
	      default: ''
	    },
	    fontColor: {
	      type: String,
	      default: 'var(--ui-color-base-0)'
	    },
	    linkColor: {
	      type: String,
	      default: 'var(--ui-color-accent-main-link)'
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
	  emits: ['update:modelValue', 'input', 'focus', 'blur', 'emptyFocus', 'emptyBlur', 'enterBlur', 'linkClick'],
	  data() {
	    return {
	      focus: false,
	      overflowing: false
	    };
	  },
	  computed: {
	    isEmpty() {
	      return this.modelValue.trim() === '';
	    },
	    isDisplay() {
	      return !this.isEmpty && !this.focus && (this.overflowing || this.hasLinks);
	    },
	    linkMatches() {
	      return this.findLinkMatches(this.modelValue);
	    },
	    hasLinks() {
	      return this.linkMatches.length > 0;
	    },
	    displayHtml() {
	      return this.getLinkifiedHtml(this.modelValue, this.linkMatches);
	    },
	    tooltip() {
	      if (!this.overflowing) {
	        return null;
	      }
	      return () => ({
	        html: this.displayHtml,
	        interactivity: true,
	        popupOptions: {
	          className: 'b24-growing-text-area-popup',
	          bindElement: this.$el,
	          offsetLeft: 40,
	          maxWidth: 440,
	          maxHeight: 360,
	          angle: {
	            offset: 40
	          },
	          darkMode: false,
	          targetContainer: document.body
	        }
	      });
	    }
	  },
	  mounted() {
	    requestAnimationFrame(() => {
	      if (this.isEmpty) {
	        this.focusToEnd();
	      }
	      this.overflowing = this.isOverflowing();
	      void this.adjustTextareaHeight();
	    });
	  },
	  methods: {
	    getLinkifiedHtml(value, matches) {
	      if (!main_core.Type.isStringFilled(value)) {
	        return '';
	      }
	      if (!Array.isArray(matches) || matches.length === 0) {
	        return main_core.Text.encode(value);
	      }
	      let result = '';
	      let lastIndex = 0;
	      matches.forEach(match => {
	        result += main_core.Text.encode(value.slice(lastIndex, match.start));
	        const safeHref = main_core.Text.encode(match.href);
	        const safeText = main_core.Text.encode(match.text);
	        result += `
					<a
						class="b24-growing-text-area-link"
						href="${safeHref}"
						target="_blank"
						rel="noopener noreferrer"
						style="color: ${this.linkColor};"
					>${safeText}</a>
				`.trim();
	        lastIndex = match.end;
	      });
	      result += main_core.Text.encode(value.slice(lastIndex));
	      return result;
	    },
	    findLinkMatches(value) {
	      if (!main_core.Type.isStringFilled(value)) {
	        return [];
	      }
	      const matches = [];
	      let text = value;
	      let offset = 0;
	      let match = this.getFirstLinkMatch(text);
	      while (match) {
	        const start = offset + match.index;
	        const end = start + match.length;
	        if (this.isMatchBoundariesValid(value, start, end)) {
	          matches.push({
	            start,
	            end,
	            text: match.text,
	            href: match.url
	          });
	        }
	        const sliceIndex = match.index + match.length;
	        offset += sliceIndex;
	        text = text.slice(sliceIndex);
	        match = this.getFirstLinkMatch(text);
	      }
	      return matches;
	    },
	    getFirstLinkMatch(text) {
	      if (!main_core.Type.isStringFilled(text)) {
	        return null;
	      }
	      for (const matcher of LINK_MATCHERS) {
	        const match = matcher(text);
	        if (match) {
	          return match;
	        }
	      }
	      return null;
	    },
	    isMatchBoundariesValid(text, start, end) {
	      const beforeChar = start > 0 ? text[start - 1] : '';
	      const afterChar = end < text.length ? text[end] : '';
	      return this.isSeparator(beforeChar) && this.isSeparator(afterChar);
	    },
	    isSeparator(char) {
	      if (!main_core.Type.isStringFilled(char)) {
	        return true;
	      }
	      return PUNCTUATION_OR_SPACE.test(char);
	    },
	    isOverflowing() {
	      const textarea = this.$refs.textarea;
	      const display = this.$refs.display;
	      if (textarea) {
	        const maxHeight = this.lineHeight * 3;
	        return textarea.scrollHeight > maxHeight;
	      }
	      if (display) {
	        return display.offsetHeight >= 60;
	      }
	      return false;
	    },
	    async adjustTextareaHeight() {
	      const textarea = this.$refs.textarea;
	      if (!textarea) {
	        return;
	      }
	      main_core.Dom.style(textarea, 'height', 'auto');
	      const maxHeight = this.lineHeight * 3;
	      const height = Math.min(textarea.scrollHeight, maxHeight);
	      this.overflowing = this.isOverflowing();
	      main_core.Dom.style(textarea, 'height', `${height}px`);
	      main_core.Dom.style(textarea, 'maxHeight', `${maxHeight}px`);
	    },
	    focusToEnd() {
	      const textarea = this.$refs.textarea;
	      if (!textarea) {
	        return;
	      }
	      if (this.readonly) {
	        return;
	      }
	      textarea.focus({
	        preventScroll: true
	      });
	      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
	      this.scrollToBeginning();
	      this.scrollToEnd();
	    },
	    focusTextarea() {
	      if (this.readonly) {
	        return;
	      }
	      if (this.focus) {
	        void this.handleFocus();
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
	    handleDisplayClick(event) {
	      if (event && event.target && event.target.closest && event.target.closest('.b24-growing-text-area-link')) {
	        this.$emit('linkClick', event);
	      } else {
	        this.focusTextarea();
	      }
	    },
	    handleInput(event) {
	      this.$emit('input', event.target.value);
	      void this.adjustTextareaHeight();
	    },
	    handleKeyDown(event) {
	      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
	        event.stopPropagation();
	        return;
	      }
	      if (event.key === 'Enter') {
	        this.$emit('enterBlur', this.modelValue === '');
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
	      if (this.modelValue === '') {
	        this.$emit('emptyFocus');
	      }
	      this.$emit('focus', event);
	    },
	    async handleBlur(event) {
	      if (!this.$refs.textarea) {
	        return;
	      }
	      if (!this.overflowing) {
	        await this.adjustTextareaHeight();
	        this.scrollToBeginning();
	      }
	      const value = this.$refs.textarea.value.trim();
	      if (value !== this.modelValue) {
	        this.$emit('update:modelValue', value);
	      }
	      this.$refs.textarea.value = value;
	      if (value === '') {
	        this.$emit('emptyBlur');
	      }
	      this.$emit('blur', event);
	      this.focus = false;
	    }
	  },
	  template: `
		<div class="b24-growing-text-area" :class="{ '--readonly': readonly }">
			<div
				ref="display"
				v-if="isDisplay"
				v-hint="tooltip"
				class="b24-growing-text-area-display print-display-block"
				:style="{
					lineHeight: lineHeight + 'px',
					color: fontColor,
					fontSize: fontSize + 'px',
					fontWeight: fontWeight,
				}"
				@click="handleDisplayClick"
			>
				<span v-html="displayHtml"/>
			</div>
			<textarea
				v-else
				class="b24-growing-text-area-edit"
				rows="1"
				:value="modelValue"
				:placeholder
				:style="{
					lineHeight: lineHeight + 'px',
					color: fontColor,
					fontSize: fontSize + 'px',
					fontWeight: fontWeight,
				}"
				:readonly
				ref="textarea"
				@input="handleInput"
				@keydown="handleKeyDown"
				@focus="handleFocus"
				@blur="handleBlur"
			>{{ modelValue }}</textarea>
		</div>
	`
	};

	exports.GrowingTextArea = GrowingTextArea;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX,BX.Vue3.Directives));
//# sourceMappingURL=growing-text-area.bundle.js.map
