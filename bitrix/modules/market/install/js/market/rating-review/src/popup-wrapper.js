import { Popup, PopupManager, PopupOptions } from 'main.popup';

const POPUP_CONTAINER_PREFIX = '#popup-window-content-';
const POPUP_ID_PREFIX = 'market-rating-review-popup-';
const POPUP_BORDER_RADIUS = '10px';
const LAST_POPUP_ID_STORAGE_KEY = '__bx_market_rating_review_last_popup_id';

// @vue/component
export const PopupWrapper = {
	name: 'PopupWrapper',
	emits: ['close'],
	data()
	{
		return {
			popupId: `${POPUP_ID_PREFIX}${Date.now()}-${Math.random().toString(16).slice(2)}`,
		};
	},
	computed:
	{
		popupContainer(): string
		{
			return `${POPUP_CONTAINER_PREFIX}${this.popupId}`;
		},
	},
	created()
	{
		this.instance = null;
		this.instance = this.getPopupInstance();
		this.instance.show();
	},
	mounted()
	{
		this.instance.adjustPosition({
			forceBindPosition: true,
			position: this.getConfig().bindOptions.position,
		});
	},
	beforeUnmount()
	{
		if (!this.instance)
		{
			return;
		}

		this.instance.destroy();
		this.instance = null;

		if (window[LAST_POPUP_ID_STORAGE_KEY] === this.popupId)
		{
			delete window[LAST_POPUP_ID_STORAGE_KEY];
		}
	},
	methods:
	{
		getPopupInstance(): Popup
		{
			if (!this.instance)
			{
				const lastPopupId = window[LAST_POPUP_ID_STORAGE_KEY];
				if (lastPopupId)
				{
					PopupManager.getPopupById(lastPopupId)?.destroy();
				}

				window[LAST_POPUP_ID_STORAGE_KEY] = this.popupId;

				this.instance = new Popup(this.getConfig());
			}

			return this.instance;
		},
		getConfig(): PopupOptions
		{
			return {
				id: this.popupId,
				bindOptions: {
					position: 'bottom',
				},
				width: 463,
				padding: 32,
				minHeight: 470,
				className: 'market-detail__app-rating_feedback-popup',
				cacheable: false,
				closeIcon: true,
				autoHide: true,
				closeByEsc: true,
				animation: 'fading',
				events: {
					onPopupClose: () => this.$emit('close'),
				},
				overlay: {
					backgroundColor: '#000',
					opacity: 50,
				},
				contentBorderRadius: POPUP_BORDER_RADIUS,
			};
		},
		closePopup()
		{
			this.$emit('close');
		},
	},
	template: `
		<Teleport :to="popupContainer">
			<slot></slot>
		</Teleport>
	`,
};
