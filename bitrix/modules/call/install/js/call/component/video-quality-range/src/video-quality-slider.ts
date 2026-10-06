import { Event, Dom } from 'main.core';
import { defineComponent, type PropType } from 'ui.vue3';
import { type VideoQualityItem } from './index';
import './css/styles.css';

type Mark = { index: number; position: number };
type CSSStyle = { left: string; transform?: string };

export const VideoQualitySlider = defineComponent({
	name: 'VideoQualitySlider',
	props: {
		title: {
			type: String,
			required: true,
		},
		videoQualityList: {
			type: Array as PropType<VideoQualityItem[]>,
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
	data(): { currentIndex: number; isDragging: boolean; dragRect: DOMRect | null }
	{
		return {
			currentIndex: 0,
			isDragging: false,
			dragRect: null,
		};
	},
	computed: {
		thumbStyle(): CSSStyle
		{
			const position = this.getThumbPosition();

			return {
				left: `${position}%`,
			};
		},
		currentLabel(): string
		{
			return this.videoQualityList[this.currentIndex]?.label ?? '';
		},
		marks(): Mark[]
		{
			if (this.videoQualityList.length < 2)
			{
				return [];
			}

			return this.videoQualityList.map((_item, index) => ({
				index,
				position: (index / (this.videoQualityList.length - 1)) * 100,
			}));
		},
	},
	watch: {
		defaultHeight: {
			handler(height: number): void
			{
				const index = this.videoQualityList.findIndex((item) => item.height === height);

				if (index !== -1)
				{
					this.currentIndex = index;
				}
			},
			immediate: true,
		},
	},
	beforeUnmount(): void
	{
		Event.unbind(document, 'mousemove', this.handleMouseMove);
		Event.unbind(document, 'mouseup', this.handleMouseUp);
		Dom.style(document.body, 'user-select', '');
	},
	methods: {
		getThumbPosition(): number
		{
			if (this.videoQualityList.length < 2)
			{
				return 0;
			}

			return (this.currentIndex / (this.videoQualityList.length - 1)) * 100;
		},

		getLabelPosition(index: number): string
		{
			if (this.videoQualityList.length < 2)
			{
				return '0%';
			}

			return `${(index / (this.videoQualityList.length - 1)) * 100}%`;
		},

		getLabelStyle(index: number): CSSStyle
		{
			const position = this.getLabelPosition(index);

			return {
				left: position,
				transform: 'none',
			};
		},

		getClosestIndex(percentage: number): number
		{
			const index = Math.round((percentage / 100) * (this.videoQualityList.length - 1));

			return Math.max(0, Math.min(this.videoQualityList.length - 1, index));
		},

		handleTrackClick(event: MouseEvent): void
		{
			if (this.disabled)
			{
				return;
			}
			const track = this.$refs.track as HTMLElement;
			const rect = track.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const percentage = (x / rect.width) * 100;
			const index = this.getClosestIndex(percentage);

			if (index !== this.currentIndex)
			{
				this.currentIndex = index;
				this.$emit('change', this.videoQualityList[index].value);
			}
		},

		handleLabelClick(index: number): void
		{
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

		handleThumbMouseDown(event: MouseEvent): void
		{
			if (event.button !== 0)
			{
				return;
			}

			if (this.disabled)
			{
				return;
			}

			this.isDragging = true;
			const track = this.$refs.track as HTMLElement;
			this.dragRect = track.getBoundingClientRect();

			Event.bind(document, 'mousemove', this.handleMouseMove);
			Event.bind(document, 'mouseup', this.handleMouseUp);
			Dom.style(document.body, 'user-select', 'none');

			event.preventDefault();
		},

		handleMouseMove(event: MouseEvent): void
		{
			if (!this.isDragging || !this.dragRect)
			{
				return;
			}

			const x = event.clientX - this.dragRect.left;
			const percentage = Math.max(0, Math.min(100, (x / this.dragRect.width) * 100));
			const index = this.getClosestIndex(percentage);

			if (index !== this.currentIndex)
			{
				this.currentIndex = index;
			}
		},

		handleThumbKeydown(event: KeyboardEvent): void
		{
			if (this.disabled)
			{
				return;
			}

			let newIndex = this.currentIndex;

			switch (event.key)
			{
				case 'ArrowRight':
				case 'ArrowUp':
					newIndex = Math.min(this.videoQualityList.length - 1, this.currentIndex + 1);
					event.preventDefault();
					break;
				case 'ArrowLeft':
				case 'ArrowDown':
					newIndex = Math.max(0, this.currentIndex - 1);
					event.preventDefault();
					break;
				case 'Home':
					newIndex = 0;
					event.preventDefault();
					break;
				case 'End':
					newIndex = this.videoQualityList.length - 1;
					event.preventDefault();
					break;
				default:
					return;
			}

			if (newIndex !== this.currentIndex)
			{
				this.currentIndex = newIndex;
				this.$emit('change', this.videoQualityList[newIndex].value);
			}
		},

		handleLabelKeydown(index: number, event: KeyboardEvent): void
		{
			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				this.handleLabelClick(index);
			}
		},

		handleMouseUp(): void
		{
			if (this.isDragging)
			{
				this.$emit('change', this.videoQualityList[this.currentIndex].value);
			}

			this.isDragging = false;
			this.dragRect = null;
			Event.unbind(document, 'mousemove', this.handleMouseMove);
			Event.unbind(document, 'mouseup', this.handleMouseUp);
			Dom.style(document.body, 'user-select', '');
		},
	},
	template: `
		<div class="bx-2-call-view-video-quality-container" :class="{ 'is-disabled': disabled }" data-testid="video-quality-slider">
			<div class="bx-2-call-view-video-quality-title">
				<div class="bx-2-call-view-video-quality-title-icon" aria-hidden="true"></div>
				<span class="bx-2-call-view-video-quality-title-text">{{ title }}</span>
			</div>

			<div class="bx-2-call-view-video-quality">
				<div
					ref="track"
					class="bx-2-call-view-video-quality-track"
					data-testid="video-quality-slider-track"
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
						role="slider"
						:tabindex="disabled ? -1 : 0"
						:aria-label="title"
						aria-orientation="horizontal"
						:aria-valuemin="0"
						:aria-valuemax="videoQualityList.length - 1"
						:aria-valuenow="currentIndex"
						:aria-valuetext="currentLabel"
						:aria-disabled="disabled ? 'true' : undefined"
						data-testid="video-quality-slider-thumb"
						@mousedown="handleThumbMouseDown"
						@keydown="handleThumbKeydown"
					></div>
				</div>

				<div class="bx-2-call-view-video-quality-labels">
					<div
						v-for="(item, index) in videoQualityList"
						:key="item.value"
						class="bx-2-call-view-video-quality-label"
						:class="{ active: currentIndex === index }"
						:style="getLabelStyle(index)"
						role="button"
						:tabindex="disabled ? -1 : 0"
						:aria-disabled="disabled ? 'true' : undefined"
						data-testid="video-quality-slider-label"
						@click="handleLabelClick(index)"
						@keydown="handleLabelKeydown(index, $event)"
					>
						{{ item.label }}
					</div>
				</div>
			</div>
		</div>
	`,
});
