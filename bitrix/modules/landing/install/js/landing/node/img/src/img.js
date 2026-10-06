import { Base } from 'landing.node.base';
import { Env } from 'landing.env';
import { Image as ImageField } from 'landing.ui.field.image';
import 'landing.utils';
import { buildAcceptValue } from './accept';
// provides the --bitrix-gpt glyph of the AI select button;
// the upload button keeps its own icon inlined in css/style.css
import 'ui.icon-set.outline';
import './css/style.css';

const attr = BX.Landing.Utils.attr;
const data = BX.Landing.Utils.data;
const encodeDataValue = BX.Landing.Utils.encodeDataValue;
const decodeDataValue = BX.Landing.Utils.decodeDataValue;

export class Img extends Base
{
	constructor(options)
	{
		super(options);
		this.type = 'img';
		this.editPanel = null;
		this.floatingPanel = null;
		this.lastValue = null;
		this.field = null;
		this.uploadParams = options.uploadParams;

		if (!this.isGrouped())
		{
			this.node.addEventListener('click', this.onClick.bind(this));

			if (!Env.getInstance().isBlockControlsEnabled())
			{
				this.initFloatingPanel();
			}
		}

		if (this.isAllowInlineEdit())
		{
			this.node.setAttribute('title', BX.Landing.Loc.getMessage('LANDING_TITLE_OF_IMAGE_NODE'));
		}
	}

	/**
	 * Creates floating panel with upload button for AI mode
	 * (compact replacement of the Content panel).
	 * The panel is destroyed when its block is removed or reloaded
	 * (undo/redo), otherwise detached panels would accumulate in body
	 * and retain removed block subtrees.
	 */
	initFloatingPanel()
	{
		const buttons = [
			{
				id: 'upload',
				iconClass: 'landing-ui-node-img-upload-icon',
				title: BX.Landing.Loc.getMessage('LANDING_TITLE_OF_IMAGE_NODE_UPLOAD'),
				onClick: this.onUploadButtonClick.bind(this),
			},
		];

		// AI select button appears only when the copilot element picker is
		// available and enabled: with the option off the panel keeps no trace
		// of it. The click only toggles the AI selection of this node.
		const picker = getElementPicker();
		if (picker)
		{
			buttons.push({
				id: 'ai_select',
				iconClass: '--bitrix-gpt',
				title: BX.Landing.Loc.getMessage('LANDING_TITLE_OF_EDITOR_ACTION_AI_TEXT'),
				onClick: () => picker.toggleSelection(this),
			});
		}

		this.floatingPanel = new BX.Landing.UI.Panel.FloatingNodePanel({ buttons });
		this.floatingPanel.attach(this.node);

		this.onBlockRemove = (event) => {
			if (event && event.block && event.block.contains(this.node))
			{
				this.destroyFloatingPanel();
			}
		};
		BX.addCustomEvent('BX.Landing.Block:remove', this.onBlockRemove);
	}

	/**
	 * Detaches floating panel and releases the block remove subscription.
	 */
	destroyFloatingPanel()
	{
		if (this.floatingPanel)
		{
			this.floatingPanel.detach();
			this.floatingPanel = null;
		}

		if (this.onBlockRemove)
		{
			BX.removeCustomEvent('BX.Landing.Block:remove', this.onBlockRemove);
			this.onBlockRemove = null;
		}
	}

	/**
	 * Handles click on the floating panel upload button:
	 * opens system file picker and uploads the chosen image.
	 */
	onUploadButtonClick()
	{
		const allowSvg = Boolean(Env.getInstance().getOptions()['allow_svg']);
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = buildAcceptValue(allowSvg);
		input.style.display = 'none';
		input.dataset.testid = 'landing-node-img-upload-input';
		input.addEventListener('change', (event) => {
			const [file] = event.target.files;
			input.remove();
			if (file)
			{
				this.uploadAndSave(file).catch((error) => {
					// The user-facing message is shown centrally by Backend.upload()
					// via ErrorManager (single Alert panel, no duplicate toast).
					console.error('BX.Landing.Node.Img: image upload failed', error);
				});
			}
		});
		// system dialog dismissed without a file: do not leave the input in body
		input.addEventListener('cancel', () => input.remove());
		document.body.appendChild(input);
		input.click();
	}

	/**
	 * Uploads file via Block::uploadFile and immediately saves it into the node.
	 * @param {File} file
	 * @return {Promise} resolves when the new file is saved into the node,
	 * rejects with the upload error
	 */
	uploadAndSave(file)
	{
		return BX.Landing.Backend.getInstance()
			.upload(file, this.uploadParams)
			.then((result) => {
				// url/src2x/id2x are intentionally omitted: setValue() touches
				// data-pseudo-url only when value.url is set, so the existing
				// link stays on the node as is; the freshly uploaded image has
				// no retina version, and setImageValue/setBackgroundValue reset
				// the old 2x when src2x/id2x are absent (no stale retina leak).
				// alt is explicitly reset: the previous alt described the previous
				// file and must not carry over to the freshly uploaded one.
				this.setValue({
					src: result.src,
					id: result.id,
					alt: '',
				});
			});
	}

	/**
	 * Checks that click on the node can activate the edit flow
	 * (shared guard for the AI and the classic branches of onClick).
	 * @return {boolean}
	 */
	canActivateOnClick(): boolean
	{
		return (
			this.manifest.allowInlineEdit !== false
			&& BX.Landing.Main.getInstance().isControlsEnabled()
			&& (!BX.Landing.Node.Text.currentNode
			|| !BX.Landing.Node.Text.currentNode.isEditable())
			&& !BX.Landing.UI.Panel.StylePanel.getInstance().isShown()
		);
	}

	/**
	 * Click on field - edit mode.
	 * @param {MouseEvent} event
	 */
	onClick(event)
	{
		BX.Event.EventEmitter.emit('BX.Landing.Node.Img:onClick');
		if (!Env.getInstance().isBlockControlsEnabled())
		{
			// AI mode: Content panel is disabled, click opens the same file
			// picker as the FloatingNodePanel upload button (activation parity
			// with the legacy click-to-edit flow, the panel itself is hover-only)
			if (this.floatingPanel && this.canActivateOnClick())
			{
				event.preventDefault();
				event.stopPropagation();
				this.onUploadButtonClick();
			}

			return;
		}

		if (this.canActivateOnClick())
		{
			event.preventDefault();
			event.stopPropagation();

			if (!this.editPanel)
			{
				this.editPanel = new BX.Landing.UI.Panel.Content(this.selector, {
					title: BX.Landing.Loc.getMessage('LANDING_IMAGE_PANEL_TITLE'),
					className: 'landing-ui-panel-edit-image',
				});

				this.editPanel.appendFooterButton(
					new BX.Landing.UI.Button.BaseButton('save_block_content', {
						text: BX.Landing.Loc.getMessage('BLOCK_SAVE'),
						onClick: this.save.bind(this),
						className: 'landing-ui-button-content-save',
						attrs: { 'data-testid': 'landing-node-img-save-btn' },
					}),
				);
				this.editPanel.appendFooterButton(
					new BX.Landing.UI.Button.BaseButton('cancel_block_content', {
						text: BX.Landing.Loc.getMessage('BLOCK_CANCEL'),
						onClick: this.editPanel.hide.bind(this.editPanel),
						className: 'landing-ui-button-content-cancel',
						attrs: { 'data-testid': 'landing-node-img-cancel-btn' },
					}),
				);

				window.parent.document.body.appendChild(this.editPanel.layout);
			}

			const form = new BX.Landing.UI.Form.BaseForm({ title: this.manifest.name });
			form.addField(this.getField());

			this.editPanel.clear();
			this.editPanel.appendForm(form);
			this.editPanel.show();
			BX.Landing.UI.Panel.EditorPanel.getInstance().hide();
		}
	}

	/**
	 * Saves value changes
	 */
	save()
	{
		const value = this.editPanel.forms[0].fields[0].getValue();

		if (JSON.stringify(this.getValue()) !== JSON.stringify(value))
		{
			this.setValue(value);
		}

		this.editPanel.hide();
	}

	/**
	 * Gets form field
	 * @return {?BX.Landing.UI.Field.BaseField}
	 */
	getField(): ?BX.Landing.UI.Field.BaseField
	{
		if (this.field)
		{
			this.field.setValue(this.getValue());
			this.field.content = this.getValue();
			requestAnimationFrame(() => {
				this.field.adjustPreviewBackgroundSize();
			});
		}
		else
		{
			let description = '';

			if (this.manifest.dimensions)
			{
				const dimensions = this.manifest.dimensions;

				const width = (
					dimensions.width
					|| dimensions.maxWidth
					|| dimensions.minWidth
				);

				const height = (
					dimensions.height
					|| dimensions.maxHeight
					|| dimensions.minHeight
				);

				if (width && !height)
				{
					description = `${BX.Landing.Loc.getMessage('LANDING_CONTENT_IMAGE_RECOMMENDED_WIDTH')} `;
					description += `${width}px`;
				}
				else if (height && !width)
				{
					description = `${BX.Landing.Loc.getMessage('LANDING_CONTENT_IMAGE_RECOMMENDED_HEIGHT')} `;
					description += `${height}px`;
				}
				else if (width && height)
				{
					description = `${BX.Landing.Loc.getMessage('LANDING_CONTENT_IMAGE_RECOMMENDED_SIZE')} `;
					description += `${width}px&nbsp;/&nbsp;`;
					description += `${height}px`;
				}
			}

			const value = this.getValue();
			if (value.url)
			{
				value.url = decodeDataValue(value.url);
			}

			const disableLink = !!this.node.closest('a') || !!this.manifest.disableLink;

			if (this.manifest.editInStyle !== true)
			{
				this.field = new ImageField({
					contextType: ImageField.CONTEXT_TYPE_CONTENT,
					selector: this.selector,
					title: this.manifest.name,
					description: description,
					disableLink: disableLink,
					isAiImageAvailable: Env.getInstance().getOptions()['ai_image_available'],
					isAiImageActive: Env.getInstance().getOptions()['ai_image_active'],
					aiUnactiveInfoCode: Env.getInstance().getOptions()['ai_unactive_info_code'],
					content: value,
					dimensions: this.manifest.dimensions ?? {},
					create2xByDefault: this.manifest.create2xByDefault,
					disableAltField: isBackground(this.node),
					uploadParams: this.uploadParams,
				});
			}
		}

		return this.field;
	}

	/**
	 * Sets node value
	 * @param value - Path to image
	 * @param {?boolean} [preventSave = false]
	 * @param {?boolean} [preventHistory = false]
	 */
	setValue(value, preventSave, preventHistory)
	{
		this.lastValue = this.lastValue || this.getValue();
		this.preventSave(preventSave);

		if (value && value.src)
		{
			value.src = decodeURIComponent(value.src);
		}

		if (isImage(this.node))
		{
			setImageValue(this.node, value);
		}

		if (isBackground(this.node))
		{
			setBackgroundValue(this.node, value);
		}

		if (value.url)
		{
			const url = this.preparePseudoUrl(value.url);
			if (url !== null)
			{
				attr(this.node, 'data-pseudo-url', url);
			}
		}

		this.onChange(preventHistory);

		if (!preventHistory)
		{
			BX.Landing.History.getInstance().push();
		}

		this.lastValue = this.getValue();
	}

	/**
	 * Gets node value
	 * @return {{src: string}}
	 */
	getValue(): {src: string}
	{
		const value = { type: '', src: '', alt: '', url: '' };

		const fileId = parseInt(this.node.dataset.fileid, 10);
		if (fileId > 0)
		{
			value.id = fileId;
		}

		const fileId2x = parseInt(this.node.dataset.fileid2x, 10);
		if (fileId2x > 0)
		{
			value.id2x = fileId2x;
		}

		if (isBackground(this.node))
		{
			value.type = 'background';
			value.src = getBackgroundUrl(this.node);
			const src2x = getBackgroundUrl2x(this.node);
			if (src2x)
			{
				value.src2x = src2x;
			}
		}

		if (isImage(this.node))
		{
			value.type = 'image';
			value.alt = getAlt(this);
			value.src = getImageSrc(this.node);
			const src2x = getImageSrc2x(this.node);
			if (src2x)
			{
				value.src2x = src2x;
			}
		}

		value.url = (
			encodeDataValue(getPseudoUrl(this))
			|| { text: '', href: '', target: '_self', enabled: false }
		);

		return value;
	}

	/**
	 * Prepare pseudo url if needed
	 * @param {object} url
	 * @return {null|object}
	 */
	preparePseudoUrl(url)
	{
		let urlIsChange = false;
		if (!(url.href === '#' && url.target === ''))
		{
			urlIsChange = true;
		}

		if (url.href === 'selectActions:')
		{
			url.href = '';
			url.enabled = false;
			urlIsChange = true;
		}

		if (url.href.startsWith('product:'))
		{
			url.target = '_self';
			urlIsChange = true;
		}

		if (url.enabled !== false && (url.href === '' || url.href === '#'))
		{
			url.enabled = false;
			urlIsChange = true;
		}

		if (url.target === '')
		{
			url.target = '_blank';
			urlIsChange = true;
		}

		if (urlIsChange === true)
		{
			return url;
		}

		return null;
	}
}

BX.Landing.Node.Img = Img;

/**
 * Resolves the active copilot element picker. Returns null when the extension
 * is not loaded or its option is disabled, so AI controls are not rendered.
 * @return {?BX.Landing.Copilot.ElementPicker}
 */
function getElementPicker()
{
	const picker = BX.Landing.Copilot && BX.Landing.Copilot.ElementPicker;

	return (picker && picker.isEnabled()) ? picker.getInstance() : null;
}

/**
 * Checks that node use backgroundImage
 * @param {HTMLElement} node
 * @return {boolean}
 */
function isBackground(node): boolean
{
	return node.nodeName !== 'IMG';
}

/**
 * Checks that node is imaged
 * @param {HTMLElement} node
 * @return {boolean}
 */
function isImage(node): boolean
{
	return node.nodeName === 'IMG';
}

/**
 * Gets background url
 * @param {BX.Landing.Node.Img} node
 * @return {boolean}
 */
function getBackgroundUrl(node): boolean
{
	const bg = node.style.getPropertyValue('background-image');
	if (bg)
	{
		const res = bg.match(/url\((.*?)\)/);

		if (res && res[1])
		{
			return res[1].replace(/["'|]/g, '');
		}
	}

	return '';
}

/**
 * Gets background url 2x
 * @param {BX.Landing.Node.Img} node
 * @return {boolean}
 */
function getBackgroundUrl2x(node): boolean
{
	const bg = node.style.getPropertyValue('background-image');
	if (bg)
	{
		const res = bg.match(/1x, url\(["'|](.*)["'|]\) 2x\)/);

		if (res && res[1])
		{
			return res[1].replace(/["'|]/g, '');
		}
	}

	return '';
}

/**
 * Gets image alt
 * @param {BX.Landing.Node.Img} node
 * @return {string}
 */
function getAlt(node): string
{
	const alt = attr(node.node, 'alt');

	return alt || '';
}

function getPseudoUrl(node): string
{
	const url = data(node.node, 'data-pseudo-url');

	return url || '';
}

/**
 * Gets image src
 * @param {HTMLElement} node
 * @return {string}
 */
function getImageSrc(node): string
{
	const src = attr(node, 'src');

	return src || '';
}

/**
 * Gets image src 2x
 * @param {HTMLElement} node
 * @return {string}
 */
function getImageSrc2x(node): string
{
	const src = attr(node, 'srcset');

	return src ? src.replace(' 2x', '') : '';
}

/**
 * Sets image value or converts to image and sets value
 * @param {HTMLElement} node
 * @param {object} value
 */
function setImageValue(node, value)
{
	if (isImage(node))
	{
		node.src = value.src;
		node.alt = value.alt || '';
		node.dataset.fileid = value.id || -1;
		node.srcset = value.src2x ? `${value.src2x} 2x` : '';
		node.dataset.fileid2x = value.id2x || -1;
	}
	else
	{
		const newNode = BX.create('img', {
			attrs: { src: value.src, alt: value.alt, 'data-fileid': value.id },
		});

		BX.Dom.insertBefore(newNode, node);
		BX.remove(node);
	}
}

/**
 * Sets background value or converts to div and sets value
 * @param {HTMLElement} node
 * @param {object} value
 */
function setBackgroundValue(node, value)
{
	if (isBackground(node))
	{
		if (value.src)
		{
			const style = [`background-image: url("${value.src}");`];
			if (value.src2x)
			{
				style.push(`background-image: -webkit-image-set(url("${value.src}") 1x, url("${value.src2x}") 2x);`, `background-image: image-set(url("${value.src}") 1x, url("${value.src2x}") 2x);`);
			}

			// save css-vars and other styles
			const oldStyleObj = node.style;
			const oldStyle = {};
			[...oldStyleObj].forEach((prop) => {
				oldStyle[prop] = oldStyleObj.getPropertyValue(prop);
			});

			node.setAttribute('style', style.join(' '));
			for (const prop in oldStyle)
			{
				if (prop !== 'background-image')
				{
					BX.Dom.style(node, prop, oldStyle[prop]);
				}
			}
		}
		else if (node.style)
		{
			BX.Dom.style(node, 'background-image', null);
		}

		node.dataset.fileid = value.id || -1;
		node.dataset.fileid2x = value.id2x || -1;
	}
	else
	{
		const newNode = BX.create('div', {
			attrs: {
				style: `background-image: url("${value.src}")`,
				'data-fileid': value.id,
			},
		});

		BX.Dom.insertBefore(newNode, node);
		BX.Dom.remove(node);
	}
}
