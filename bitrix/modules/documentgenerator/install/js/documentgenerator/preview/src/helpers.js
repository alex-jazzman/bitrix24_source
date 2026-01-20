import { Dom, Loc, Type } from 'main.core';
import { MenuManager, Popup, PopupWindowButton } from 'main.popup';

export function parseUrl(url, key): JsonObject
{
	const parser = document.createElement('a');
	const params = {};
	let split = null;
	let i = null;
	parser.href = url;
	const queries = parser.search.replace(/^\?/, '').split('&');
	for (i = 0; i < queries.length; i++)
	{
		split = queries[i].split('=');
		params[split[0]] = split[1];
	}
	const result = {
		protocol: parser.protocol,
		host: parser.host,
		hostname: parser.hostname,
		port: parser.port,
		pathname: parser.pathname,
		search: parser.search,
		params,
		hash: parser.hash,
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
		if (!Type.isNumber(width))
		{
			width = 810;
		}
		BX.SidePanel.Instance.open(viewUrl, { width, cacheable: false, loader: loaderPath });
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
	title = title || '';
	if (Type.isNil(buttons) || (Type.isObjectLike(buttons) && Object.keys(buttons).length <= 0))
	{
		buttons = [new PopupWindowButton({
			text: Loc.getMessage('DOCGEN_PREVIEW_CLOSE_BUTTON'),
			className: 'ui-btn ui-btn-md ui-btn-default',
			events: {
				click(e) {
					this.popupWindow.close();
					BX.PreventDefault(e);
				},
			},
		})];
	}

	popupConfirm?.destroy();

	if (!Type.isDomNode(content))
	{
		const node = document.createElement('div');
		node.innerHTML = content;
		content = node;
	}

	if (!Type.isArray(content))
	{
		content = [content];
	}

	popupConfirm = new Popup('bx-popup-documentgenerator-popup', null, {
		zIndex: 200,
		autoHide: true,
		closeByEsc: true,
		buttons,
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
			children: content,
		}),
		titleBar: title,
		contentColor: 'white',
		className: 'bx-popup-documentgenerator-popup',
		maxWidth: 470,
	});

	popupConfirm.show();
}
