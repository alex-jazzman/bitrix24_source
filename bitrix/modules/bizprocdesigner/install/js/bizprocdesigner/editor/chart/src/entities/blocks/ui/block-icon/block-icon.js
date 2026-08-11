import { Runtime } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { useBlockDiagram } from 'ui.block-diagram';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toValue, watch } from 'ui.vue3';

import { getAnimationData } from './animations';

import './block-icon.css';

type BlockIconSetup = {
	iconClassNames: { [string]: boolean };
	lottieContainerRef: { value: ?HTMLElement };
	isLottieActive: { value: boolean };
	lottieStyle: { value: { width: string, height: string } };
	getIconName: (name: ?string) => string;
	getIconColor: (colorIndex: ?Number) => ?string;
};

const ICON_CLASS_NAMES = {
	base: 'editor-chart-block-icon',
	deactivated: '--deactivated',
	lottiePlaying: '--lottie-playing',
};

const ICON_BG_COLOR_CLASS_NAMES = {
	bgColor_1: '--background-color-1',
	bgColor_2: '--background-color-2',
	bgColor_3: '--background-color-3',
	bgColor_4: '--background-color-4',
	bgColor_5: '--background-color-5',
	bgColor_6: '--background-color-6',
	bgColor_7: '--background-color-7',
	bgColor_8: '--background-color-8',
	bgColor_9: '--background-color-9',
};

const ICON_COLORS = {
	0: 'var(--designer-bp-ai-icons)',
	1: 'var(--designer-bp-entities-icons)',
	2: 'var(--designer-bp-employe-icons)',
	3: 'var(--designer-bp-technical-icons)',
	4: 'var(--designer-bp-communication-icons)',
	5: 'var(--designer-bp-storage-icons)',
	6: 'var(--designer-bp-afiliate-icons)',
	7: 'var(--ui-color-palette-white-base)',
	8: 'var(--ui-color-palette-white-base)',
};

const DEFAULT_ICON_NAME = Outline.FILE;
const ANIMATION_START_DELAY_MS = 300;
const ANIMATION_DESTROY_DELAY_MS = 200;
const MARK_CLEANUP_DELAY_MS = 500;

const animatedBlockIds: Set<string> = new Set();
const markCleanupTimers: Map<string, number> = new Map();

// @vue/component
export const BlockIcon = {
	name: 'block-icon',
	components: {
		BIcon,
	},
	props: {
		iconName: {
			type: String,
			default: DEFAULT_ICON_NAME,
		},
		iconColorIndex: {
			type: Number,
			default: 0,
		},
		customColor: {
			type: String,
			default: null,
		},
		iconSize: {
			type: Number,
			default: 32,
		},
		deactivated: {
			type: Boolean,
			default: false,
		},
		blockId: {
			type: String,
			default: null,
		},
		animate: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): BlockIconSetup
	{
		const iconSet = Outline;
		const lottieContainerRef = ref(null);
		const isLottieActive = ref(false);

		const { blockIntersections } = useBlockDiagram();

		const isInViewport = computed(() => {
			if (!props.blockId)
			{
				return false;
			}

			return toValue(blockIntersections.visibleBlockIds).has(props.blockId);
		});

		const lottieStyle = computed(() => ({
			width: `${props.iconSize}px`,
			height: `${props.iconSize}px`,
		}));

		const iconClassNames = computed(() => {
			const bgColorClassNamesMap = Object.keys(ICON_BG_COLOR_CLASS_NAMES)
				.reduce((bgColorMap, key, index) => {
					return {
						...bgColorMap,
						[ICON_BG_COLOR_CLASS_NAMES[key]]: props.iconColorIndex === index && !props.deactivated,
					};
				}, {});

			return {
				[ICON_CLASS_NAMES.base]: true,
				[ICON_CLASS_NAMES.deactivated]: props.deactivated,
				[ICON_CLASS_NAMES.lottiePlaying]: isLottieActive.value,
				...bgColorClassNamesMap,
			};
		});

		function getIconName(name: ?string): string
		{
			if (name && Object.prototype.hasOwnProperty.call(iconSet, name))
			{
				return iconSet[name];
			}

			return DEFAULT_ICON_NAME;
		}

		function getIconColor(colorIndex: ?Number): ?string
		{
			if (colorIndex !== false && ICON_COLORS[colorIndex])
			{
				return ICON_COLORS[colorIndex];
			}

			return null;
		}

		let isUnmounted = false;
		let lottieInstance = null;
		let startDelayTimer = null;
		let destroyDelayTimer = null;

		function destroyLottie(): void
		{
			if (lottieInstance)
			{
				lottieInstance.destroy();
				lottieInstance = null;
			}
			isLottieActive.value = false;
		}

		function clearStartTimer(): void
		{
			if (startDelayTimer !== null)
			{
				clearTimeout(startDelayTimer);
				startDelayTimer = null;
			}
		}

		function clearDestroyDelayTimer(): void
		{
			if (destroyDelayTimer !== null)
			{
				clearTimeout(destroyDelayTimer);
				destroyDelayTimer = null;
			}
		}

		function cancelPlaybackIfInterrupted(): boolean
		{
			if (!isUnmounted && isInViewport.value && lottieContainerRef.value)
			{
				return false;
			}

			isLottieActive.value = false;

			return true;
		}

		async function playAnimation(animationData: Object): Promise<void>
		{
			isLottieActive.value = true;
			await nextTick();
			if (cancelPlaybackIfInterrupted())
			{
				return;
			}

			const { Lottie } = await Runtime.loadExtension('ui.lottie');
			if (cancelPlaybackIfInterrupted())
			{
				return;
			}

			lottieInstance = Lottie.loadAnimation({
				container: lottieContainerRef.value,
				animationData,
				loop: false,
				autoplay: true,
				renderer: 'svg',
				rendererSettings: {
					viewBoxOnly: true,
				},
			});

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			lottieInstance.addEventListener('complete', destroyLottie);
		}

		onMounted(() => {
			const pendingCleanup = markCleanupTimers.get(props.blockId);
			if (pendingCleanup !== undefined)
			{
				clearTimeout(pendingCleanup);
				markCleanupTimers.delete(props.blockId);
			}
		});

		watch(isInViewport, (isVisible: boolean, wasVisible: ?boolean) => {
			if (!isVisible && !wasVisible)
			{
				return;
			}

			if (!isVisible)
			{
				clearDestroyDelayTimer();
				destroyDelayTimer = setTimeout(() => {
					destroyDelayTimer = null;
					clearStartTimer();
					destroyLottie();
					animatedBlockIds.delete(props.blockId);
				}, ANIMATION_DESTROY_DELAY_MS);

				return;
			}

			if (destroyDelayTimer !== null)
			{
				clearDestroyDelayTimer();

				return;
			}

			if (!props.animate || props.deactivated)
			{
				return;
			}

			if (animatedBlockIds.has(props.blockId))
			{
				return;
			}

			const animationData = getAnimationData(props.iconName);
			if (!animationData)
			{
				return;
			}

			animatedBlockIds.add(props.blockId);
			clearStartTimer();
			startDelayTimer = setTimeout(async () => {
				startDelayTimer = null;
				if (isUnmounted)
				{
					return;
				}

				try
				{
					await playAnimation(animationData);
				}
				catch (error)
				{
					console.error('BlockIcon: failed to play Lottie animation', error);
					destroyLottie();
				}
			}, ANIMATION_START_DELAY_MS);
		}, { immediate: true });

		onBeforeUnmount(() => {
			isUnmounted = true;
			clearStartTimer();
			clearDestroyDelayTimer();
			destroyLottie();

			if (props.blockId && animatedBlockIds.has(props.blockId))
			{
				const timer = setTimeout(() => {
					animatedBlockIds.delete(props.blockId);
					markCleanupTimers.delete(props.blockId);
				}, MARK_CLEANUP_DELAY_MS);
				markCleanupTimers.set(props.blockId, timer);
			}
		});

		return {
			iconClassNames,
			lottieContainerRef,
			isLottieActive,
			lottieStyle,
			getIconName,
			getIconColor,
		};
	},
	template: `
		<div :class="iconClassNames">
			<BIcon
				:name="getIconName(iconName)"
				:size="iconSize"
				:color="customColor || getIconColor(iconColorIndex)"
				class="editor-chart-block-icon__icon"
			/>
			<div
				v-if="isLottieActive"
				ref="lottieContainerRef"
				class="editor-chart-block-icon__lottie"
				:style="lottieStyle"
			/>
		</div>
	`,
};
