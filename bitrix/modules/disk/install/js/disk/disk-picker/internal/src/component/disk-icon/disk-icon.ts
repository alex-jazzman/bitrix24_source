import 'main.polyfill.intersectionobserver';
import { DiskIcon } from 'ui.icon-set.api.disk';
import { defineComponent, markRaw } from 'ui.vue3';

// Same viewport window the design-system lazy loader uses, so a preview starts
// loading at the moment it did before.
const PREVIEW_OBSERVER_OPTIONS: IntersectionObserverInit = {
	root: null,
	rootMargin: '50px',
	threshold: 0.1,
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
	},
	data(): { icon: DiskIcon | null, previewObserver: IntersectionObserver | null }
	{
		return { icon: null, previewObserver: null };
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
			this.stopPreviewObserver();
			this.icon?.setPreviewUrl(null);
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
		this.icon = icon;
		this.observePreview();
	},
	beforeUnmount(): void
	{
		this.stopPreviewObserver();
		this.icon?.destroy();
		this.icon = null;
	},
	methods: {
		observePreview(): void
		{
			const url = this.previewUrl ?? null;
			const node = this.$el as HTMLElement | null;
			if (url === null || !node)
			{
				return;
			}

			const observer = new IntersectionObserver((entries) => {
				if (!entries.some((entry) => entry.isIntersecting))
				{
					return;
				}

				this.stopPreviewObserver();
				this.icon?.setPreviewUrl(url);
			}, PREVIEW_OBSERVER_OPTIONS);

			observer.observe(node);
			this.previewObserver = markRaw(observer);
		},
		stopPreviewObserver(): void
		{
			this.previewObserver?.disconnect();
			this.previewObserver = null;
		},
	},
	template: `
		<span class="disk-picker-disk-icon"></span>
	`,
});
