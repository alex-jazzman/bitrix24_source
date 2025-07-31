import { type PopupOptions, type Popup as PopupInstance } from 'main.popup';
import { Type, Runtime } from 'main.core';

export type ShowPartnerOrderFormParams = {
	id: string | number;
	sec: string | number;
};

export async function showPartnerOrderForm(params: ShowPartnerOrderFormParams)
{
	if (Type.isObject(params) === false)
	{
		return;
	}

	const { Popup } = await Runtime.loadExtension('main.popup');

	const popupOptions: PopupOptions = {
		id: 'B24PartnerOrderForm',
		autoHide: true,
		noAllPaddings: true,
		zIndex: 0,
		offsetLeft: 0,
		offsetTop: 0,
		overlay: true,
		borderRadius: '10px',
		contentBorderRadius: '10px',
		disableScroll: true,
		height: Math.min(window.innerHeight - 60, 758),
		width: 560,
		draggable: { restrict: true },
		closeByEsc: true,
		contentColor: 'white',
		contentNoPaddings: true,
		cacheable: false,
		content: `
			<script data-b24-form="inline/${params.id}/${params.sec}" data-skip-moving="true">
				(function(w, d,u) {
					var s = d.createElement("script");
					s.async=true;
					s.src=u + "?" + (Date.now()/180000|0);
					var h = d.getElementsByTagName("script")[0];
					h.parentNode.insertBefore(s,h);
				})(window,document,"https://bitrix24.team/upload/crm/form/loader_${params.id}_${params.sec}.js")
			</script>
		`,
		events: {
			onPopupFirstShow()
			{
				(function(w, d, u) {
					var s = d.createElement('script');
					s.async = true;
					s.src = u + '?' + (Date.now() / 180_000 | 0);
					var h = d.getElementsByTagName('script')[0];
					h.parentNode.insertBefore(s, h);
				})(window, document, `https://bitrix24.team/upload/crm/form/loader_${params.id}_${params.sec}.js`);
			},
		},
	};

	const popup: PopupInstance = new Popup(popupOptions);

	popup.show();
}
