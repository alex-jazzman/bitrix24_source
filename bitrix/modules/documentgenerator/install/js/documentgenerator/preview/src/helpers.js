import { type JsonObject, Dom, Loc, Type, Uri } from 'main.core';
import { MenuManager, Popup, PopupWindowButton } from 'main.popup';

export function parseUrl(url, key): JsonObject
{
	const uri = new Uri(url);
	const result = {
		protocol: uri.getSchema() ? `${uri.getSchema()}:` : '',
		host: uri.getHost() || '',
		hostname: uri.getHost() || '',
		port: uri.getPort() || '',
		pathname: uri.getPath(),
		search: uri.getQuery() ? `?${uri.getQuery()}` : '',
		params: uri.getQueryParams(),
		hash: uri.getFragment() ? `#${uri.getFragment()}` : '',
	};

	if (key && Object.hasOwn(result, key))
	{
		return result[key];
	}

	return result;
}

export function openUrl(viewUrl, loaderPath, width): void
{
	if (BX.SidePanel)
	{
		const sliderWidth = Type.isNumber(width) ? width : 810;
		BX.SidePanel.Instance.open(viewUrl, { width: sliderWidth, cacheable: false, loader: loaderPath });
		const menu = MenuManager.getCurrentMenu();
		if (menu && menu.popupWindow)
		{
			menu.popupWindow.close();
		}
	}
	else
	{
		location.href = viewUrl;
	}
}

let popupConfirm = null;

export function showMessage(content, buttons, title, onclose): void
{
	const popupTitle = title || '';
	const popupButtons = Type.isNil(buttons)
		|| (Type.isObjectLike(buttons) && Object.keys(buttons).length <= 0)
		? [new PopupWindowButton({
			id: 'documentgenerator-preview-message-close',
			text: Loc.getMessage('DOCGEN_PREVIEW_CLOSE_BUTTON'),
			className: 'ui-btn ui-btn-md ui-btn-default',
			events: {
				click(e) {
					this.popupWindow.close();
					e.preventDefault();
					e.stopPropagation();
				},
			},
		})]
		: buttons
	;

	popupConfirm?.destroy();

	const normalizedContent = Type.isDomNode(content) ? content : (() => {
		const node = document.createElement('div');
		node.innerHTML = content;

		return node;
	})();
	const popupContent = Type.isArray(normalizedContent) ? normalizedContent : [normalizedContent];

	popupConfirm = new Popup('bx-popup-documentgenerator-popup', null, {
		zIndex: 200,
		autoHide: true,
		closeByEsc: true,
		buttons: popupButtons,
		closeIcon: true,
		overlay: true,
		events: {
			onPopupClose()
			{
				if (Type.isFunction(onclose))
				{
					onclose();
				}
				this.destroy();
			},
			onPopupDestroy: () => {
				popupConfirm = null;
			},
		},
		content: Dom.create('span', {
			attrs: { className: 'bx-popup-documentgenerator-popup-content-text' },
			children: popupContent,
		}),
		titleBar: popupTitle,
		contentColor: 'white',
		className: 'bx-popup-documentgenerator-popup',
		maxWidth: 470,
	});

	popupConfirm.show();
}
