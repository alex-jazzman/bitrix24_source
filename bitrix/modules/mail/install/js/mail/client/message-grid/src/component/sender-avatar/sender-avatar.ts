import { defineComponent, markRaw, type PropType } from 'ui.vue3';

import { protectedImageFor } from '../../infrastructure/service/sender-avatar/protected-image';
import { useGridStore } from '../../model/grid/grid';
import {
	type SenderAvatar as SenderAvatarParams,
	type SenderAvatarFallback,
} from '../../model/grid/types';

import './sender-avatar.css';

/**
 * Half the height, corrected so that the glyphs sit on the middle line of a circle of an odd size -
 * the rule the avatar of a contact has always been drawn by.
 */
function resolveInitialsFontSize(size: number): number
{
	const half = Math.floor(size / 2);

	return half - Math.abs((size % 2) - (half % 2));
}

/**
 * The address reaches the style as a CSS string in quotes. `encodeURI` covers every character that
 * could end one except the quote itself, so that one is spelled out. The old template of the avatar
 * had the same by way of `Uri::urnEncode`.
 */
function encodeAvatarUrl(src: string): string
{
	return encodeURI(src).replaceAll("'", '%27');
}

type VisibilityListener = (visible: boolean) => void;
type SharedVisibilityObserver = {
	observer: IntersectionObserver;
	listeners: Map<Element, VisibilityListener>;
};

const visibilityObservers = new WeakMap<object, SharedVisibilityObserver>();

function observeProtectedAvatar(resource: object, element: Element, listener: VisibilityListener): () => void
{
	if (!globalThis.IntersectionObserver)
	{
		listener(true);

		return () => {};
	}

	let shared = visibilityObservers.get(resource);
	if (!shared)
	{
		const listeners = new Map<Element, VisibilityListener>();
		shared = {
			listeners,
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-io-without-polyfill -- Missing API loads immediately.
			observer: new IntersectionObserver((entries) => {
				for (const entry of entries)
				{
					listeners.get(entry.target)?.(entry.isIntersecting);
				}
			}),
		};
		visibilityObservers.set(resource, shared);
	}

	shared.listeners.set(element, listener);
	shared.observer.observe(element);

	return () => {
		shared.listeners.delete(element);
		shared.observer.unobserve(element);
		if (shared.listeners.size === 0)
		{
			shared.observer.disconnect();
			visibilityObservers.delete(resource);
		}
	};
}

/**
 * The avatar of the sender, in the three shapes the server chooses between. The design system draws
 * an avatar of its own, on another scale and with an outline of its own, and the row of the list may
 * not change - so the shapes below are kept.
 */
// @vue/component
export const SenderAvatar = defineComponent({
	name: 'MailMessageGridSenderAvatar',

	props: {
		avatar: {
			type: Object as PropType<SenderAvatarParams>,
			required: true,
		},
	},

	setup()
	{
		return {
			images: markRaw(protectedImageFor(useGridStore())),
		};
	},

	data()
	{
		return {
			requestedAvatar: null as SenderAvatarParams | null,
			requestedSrc: null as string | null,
			requestedCacheIdentity: null as string | null,
			loadedSrc: null as string | null,
			imageFailed: false,
			requestId: 0,
			startedRequestId: -1,
			isMounted: false,
			isVisible: false,
			stopObserving: null as (() => void) | null,
		};
	},

	computed: {
		displayAvatar(): SenderAvatarFallback
		{
			if (this.avatar.protected)
			{
				if (this.loadedSrc && !this.imageFailed)
				{
					return { kind: 'image', size: this.avatar.size };
				}

				return this.avatar.fallback ?? { kind: 'default', size: this.avatar.size };
			}

			return this.avatar;
		},

		modifierClass(): string
		{
			return `--${this.displayAvatar.kind}`;
		},

		/**
		 * The size travels as a number and reaches the markup as a box: the circle holds its width in a
		 * row of flexible cells, and the initials sit on the middle line of it.
		 */
		boxStyle(): Record<string, string>
		{
			const size = `${this.displayAvatar.size}px`;
			const style: Record<string, string> = {
				width: size,
				minWidth: size,
				height: size,
				minHeight: size,
				fontSize: `${resolveInitialsFontSize(this.displayAvatar.size)}px`,
				lineHeight: size,
			};

			if (this.displayAvatar.kind === 'image' && this.displayAvatar.src)
			{
				style.backgroundImage = `url('${encodeAvatarUrl(this.displayAvatar.src)}')`;
				style.backgroundSize = `${size} ${size}`;
			}

			if (this.displayAvatar.kind === 'initials' && this.displayAvatar.color)
			{
				style.backgroundColor = this.displayAvatar.color;
			}

			return style;
		},

		initials(): string
		{
			return this.displayAvatar.kind === 'initials' ? (this.displayAvatar.initials ?? '') : '';
		},
	},

	watch: {
		avatar: {
			immediate: true,
			deep: true,
			handler(): void
			{
				this.updateImage();
			},
		},
	},

	mounted(): void
	{
		this.isMounted = true;
		this.syncVisibility();
	},

	beforeUnmount(): void
	{
		this.isMounted = false;
		this.requestId += 1;
		this.stopObserving?.();
		this.stopObserving = null;
	},

	methods: {
		updateImage(): void
		{
			if (
				this.requestedAvatar === this.avatar
				&& this.requestedSrc === this.avatar.src
				&& this.requestedCacheIdentity === (this.avatar.cacheIdentity ?? null)
			)
			{
				return;
			}

			this.requestedAvatar = this.avatar;
			this.requestedSrc = this.avatar.src ?? null;
			this.requestedCacheIdentity = this.avatar.cacheIdentity ?? null;
			this.requestId += 1;
			this.loadedSrc = null;
			this.imageFailed = false;
			this.syncVisibility();
			if (this.isVisible)
			{
				void this.loadImage();
			}
		},

		syncVisibility(): void
		{
			if (!this.isMounted)
			{
				return;
			}

			if (!this.avatar.protected || !this.avatar.src)
			{
				this.stopObserving?.();
				this.stopObserving = null;
				this.isVisible = false;

				return;
			}

			if (!this.stopObserving)
			{
				this.stopObserving = observeProtectedAvatar(this.images, this.$el as Element, (visible) => {
					if (!this.isMounted)
					{
						return;
					}

					this.isVisible = visible;
					if (visible)
					{
						void this.loadImage();
					}
				});
			}
		},

		async loadImage(): Promise<void>
		{
			if (
				!this.isMounted
				|| !this.isVisible
				|| !this.avatar.protected
				|| !this.avatar.src
				|| this.startedRequestId === this.requestId
			)
			{
				return;
			}

			const requestId = this.requestId;
			this.startedRequestId = requestId;
			const src = this.avatar.src;
			const loadedSrc = await this.images.load(src, this.avatar.cacheIdentity);
			if (this.isMounted && requestId === this.requestId && this.avatar.src === src)
			{
				this.loadedSrc = loadedSrc;
			}
		},

		handleImageError(): void
		{
			this.imageFailed = true;
		},
	},

	template: `
		<span class="mail-message-grid-avatar" :class="modifierClass" :style="boxStyle" :data-testid="avatar.protected ? 'mail-list-sender-avatar-protected' : null">{{ initials }}<img
				v-if="avatar.protected && loadedSrc && !imageFailed"
				class="mail-message-grid-avatar__image"
				:src="loadedSrc"
				alt=""
				@error="handleImageError"
			></span>
	`,
});
