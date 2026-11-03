import 'main.polyfill.intersectionobserver';
import { Dom } from 'main.core';
import { DiskIcon } from 'ui.icon-set.api.disk';
import { Line as SkeletonLine } from 'ui.system.skeleton';
import { defineComponent, markRaw } from 'ui.vue3';

import { enqueuePreview } from '../../lib/preview-load-queue/preview-load-queue';

import './disk-icon.css';

// Same viewport window the design-system lazy loader uses, so a preview starts
// loading at the moment it did before.
// The corner of the placeholder repeats the thumbnail's own, --ui-border-radius-xs.
const PREVIEW_PLACEHOLDER_RADIUS = 6;

const PREVIEW_OBSERVER_OPTIONS: IntersectionObserverInit = {
	root: null,
	rootMargin: '50px',
	threshold: 0.1,
};

type DiskIconData = {
	icon: DiskIcon | null,
	previewObserver: IntersectionObserver | null,
	cancelPreviewLoad: (() => void) | null,
	previewImage: HTMLImageElement | null,
	previewPlaceholder: HTMLElement | null,
};

// Thin Vue shell over the vanilla `DiskIcon` class. The design-system Vue wrapper
// (`ui.icon-set.api.disk` BDiskIcon) stores its DiskIcon instance in reactive
// `data`, so Vue proxies it and the class's private `#` fields throw a TypeError
// on access from `renderOnNode`/`mounted`, which aborts the whole mounted queue.
// Here the instance is created in `mounted` and kept non-reactive via `markRaw`,
// updated through watchers and released in `beforeUnmount`.
//
// The preview url is withheld from DiskIcon until the row scrolls into view: given
// one upfront, DiskIcon registers the node in the shared LazyLoadManager, which
// offers no way to stop observing, so rows dropped by navigation before they were
// ever seen stay referenced by its IntersectionObserver. Owning the observation
// here means `beforeUnmount` can end it.
export const DiskIconView = defineComponent({
	name: 'DiskPickerDiskIcon',
	props: {
		type: {
			type: String,
			default: 'file',
		},
		size: {
			type: Number,
			default: 24,
		},
		previewUrl: {
			type: String,
			default: null,
		},
		// Set by the owners that outlive a feed change - the picked set. A feed row is
		// replaced along with the feed and its unfinished thumbnail is dropped; an icon
		// that stays on screen keeps the same url, so its observer never fires again and
		// a dropped load would never be asked for a second time.
		keepPreviewOnFeedChange: {
			type: Boolean,
			default: false,
		},
	},
	data(): DiskIconData
	{
		return {
			icon: null,
			previewObserver: null,
			cancelPreviewLoad: null,
			previewImage: null,
			previewPlaceholder: null,
		};
	},
	watch: {
		type(): void
		{
			this.icon?.setType(this.type);
		},
		size(): void
		{
			this.icon?.setSize(this.size);
		},
		previewUrl(): void
		{
			this.resetPreview();
			this.observePreview();
		},
	},
	mounted(): void
	{
		const icon = markRaw(new DiskIcon({
			type: this.type,
			size: this.size,
			previewUrl: null,
		}));
		icon.renderOnNode(this.$el as HTMLElement);
		Dom.addClass(this.$el as HTMLElement, 'disk-picker-disk-icon');
		this.icon = icon;
		this.observePreview();
	},
	beforeUnmount(): void
	{
		this.resetPreview();
		this.icon?.destroy();
		this.icon = null;
	},
	methods: {
		observePreview(): void
		{
			const url = this.previewUrl ?? null;
			const node = this.$el as HTMLElement | null;
			if (url === null || !node || this.icon === null)
			{
				return;
			}

			const observer = new IntersectionObserver((entries) => {
				if (!entries.some((entry) => entry.isIntersecting))
				{
					return;
				}

				this.stopPreviewObserver();
				// The placeholder goes up when the request does, not when the row is built: a row that
				// never reaches the viewport asks for no picture, and a placeholder over its glyph
				// would be a promise of something that was never coming.
				this.showPreviewPlaceholder();
				// The placeholder is taken away by the second callback rather than by the first: a
				// preview that fails, or one cancelled by navigation, never reaches the first, and the
				// placeholder would have stayed over the type glyph for good.
				this.cancelPreviewLoad = enqueuePreview(url, (image) => {
					this.cancelPreviewLoad = null;
					if (this.icon === null || this.previewUrl !== url)
					{
						return;
					}

					Dom.addClass(image, 'disk-picker-disk-icon__preview');
					Dom.attr(image, 'alt', '');
					node.append(image);
					// The thumbnail outline hangs on the wrapper, and this flag is what selects
					// it: :has() would do the same but is unsupported on our Firefox target.
					Dom.addClass(node, '--with-preview');
					this.previewImage = image;
				}, () => {
					this.hidePreviewPlaceholder();
				}, this.keepPreviewOnFeedChange);
			}, PREVIEW_OBSERVER_OPTIONS);

			observer.observe(node);
			this.previewObserver = markRaw(observer);
		},
		// A file with a thumbnail shows the type glyph until the picture arrives, and on a slow
		// connection that glyph is itself a request — the box stood empty either way. The
		// placeholder fills it from the moment the row is built until the picture is in place.
		// It is appended rather than rendered by Vue for the same reason the image is: the vanilla
		// icon rebuilds the node it draws into and would wipe anything Vue put there. The design
		// system's own vanilla skeleton draws it, in the dark context, where its fill is white.
		showPreviewPlaceholder(): void
		{
			const node = this.$el as HTMLElement | null;
			if (!node || this.previewPlaceholder || this.previewImage)
			{
				return;
			}

			const placeholder = SkeletonLine(this.size, this.size, PREVIEW_PLACEHOLDER_RADIUS);
			Dom.addClass(placeholder, 'disk-picker-disk-icon__placeholder');
			Dom.addClass(placeholder, '--ui-context-edge-dark');
			node.append(placeholder);
			this.previewPlaceholder = placeholder;
		},
		hidePreviewPlaceholder(): void
		{
			this.previewPlaceholder?.remove();
			this.previewPlaceholder = null;
		},
		stopPreviewObserver(): void
		{
			this.previewObserver?.disconnect();
			this.previewObserver = null;
		},
		resetPreview(): void
		{
			this.stopPreviewObserver();
			this.cancelPreviewLoad?.();
			this.cancelPreviewLoad = null;
			this.previewImage?.remove();
			this.previewImage = null;
			this.hidePreviewPlaceholder();
			Dom.removeClass(this.$el as HTMLElement, '--with-preview');
		},
	},
	template: `
		<span class="disk-picker-disk-icon"></span>
	`,
});
