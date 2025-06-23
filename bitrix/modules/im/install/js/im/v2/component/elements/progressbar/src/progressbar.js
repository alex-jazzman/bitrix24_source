import { ProgressBarManager } from 'im.v2.lib.progressbar';

import './css/progressbar.css';

import type { ImModelFile } from 'im.v2.model';

// @vue/component
export const ProgressBar = {
	name: 'ProgressBar',
	props: {
		item: {
			type: Object,
			required: true,
		},
		withLabels: {
			type: Boolean,
			default: true,
		},
		cancelCallbackDelay: {
			type: Number,
			default: 0,
		},
	},
	emits: ['cancelClick'],
	computed: {
		file(): ImModelFile
		{
			return this.item;
		},
	},
	watch: {
		'file.status': function() {
			this.getProgressBarManager().update();
		},
		'file.progress': function() {
			this.getProgressBarManager().update();
		},
	},
	mounted()
	{
		this.initProgressBar();
	},
	beforeUnmount()
	{
		this.removeProgressBar();
	},
	methods: {
		initProgressBar()
		{
			if (this.file.progress === 100)
			{
				return;
			}

			const customConfig = {
				hasTitle: false,
				cancelCallbackDelay: 0,
			};
			if (!this.withLabels)
			{
				customConfig.labels = {};
			}

			this.progressBarManager = new ProgressBarManager({
				container: this.$refs['progress-bar'],
				uploadState: this.file,
				customConfig,
			});

			this.progressBarManager.subscribe(ProgressBarManager.event.cancel, () => {
				this.$emit('cancelClick', { file: this.file });
			});

			this.progressBarManager.start();
		},
		removeProgressBar()
		{
			if (!this.getProgressBarManager())
			{
				return;
			}

			this.getProgressBarManager().destroy();
		},
		getProgressBarManager(): ProgressBarManager
		{
			return this.progressBarManager;
		},
	},
	template: `
		<div class="bx-im-progress-bar__container" ref="progress-bar"></div>
	`,
};
