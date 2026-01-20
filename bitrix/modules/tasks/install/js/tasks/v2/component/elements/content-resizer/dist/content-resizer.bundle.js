/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core) {
	'use strict';

	// @vue/component
	const ContentResizer = {
	  name: 'ContentResizer',
	  emits: ['endResize'],
	  data() {
	    return {
	      startMouseX: 0,
	      startWidth: 0
	    };
	  },
	  methods: {
	    startResize(event) {
	      main_core.Event.bind(window, 'pointermove', this.resize);
	      main_core.Event.bind(window, 'mouseup', this.endResize);
	      main_core.Dom.style(document.body, 'userSelect', 'none');
	      this.startMouseX = event.clientX;
	      this.startWidth = this.$el.parentElement.offsetWidth;
	    },
	    resize(event) {
	      event.preventDefault();
	      const width = this.startWidth + event.clientX - this.startMouseX;
	      main_core.Dom.style(this.$el.parentElement, 'width', `${width}px`);
	    },
	    endResize() {
	      main_core.Event.unbind(window, 'pointermove', this.resize);
	      main_core.Event.unbind(window, 'mouseup', this.endResize);
	      main_core.Dom.style(document.body, 'userSelect', null);
	      this.$emit('endResize', this.$el.parentElement.offsetWidth);
	    }
	  },
	  template: `
		<div class="b24-content-resizer" @mousedown.left="startResize"/>
	`
	};

	exports.ContentResizer = ContentResizer;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX));
//# sourceMappingURL=content-resizer.bundle.js.map
