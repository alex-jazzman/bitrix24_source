/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,im_v2_lib_progressbar) {
	'use strict';

	// @vue/component
	const ProgressBar = {
	  name: 'ProgressBar',
	  props: {
	    item: {
	      type: Object,
	      required: true
	    },
	    withLabels: {
	      type: Boolean,
	      default: true
	    },
	    cancelCallbackDelay: {
	      type: Number,
	      default: 0
	    }
	  },
	  emits: ['cancelClick'],
	  computed: {
	    file() {
	      return this.item;
	    }
	  },
	  watch: {
	    'file.status': function () {
	      this.getProgressBarManager().update();
	    },
	    'file.progress': function () {
	      this.getProgressBarManager().update();
	    }
	  },
	  mounted() {
	    this.initProgressBar();
	  },
	  beforeUnmount() {
	    this.removeProgressBar();
	  },
	  methods: {
	    initProgressBar() {
	      if (this.file.progress === 100) {
	        return;
	      }
	      const customConfig = {
	        hasTitle: false,
	        cancelCallbackDelay: 0
	      };
	      if (!this.withLabels) {
	        customConfig.labels = {};
	      }
	      this.progressBarManager = new im_v2_lib_progressbar.ProgressBarManager({
	        container: this.$refs['progress-bar'],
	        uploadState: this.file,
	        customConfig
	      });
	      this.progressBarManager.subscribe(im_v2_lib_progressbar.ProgressBarManager.event.cancel, () => {
	        this.$emit('cancelClick', {
	          file: this.file
	        });
	      });
	      this.progressBarManager.start();
	    },
	    removeProgressBar() {
	      if (!this.getProgressBarManager()) {
	        return;
	      }
	      this.getProgressBarManager().destroy();
	    },
	    getProgressBarManager() {
	      return this.progressBarManager;
	    }
	  },
	  template: `
		<div class="bx-im-progress-bar__container" ref="progress-bar"></div>
	`
	};

	exports.ProgressBar = ProgressBar;

}((this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}),BX.Messenger.v2.Lib));
//# sourceMappingURL=progressbar.bundle.js.map
