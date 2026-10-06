import { TextSm } from 'ui.system.typography.vue';

const RING_SIZE = 251;
const RING_STROKE = 36;
const MAX_TURNS = 2;

export function getApplicationLimitRingTurns(value: number, max: number): number
{
	if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0)
	{
		return 0;
	}

	return Math.min(Math.max(value / max, 0), MAX_TURNS);
}

function rampColor(progress: number): string
{
	const normalizedProgress = Math.max(0, Math.min(progress, 1));
	if (normalizedProgress <= 0.45)
	{
		const warningPart = (normalizedProgress / 0.45 * 100).toFixed(1);

		return `color-mix(in srgb, var(--ui-color-accent-main-warning) ${warningPart}%, var(--ui-color-accent-soft-orange-1))`;
	}

	const alertPart = ((normalizedProgress - 0.45) / 0.55 * 100).toFixed(1);

	return `color-mix(in srgb, var(--ui-color-accent-main-alert) ${alertPart}%, var(--ui-color-accent-main-warning))`;
}

function createRingMask(fraction: number): string
{
	const radius = (RING_SIZE - RING_STROKE) / 2;
	const circumference = 2 * Math.PI * radius;
	const center = RING_SIZE / 2;
	const dash = circumference * Math.max(0, Math.min(fraction, 1));
	const svg = [
		`<svg xmlns='http://www.w3.org/2000/svg' width='${RING_SIZE}' height='${RING_SIZE}' viewBox='0 0 ${RING_SIZE} ${RING_SIZE}'>`,
		`<circle cx='${center}' cy='${center}' r='${radius}' fill='none' stroke='white' stroke-width='${RING_STROKE}' `,
		`stroke-linecap='butt' stroke-dasharray='${dash} ${circumference}' stroke-dashoffset='0' `,
		`transform='rotate(-90 ${center} ${center})'/></svg>`,
	].join('');

	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export const AppsProgressRing = {
	name: 'MarketVibePlusAppsProgressRing',
	inheritAttrs: false,
	components: {
		TextSm,
	},
	props: {
		value: {
			type: Number,
			required: true,
		},
		max: {
			type: Number,
			required: true,
		},
		label: {
			type: String,
			required: true,
		},
		caption: {
			type: String,
			required: true,
		},
	},
	data(): Object
	{
		return {
			isOpeningAnimationActive: true,
		};
	},
	computed: {
		effectiveTurns(this: any): number
		{
			return getApplicationLimitRingTurns(this.value, this.max);
		},
		seamProgress(this: any): number
		{
			return this.effectiveTurns > 0
				? Math.min(1 / this.effectiveTurns, 1)
				: 1;
		},
		lapFraction(this: any): number
		{
			return Math.max(this.effectiveTurns - 1, 0);
		},
		baseStyle(this: any): Object
		{
			return {
				background: `conic-gradient(from 0deg, ${rampColor(0)} 0%, ${rampColor(this.seamProgress * 0.5)} 50%, ${rampColor(this.seamProgress)} 100%)`,
				maskImage: createRingMask(Math.min(this.effectiveTurns, 1)),
				WebkitMaskImage: createRingMask(Math.min(this.effectiveTurns, 1)),
			};
		},
		lapStyle(this: any): Object
		{
			return {
				background: `conic-gradient(from 0deg, ${rampColor(this.seamProgress)} 0%, var(--ui-color-accent-main-alert) ${(this.lapFraction * 100).toFixed(1)}%, ${rampColor(this.seamProgress)} 100%)`,
				maskImage: createRingMask(this.lapFraction),
				WebkitMaskImage: createRingMask(this.lapFraction),
			};
		},
		tipStyle(this: any): Object
		{
			const radius = (RING_SIZE - RING_STROKE) / 2;
			const center = RING_SIZE / 2;
			const leadTurns = this.effectiveTurns <= 1
				? this.effectiveTurns
				: this.effectiveTurns - 1;
			const angle = leadTurns * 2 * Math.PI;

			return {
				left: `${center + radius * Math.sin(angle) - RING_STROKE / 2}px`,
				top: `${center - radius * Math.cos(angle) - RING_STROKE / 2}px`,
				background: rampColor(1),
			};
		},
	},
	methods: {
		handleOpeningAnimationEnd(this: any): void
		{
			this.isOpeningAnimationActive = false;
		},
	},
	template: `
		<div
			class="market-vibe-plus-application-limit-popup__ring"
			role="img"
			:aria-label="label"
			v-bind="$attrs"
		>
			<div
				:class="[
					'market-vibe-plus-application-limit-popup__ring-track',
					{ '--opening': isOpeningAnimationActive },
				]"
				@animationend="handleOpeningAnimationEnd"
			>
				<div
					class="market-vibe-plus-application-limit-popup__ring-base"
					:style="baseStyle"
				></div>
				<div
					v-if="lapFraction > 0"
					class="market-vibe-plus-application-limit-popup__ring-lap"
					:style="lapStyle"
				></div>
				<div
					v-if="effectiveTurns > 0"
					class="market-vibe-plus-application-limit-popup__ring-tip"
					:style="tipStyle"
				></div>
			</div>
			<div class="market-vibe-plus-application-limit-popup__ring-center">
				<div class="market-vibe-plus-application-limit-popup__ring-value">
					{{ value }}/{{ max }}
				</div>
				<TextSm
					className="market-vibe-plus-application-limit-popup__ring-caption"
					accent
					tag="div"
				>
					{{ caption }}
				</TextSm>
			</div>
		</div>
	`,
};
