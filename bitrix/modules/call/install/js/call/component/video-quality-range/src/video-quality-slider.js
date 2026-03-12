import './css/styles.css';

// @vue/component
const VideoQualitySlider = {
	name: 'VideoQualitySlider',
	props: {
		title: {
			type: String,
			required: true,
		},
		videoQualityList: {
			type: Array,
			required: true,
		},
		defaultHeight: {
			type: Number,
			default: 0,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['change'],
	// eslint-disable-next-line flowtype/require-return-type
	data() {
		return {
			currentIndex: 0,
			isDragging: false,
			dragRect: null,
		};
	},
	computed: {
		// eslint-disable-next-line flowtype/require-return-type
		thumbStyle() {
			const position = this.getThumbPosition();

			return {
				left: `${position}%`,
			};
		},
		// eslint-disable-next-line flowtype/require-return-type
		marks() {
			if (this.videoQualityList.length < 2)
			{
				return [];
			}

			return this.videoQualityList.map((item, index) => ({
				index,
				position: (index / (this.videoQualityList.length - 1)) * 100,
			}));
		},
	},
	watch: {
		defaultHeight: {
			handler(height) {
				const index = this.videoQualityList.findIndex((item) => item.height === height);

				if (index !== -1)
				{
					this.currentIndex = index;
				}
			},
			immediate: true,
		},
	},
	beforeUnmount() {
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		document.removeEventListener('mousemove', this.handleMouseMove);
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		document.removeEventListener('mouseup', this.handleMouseUp);
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-style
		document.body.style.userSelect = '';
	},
	methods: {
		// eslint-disable-next-line flowtype/require-return-type
		getThumbPosition() {
			if (this.videoQualityList.length < 2)
			{
				return 0;
			}

			return (this.currentIndex / (this.videoQualityList.length - 1)) * 100;
		},

		getLabelPosition(index): string {
			if (this.videoQualityList.length < 2)
			{
				return '0%';
			}

			return `${(index / (this.videoQualityList.length - 1)) * 100}%`;
		},

		// eslint-disable-next-line flowtype/require-return-type
		getLabelStyle(index) {
			const position = this.getLabelPosition(index);

			return {
				left: position,
				transform: 'none',
			};
		},

		getClosestIndex(percentage): number {
			const index = Math.round((percentage / 100) * (this.videoQualityList.length - 1));

			return Math.max(0, Math.min(this.videoQualityList.length - 1, index));
		},

		handleTrackClick(e) {
			if (this.disabled)
			{
				return;
			}
			const rect = this.$refs.track.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const percentage = (x / rect.width) * 100;
			const index = this.getClosestIndex(percentage);

			if (index !== this.currentIndex)
			{
				this.currentIndex = index;
				this.$emit('change', this.videoQualityList[index].value);
			}
		},

		handleLabelClick(index) {
			if (this.disabled)
			{
				return;
			}

			if (index !== this.currentIndex)
			{
				this.currentIndex = index;
				this.$emit('change', this.videoQualityList[index].value);
			}
		},

		handleThumbMouseDown(e) {
			if (e.button !== 0)
			{
				return;
			}

			if (this.disabled)
			{
				return;
			}

			this.isDragging = true;
			this.dragRect = this.$refs.track.getBoundingClientRect();

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			document.addEventListener('mousemove', this.handleMouseMove);
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			document.addEventListener('mouseup', this.handleMouseUp);
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-style
			document.body.style.userSelect = 'none';

			e.preventDefault();
		},

		handleMouseMove(e) {
			if (!this.isDragging)
			{
				return;
			}

			const x = e.clientX - this.dragRect.left;
			const percentage = Math.max(0, Math.min(100, (x / this.dragRect.width) * 100));
			const index = this.getClosestIndex(percentage);

			if (index !== this.currentIndex)
			{
				this.currentIndex = index;
			}
		},

		handleMouseUp() {
			if (this.isDragging)
			{
				this.$emit('change', this.videoQualityList[this.currentIndex].value);
			}

			this.isDragging = false;
			this.dragRect = null;
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			document.removeEventListener('mousemove', this.handleMouseMove);
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			document.removeEventListener('mouseup', this.handleMouseUp);
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-style
			document.body.style.userSelect = '';
		},
	},
	template: `
		<div class="bx-2-call-view-video-quality-container" :class="{ 'is-disabled': disabled }">
			<div class="bx-2-call-view-video-quality-title">
				<div class="bx-2-call-view-video-quality-title-icon"></div>
				<span class="bx-2-call-view-video-quality-title-text">{{ title }}</span>
			</div>

			<div class="bx-2-call-view-video-quality">
				<div
					ref="track"
					class="bx-2-call-view-video-quality-track"
					@click="handleTrackClick"
				>
					<div
						v-for="mark in marks"
						:key="mark.index"
						class="bx-2-call-view-video-quality-mark"
						:style="{ left: mark.position + '%' }"
					></div>
	
					<div
						class="bx-2-call-view-video-quality-thumb"
						:style="thumbStyle"
						@mousedown="handleThumbMouseDown"
					></div>
				</div>

				<div class="bx-2-call-view-video-quality-labels">
					<div
						v-for="(item, index) in videoQualityList"
						:key="item.value"
						class="bx-2-call-view-video-quality-label"
						:class="{ active: currentIndex === index }"
						:style="getLabelStyle(index)"
						@click="handleLabelClick(index)"
					>
						{{ item.label }}
					</div>
				</div>
			</div>
		</div>
	`,
};

export { VideoQualitySlider };
