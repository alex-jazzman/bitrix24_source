import { Popup, PopupManager, type PopupOptions } from 'main.popup';

export type UiPopupOptions = PopupOptions;

// @vue/components
export const UiPopup = {
	name: 'UiSocialnetworkPopup',
	props: {
		id: {
			type: String,
			required: true,
		},
		options: {
			/** @type {UiPopupOptions} */
			type: Object,
			default: () => ({}),
		},
	},
	emits: [
		'close',
	],
	expose: ['getPopupInstance'],
	setup(): { popup: ?Popup }
	{
		return {
			popup: null,
		};
	},
	computed: {
		popupContainer(): string
		{
			return `#popup-window-content-${this.id}`;
		},
		container(): HTMLElement
		{
			return this.getPopupInstance().getPopupContainer();
		},
		popupDefaultOptions(): PopupOptions
		{
			return {
				id: this.id,
				cacheable: false,
				autoHide: true,
				autoHideHandler: ({ target }) => {
					const parentAutoHide = target !== this.container && !this.container.contains(target);
					const isAhaMoment = target.closest('.popup-window-ui-tour');

					return parentAutoHide && !isAhaMoment;
				},
				bindOptions: {
					position: 'bottom',
				},
				closeByEsc: true,
				animation: 'fading',
				events: {
					onPopupClose: this.closePopup,
					onPopupDestroy: this.closePopup,
				},
			};
		},
	},
	created(): void
	{
		this.popup = this.getPopupInstance();
		this.popup?.show();
	},
	mounted(): void
	{
		this.popup?.adjustPosition({
			forceBindPosition: true,
			position: this.getPopupOptions()?.bindOptions?.position || 'bottom',
		});
	},
	beforeUnmount(): void
	{
		this.closePopup();
	},
	methods: {
		getPopupInstance(): Popup
		{
			if (!this.popup)
			{
				PopupManager.getPopupById(this.id)?.destroy();

				this.popup = new Popup(this.getPopupOptions());
			}

			return this.popup;
		},
		getPopupOptions(): PopupOptions
		{
			return {
				...this.popupDefaultOptions,
				...this.options,
			};
		},
		closePopup(): void
		{
			this.$emit('close');
			this.popup?.destroy();
			this.popup = null;
		},
	},
	template: `
		<Teleport :to="popupContainer">
			<slot/>
		</Teleport>
	`,
};
