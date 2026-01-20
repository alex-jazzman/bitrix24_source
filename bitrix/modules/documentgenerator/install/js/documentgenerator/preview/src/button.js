import { ajax as Ajax, Dom, Event, Text, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { Loader } from 'main.loader';
import { MenuManager } from 'main.popup';
import { MessageBox } from 'ui.dialogs.messagebox';

/**
 * @memberOf BX.Crm.DocumentGenerator
 */
export class Button
{
	progress = false;
	links = {};
	linksLoaded = false;
	intranetExtensions = null;
	id = null;
	text = 'Document';
	className = '';
	menuClassName = null;
	provider = null;
	value = null;
	loaderPath = null;
	documentUrl = null;
	templateListUrl = null;
	moduleId = null;
	templatesText = 'Templates';
	documentsText = 'Documents';
	sliderWidth = null;
	loader = null;

	constructor(id, params)
	{
		this.id = id;
		this.fillParameters(params);
	}

	fillParameters(params): void
	{
		if (params.links && Type.isObjectLike(params.links) && Object.keys(params.links).length > 0)
		{
			this.links = params.links;
			if (this.links.length > 0)
			{
				this.linksLoaded = true;
			}
		}

		if (params.menuClassName && Type.isString(params.menuClassName))
		{
			this.menuClassName = params.menuClassName;
		}

		if (params.className && Type.isString(params.className))
		{
			this.className = params.className;
		}

		if (params.moduleId && Type.isString(params.moduleId))
		{
			this.moduleId = params.moduleId;
		}

		if (params.text && Type.isString(params.text))
		{
			this.text = params.text;
		}

		if (params.templatesText && Type.isString(params.templatesText))
		{
			this.templatesText = params.templatesText;
		}

		if (params.documentsText && Type.isString(params.documentsText))
		{
			this.documentsText = params.documentsText;
		}
		this.value = params.value || null;
		this.provider = params.provider || null;
		this.loaderPath = params.loaderPath || null;
		this.templateListUrl = params.templateListUrl || null;
		this.documentUrl = params.documentUrl || null;
		this.sliderWidth = Object.hasOwn(params, 'sliderWidth') ? parseInt(params.sliderWidth, 10) : null;
	}

	getElement(): ?HTMLElement
	{
		return document.getElementById(this.id);
	}

	createElement(): ?HTMLElement
	{
		const node = this.getElement();
		if (node)
		{
			return node;
		}

		if (!this.id)
		{
			return null;
		}
		const tagName = 'button';
		let className = 'ui-btn ui-btn-md ui-btn-light-border ui-btn-dropdown ui-btn-themes';
		if (this.className)
		{
			className += ` ${this.className}`;
		}
		const attrs = {
			id: this.id,
			className,
		};

		return Dom.create(tagName, {
			attrs,
			text: this.text,
		});
	}

	init(): void
	{
		Event.bind(this.getElement(), 'click', () => {
			if (this.linksLoaded)
			{
				this.showPopup();
			}
			else
			{
				if (this.progress)
				{
					return;
				}
				this.progress = true;
				this.showLoader();
				Ajax.runAction('documentgenerator.api.document.getButtonTemplates', {
					data: {
						moduleId: this.moduleId,
						provider: this.provider,
						value: this.value,
					},
				}).then((response) => {
					this.fillLinksFromResponse(response);
					this.hideLoader();
					this.progress = false;
					setTimeout(() => this.showPopup(), 10);
				}).catch((response) => {
					this.hideLoader();
					this.progress = false;
					MessageBox.alert(response.errors.pop().message);
				});
			}
		});

		EventEmitter.subscribe('onPullEvent-documentgenerator', (event: BaseEvent) => {
			const [command] = event.getData();

			if (command === 'updateTemplate')
			{
				this.linksLoaded = false;
				this.links = {};
				MenuManager.destroy(this.getPopupMenuId());
			}
		});
	}

	fillLinksFromResponse(response): void
	{
		this.linksLoaded = true;
		this.links = {};
		if (this.documentUrl && response.data.templates && Type.isArray(response.data.templates))
		{
			this.links.templates = [];
			const length = response.data.templates.length;
			for (let i = 0; i < length; i++)
			{
				const url = BX.util.add_url_param(this.documentUrl, {
					templateId: parseInt(response.data.templates[i].id, 10),
					providerClassName: this.provider.replaceAll('\\', '\\\\'),
					value: this.value,
					analyticsLabel: 'generateDocument',
					templateCode: response.data.templates[i].code,
				});
				const docParams = {};
				if (this.sliderWidth)
				{
					docParams.sliderWidth = this.sliderWidth;
				}
				this.links.templates[i] = {
					text: Text.encode(response.data.templates[i].name),
					title: Text.encode(response.data.templates[i].name),
					onclick: `BX.DocumentGenerator.Document.onBeforeCreate('${url}',${JSON.stringify(docParams)},'${this.loaderPath}','${this.moduleId}')`,
				};
			}
		}

		if (response.data.documentList && this.documentUrl)
		{
			this.links.documentList = BX.util.add_url_param(response.data.documentList, {
				provider: this.provider.replaceAll('\\', '\\\\'),
				module: this.moduleId,
				value: this.value,
				viewUrl: this.documentUrl,
				loaderPath: this.loaderPath,
			});
		}

		if (response.data.canEditTemplate && this.templateListUrl)
		{
			this.links.templateList = this.templateListUrl;
		}

		if (response.data.intranetExtensions)
		{
			this.intranetExtensions = response.data.intranetExtensions;
		}
	}

	prepareLinksForPopup(): Array<Object>
	{
		let result = [];
		let addDelimiter = false;
		if (!this.linksLoaded)
		{
			return result;
		}

		if (this.links.templates && Type.isArray(this.links.templates))
		{
			result = this.links.templates;
			addDelimiter = true;
		}

		if (this.links.documentList)
		{
			if (addDelimiter)
			{
				result[result.length] = {
					delimiter: true,
				};
				addDelimiter = false;
			}
			result[result.length] = {
				text: this.documentsText,
				onclick: `BX.DocumentGenerator.openUrl('${this.links.documentList}', null, 1060)`,
			};
		}

		if (this.links.templateList)
		{
			if (addDelimiter)
			{
				result[result.length] = {
					delimiter: true,
				};
			}
			result[result.length] = {
				text: this.templatesText,
				onclick: `BX.DocumentGenerator.openUrl('${this.links.templateList}', null, 1060)`,
			};
		}

		if (this.intranetExtensions)
		{
			result.push({
				delimiter: true,
			}, this.intranetExtensions);
		}

		return result;
	}

	showPopup(): void
	{
		MenuManager.show(this.getPopupMenuId(), this.getElement(), this.prepareLinksForPopup(), {
			offsetLeft: 0,
			offsetTop: 0,
			closeByEsc: true,
			className: 'document-toolbar-menu',
			maxWidth: 600,
		});
	}

	getPopupMenuId(): string
	{
		return `${this.id}_menu`;
	}

	getLoader(): Loader
	{
		if (!this.loader)
		{
			this.loader = new Loader({ size: 50 });
		}

		return this.loader;
	}

	showLoader(): void
	{
		if (this.getElement() && !this.getLoader().isShown())
		{
			this.getLoader().show(this.getElement());
		}
	}

	hideLoader(): void
	{
		if (this.getLoader().isShown())
		{
			this.getLoader().hide();
		}
	}
}
