/* eslint-disable */
this.BX = this.BX || {};
this.BX.Vibecodeconnector = this.BX.Vibecodeconnector || {};
(function (exports, main_core) {
	'use strict';

	class EmbedCreateView {
		#container = null;
		getContainer() {
			this.#container ??= main_core.Tag.render`<div class="vibecode-catalog-embed-create" style="height: 100%;"></div>`;
			return this.#container;
		}
		mountLayout(html) {
			return main_core.Runtime.html(this.getContainer(), html);
		}
		showLoadError() {
			const container = this.getContainer();
			main_core.Dom.clean(container);
			main_core.Dom.append(main_core.Tag.render`
				<div class="vibecode-catalog-embed-create__error" role="alert" data-testid="vibecode-embed-create-error">
					${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_EMBED_CREATE_LOAD_ERROR')}
				</div>
			`, container);
		}
	}

	const EMBED_CREATE_SLIDER_ID_PREFIX = 'vibecodeconnector-embed-create-';
	const EmbedCreateTarget = Object.freeze({
		Hub: 'create',
		Application: 'applications-create',
		Agent: 'agents-create'
	});
	const EMBED_CREATE_TITLES = Object.freeze({
		[EmbedCreateTarget.Hub]: 'VIBECODECONNECTOR_CATALOG_CREATE_TITLE',
		[EmbedCreateTarget.Application]: 'VIBECODECONNECTOR_CATALOG_CREATE_APPLICATION',
		[EmbedCreateTarget.Agent]: 'VIBECODECONNECTOR_CATALOG_CREATE_AGENT'
	});
	const EMBED_CLOSE_MESSAGE_TYPE = 'vibe:embed-close';
	const EMBED_TARIFF_MESSAGE_TYPE = 'vibe:open-tariff';
	const EMBED_TARIFF_ACK_MESSAGE_TYPE = 'vibe:open-tariff-ack';
	const TARIFF_SLIDER_URL = '/settings/license_all.php';
	function resolveOrigin(url) {
		try {
			return new URL(url).origin;
		} catch {
			return null;
		}
	}
	function listenEmbedMessages(sliderId, vibecodeUrl) {
		const allowedOrigin = resolveOrigin(vibecodeUrl);
		const handler = event => {
			if (allowedOrigin === null || event.origin !== allowedOrigin) {
				return;
			}
			const type = event.data?.type;
			if (type === EMBED_CLOSE_MESSAGE_TYPE) {
				BX.SidePanel.Instance.getSlider(sliderId)?.close();
				return;
			}
			if (type === EMBED_TARIFF_MESSAGE_TYPE) {
				BX.SidePanel.Instance.open(TARIFF_SLIDER_URL);
				// the frame falls back to a new tab unless it hears back, so an old module stays usable
				event.source?.postMessage({
					type: EMBED_TARIFF_ACK_MESSAGE_TYPE
				}, allowedOrigin);
			}
		};
		main_core.Event.bind(window, 'message', handler);
		return () => main_core.Event.unbind(window, 'message', handler);
	}
	function openVibecodeCreate(view, options) {
		const titleCode = EMBED_CREATE_TITLES[view];
		if (titleCode === undefined) {
			return false;
		}
		const sliderId = `${EMBED_CREATE_SLIDER_ID_PREFIX}${view}`;
		if (BX.SidePanel.Instance.getSlider(sliderId) !== null) {
			return true;
		}
		const embedView = new EmbedCreateView();
		const layoutPromise = loadEmbedCreateLayout(view);
		layoutPromise.catch(() => {});
		const unlisten = listenEmbedMessages(sliderId, options.vibecodeUrl);
		const opened = BX.SidePanel.Instance.open(sliderId, {
			title: main_core.Loc.getMessage(titleCode),
			cacheable: false,
			allowChangeHistory: false,
			contentCallback: () => embedView.getContainer(),
			events: {
				onLoad: () => {
					layoutPromise.then(({
						html
					}) => embedView.mountLayout(html)).catch(() => embedView.showLoadError());
				},
				onClose: () => {
					unlisten();
					options.onClose?.();
				}
			}
		});
		if (!opened) {
			unlisten();
			return false;
		}
		return true;
	}
	function loadEmbedCreateLayout(view) {
		return main_core.ajax.runAction('vibecodeconnector.Embed.openLayout', {
			data: {
				view
			}
		}).then(response => {
			const html = response?.data?.html;
			return {
				html: main_core.Type.isString(html) ? html : ''
			};
		});
	}

	exports.EmbedCreateTarget = EmbedCreateTarget;
	exports.openVibecodeCreate = openVibecodeCreate;

})(this.BX.Vibecodeconnector.EmbedCreate = this.BX.Vibecodeconnector.EmbedCreate || {}, BX);
//# sourceMappingURL=embed-create.bundle.js.map
