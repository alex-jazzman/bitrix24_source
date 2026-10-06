/* eslint-disable */
;(function() {

	if (window['LHEPostForm'])
	{
		return;
	}

this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup) {
	'use strict';

	class Default {
		id = 'SomeParser';
		buttonParams = {
			name: 'Some parser name',
			iconClassName: 'some-parser-class',
			disabledForTextarea: false,
			src: '/icon.png',
			toolbarSort: 205,
			compact: false
		};
		constructor(editor, htmlEditor) {
			this.editor = editor;
			this.htmlEditor = htmlEditor;
			this.handler = this.handler.bind(this);
		}
		handler() {}
		parse(text) {
			return text;
		}
		unparse(bxTag, oNode) {
			return '';
		}
		hasButton() {
			return this.buttonParams !== null;
		}
		getButton() {
			if (this.buttonParams === null) {
				return null;
			}
			return {
				id: this.id,
				name: this.buttonParams.name,
				iconClassName: this.buttonParams.iconClassName,
				disabledForTextarea: this.buttonParams.disabledForTextarea,
				src: this.buttonParams.src,
				toolbarSort: this.buttonParams.toolbarSort,
				compact: this.buttonParams.compact === true,
				handler: this.handler
			};
		}
		getParser() {
			return {
				name: this.id,
				obj: {
					Parse: (parserId, text) => {
						return this.parse(text);
					},
					UnParse: this.unparse.bind(this)
				}
			};
		}
	}

	class Spoiler extends Default {
		id = 'spoiler';
		buttonParams = {
			name: main_core.Loc.getMessage('MPF_SPOILER'),
			iconClassName: 'spoiler',
			disabledForTextarea: false,
			src: main_core.Loc.getMessage('MPF_TEMPLATE_FOLDER') + '/images/lhespoiler.svg',
			toolbarSort: 205
		};
		handler() {
			let result;
			// Iframe
			if (!this.htmlEditor.bbCode || !this.htmlEditor.synchro.IsFocusedOnTextarea()) {
				result = this.htmlEditor.action.actions.formatBlock.exec('formatBlock', 'blockquote', 'bx-spoiler', false, {
					bxTagParams: {
						tag: "spoiler"
					}
				});
			} else
				// bbcode + textarea
				{
					result = this.htmlEditor.action.actions.formatBbCode.exec('quote', {
						tag: 'SPOILER'
					});
				}
			return result;
		}
		parse(content, pLEditor) {
			if (/\[spoiler(([^\]])*)\]/gi.test(content)) {
				content = content.replace(/[\x01-\x02]/gi, '').replace(/\[spoiler([^\]]*)\]/gi, '\x01$1\x01').replace(/\[\/spoiler]/gi, '\x02');
				const reg2 = /(?:\x01([^\x01]*)\x01)([^\x01-\x02]+)\x02/gi;
				while (content.match(reg2)) {
					content = content.replace(reg2, function (str, title, body) {
						title = title.replace(/^(="|='|=)/gi, '').replace(/("|')?$/gi, '');
						return `<blockquote class="bx-spoiler" id="${this.htmlEditor.SetBxTag(false, {
						tag: "spoiler"
					})}" title="${title}">${body}</blockquote>`;
					}.bind(this));
				}
			}
			content = content.replace(/\001([^\001]*)\001/gi, '[spoiler$1]').replace(/\002/gi, '[/spoiler]');
			return content;
		}
		unparse(bxTag, oNode) {
			let name = '';
			for (let i = 0; i < oNode.node.childNodes.length; i++) {
				name += this.htmlEditor.bbParser.GetNodeHtml(oNode.node.childNodes[i]);
			}
			name = name.trim();
			if (name !== '') {
				return "[SPOILER" + (oNode.node.hasAttribute("title") ? '=' + oNode.node.getAttribute("title") : '') + "]" + name + "[/SPOILER]";
			}
			return "";
		}
	}

	class PostUser extends Default {
		id = 'postuser';
		buttonParams = null;
		constructor(editor, htmlEditor) {
			super(editor, htmlEditor);
			main_core_events.EventEmitter.subscribe(htmlEditor, 'OnIframeKeydown', function ({
				compatData: [event]
			}) {
				if (window.onKeyDownHandler) {
					window.onKeyDownHandler(event, htmlEditor, htmlEditor.formID);
				}
			});
			main_core_events.EventEmitter.subscribe(htmlEditor, 'OnIframeKeyup', function ({
				compatData: [event]
			}) {
				if (window.onKeyUpHandler) {
					window.onKeyUpHandler(event, htmlEditor, htmlEditor.formID);
				}
			});
			main_core_events.EventEmitter.subscribe(htmlEditor, 'OnIframeClick', function () {
				if (window['BXfpdStopMent' + htmlEditor.formID]) {
					window['BXfpdStopMent' + htmlEditor.formID]();
				}
			});
			main_core_events.EventEmitter.subscribe(htmlEditor, 'OnTextareaKeyup', function ({
				compatData: [event]
			}) {
				if (htmlEditor.textareaView && htmlEditor.textareaView.GetCursorPosition && window.onTextareaKeyUpHandler) {
					window.onTextareaKeyUpHandler(event, htmlEditor, htmlEditor.formID);
				}
			});
			main_core_events.EventEmitter.subscribe(htmlEditor, 'OnTextareaKeydown', function ({
				compatData: [event]
			}) {
				if (htmlEditor.textareaView && htmlEditor.textareaView.GetCursorPosition && window.onTextareaKeyDownHandler) {
					window.onTextareaKeyDownHandler(event, htmlEditor, htmlEditor.formID);
				}
			});
		}
		parse(content, pLEditor) {
			content = content.replace(/\[USER\s*=\s*(\d+)\](.*?)\[\/USER\]/ig, (str, id, name) => {
				name = name.trim();
				if (name === '') {
					return '';
				}
				const tagId = this.htmlEditor.SetBxTag(false, {
					tag: this.id,
					userId: id,
					userName: name
				});
				return `<span id="${tagId}" class="bxhtmled-metion">${name}</span>`;
			}).replace(/\[PROJECT\s*=\s*(\d+)\](.*?)\[\/PROJECT\]/ig, (str, id, name) => {
				name = name.trim();
				if (name === '') {
					return '';
				}
				const tagId = this.htmlEditor.SetBxTag(false, {
					tag: this.id,
					projectId: id,
					projectName: name
				});
				return `<span id="${tagId}" class="bxhtmled-metion">${name}</span>`;
			}).replace(/\[DEPARTMENT\s*=\s*(\d+)\](.*?)\[\/DEPARTMENT\]/ig, (str, id, name) => {
				name = name.trim();
				if (name === '') {
					return '';
				}
				const tagId = this.htmlEditor.SetBxTag(false, {
					tag: this.id,
					departmentId: id,
					departmentName: name
				});
				return `<span id="${tagId}" class="bxhtmled-metion">${name}</span>`;
			});
			return content;
		}
		unparse(bxTag, oNode) {
			let text = '';
			oNode.node.childNodes.forEach(node => {
				text += this.htmlEditor.bbParser.GetNodeHtml(node);
			});
			text = String(text).trim();
			let result = '';
			if (main_core.Type.isStringFilled(text)) {
				if (!main_core.Type.isUndefined(bxTag.userId)) {
					result = `[USER=${bxTag.userId}]${text}[/USER]`;
				} else if (!main_core.Type.isUndefined(bxTag.projectId)) {
					result = `[PROJECT=${bxTag.projectId}]${text}[/PROJECT]`;
				} else if (!main_core.Type.isUndefined(bxTag.departmentId)) {
					result = `[DEPARTMENT=${bxTag.departmentId}]${text}[/DEPARTMENT]`;
				}
			}
			return result;
		}
	}

	class Controller {
		actionPool = [];
		constructor(cid, container, editor) {
			this.cid = cid;
			this.container = container;
			this.editor = editor;
			main_core_events.EventEmitter.subscribe(editor.getEventObject(), 'onShowControllers', ({
				data
			}) => {
				main_core_events.EventEmitter.emit(container.parentNode, 'BFileDLoadFormController', new main_core_events.BaseEvent({
					compatData: [data]
				}));
			});
			main_core_events.EventEmitter.subscribe(editor.getEventObject(), 'onCollectControllers', event => {
				event.data[cid] = {
					values: []
				};
			});
		}
		get isReady() {
			return true;
		}
		exec(callback = null) {
			if (callback) {
				this.actionPool.push(callback);
			}
			if (this.isReady) {
				try {
					let action;
					while ((action = this.actionPool.shift()) && action) {
						action.apply(this);
					}
				} catch (e) {
					console.log('error in attachments controllers: ', e);
				}
			}
		}
		getId() {
			return this.cid;
		}
		getFieldName() {
			return null;
		}
		reinitFrom(data) {
			this.exec(() => {
				if (!this.getFieldName()) {
					return;
				}
				this.container.querySelector(`inptut[name="${this.getFieldName()}"]`).forEach(function (inputFile) {
					inputFile.parentNode.removeChild(inputFile);
				});
			});
		}
	}

	class DiskController extends Controller {
		diskUfUploader = null;
		diskUfHandler = null;
		constructor(cid, container, editor) {
			super(cid, container, editor);
			const _catchHandler = diskUfUploader => {
				this.diskUfUploader = diskUfUploader;
				this.exec();
				const func = BaseEvent => {
					main_core_events.EventEmitter.emit(editor.getEventObject(), 'onUploadsHasBeenChanged', BaseEvent);
				};
				main_core_events.EventEmitter.subscribe(this.diskUfUploader, 'onFileIsInited', func); // new diskUfUploader
				main_core_events.EventEmitter.subscribe(this.diskUfUploader, 'ChangeFileInput', func); // old diskUfUploader
			};
			if (BX.UploaderManager.getById(cid)) {
				_catchHandler(BX.UploaderManager.getById(cid));
			}
			main_core_events.EventEmitter.subscribeOnce(container.parentNode, 'DiskDLoadFormControllerInit', ({
				compatData: [diskUfHandler]
			}) => {
				this.diskUfHandler = diskUfHandler;
				if (cid === diskUfHandler.CID && !this.diskUfUploader) {
					_catchHandler(diskUfHandler.agent);
				}
			});
			main_core_events.EventEmitter.subscribe(editor.getEventObject(), 'onShowControllers', ({
				data
			}) => {
				main_core_events.EventEmitter.emit(container.parentNode, 'DiskLoadFormController', new main_core_events.BaseEvent({
					compatData: [data]
				}));
			});
		}
		get isReady() {
			return !!this.diskUfUploader;
		}
		getFieldName() {
			if (this.diskUfHandler) {
				return this.diskUfHandler.params.controlName;
			}
			return null;
		}
		reinitFrom(data) {
			this.exec(() => {
				if (!this.getFieldName()) {
					return;
				}
				Array.from(this.container.querySelectorAll(`inptut[name="${this.getFieldName()}"]`)).forEach(function (inputFile) {
					inputFile.parentNode.removeChild(inputFile);
				});
				let values = null;
				for (let ii in data) {
					if (data.hasOwnProperty(ii) && data[ii] && data[ii]['USER_TYPE_ID'] === 'disk_file' && data[ii]['FIELD_NAME'] === this.getFieldName()) {
						values = data[ii]['VALUE'];
					}
				}
				if (values) {
					const files = {};
					values.forEach(id => {
						let node = document.querySelector('#disk-attach-' + id);
						if (node.tagName !== "A") {
							node = node.querySelector('img');
						}
						if (node) {
							files['E' + id] = {
								type: 'file',
								id: id,
								name: node.getAttribute("data-bx-title") || node.getAttribute("data-title"),
								size: node.getAttribute("data-bx-size") || '',
								sizeInt: node.getAttribute("data-bx-size") || '',
								width: node.getAttribute("data-bx-width"),
								height: node.getAttribute("data-bx-height"),
								storage: 'disk',
								previewUrl: node.tagName === "A" ? '' : node.getAttribute("data-bx-src") || node.getAttribute("data-src"),
								fileId: node.getAttribute("bx-attach-file-id")
							};
							if (node.hasAttribute("bx-attach-xml-id")) files['E' + id]["xmlId"] = node.getAttribute("bx-attach-xml-id");
							if (node.hasAttribute("bx-attach-file-type")) files['E' + id]["fileType"] = node.getAttribute("bx-attach-file-type");
						}
					});
					this.diskUfHandler.selectFile({}, {}, files);
				}
			});
		}
	}

	/*
	* @deprecated
	* */
	class UploadFile extends Default {
		id = 'uploadfile';
		buttonParams = null;
		regexp = /\[FILE ID=((?:\s|\S)*?)?\]/ig;
		values = new Map();
		controllers = new Map();
		constructor(editor, htmlEditor) {
			super(editor, htmlEditor);
			this.checkButtonsDebounced = main_core.Runtime.debounce(this.checkButtons, 500, this);
			this.init();
			main_core_events.EventEmitter.subscribe(editor.getEditor(), 'OnContentChanged', this.checkButtons.bind(this));
			main_core_events.EventEmitter.subscribe(editor.getEventObject(), 'onReinitializeBefore', ({
				data: [text, data]
			}) => {
				this.reinit(text, data);
			});
		}
		init() {
			Array.from(this.editor.getContainer().querySelectorAll('.file-selectdialog')).forEach((selectorNode, index) => {
				const cid = selectorNode.id.replace('file-selectdialog-', '');
				let controller = this.controllers.get(cid);
				if (!controller) {
					controller = new Controller(cid, selectorNode, this.editor);
					main_core_events.EventEmitter.subscribe(selectorNode.parentNode, 'OnFileUploadSuccess', ({
						data: [{
							element_id
						}, {
							id,
							doc_prefix,
							CID
						}]
					}) => {
						if (cid === id) {
							const securityNode = document.querySelector('#' + this.editor.getFormId()) ? document.querySelector('#' + this.editor.getFormId()).querySelector('#upload-cid') : null;
							if (securityNode) {
								securityNode.value = CID;
							}
							const [id, file] = this.parseFile(selectorNode.querySelector('#' + doc_prefix + element_id));
							this.values.set(id, file);
						}
					});
					main_core_events.EventEmitter.subscribe(selectorNode.parentNode, 'OnFileUploadRemove', ({
						compatData: [fileId, {
							id
						}]
					}) => {
						if (cid === id && this.values.has(fileId)) {
							this.values.delete(fileId);
							this.deleteFile([fileId]);
						}
					});
					if (index === 0) {
						main_core_events.EventEmitter.subscribe(this.editor.getEventObject(), 'onFilesHaveCaught', event => {
							event.stopImmediatePropagation();
							if (window['BfileFD' + cid]) {
								window['BfileFD' + cid].agent.UploadDroppedFiles([...event.getData()]);
							}
						});
					}
				}
				if (selectorNode.querySelector('table.files-list')) {
					Array.from(selectorNode.querySelector('table.files-list').querySelectorAll('tr')).forEach(tr => {
						const [id, file] = this.parseFile(tr);
						this.values.set(id, file);
					});
				}
			});
		}
		parseFile(tr) {
			const id = tr.id.replace('wd-doc', '');
			const data = {
				id: id,
				name: tr.querySelector('[data-role="name"]') ? tr.querySelector('[data-role="name"]').innerHTML : tr.querySelector('span.f-wrap').innerHTML,
				node: tr,
				buttonNode: tr.querySelector('[data-role="button-insert"]'),
				image: {
					src: null,
					lowsrc: null,
					width: null,
					height: null
				}
			};
			const insertFile = () => {
				this.insertFile(id, tr);
			};
			const nameNode = tr.querySelector('.f-wrap');
			if (nameNode) {
				nameNode.addEventListener('click', insertFile);
				nameNode.style.cursor = 'pointer';
				nameNode.title = main_core.Loc.getMessage('MPF_FILE');
			}
			const imageNode = tr.querySelector('img');
			if (imageNode) {
				imageNode.addEventListener('click', insertFile);
				imageNode.title = main_core.Loc.getMessage('MPF_FILE');
				imageNode.style.cursor = 'pointer';
				data.image.lowsrc = imageNode.lowsrc || imageNode.src;
				data.image.src = imageNode.rel || imageNode.src;
				data.image.width = imageNode.getAttribute('data-bx-full-width');
				data.image.height = imageNode.getAttribute('data-bx-full-height');
			}
			if (tr instanceof HTMLTableRowElement && tr.querySelector('.files-info')) {
				if (!data.buttonNode) {
					data.buttonNode = main_core.Tag.render`
<span type="button" onclick="${insertFile}" data-role="button-insert" class="insert-btn">
	<span data-role="insert-btn" class="insert-btn-text">${main_core.Loc.getMessage('MPF_FILE_INSERT_IN_TEXT')}</span>
	<span data-role="in-text-btn" class="insert-btn-text">${main_core.Loc.getMessage('MPF_FILE_IN_TEXT')}</span>
</span>`;
					tr.querySelector('.files-info').appendChild(data.buttonNode);
					this.checkButtonsDebounced();
				}
			}
			return [id, data];
		}
		buildHTML(id, data, htmlData = null) {
			const tagId = this.htmlEditor.SetBxTag(false, {
				tag: this.id,
				fileId: id
			});
			let html = `<span data-bx-file-id="${id}" id="${tagId}" style="color: #2067B0; border-bottom: 1px dashed #2067B0; margin:0 2px;">${data.name}</span>`;
			if (data.image.src) {
				let additional = [];
				if (htmlData) {
					additional.push(`style="width:${htmlData.width}px;height:${htmlData.height}px;"`);
				} else if (data.image.width && data.image.height) {
					additional.push(`style="width:${data.image.width}px;height:${data.image.height}px;" `);
					additional.push(`onload="this.style.width='auto';this.style.height='auto';"`);
				}
				html = `<img style="max-width: 90%;"  data-bx-file-id="${id}" id="${tagId}" src="${data.image.src}" lowsrc="${data.image.lowsrc}" ${additional.join(' ')}/>`;
			}
			return html;
		}
		buildText(id, params) {
			return `[FILE ID=${id}${params || ''}]`;
		}
		insertFile(id, node) {
			const data = this.values.get(String(id));
			if (data) {
				main_core_events.EventEmitter.emit(this.editor.getEventObject(), 'OnInsertContent', [this.buildText(id), this.buildHTML(id, data)]);
			}
		}
		deleteFile(fileIds) {
			const content = this.htmlEditor.GetContent();
			if (this.htmlEditor.GetViewMode() === 'wysiwyg') {
				const doc = this.htmlEditor.GetIframeDoc();
				for (let ii in this.htmlEditor.bxTags) {
					if (this.htmlEditor.bxTags.hasOwnProperty(ii) && typeof this.htmlEditor.bxTags[ii] === 'object' && this.htmlEditor.bxTags[ii]['tag'] === this.id && fileIds.indexOf(String(this.htmlEditor.bxTags[ii]['fileId'])) >= 0 && doc.getElementById(ii)) {
						const node = doc.getElementById(ii);
						node.parentNode.removeChild(node);
					}
				}
				this.htmlEditor.SaveContent();
			} else /* if (this.regexp.test(content))*/
				{
					const content2 = content.replace(this.regexp, function (str, foundId) {
						return fileIds.indexOf(foundId) >= 0 ? '' : str;
					});
					this.htmlEditor.SetContent(content2);
					this.htmlEditor.Focus();
				}
		}
		checkButtons(event) {
			const content = event ? event.compatData[0] : this.htmlEditor.GetContent();
			const matches = [...content.matchAll(this.regexp)].map(([match, id]) => {
				return id;
			});
			this.values.forEach((data, id) => {
				if (!data.buttonNode) {
					return;
				}
				const mark = matches.indexOf(id) >= 0;
				if (mark === true && data.buttonNode.className !== 'insert-text') {
					data.buttonNode.className = 'insert-text';
					data.buttonNode.querySelector('[data-role="insert-btn"]').style.display = 'none';
					data.buttonNode.querySelector('[data-role="in-text-btn"]').style.display = '';
				} else if (mark !== true && data.buttonNode.className !== 'insert-btn') {
					data.buttonNode.className = 'insert-btn';
					data.buttonNode.querySelector('[data-role="insert-btn"]').style.display = '';
					data.buttonNode.querySelector('[data-role="in-text-btn"]').style.display = 'none';
				}
			});
		}
		reinit(text, data) {
			this.values.forEach((file, id) => {
				if (file.node && file.node.parentNode) {
					file.node.parentNode.removeChild(file.node);
				}
			});
			this.values.clear();
			this.controllers.forEach(controller => {
				controller.reinitFrom(data);
			});
		}
		parse(content) {
			if (!this.regexp.test(content)) {
				return content;
			}
			content = content.replace(this.regexp, function (str, id, width, height) {
				if (this.values.has(id)) {
					return this.buildHTML(id, this.values.get(id), width > 0 && height > 0 ? {
						width,
						height
					} : null);
				}
				return str;
			}.bind(this));
			return content;
		}
		unparse(bxTag, {
			node
		}) {
			const width = parseInt(node.hasAttribute('width') ? node.getAttribute('width') : 0);
			const height = parseInt(node.hasAttribute('height') ? node.getAttribute('height') : 0);
			let params = '';
			if (width > 0 && height > 0) {
				params = ' WIDTH=' + width + ' HEIGHT=' + height;
			}
			const id = node.getAttribute('data-bx-file-id');
			return this.buildText(id, params);
		}
	}

	/*
	* @deprecated
	* */
	class UploadImage extends Default {
		id = 'uploadimage';
		buttonParams = null;
		regexp = /\[IMAGE ID=((?:\s|\S)*?)?\]/ig;
		values = new Map();
		controllers = new Map();
		constructor(editor, htmlEditor) {
			super(editor, htmlEditor);
			this.init();
			console.log('PostImage: ');
			main_core_events.EventEmitter.subscribe(editor.getEventObject(), 'onReinitializeBefore', ({
				data: [text, data]
			}) => {
				this.reinit(text, data);
			});
		}
		init() {
			Array.from(this.editor.getContainer().querySelectorAll('.file-selectdialog')).forEach(selectorNode => {
				const cid = selectorNode.id.replace('file-selectdialog-', '');
				let controller = this.controllers.get(cid);
				if (!controller) {
					controller = new Controller(cid, selectorNode, this.editor);
					main_core_events.EventEmitter.subscribe(selectorNode.parentNode, 'OnFileUploadSuccess', ({
						data: [{
							element_id
						}, {
							id,
							doc_prefix,
							CID
						}]
					}) => {
						if (cid === id) {
							const securityNode = document.querySelector('#' + this.editor.getFormId()) ? document.querySelector('#' + this.editor.getFormId()).querySelector('#upload-cid') : null;
							if (securityNode) {
								securityNode.value = CID;
							}
							const [id, file] = this.parseFile(selectorNode.querySelector('#' + doc_prefix + element_id));
							this.values.set(id, file);
						}
					});
					main_core_events.EventEmitter.subscribe(selectorNode.parentNode, 'OnFileUploadRemove', ({
						compatData: [fileId, {
							id
						}]
					}) => {
						if (cid === id && this.values.has(fileId)) {
							this.values.delete(fileId);
						}
					});
				}
				if (selectorNode.querySelector('table.files-list')) {
					Array.from(selectorNode.querySelector('table.files-list').querySelectorAll('tr')).forEach(tr => {
						const [id, file] = this.parseFile(tr);
						this.values.set(id, file);
					});
				}
			});
		}
		parseFile(tr) {
			const id = tr.id.replace('wd-doc', '');
			const data = {
				id: id,
				name: tr.querySelector('[data-role="name"]') ? tr.querySelector('[data-role="name"]').innerHTML : tr.querySelector('span.f-wrap').innerHTML,
				node: tr,
				image: {
					src: null,
					lowsrc: null,
					width: null,
					height: null
				}
			};
			return [id, data];
		}
		reinit(text, data) {
			this.values.forEach((file, id) => {
				if (file.node && file.node.parentNode) {
					file.node.parentNode.removeChild(file.node);
				}
			});
			this.values.clear();
			this.controllers.forEach(controller => {
				controller.reinitFrom(data);
			});
		}
		parse(content) {
			return content;
		}
		unparse(bxTag, {
			node
		}) {
			return '';
		}
	}

	/*
	* @deprecated
	* */
	class DiskFile extends UploadFile {
		id = 'diskfile';
		regexp = /\[(?:DOCUMENT ID|DISK FILE ID)=([n0-9]+)\]/ig;
		init() {
			Array.from(this.editor.getContainer().querySelectorAll('.diskuf-selectdialog')).forEach((selectorNode, index) => {
				const cid = selectorNode.id.replace('diskuf-selectdialog-', '');
				let controller = this.controllers.get(cid);
				if (!controller) {
					controller = new DiskController(cid, selectorNode, this.editor);
					this.controllers.set(cid, controller);
					main_core_events.EventEmitter.subscribe(selectorNode.parentNode, 'OnFileUploadSuccess', ({
						data: [{
							element_id
						}, {
							CID
						}, blob]
					}) => {
						if (controller.getId() !== CID || this.values.has(element_id)) {
							return;
						}
						const [id, fileId, file] = this.parseFile(selectorNode.querySelector('#disk-edit-attach' + element_id));
						this.values.set(id, file);
						if (id !== fileId) {
							this.values.set(fileId, file);
						}
						if (blob && blob['insertImageAfterUpload'] && file.image.src) {
							this.insertFile(id, file.node);
						}
					});
					main_core_events.EventEmitter.subscribe(selectorNode.parentNode, 'OnFileUploadRemove', ({
						compatData: [fileId, {
							CID
						}]
					}) => {
						if (controller.getId() === CID && this.values.has(fileId)) {
							const file = this.values.get(fileId);
							this.values.delete(file.id);
							this.values.delete(file.fileId);
							this.deleteFile([file.id, file.fileId]);
						}
					});
					main_core_events.EventEmitter.subscribe(selectorNode.parentNode, 'OnFileUploadFailed', ({
						compatData: [file, {
							CID
						}, blob]
					}) => {
						if (controller.getId() === CID && blob && blob["referrerToEditor"]) {
							BX.onCustomEvent(blob["referrerToEditor"], "OnImageDataUriCaughtFailed", []);
							BX.onCustomEvent(this.editor, "OnImageDataUriCaughtFailed", [blob["referrerToEditor"]]);
						}
					});
					if (index === 0) {
						initVideoReceptionForTheFirstController(this, controller, selectorNode, this.editor);
						initImageReceptionForTheFirstController(this, controller, selectorNode, this.editor);
						main_core_events.EventEmitter.subscribe(this.editor.getEventObject(), 'onFilesHaveCaught', event => {
							event.stopImmediatePropagation();
							controller.diskUfUploader.onChange([...event.getData()]);
						});
					}
				}
				if (selectorNode.querySelector('table.files-list')) {
					Array.from(selectorNode.querySelector('table.files-list').querySelectorAll('tr')).forEach(tr => {
						const [id, fileId, file] = this.parseFile(tr);
						this.values.set(id, file);
						if (id !== fileId) {
							this.values.set(fileId, file);
						}
					});
				}
			});
		}
		parseFile(tr) {
			const id = String(tr.id.replace('disk-edit-attach', ''));
			const data = {
				id: id,
				name: tr.querySelector('[data-role="name"]') ? tr.querySelector('[data-role="name"]').innerHTML : tr.querySelector('span.f-wrap').innerHTML,
				fileId: tr.getAttribute('bx-attach-file-id'),
				node: tr,
				buttonNode: tr.querySelector('[data-role="button-insert"]'),
				image: {
					src: null,
					lowsrc: null,
					width: null,
					height: null
				}
			};
			const nameNode = tr.querySelector('.f-wrap');
			const insertFile = () => {
				this.insertFile(id, tr);
			};
			if (nameNode) {
				nameNode.addEventListener('click', insertFile);
				nameNode.style.cursor = 'pointer';
				nameNode.title = main_core.Loc.getMessage('MPF_FILE');
			}
			const imageNode = tr.querySelector('img.files-preview');
			if (imageNode && (imageNode.src.indexOf('bitrix/tools/disk/uf.php') >= 0 || imageNode.src.indexOf('/disk/showFile/') >= 0)) {
				imageNode.addEventListener('click', insertFile);
				imageNode.title = main_core.Loc.getMessage('MPF_FILE');
				imageNode.style.cursor = 'pointer';
				data.image.lowsrc = imageNode.lowsrc || imageNode.src;
				data.image.src = (imageNode.rel || imageNode.getAttribute('data-bx-src') || imageNode.src).replace(/&(width|height)=\d+/gi, '');
				const handler = () => {
					data.image.width = imageNode.getAttribute('data-bx-full-width');
					data.image.height = imageNode.getAttribute('data-bx-full-height');
				};
				imageNode.addEventListener('load', handler);
				if (imageNode.complete) {
					handler();
				}
			}
			if (tr instanceof HTMLTableRowElement && !data.buttonNode) {
				data.buttonNode = main_core.Tag.render`
<span class="insert-btn" data-role="button-insert" onclick="${insertFile}">
	<span data-role="insert-btn" class="insert-btn-text">${main_core.Loc.getMessage('MPF_FILE_INSERT_IN_TEXT')}</span>
	<span data-role="in-text-btn" class="insert-btn-text" style="display: none;">${main_core.Loc.getMessage('MPF_FILE_IN_TEXT')}</span>
</span>`;
				setTimeout(() => {
					if (tr.querySelector('.files-info')) {
						tr.querySelector('.files-info').appendChild(data.buttonNode);
						this.checkButtonsDebounced();
					}
				});
			}
			return [id, data.fileId, data];
		}
		buildText(id, params) {
			return `[DISK FILE ID=${id}${params || ''}]`;
		}
	}
	function initVideoReceptionForTheFirstController(diskFileParser, controller, selectorNode, editor) {
		main_core_events.EventEmitter.subscribe(editor.getEventObject(), 'OnVideoHasCaught', event => {
			const fileToUpload = event.getData();
			const onSuccess = ({
				data: [{
					element_id
				}, {}, blob]
			}) => {
				if (fileToUpload === blob && diskFileParser.values.has(element_id)) {
					main_core_events.EventEmitter.unsubscribe(selectorNode.parentNode, 'OnFileUploadSuccess', onSuccess);
					diskFileParser.insertFile(element_id, diskFileParser.values.get(element_id).node);
				}
			};
			main_core_events.EventEmitter.subscribe(selectorNode.parentNode, 'OnFileUploadSuccess', onSuccess);
			controller.exec(() => {
				controller.diskUfUploader.onChange([fileToUpload]);
			});
			event.stopImmediatePropagation();
		});
	}
	function initImageReceptionForTheFirstController(diskFileParser, controller, selectorNode, editor) {
		main_core_events.EventEmitter.subscribe(editor.getEventObject(), 'OnImageHasCaught', event => {
			event.stopImmediatePropagation();
			const fileToUpload = event.getData();
			return new Promise((resolve, reject) => {
				const onSuccess = ({
					data: [{
						element_id
					}, {}, blob]
				}) => {
					if (fileToUpload === blob && diskFileParser.values.has(element_id)) {
						main_core_events.EventEmitter.unsubscribe(selectorNode.parentNode, 'OnFileUploadSuccess', onSuccess);
						main_core_events.EventEmitter.unsubscribe(selectorNode.parentNode, 'OnFileUploadFailed', onFailed);
						const file = diskFileParser.values.get(element_id);
						const html = diskFileParser.buildHTML(element_id, file);
						resolve({
							image: file.image,
							html: html
						});
					}
				};
				const onFailed = ({
					data: [file, {}, blob]
				}) => {
					if (fileToUpload === blob) {
						main_core_events.EventEmitter.unsubscribe(selectorNode.parentNode, 'OnFileUploadSuccess', onSuccess);
						main_core_events.EventEmitter.unsubscribe(selectorNode.parentNode, 'OnFileUploadFailed', onFailed);
						reject();
					}
				};
				main_core_events.EventEmitter.subscribe(selectorNode.parentNode, 'OnFileUploadSuccess', onSuccess);
				main_core_events.EventEmitter.subscribe(selectorNode.parentNode, 'OnFileUploadFailed', onFailed);
				controller.exec(() => {
					controller.diskUfUploader.onChange([event.getData()]);
				});
			});
		});
	}

	class AIImageGenerator extends Default {
		id = 'ai-image-generator';
		buttonParams = {
			name: 'AI image generator',
			iconClassName: 'feed-add-post-editor-btn-ai-image',
			disabledForTextarea: false,
			toolbarSort: 398,
			compact: true
		};
		handler() {
			if (!this.editor.isImageCopilotEnabledBySettings()) {
				top.BX.UI.InfoHelper.show('limit_copilot_off');
				return;
			}
			main_core.Runtime.loadExtension('ai.picker').then(() => {
				const aiImagePicker = new BX.AI.Picker({
					moduleId: 'main',
					contextId: 'image_' + main_core.Loc.getMessage('USER_ID'),
					analyticLabel: 'main_post_form_comments_ai_image',
					saveImages: false,
					history: true,
					onSelect: imageURL => {
						fetch(imageURL).then(response => response.blob()).then(myBlob => {
							BX.onCustomEvent(window, 'onAddVideoMessage', [myBlob, this.editor.getFormId()]);
						});
					}
				});
				aiImagePicker.setLangSpace(BX.AI.Picker.LangSpace.image);
				aiImagePicker.image();
			});
		}
		parse(content, pLEditor) {
			return content;
		}
		unparse(bxTag, oNode) {
			return '';
		}
	}

	function getKnownParser(parserId, editor, htmlEditor) {
		if (parserId === 'Spoiler') {
			return new Spoiler(editor, htmlEditor);
		}
		if (parserId === 'MentionUser') {
			return new PostUser(editor, htmlEditor);
		}
		if (parserId === 'UploadImage') {
			return new UploadImage(editor, htmlEditor);
		}
		if (parserId === 'UploadFile') {
			return new UploadFile(editor, htmlEditor);
		}
		if (parserId === 'AIImage') {
			return new AIImageGenerator(editor, htmlEditor);
		}
		if (typeof parserId === 'object' && parserId['disk_file']) {
			return new DiskFile(editor, htmlEditor);
		}
		return null;
	}

	function bindAutoSave(htmlEditor, formNode) {
		if (!formNode) {
			return;
		}
		BX.addCustomEvent(formNode, 'onAutoSavePrepare', function (ob) {
			ob.FORM.setAttribute("bx-lhe-autosave-prepared", "Y");
			setTimeout(function () {
				BX.addCustomEvent(htmlEditor, 'OnContentChanged', function (text) {
					ob["mpfTextContent"] = text;
					ob.Init();
				});
			}, 1500);
		});
		BX.addCustomEvent(formNode, 'onAutoSave', function (ob, form_data) {
			if (BX.type.isNotEmptyString(ob['mpfTextContent'])) form_data['text'] = ob['mpfTextContent'];
		});
		BX.addCustomEvent(formNode, 'onAutoSaveRestore', function (ob, form_data) {
			if (form_data['text'] && /[^\s]+/gi.test(form_data['text'])) {
				htmlEditor.CheckAndReInit(form_data['text']);
			}
		});
		if (formNode.hasAttribute("bx-lhe-autosave-prepared") && formNode.BXAUTOSAVE) {
			formNode.removeAttribute("bx-lhe-autosave-prepared");
			setTimeout(formNode.BXAUTOSAVE.Prepare, 100);
		}
	}

	function showPanelEditor(editor, htmlEditor, editorParams) {
		let save = false;
		if (editorParams.showPanelEditor !== true && editorParams.showPanelEditor !== false) {
			editorParams.showPanelEditor = !htmlEditor.toolbar.IsShown();
			save = true;
		}
		editor.exec(() => {
			const buttonNode = editor.getContainer().querySelector('[data-bx-role="button-show-panel-editor"]');
			buttonNode?.setAttribute('aria-pressed', editorParams.showPanelEditor ? 'true' : 'false');
			if (editorParams.showPanelEditor) {
				htmlEditor.dom.toolbarCont.style.opacity = 'inherit';
				htmlEditor.toolbar.Show();
				if (buttonNode) {
					buttonNode.classList.add('feed-add-post-form-btn-active');
				}
			} else {
				htmlEditor.toolbar.Hide();
				if (buttonNode) {
					buttonNode.classList.remove('feed-add-post-form-btn-active');
				}
			}
		});
		if (save !== false) {
			BX.userOptions.save('main.post.form', 'postEdit', 'showBBCode', editorParams.showPanelEditor ? 'Y' : 'N');
		}
	}

	function showUrlPreview(htmlEditor, editorParams) {
		if (!(editorParams.urlPreviewId && window['BXUrlPreview'] && BX(editorParams.urlPreviewId))) {
			return;
		}
		const urlPreview = new BXUrlPreview(BX(editorParams.urlPreviewId));
		const OnAfterUrlConvert = function (url) {
			urlPreview.attachUrlPreview({
				url: url
			});
		};
		const OnBeforeCommandExec = function (isContentAction, action, oAction, value) {
			if (action === 'createLink' && BX.type.isPlainObject(value) && value.hasOwnProperty('href')) {
				urlPreview.attachUrlPreview({
					url: value.href
				});
			}
		};
		BX.addCustomEvent(htmlEditor, 'OnAfterUrlConvert', OnAfterUrlConvert);
		BX.addCustomEvent(htmlEditor, 'OnAfterLinkInserted', OnAfterUrlConvert);
		BX.addCustomEvent(htmlEditor, 'OnBeforeCommandExec', OnBeforeCommandExec);
		BX.addCustomEvent(htmlEditor, 'OnReinitialize', (text, data) => {
			urlPreview.detachUrlPreview();
			let urlPreviewId;
			for (let uf in data) {
				if (data.hasOwnProperty(uf) && data[uf].hasOwnProperty('USER_TYPE_ID') && data[uf]['USER_TYPE_ID'] === 'url_preview') {
					urlPreviewId = data[uf]['VALUE'];
					break;
				}
			}
			if (urlPreviewId) {
				urlPreview.attachUrlPreview({
					id: urlPreviewId
				});
			}
		});
	}

	function customizeHTMLEditor(editor, htmlEditor) {
		editor.exec(() => {
			// Contextmenu changing for images/files
			htmlEditor.contextMenu.items['postimage'] = htmlEditor.contextMenu.items['postdocument'] = htmlEditor.contextMenu.items['postfile'] = [{
				TEXT: main_core.Loc.getMessage('BXEdDelFromText'),
				bbMode: true,
				ACTION: function () {
					var node = htmlEditor.contextMenu.GetTargetItem('postimage');
					if (!node) node = htmlEditor.contextMenu.GetTargetItem('postdocument');
					if (!node) node = htmlEditor.contextMenu.GetTargetItem('postfile');
					if (node && node.element) {
						htmlEditor.selection.RemoveNode(node.element);
					}
					htmlEditor.contextMenu.Hide();
				}
			}];
			if (htmlEditor.toolbar.controls && htmlEditor.toolbar.controls.FontSelector) {
				htmlEditor.toolbar.controls.FontSelector.SetWidth(45);
			}
		});
	}

	function bindHTML(editor) {
		const submitButton = document.querySelector('#lhe_button_submit_' + editor.getFormId());
		if (submitButton) {
			submitButton.addEventListener('click', function (event) {
				main_core_events.EventEmitter.emit(editor.getEventObject(), 'OnButtonClick', ['submit']);
				event.preventDefault();
				event.stopPropagation();
			});
		}
		const cancelButton = document.querySelector('#lhe_button_cancel_' + editor.getFormId());
		if (cancelButton) {
			cancelButton.addEventListener('click', function (event) {
				main_core_events.EventEmitter.emit(editor.getEventObject(), 'OnButtonClick', ['cancel']);
				event.preventDefault();
				event.stopPropagation();
			});
		}
	}

	function bindToolbar(editor, htmlEditor) {
		const toolbar = editor.getContainer().querySelector('[data-bx-role="toolbar"]');
		if (toolbar.querySelector('[data-id="file"]')) {
			const fileButton = toolbar.querySelector('[data-id="file"]');
			if (fileButton) {
				fileButton.addEventListener('click', () => {
					main_core_events.EventEmitter.emit(editor.getEventObject(), 'onShowControllers', fileButton.hasAttribute('data-bx-button-status') ? 'hide' : 'show');
				});
				main_core_events.EventEmitter.subscribe(editor.getEventObject(), 'onShowControllers', ({
					data
				}) => {
					if (data.toString() === 'show') {
						fileButton.setAttribute('data-bx-button-status', 'active');
					} else {
						fileButton.removeAttribute('data-bx-button-status');
					}
				});
				fileButton.setAttribute('data-bx-files-count', 0);
				main_core_events.EventEmitter.subscribe(editor.getEventObject(), 'onShowControllers:File:Increment', ({
					data
				}) => {
					const count = data > 0 ? data : 1;
					const filesCount = Math.max(parseInt(fileButton.getAttribute('data-bx-files-count') || 0) + count, 0);
					if (filesCount > 0) {
						if (!fileButton['counterObject']) {
							fileButton['counterObject'] = new BX.UI.Counter({
								value: filesCount,
								color: BX.UI.Counter.Color.GRAY,
								animate: true
							});
							const container = fileButton.querySelector('span');
							container.appendChild(fileButton['counterObject'].getContainer());
						} else {
							fileButton['counterObject'].update(filesCount);
						}
					}
					fileButton.setAttribute('data-bx-files-count', filesCount);
				});
				main_core_events.EventEmitter.subscribe(editor.getEventObject(), 'onShowControllers:File:Decrement', ({
					data
				}) => {
					const count = data > 0 ? data : 1;
					const filesCount = Math.max(parseInt(fileButton.getAttribute('data-bx-files-count') || 0) - count, 0);
					fileButton.setAttribute('data-bx-files-count', filesCount);
					if (fileButton['counterObject']) {
						fileButton['counterObject'].update(filesCount);
					}
				});
			}
		}
		if (toolbar.querySelector('[data-id="search-tag"]')) {
			window['BXPostFormTags_' + editor.getFormId()] = new BXPostFormTags(editor.getFormId(), toolbar.querySelector('[data-id="search-tag"]'));
		}
		if (toolbar.querySelector('[data-id="create-link"]')) {
			toolbar.querySelector('[data-id="create-link"]').addEventListener('click', event => {
				htmlEditor.toolbar.controls.InsertLink.OnClick(event);
			});
		}
		if (toolbar.querySelector('[data-id="video"]')) {
			toolbar.querySelector('[data-id="video"]').addEventListener('click', event => {
				htmlEditor.toolbar.controls.InsertVideo.OnClick(event);
			});
		}
		if (toolbar.querySelector('[data-id="quote"]')) {
			const quoteNode = toolbar.querySelector('[data-id="quote"]');
			quoteNode.setAttribute('data-bx-type', 'action');
			quoteNode.setAttribute('data-bx-action', 'quote');
			quoteNode.addEventListener('mousedown', event => {
				htmlEditor.toolbar.controls.Quote.OnMouseDown.apply(htmlEditor.toolbar.controls.Quote, [event]);
				htmlEditor.CheckCommand(quoteNode);
			});
		}
		if (editor.getContainer().querySelector('[data-bx-role="button-show-panel-editor"]')) {
			editor.getContainer().querySelector('[data-bx-role="button-show-panel-editor"]').addEventListener('click', () => {
				editor.showPanelEditor();
			});
		}
		const copilot = toolbar.querySelector('[data-id="copilot"]');
		if (copilot) {
			let isFocusReturnBound = false;
			copilot.addEventListener('click', () => {
				if (!editor.isTextCopilotEnabledBySettings()) {
					top.BX.UI.InfoHelper.show('limit_copilot_off');
					return;
				}
				editor.showCopilot(copilot);
				if (isFocusReturnBound) {
					return;
				}
				const copilotInstance = htmlEditor.iframeView.copilot?.copilot;
				if (!copilotInstance) {
					return;
				}
				copilotInstance.subscribe('hide', () => {
					copilot.focus({
						focusVisible: true
					});
				});
				isFocusReturnBound = true;
			});
		}
	}

	let intersectionObserver;
	function observeIntersection(entity, callback) {
		if (!intersectionObserver) {
			intersectionObserver = new IntersectionObserver(function (entries) {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						intersectionObserver.unobserve(entry.target);
						const observedCallback = entry.target.observedCallback;
						delete entry.target.observedCallback;
						setTimeout(observedCallback);
					}
				});
			}, {
				threshold: 0
			});
		}
		entity.observedCallback = callback;
		intersectionObserver.observe(entity);
	}
	let justCounter = 0;
	class Toolbar {
		constructor(eventObject, container) {
			this.container = container.querySelector('[data-bx-role="toolbar"]');
			this.container.setAttribute('role', 'toolbar');
			this.adjustMorePosition = this.adjustMorePosition.bind(this);
			this.moreItem = container.querySelector('[data-bx-role="toolbar-item-more"]');
			this.moreItem.addEventListener('click', this.showSubmenu.bind(this));
			observeIntersection(this.container, this.adjustMorePosition);
			window.addEventListener('resize', this.adjustMorePosition);
			this.container.addEventListener('keydown', event => {
				if (event.key !== 'Enter' && event.key !== ' ') {
					return;
				}
				const button = event.target.closest('[data-bx-role="toolbar-item"], [data-bx-role="toolbar-item-more"]');
				if (!button) {
					return;
				}
				event.preventDefault();
				const clickTarget = button.firstElementChild || button;
				clickTarget.click();
			});
		}
		insertAfter(button, buttonId) {
			if (!main_core.Type.isElementNode(button['BODY']) && !main_core.Type.isStringFilled(button['BODY'])) {
				return;
			}
			const item = main_core.Tag.render`<button type="button" class="main-post-form-toolbar-button" data-bx-role="toolbar-item"></button>`;
			if (main_core.Type.isElementNode(button['BODY'])) {
				item.appendChild(button['BODY']);
			} else {
				item.innerHTML = button['BODY'];
			}
			if (button['ID']) {
				item.setAttribute('data-id', button['ID']);
			}
			if (buttonId !== null) {
				let found = false;
				let itemBefore = null;
				Array.from(this.container.querySelectorAll('[data-bx-role="toolbar-item"]')).forEach(toolbarItem => {
					if (found === true && itemBefore === null) {
						itemBefore = toolbarItem;
					} else if (found === false && toolbarItem && toolbarItem.dataset && toolbarItem.dataset.id === buttonId) {
						found = true;
					}
				});
				if (itemBefore) {
					itemBefore.parentNode.insertBefore(item, itemBefore);
				}
			}
			if (!item.parentNode) {
				this.container.appendChild(item);
			}
			this.adjustMorePosition();
		}
		getItems() {
			return Array.from(this.container.querySelectorAll('[data-bx-role="toolbar-item"]'));
		}
		getVisibleItems() {
			const visibleItems = [];
			Array.from(this.container.querySelectorAll('[data-bx-role="toolbar-item"]')).forEach(item => {
				if (item.offsetTop > this.container.clientHeight / 2) {
					visibleItems.push(item);
				}
			});
			return visibleItems;
		}
		getHiddenItems() {
			const hiddenItems = [];
			Array.from(this.container.querySelectorAll('[data-bx-role="toolbar-item"]')).forEach(item => {
				if (item.offsetTop > 0) {
					hiddenItems.push(item);
				}
			});
			return hiddenItems;
		}
		adjustMorePosition() {
			const visibleItemsLength = this.getVisibleItems().length;
			if (visibleItemsLength <= 0 || visibleItemsLength >= this.getItems().length) {
				this.moreItem.style.display = 'none';
			} else {
				this.moreItem.style.display = '';
			}
		}
		getPopup() {
			if (!this.popup) {
				this.popup = main_popup.PopupManager.create({
					id: 'main_post_form_toolbar_' + justCounter++,
					className: 'main-post-form-toolbar-popup',
					cacheable: false,
					content: this.getPopupContainer(),
					closeByEsc: true,
					autoHide: true,
					angle: true,
					bindElement: this.moreItem,
					offsetTop: -5,
					offsetLeft: 5,
					events: {
						onClose: () => {
							Array.from(this.getPopupContainer().querySelectorAll('[data-bx-role="toolbar-item"]')).forEach(item => {
								this.container.appendChild(item);
							});
							delete this.popup;
						}
					}
				});
			}
			return this.popup;
		}
		getPopupContainer() {
			if (!this.popupContainer) {
				this.popupContainer = document.createElement('DIV');
			}
			return this.popupContainer;
		}
		showSubmenu() {
			const hiddenItems = this.getHiddenItems();
			if (hiddenItems.length <= 0) {
				return;
			}
			hiddenItems.forEach(item => {
				this.getPopupContainer().appendChild(item);
			});
			this.getPopup().show();
		}
	}

	class TasksLimit {
		static showPopup(params) {
			let tasksLimitPopup = main_popup.PopupManager.getPopupById(this.getPopupId());
			if (!tasksLimitPopup) {
				tasksLimitPopup = new main_popup.Popup(this.getPopupId(), null, {
					content: this.getTasksLimitPopupContent(),
					lightShadow: false,
					offsetLeft: 20,
					autoHide: false,
					angle: {
						position: 'bottom'
					},
					closeByEsc: false,
					closeIcon: true
				});
			}
			tasksLimitPopup.setBindElement(params.bindPosition);
			tasksLimitPopup.show();
		}
		static getPopupId() {
			return 'bx-post-mention-tasks-limit-popup';
		}
		static getTasksLimitPopupContent() {
			return main_core.Dom.create('DIV', {
				style: {
					width: '400px',
					padding: '10px'
				},
				children: [main_core.Dom.create('SPAN', {
					html: main_core.Loc.getMessage('MPF_MENTION_TASKS_LIMIT').replace('#A_BEGIN#', '<a href="javascript:void(0);" onclick="BX.Main.PostFormTasksLimit.onClickTasksLimitPopupSlider(this);">').replace('#A_END#', '</a>')
				})]
			});
		}
		static onClickTasksLimitPopupSlider(bindElement) {
			BX.Runtime.loadExtension('ui.info-helper').then(({
				FeaturePromotersRegistry
			}) => {
				if (FeaturePromotersRegistry) {
					FeaturePromotersRegistry.getPromoter({
						code: 'limit_tasks_observers_participants',
						bindElement
					}).show();
				} else {
					this.hidePopup();
					BX.UI.InfoHelper.show('limit_tasks_observers_participants', {
						isLimit: true,
						limitAnalyticsLabels: {
							module: 'tasks',
							source: 'postForm',
							subject: 'auditor'
						}
					});
				}
			});
		}
		static hidePopup() {
			const tasksLimitPopup = main_popup.PopupManager.getPopupById(this.getPopupId());
			if (tasksLimitPopup) {
				tasksLimitPopup.close();
			}
		}
	}

	class Editor {
		static repo = new Map();
		jobs = new Map();
		editorParams = {
			height: 100,
			ctrlEnterHandler: null,
			parsers: null,
			showPanelEditor: false,
			lazyLoad: true,
			urlPreviewId: null,
			tasksLimitExceeded: false
		};
		actionQueue = [];
		constructor(options, editorParams) {
			this.id = options['id'];
			this.name = options['name'];
			this.formId = options['formId'];
			this.eventNode = options.eventNode || document.querySelector('#div' + (this.name || this.id));
			this.eventNode.dataset.bxHtmlEditable = 'Y';
			this.formEntityType = null;
			Editor.repo.set(this.getId(), this);
			if (!main_core.Type.isArray(editorParams.parsers) && main_core.Type.isPlainObject(editorParams.parsers)) {
				editorParams.parsers = Object.values(editorParams.parsers);
			}
			this.setEditorParams(editorParams);
			this.bindEvents(window['BXHtmlEditor'] ? window['BXHtmlEditor'].Get(this.getId()) : null);
			this.toolbar = new Toolbar(this.getEventObject(), this.getContainer());
			this.inited = true;
			if (this.name !== null) {
				window[this.name] = this;
			}
			BX.onCustomEvent(this, 'onInitialized', [this, this.getFormId()]);

			//region Compatibility for crm.timeline
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'OnFileUploadSuccess', ({
				compatData
			}) => {
				BX.onCustomEvent(this.getEventObject(), 'onFileIsAdded', compatData);
			});
			//endregion

			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'onBusy', ({
				data: handler
			}) => {
				if (this.jobs.size <= 0) {
					main_core_events.EventEmitter.emit(this.getEventObject(), 'onLHEIsBusy');
				}
				this.jobs.set(handler, (this.jobs.get(handler) || 0) + 1);
			});
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'onReady', ({
				data: handler
			}) => {
				if (this.jobs.size <= 0 || !this.jobs.has(handler)) {
					return;
				}
				let counter = this.jobs.get(handler);
				if (counter <= 1) {
					this.jobs.delete(handler);
					if (this.jobs.size <= 0) {
						main_core_events.EventEmitter.emit(this.getEventObject(), 'onLHEIsReady');
					}
				} else {
					this.jobs.set(handler, --counter);
				}
			});
		}
		setEditorParams(editorParams) {
			this.editorParams = Object.assign(this.editorParams, editorParams);
		}
		bindEvents(htmlEditor = null) {
			this.events = {};
			[['OnEditorInitedBefore', this.OnEditorInitedBefore.bind(this)], ['OnCreateIframeAfter', this.OnCreateIframeAfter.bind(this)], ['OnEditorInitedAfter', this.OnEditorInitedAfter.bind(this)]].forEach(([eventName, closure]) => {
				if (!htmlEditor) {
					this.events[eventName] = htmlEditor => {
						if (htmlEditor.id === this.getId()) {
							//!it important to use deprecated eventEmitter
							BX.removeCustomEvent(eventName, this.events[eventName]);
							delete this.events[eventName];
							closure(htmlEditor);
						}
					};
					//!it important to use deprecated eventEmitter
					BX.addCustomEvent(eventName, this.events[eventName]);
				} else {
					closure(htmlEditor);
				}
			});
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'OnShowLHE', this.OnShowLHE.bind(this));
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'OnButtonClick', this.OnButtonClick.bind(this));
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'OnParserRegister', ({
				data: parser
			}) => {
				this.addParser(parser);
			});
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'OnGetHTMLEditor', ({
				data: someObjectToReceiveHTMLEditor
			}) => {
				someObjectToReceiveHTMLEditor.htmlEditor = this.getEditor();
			});
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'OnInsertContent', ({
				data: [text, html]
			}) => {
				this.insertContent(text, html);
			});
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'OnAddButton', ({
				data: [button, beforeButton]
			}) => {
				this.getToolbar().insertAfter(button, beforeButton);
			});
			bindHTML(this);
		}
		getId() {
			return this.id;
		}
		setEditor(htmlEditor) {
			if (this.htmlEditor === htmlEditor) {
				return;
			}
			this.htmlEditor = htmlEditor;
			htmlEditor.formID = this.getFormId();
			main_core_events.EventEmitter.subscribe(htmlEditor, 'OnCtrlEnter', () => {
				htmlEditor.SaveContent();
				if (main_core.Type.isFunction(this.editorParams.ctrlEnterHandler)) {
					this.editorParams.ctrlEnterHandler();
				} else if (main_core.Type.isStringFilled(this.editorParams.ctrlEnterHandler) && window[this.editorParams.ctrlEnterHandler]) {
					window[this.editorParams.ctrlEnterHandler]();
				} else if (document.forms[this.getFormId()]) {
					BX.submit(document.forms[this.getFormId()]);
				}
			});
			this.editorParams['height'] = htmlEditor.config['height'];
			console.groupCollapsed('main.post.form: parsers: ', this.getId());
			this.editorParams.parsers.forEach(parserId => {
				const parser = getKnownParser(parserId, this, htmlEditor);
				if (parser) {
					console.groupCollapsed(parserId);
					console.log(parser);
					if (parser.hasButton()) {
						htmlEditor.AddButton(parser.getButton());
					}
					htmlEditor.AddParser(parser.getParser());
					console.groupEnd(parserId);
				}
			});
			console.groupEnd('main.post.form: parsers: ', this.getId());

			//region Catching external files
			// paste an image from IO buffer into editor
			main_core_events.EventEmitter.subscribe(htmlEditor, 'OnImageDataUriHandle', ({
				compatData: [editor, imageBase64]
			}) => {
				const blob = BX.UploaderUtils.dataURLToBlob(imageBase64.src);
				if (blob && blob.size > 0 && blob.type.indexOf('image/') === 0) {
					main_core_events.EventEmitter.emit(this.getEventObject(), 'onShowControllers', 'show');
					blob.name = blob.name || imageBase64.title || 'image.' + blob.type.substr(6);
					blob.referrerToEditor = imageBase64;
					main_core_events.EventEmitter.emit(this.getEventObject(), 'OnImageHasCaught', new main_core_events.BaseEvent({
						data: blob
					})).forEach(result => {
						result.then(({
							image,
							html
						}) => {
							main_core_events.EventEmitter.emit(htmlEditor, 'OnImageDataUriCaughtUploaded', new main_core_events.BaseEvent({
								compatData: [imageBase64, image, {
									replacement: html
								}]
							}));
						}).catch(() => {
							main_core_events.EventEmitter.emit(htmlEditor, 'OnImageDataUriCaughtFailed', new main_core_events.BaseEvent({
								compatData: [imageBase64]
							}));
						});
					});
				}
			});

			// paste a video into editor
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'onAddVideoMessage', ({
				compatData: [file, formID]
			}) => {
				if (!formID || this.getFormId() !== formID) {
					return;
				}
				main_core_events.EventEmitter.emit(this.getEventObject(), 'onShowControllers', 'show');
				main_core_events.EventEmitter.emit(this.getEventObject(), 'OnVideoHasCaught', new main_core_events.BaseEvent({
					data: file
				}));
			});
			// DnD

			if (this.editorParams.isDnDEnabled) {
				(() => {
					const placeHolder = BX('micro' + (this.name || this.id));
					let active = false;
					let timeoutId = 0;
					const activate = e => {
						e.preventDefault();
						e.stopPropagation();
						if (timeoutId > 0) {
							clearTimeout(timeoutId);
							timeoutId = 0;
						}
						if (active === true) {
							return;
						}
						let isFileTransfer = e && e['dataTransfer'] && e['dataTransfer']['types'] && e['dataTransfer']['types'].indexOf('Files') >= 0;
						if (isFileTransfer) {
							active = true;
							this.getContainer().classList.add('feed-add-post-dnd-over');
							if (placeHolder) {
								placeHolder.classList.add('feed-add-post-micro-dnd-ready');
							}
						}
						return true;
					};
					const disActivate = e => {
						e.preventDefault();
						e.stopPropagation();
						if (timeoutId > 0) {
							clearTimeout(timeoutId);
						}
						timeoutId = setTimeout(() => {
							active = false;
							this.getContainer().classList.remove('feed-add-post-dnd-over');
							if (placeHolder) {
								placeHolder.classList.remove('feed-add-post-micro-dnd-ready');
							}
						}, 100);
						return false;
					};
					const catchFiles = e => {
						disActivate(e);
						if (e && e['dataTransfer'] && e['dataTransfer']['types'] && e['dataTransfer']['types'].indexOf('Files') >= 0 && e['dataTransfer']['files'] && e['dataTransfer']['files'].length > 0) {
							main_core_events.EventEmitter.emit(this.getEventObject(), 'OnShowLHE', new main_core_events.BaseEvent({
								compatData: ['justShow', {
									onShowControllers: 'show'
								}]
							}));
							main_core_events.EventEmitter.emit(this.getEventObject(), 'onFilesHaveCaught', new main_core_events.BaseEvent({
								data: e['dataTransfer']['files']
							}));
							main_core_events.EventEmitter.emit(this.getEventObject(), 'onFilesHaveDropped', {
								event: e
							});
						}
						return false;
					};
					this.getContainer().addEventListener('dragover', activate);
					this.getContainer().addEventListener('dragenter', activate);
					this.getContainer().addEventListener('dragleave', disActivate);
					this.getContainer().addEventListener('dragexit', disActivate);
					this.getContainer().addEventListener('drop', catchFiles);
					this.getContainer().setAttribute('dropzone', 'copy f:*\/*');
					if (!document.body.hasAttribute('dropzone')) {
						document.body.setAttribute('dropzone', 'copy f:*/*');
						document.body.addEventListener('dragover', function (e) {
							e.preventDefault();
							e.stopPropagation();
							return true;
						});
						document.body.addEventListener('drop', function (e) {
							e.preventDefault();
							e.stopPropagation();
							if (e && e['dataTransfer'] && e['dataTransfer']['types'] && e['dataTransfer']['types'].indexOf('Files') >= 0 && e['dataTransfer']['files'] && e['dataTransfer']['files'].length > 0) {
								let lhe;
								let iteratorBuffer;
								const iterator = this.constructor.#shownForms.keys();
								while ((iteratorBuffer = iterator.next()) && iteratorBuffer.done !== true && iteratorBuffer.value) {
									lhe = iteratorBuffer.value;
								}
								if (lhe) {
									main_core_events.EventEmitter.emit(lhe.getEventObject(), 'OnShowLHE', new main_core_events.BaseEvent({
										compatData: ['justShow', {
											onShowControllers: 'show'
										}]
									}));
									main_core_events.EventEmitter.emit(lhe.getEventObject(), 'onFilesHaveCaught', new main_core_events.BaseEvent({
										data: e['dataTransfer']['files']
									}));
									main_core_events.EventEmitter.emit(lhe.getEventObject(), 'onFilesHaveDropped', {
										event: e
									});
								}
							}
							return false;
						}.bind(this));
					}
					if (placeHolder) {
						placeHolder.addEventListener('dragenter', e => {
							activate(e);
							main_core_events.EventEmitter.emit(this.getEventObject(), 'OnShowLHE', new main_core_events.BaseEvent({
								compatData: ['justShow', {
									onShowControllers: 'show'
								}]
							}));
						});
					}
					main_core_events.EventEmitter.subscribe(this.getEditor(), 'OnIframeDrop', ({
						data: [e]
					}) => catchFiles(e));
					main_core_events.EventEmitter.subscribe(this.getEditor(), 'OnIframeDragOver', ({
						data: [e]
					}) => activate(e));
					main_core_events.EventEmitter.subscribe(this.getEditor(), 'OnIframeDragLeave', ({
						data: [e]
					}) => disActivate(e));
				})();
			}
			//endregion

			main_core_events.EventEmitter.subscribe(htmlEditor, 'OnInsertContent', ({
				data: [text, html]
			}) => {
				this.insertContent(text, html);
			});

			//region Visible customization
			showPanelEditor(this, htmlEditor, this.editorParams);
			showUrlPreview(htmlEditor, this.editorParams);
			customizeHTMLEditor(this, htmlEditor);
			bindAutoSave(htmlEditor, BX(this.getFormId()));
			bindToolbar(this, htmlEditor);
			//endregion
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'OnAfterShowLHE', () => {
				this.getEditor().AllowBeforeUnloadHandler();
			});
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'OnAfterHideLHE', () => {
				TasksLimit.hidePopup();
				this.getEditor().DenyBeforeUnloadHandler();
			});
			main_core_events.EventEmitter.subscribe(htmlEditor, 'OnIframeClick', () => {
				const event = new MouseEvent('click', {
					bubbles: true,
					cancelable: true,
					view: window
				});
				htmlEditor.iframeView.container.dispatchEvent(event);
			});
		}
		getEditor() {
			return this.htmlEditor;
		}
		getFormId() {
			return this.formId;
		}
		getEventObject() {
			return this.eventNode;
		}
		getContainer() {
			return this.eventNode;
		}
		getToolbar() {
			return this.toolbar;
		}
		OnEditorInitedBefore(htmlEditor) {
			this.setEditor(htmlEditor);
		}
		OnCreateIframeAfter() {
			if (this.editorIsLoaded !== true) {
				this.editorIsLoaded = true;
				this.exec();
				main_core_events.EventEmitter.emit(this, 'OnEditorIsLoaded', []);
			}
		}
		get isReady() {
			return this.editorIsLoaded;
		}
		OnEditorInitedAfter(htmlEditor) {
			if (!this.editorParams.lazyLoad) {
				main_core_events.EventEmitter.emit(this.getEventObject(), 'OnShowLHE', new main_core_events.BaseEvent({
					compatData: ['justShow', htmlEditor, false]
				}));
			}
			if (htmlEditor.sandbox && htmlEditor.sandbox.inited) {
				this.OnCreateIframeAfter();
			}
		}
		addParser(parser) {
			this.exec(() => {
				parser.init(this.getEditor());
				this.getEditor().AddParser({
					name: parser.id,
					obj: {
						Parse: (parserId, text) => {
							return parser.parse(text);
						},
						UnParse: parser.unparse
					}
				});
				if (!this['addParserAfterDebounced']) {
					this.addParserAfterDebounced = main_core.Runtime.debounce(() => {
						const content = this.getEditor().GetContent();
						if (/&#9[13];/gi.test(content)) {
							this.getEditor().SetContent(content.replace(/&#91;/ig, "[").replace(/&#93;/ig, "]"), true);
						}
					}, 100);
				}
				this.addParserAfterDebounced();
			});
		}
		insertContent(text, html = null) {
			this.exec(() => {
				const editorMode = this.getEditor().GetViewMode();
				if (editorMode === 'wysiwyg') {
					const range = this.getEditor().selection.GetRange();
					this.getEditor().InsertHtml(html || text, range);
					setTimeout(this.getEditor().AutoResizeSceleton.bind(this.getEditor()), 500);
					setTimeout(this.getEditor().AutoResizeSceleton.bind(this.getEditor()), 1000);
				} else {
					this.getEditor().textareaView.Focus();
					if (!this.getEditor().bbCode) {
						const doc = this.getEditor().GetIframeDoc();
						const dummy = doc.createElement('DIV');
						dummy.style.display = 'none';
						dummy.innerHTML = text;
						doc.body.appendChild(dummy);
						text = this.getEditor().Parse(text, true, false);
						dummy.parentNode.removeChild(dummy);
					}
					this.getEditor().textareaView.WrapWith('', '', text);
				}
			});
		}
		reinit(text, data) {
			let showControllers = 'hide';
			if (main_core.Type.isPlainObject(data) && Object.values(data).length) {
				Object.values(data).forEach(property => {
					if (property && property['VALUE']) {
						showControllers = 'show';
					}
				});
			}
			main_core_events.EventEmitter.emitAsync(this.getEventObject(), 'onReinitializeBeforeAsync', [text, data]).then(() => {
				main_core_events.EventEmitter.emit(this.getEventObject(), 'onShowControllers', showControllers);
				main_core_events.EventEmitter.emit(this.getEventObject(), 'onReinitializeBefore', [text, data]);
				this.getEditor().CheckAndReInit(main_core.Type.isString(text) ? text : '');
				BX.onCustomEvent(this.getEditor(), 'onReinitialize', [this, text, data]);
				if (this.editorParams['height']) {
					this.oEditor.SetConfigHeight(this.editorParams['height']);
					this.oEditor.ResizeSceleton();
				}
			});
		}
		OnShowLHE({
			data,
			compatData
		}) {
			let [show, setFocus, FCFormId] = data || compatData;
			if (!this.getEditor() && window['BXHtmlEditor']) {
				window['BXHtmlEditor'].Get(this.getId()).Init();
			}
			show = show === false || show === 'hide' || show === 'justShow' ? show : true;
			const placeHolder = BX('micro' + (this.name || this.id));
			if (placeHolder) {
				placeHolder.style.display = show === true || show === 'justShow' ? 'none' : 'block';
			}
			if (show === 'hide') {
				this.constructor.#shownForms.delete(this);
				main_core_events.EventEmitter.emit(this.getEventObject(), 'OnBeforeHideLHE');
				if (this.getContainer().style.display === 'none') {
					main_core_events.EventEmitter.emit(this.getEventObject(), 'OnAfterHideLHE');
					main_core_events.EventEmitter.emit(this.getEventObject(), 'onShowControllers', 'hide');
				} else {
					new BX['easing']({
						duration: 200,
						start: {
							opacity: 100,
							height: this.getContainer().scrollHeight
						},
						finish: {
							opacity: 0,
							height: 20
						},
						transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
						step: state => {
							this.getContainer().style.height = state.height + 'px';
							this.getContainer().style.opacity = state.opacity / 100;
						},
						complete: () => {
							this.getContainer().style.cssText = '';
							this.getContainer().style.display = 'none';
							main_core_events.EventEmitter.emit(this.getEventObject(), 'OnAfterHideLHE');
							main_core_events.EventEmitter.emit(this.getEventObject(), 'onShowControllers', 'hide');
						}
					}).animate();
				}
			} else if (show) {
				this.constructor.#shownForms.set(this);
				this.formEntityType = main_core.Type.isArray(FCFormId) && main_core.Type.isStringFilled(FCFormId[0]) && FCFormId[0].match(/^TASK_(\d+)$/i) ? 'task' : null;
				if (setFocus && main_core.Type.isPlainObject(setFocus)) {
					if (setFocus['onShowControllers']) {
						main_core_events.EventEmitter.emit(this.getEventObject(), 'onShowControllers', setFocus['onShowControllers']);
					}
				}
				main_core_events.EventEmitter.emit(this.getEventObject(), 'OnBeforeShowLHE');
				if (show === 'justShow' || this.getContainer().style.display === 'block') {
					this.getContainer().style.display = 'block';
					main_core_events.EventEmitter.emit(this.getEventObject(), 'OnAfterShowLHE'); //To remember: Here is set a text -> reinitData-> reinit -> editor.CheckAndReInit()
					if (setFocus !== false) {
						this.getEditor().Focus();
					}
				} else {
					main_core.Dom.adjust(this.getContainer(), {
						style: {
							display: 'block',
							overflow: 'hidden',
							height: '20px',
							opacity: 0.1
						}
					});
					new BX['easing']({
						duration: 200,
						start: {
							opacity: 10,
							height: 20
						},
						finish: {
							opacity: 100,
							height: this.getContainer().scrollHeight
						},
						transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
						step: state => {
							this.getContainer().style.height = state.height + 'px';
							this.getContainer().style.opacity = state.opacity / 100;
						},
						complete: () => {
							main_core_events.EventEmitter.emit(this.getEventObject(), 'OnAfterShowLHE'); //To remember: Here is set a text -> reinitData-> reinit -> editor.CheckAndReInit()
							this.getEditor().Focus();
							this.getContainer().style.cssText = "";
						}
					}).animate();
				}
			} else {
				this.constructor.#shownForms.delete(this);
				main_core_events.EventEmitter.emit(this.getEventObject(), 'OnBeforeHideLHE');
				main_core_events.EventEmitter.emit(this.getEventObject(), 'onShowControllers', 'hide');
				this.getContainer().style.display = 'none';
				main_core_events.EventEmitter.emit(this.getEventObject(), 'OnAfterHideLHE');
			}
		}
		OnButtonClick({
			data: [action]
		}) {
			if (action !== 'cancel') {
				const res = {
					result: true
				};
				main_core_events.EventEmitter.emit(this.getEventObject(), 'OnClickBeforeSubmit', new main_core_events.BaseEvent({
					compatData: [this, res]
				}));
				if (res['result'] !== false) {
					main_core_events.EventEmitter.emit(this.getEventObject(), 'OnClickSubmit', new main_core_events.BaseEvent({
						compatData: [this]
					}));
				}
			} else {
				main_core_events.EventEmitter.emit(this.getEventObject(), 'OnClickCancel', new main_core_events.BaseEvent({
					compatData: [this]
				}));
				main_core_events.EventEmitter.emit(this.getEventObject(), 'OnShowLHE', new main_core_events.BaseEvent({
					compatData: ['hide']
				}));
			}
		}

		//region compatibility
		exec(func, args) {
			if (typeof func == 'function') {
				this.actionQueue.push([func, args]);
			}
			if (this.editorIsLoaded === true) {
				let res;
				while ((res = this.actionQueue.shift()) && res) {
					res[0].apply(this, res[1]);
				}
			}
		}
		get oEditor() {
			return this.getEditor();
		}
		get oEditorId() {
			return this.getId();
		}
		get formID() {
			return this.getFormId();
		}
		get params() {
			return {
				formID: this.getFormId()
			};
		}
		showPanelEditor() {
			showPanelEditor(this, this.getEditor(), {});
		}
		getContent() {
			return this.oEditor ? this.oEditor.GetContent() : '';
		}
		setContent(text) {
			if (this.getEditor()) {
				this.getEditor().SetContent(text);
			}
		}
		controllerInit(status) {
			main_core_events.EventEmitter.emit(this.getEventObject(), 'onShowControllers', status === 'hide' ? 'hide' : 'show');
		}
		showCopilot(copilot) {
			const editor = this.getEditor();
			editor.SetView('wysiwyg');
			if (editor.ShowCopilotAtTheBottom(copilot)) {
				editor.iframeView.GetSelection().removeAllRanges();
			}
		}
		isTextCopilotEnabledBySettings() {
			const isEnabled = this.getEditor().config.isCopilotTextEnabledBySettings;
			return main_core.Type.isNil(isEnabled) || isEnabled;
		}
		isImageCopilotEnabledBySettings() {
			const isEnabled = this.getEditor().config.isCopilotImageEnabledBySettings;
			return main_core.Type.isNil(isEnabled) || isEnabled;
		}
		get controllers() {
			const event = new main_core_events.BaseEvent();
			const data = {};
			event.setData(data);
			main_core_events.EventEmitter.emit(this.getEventObject(), 'onCollectControllers', event);
			const result = {};
			Object.keys(data).forEach(fieldName => {
				result[fieldName] = Object.assign({}, data[fieldName]);
				result[fieldName]['values'] = {};
				if (main_core.Type.isArray(data[fieldName]['values'])) {
					data[fieldName]['values'].forEach(id => {
						result[fieldName]['values'][id] = {
							id: id
						};
					});
				} else if (main_core.Type.isPlainObject(data[fieldName]['values'])) {
					result[fieldName]['values'] = Object.assign({}, data[fieldName]['values']);
				}
			});
			return result;
		}
		get arFiles() {
			const event = new main_core_events.BaseEvent();
			const data = {};
			event.setData(data);
			main_core_events.EventEmitter.emit(this.getEventObject(), 'onCollectControllers', event);
			const result = {};
			Object.keys(data).forEach(fieldName => {
				if (data[fieldName]['values']) {
					data[fieldName]['values'].forEach(id => {
						result[id] = [fieldName];
					});
				}
			});
			return result;
		}
		//endregion
		static #shownForms = new Map();
	}

	window['LHEPostForm'] = {
		//region compatibility
		getEditor: function (editor) {
			return window["BXHtmlEditor"] ? window["BXHtmlEditor"].Get(typeof editor == "object" ? editor.id : editor) : null;
		},
		getHandler: function (editor) {
			const id = main_core.Type.isStringFilled(editor) ? editor : editor.id;
			return Editor.repo.get(id);
		},
		getHandlerByFormId: function (formId) {
			let result = null;
			Editor.repo.forEach(editor => {
				if (editor.getFormId() === formId) {
					result = editor;
				}
			});
			return result;
		},
		reinitData: function (editorID, text, data) {
			const files = {};
			if (!main_core.Type.isPlainObject(data)) {
				data = {};
			}
			Object.entries(data).forEach(([userFieldName, userField]) => {
				if (main_core.Type.isPlainObject(userField) && userField['USER_TYPE_ID'] && userField['VALUE'] && Object.values(userField['VALUE']).length > 0) {
					files[userFieldName] = userField;
				}
			});
			const handler = this.getHandler(editorID);
			if (handler && (handler.isReady || main_core.Type.isStringFilled(text) || Object.values(files).length > 0)) {
				handler.exec(handler.reinit, [text, files]);
			}
			return false;
		},
		reinitDataBefore: function (editorID) {
			const handler = Editor.repo.get(editorID);
			if (handler && handler.getEventObject()) {
				main_core_events.EventEmitter.emit(handler.getEventObject(), 'onReinitializeBefore', [handler]);
			}
		}
		//endregion
	};

	exports.PostForm = Editor;
	exports.PostFormTasksLimit = TasksLimit;

})(this.BX.Main = this.BX.Main || {}, BX, BX.Event, BX.Main);



;(function(){
	if (window["BXPostFormTags"])
		return;
var repo = {
	selector : {},
	mentionParams: {},
};

window.BXPostFormTags = function(formID, buttonID)
{
	this.popup = null;
	this.formID = formID;
	this.buttonID = buttonID;
	this.sharpButton = null;
	this.addNewLink = null;
	this.tagsArea = null;
	this.hiddenField = null;
	this.popupContent = null;

	BX.ready(BX.proxy(this.init, this));
};

window.BXPostFormTags.prototype.init = function()
{
	this.sharpButton = BX(this.buttonID);
	this.addNewLink = BX("post-tags-add-new-" + this.formID);
	this.tagsArea = BX("post-tags-block-" + this.formID);
	this.tagsContainer = BX("post-tags-container-" + this.formID);
	this.hiddenField = BX("post-tags-hidden-" + this.formID);
	this.popupContent = BX("post-tags-popup-content-" + this.formID);
	this.popupInput = BX.findChild(this.popupContent, { tag : "input" });

	var tags = BX.findChildren(this.tagsContainer, { className : "feed-add-post-del-but" }, true);
	for (var i = 0, cnt = tags.length; i < cnt; i++ )
	{
		BX.bind(tags[i], "click", BX.proxy(this.onTagDelete, {
			obj : this,
			tagBox : tags[i].parentNode,
			tagValue : tags[i].parentNode.getAttribute("data-tag")
		}));
	}

	BX.bind(this.sharpButton, "click", BX.proxy(this.onButtonClick, this));
	BX.bind(this.addNewLink, "click", BX.proxy(this.onAddNewClick, this));
};

window.BXPostFormTags.prototype.onTagDelete = function()
{
	BX.remove(this.tagBox);
	this.obj.hiddenField.value = this.obj.hiddenField.value.replace(this.tagValue + ',', '').replace('  ', ' ');
};

window.BXPostFormTags.prototype.show = function()
{
	if (this.popup === null)
	{
		this.popup = new BX.PopupWindow("bx-post-tag-popup", this.addNewLink, {
			content : this.popupContent,
			lightShadow : false,
			offsetTop: 8,
			offsetLeft: 10,
			autoHide: true,
			angle : true,
			closeByEsc: true,
			zIndex: -840,
			buttons: [
				new BX.PopupWindowButton({
					text : BX.message("TAG_ADD"),
					events : {
						click : BX.proxy(this.onTagAdd, this)
					}
				})
			]
		});

		BX.bind(this.popupInput, "keydown", BX.proxy(this.onKeyPress, this));
		BX.bind(this.popupInput, "keyup", BX.proxy(this.onKeyPress, this));
	}

	this.popup.show();
	BX.focus(this.popupInput);
};

window.BXPostFormTags.prototype.addTag = function(tagStr)
{
	var tags = BX.type.isNotEmptyString(tagStr) ? tagStr.split(",") : this.popupInput.value.split(",");
	var result = [];
	for (var i = 0; i < tags.length; i++ )
	{
		var tag = BX.util.trim(tags[i]);
		if (tag.length > 0)
		{
			var allTags = this.hiddenField.value.split(",");
			if (!BX.util.in_array(tag, allTags))
			{
				var newTagDelete;
				var newTag = BX.create("span", {
					children : [
						(newTagDelete = BX.create("span", { attrs : { "class": "feed-add-post-del-but" }}))
					],
					attrs : { "class": "feed-add-post-tags" }
				});

				newTag.insertBefore(document.createTextNode(tag), newTagDelete);
				this.tagsContainer.insertBefore(newTag, this.addNewLink);

				BX.bind(newTagDelete, "click", BX.proxy(this.onTagDelete, {
					obj : this,
					tagBox : newTag,
					tagValue : tag
				}));

				this.hiddenField.value += tag + ',';

				result.push(tag);
			}
		}
	}

	return result;
};

window.BXPostFormTags.prototype.onTagAdd = function()
{
	this.addTag();
	this.popupInput.value = "";
	this.popup.close();
};

window.BXPostFormTags.prototype.onAddNewClick = function(event)
{
	event = event || window.event;
	this.show();
	BX.PreventDefault(event);
};

window.BXPostFormTags.prototype.onButtonClick = function(event)
{
	event = event || window.event;
	BX.show(this.tagsArea);
	this.show();
	BX.PreventDefault(event);
};

window.BXPostFormTags.prototype.onKeyPress = function(event)
{
	event = event || window.event;
	var key = (event.keyCode ? event.keyCode : (event.which ? event.which : null));
	if (key == 13)
	{
		setTimeout(BX.proxy(this.onTagAdd, this), 0);
	}
};

window.BXPostFormImportant = function(formID, buttonID, inputName)
{
	if (inputName)
	{
		this.formID = formID;
		this.buttonID = buttonID;
		this.inputName = inputName;

		this.fireButton = null;
		this.activeBlock = null;
		this.hiddenField = null;

		BX.ready(BX.proxy(this.init, this));
	}

	return false;
};
window.BXPostFormImportant.prototype.init = function()
{
	this.fireButton = BX(this.buttonID);
	this.activeBlock = BX(this.buttonID + '-active');

	var form = BX(this.formID);
	if (form)
	{
		this.hiddenField = form[this.inputName];
		if (
			this.hiddenField
			&& this.hiddenField.value == 1
		)
		{
			this.showActive();
		}
	}

	BX.bind(this.fireButton, "click", BX.proxy(function(event) {
		event = event || window.event;
		this.showActive();
		BX.PreventDefault(event);
	}, this));

	BX.bind(this.activeBlock, "click", BX.proxy(function(event) {
		event = event || window.event;
		this.hideActive();
		BX.PreventDefault(event);
	}, this));
};
window.BXPostFormImportant.prototype.showActive = function(event)
{
	BX.hide(this.fireButton);
	BX.show(this.activeBlock, 'inline-block');

	if (this.hiddenField)
	{
		this.hiddenField.value = 1;
	}

	return false;
};
window.BXPostFormImportant.prototype.hideActive = function(event)
{
	BX.hide(this.activeBlock);
	BX.show(this.fireButton, 'inline-block');

	if (this.hiddenField)
	{
		this.hiddenField.value = 0;
	}

	return false;
};

var lastWaitElement = null;
window.MPFbuttonShowWait = function(el)
{
	if (el && !BX.type.isElementNode(el))
	{
		el = null;
	}

	el = el || this;
	el = (el ? (el.tagName == "A" ? el : el.parentNode) : el);
	if (el)
	{
		BX.addClass(el, "ui-btn-clock");
		lastWaitElement = el;
		BX.defer(function(){el.disabled = true})();
	}
};

var MPFMention = {
	listen: false,
	plus : false,
	text : '',
	bSearch: false,
	node: null,
	mode: null
};
BX.addCustomEvent(window, 'onInitialized', function(someObject) {
	if (someObject && someObject.eventNode)
	{
		BX.onCustomEvent(someObject.eventNode, 'OnClickCancel', function(){
			MPFMention.node = null;
		});
	}
});

BX.addCustomEvent(window, 'BX.MPF.MentionSelector:open', function(params) {

	var formId = (BX.Type.isStringFilled(params.formId) ? params.formId : '');
	if (
		!BX.Type.isStringFilled(formId)
		|| BX.Type.isUndefined(repo.mentionParams[formId])
	)
	{
		return;
	}

	var bindNode = (BX.Type.isDomNode(params.bindNode) ? params.bindNode : null);
	var bindPosition = (BX.type.isNotEmptyObject(params.bindPosition) ? params.bindPosition : null);

	var selectorId = window.MPFgetSelectorId('bx-mention-' + formId + '-id') + (bindNode ? '-withsearch' : '');
	var dialog = BX.UI.EntitySelector.Dialog.getById(selectorId);
	if (!dialog)
	{
		window.MPFcreateSelectorDialog({
			formId: formId,
			selectorId: selectorId,
			enableSearch: !!bindNode,
			params: repo.mentionParams[formId],
		});

		dialog = BX.UI.EntitySelector.Dialog.getById(selectorId);
	}

	if (!dialog)
	{
		return;
	}

	dialog.deselectAll();
	dialog.search('');
	dialog.show();

	var popupBindOptions = {};
	if (BX.Type.isDomNode(bindNode))
	{
		dialog.focusSearch();
		dialog.popup.setBindElement(bindNode);
		popupBindOptions.position = 'top';
	}
	else if (BX.type.isNotEmptyObject(bindPosition))
	{
		bindPosition.top -= 5;
		dialog.popup.setBindElement(bindPosition);
	}
	dialog.popup.adjustPosition(popupBindOptions);
});

window.onKeyDownHandler = function(e, editor, formID)
{
	var keyCode = e.keyCode;

	if (!window['BXfpdStopMent' + formID])
	{
		return true;
	}

	var selectorId = window.MPFgetSelectorId('bx-mention-' + formID + '-id');

	if (
		keyCode === editor.KEY_CODES['backspace']
		&& MPFMention.node
	)
	{
		var mentText = BX.util.trim(editor.util.GetTextContent(MPFMention.node));
		if (
			mentText === '+'
			|| mentText === '@'
			|| (
				MPFMention.mode == 'button'
				&& mentText.length == 1
			)
		)
		{
			window['BXfpdStopMent' + formID]();
		}
		else if (
			MPFMention.mode == 'button'
			&& mentText.length == 1
		)
		{
			window['BXfpdStopMent' + formID]();
		}
	}

	if (
		BX.util.in_array(keyCode, [ 107, 187 ])
		|| (
			(e.shiftKey || e.modifiers > 3)
			&& BX.util.in_array(keyCode, [ 50, 43, 61 ])
		)
		|| (
			e.altKey
			&& BX.util.in_array(keyCode, [ 76 ])
		) /* German @ == Alt + L*/
		|| (
			e.altKey
			&& e.ctrlKey
			&& BX.util.in_array(keyCode, [ 81 ])
			&& e.key === '@'
		) /* Win LA Spanish @ == Ctrl + Alt + Q */
		|| (
			e.altKey
			&& BX.util.in_array(keyCode, [ 71, 81 ])
			&& e.key === '@'
		) /* MacOS ES Spanish @ == Alt + G, MacOS LA Spanish @ = Alt + Q */
		|| (
			e.altKey
			&& BX.util.in_array(keyCode, [ 50 ])
			&& e.key === '@'
		) /* MacOS PT Portugal @ == Alt + 2 */
		|| (
			BX.Type.isFunction(e.getModifierState)
			&& !!e.getModifierState('AltGraph')
			&& BX.util.in_array(keyCode, [ 81, 50, 48 ])
			&& !BX.Type.isUndefined(e.key)
			&& e.key === '@'
		) /* Win German @ == AltGr + Q, Win Spanish @ == AltGr + 2, Win French @ == AltGr + 0 */
		|| (
			BX.util.in_array(keyCode, [ 192 ])
			&& e.key === '@'
		) /* MacOS FR */
	)
	{
		setTimeout(function()
		{
			var range = editor.selection.GetRange();
			var doc = editor.GetIframeDoc();
			var txt = (range ? range.endContainer.textContent : '');
			var determiner = (txt ? txt.slice(range.endOffset - 1, range.endOffset) : '');
			var prevS = (txt ? txt.slice(range.endOffset - 2, range.endOffset-1) : '');

			if (
				(determiner == "@" || determiner == "+")
				&& (
					!prevS
					|| BX.util.in_array(prevS, ["+", "@", ",", "("])
					|| (
						prevS.length == 1
						&& BX.util.trim(prevS) === ""
					)
				)
			)
			{
				MPFMention.listen = true;
				MPFMention.listenFlag = true;
				MPFMention.text = '';
				MPFMention.leaveContent = true;
				MPFMention.mode = 'plus';

				range.setStart(range.endContainer, range.endOffset - 1);
				range.setEnd(range.endContainer, range.endOffset);
				editor.selection.SetSelection(range);
				MPFMention.node = BX.create("SPAN", {props: {id: "bx-mention-node"}}, doc);
				editor.selection.Surround(MPFMention.node, range);
				range.setStart(MPFMention.node, 1);
				range.setEnd(MPFMention.node, 1);
				editor.selection.SetSelection(range);

				if (BX.Type.isStringFilled(selectorId))
				{
					BX.onCustomEvent(window, 'BX.MPF.MentionSelector:open', [{
						formId: formID,
						bindPosition: getMentionNodePosition(MPFMention.node, editor)
					}]);
				}
			}
		}, 10);
	}

	if (MPFMention.listen)
	{
		var activeDialogTab = null;
		var dialog = (
			BX.Type.isStringFilled(selectorId)
				? BX.UI.EntitySelector.Dialog.getById(selectorId)
				: null
		);
		if (
			dialog
			&& dialog.getActiveTab()
		)
		{
			activeDialogTab = dialog.getActiveTab().getId();
		}

		var key = null;
		switch (keyCode)
		{
			case editor.KEY_CODES.enter:
				key = 'Enter';
				break;
			case 9:
				key = 'Tab';
				break;
			case editor.KEY_CODES.up:
				key = 'ArrowUp';
				break;
			case editor.KEY_CODES.down:
				key = 'ArrowDown';
				break;
			case editor.KEY_CODES.left:
				if (activeDialogTab === 'departments')
				{
					key = 'ArrowLeft';
				}
				break;
			case editor.KEY_CODES.right:
				if (activeDialogTab === 'departments')
				{
					key = 'ArrowRight';
				}
				break;
		}

		if (key)
		{
			var event = new KeyboardEvent('keydown', {
				key: key,
				keyCode: keyCode,
				bubbles: true,
				cancelable: true,
				view: window,
			});

			if (!document.dispatchEvent(event))
			{
				editor.iframeKeyDownPreventDefault = true;
				e.stopPropagation();
				e.preventDefault();
			}
		}
	}

	if (
		!MPFMention.listen
		&& MPFMention.listenFlag
		&& keyCode === editor.KEY_CODES["enter"]
	)
	{
		var range = editor.selection.GetRange();
		if (range.collapsed)
		{
			var node = range.endContainer;
			var doc = editor.GetIframeDoc();

			if (node)
			{
				if (node.className !== 'bxhtmled-metion')
				{
					node = BX.findParent(node, function(n)
					{
						return n.className == 'bxhtmled-metion';
					}, doc.body);
				}

				if (node && node.className == 'bxhtmled-metion')
				{
					editor.selection.SetAfter(node);
				}
			}
		}
	}
};

window.onKeyUpHandler = function(e, editor, formID)
{
	var keyCode = e.keyCode;
	var range;
	var mentText;

	if (!window['BXfpdStopMent' + formID])
	{
		return true;
	}

	if (MPFMention.listen === true)
	{
		if (keyCode == editor.KEY_CODES.escape) //ESC
		{
			var event = new KeyboardEvent('keyup', {
				key: 'Escape',
				keyCode: keyCode,
				bubbles: true,
				cancelable: true,
				view: window,
			});

			if (!document.dispatchEvent(event))
			{
				e.stopPropagation();
				e.preventDefault();
			}

			window['BXfpdStopMent' + formID]();
		}
		else if (
			keyCode !== editor.KEY_CODES.enter
			&& keyCode !== editor.KEY_CODES.left
			&& keyCode !== editor.KEY_CODES.right
			&& keyCode !== editor.KEY_CODES.up
			&& keyCode !== editor.KEY_CODES.down
		)
		{
			if (BX(MPFMention.node))
			{
				mentText = BX.util.trim(editor.util.GetTextContent(MPFMention.node));
				var mentTextOrig = mentText;

				mentText = mentText.replace(/^[\+@]*/, '');
				MPFMention.bSearch = BX.Type.isStringFilled(mentText);

				var selectorId = window.MPFgetSelectorId('bx-mention-' + formID + '-id');
				var dialog = BX.UI.EntitySelector.Dialog.getById(selectorId);

				if (
					BX.Type.isStringFilled(mentText)
					&& dialog
				)
				{
					dialog.search(mentText);
				}

				if (
					MPFMention.leaveContent
					&& MPFMention._lastText
				)
				{
					if (mentTextOrig === '')
					{
						window['BXfpdStopMent' + formID]();
					}
					else if (
						mentTextOrig !== ''
						&& mentText === ''
					)
					{
						MPFMention.bSearch = false;
						if (dialog)
						{
							dialog.search('');
						}
					}
				}

				MPFMention.lastText = mentText;
				MPFMention._lastText = mentTextOrig;

			}
			else
			{
				window['BXfpdStopMent' + formID]();
			}
		}
	}
	else
	{
		if (
			!e.shiftKey &&
			(keyCode === editor.KEY_CODES["space"] ||
			keyCode === editor.KEY_CODES["escape"] ||
			keyCode === 188 ||
			keyCode === 190
			))
		{
			range = editor.selection.GetRange();
			if (range.collapsed)
			{
				var node = range.endContainer;
				var doc = editor.GetIframeDoc();

				if (node)
				{
					if (node.className !== 'bxhtmled-metion')
					{
						node = BX.findParent(node, function(n)
						{
							return n.className == 'bxhtmled-metion';
						}, doc.body);
					}

					if (node && node.className == 'bxhtmled-metion')
					{
						mentText = editor.util.GetTextContent(node);
						var matchSep = mentText.match(/[\s\.\,]$/);
						if (matchSep || keyCode === editor.KEY_CODES["escape"])
						{
							node.innerHTML = mentText.replace(/[\s\.\,]$/, '');
							var sepNode = BX.create('SPAN', {html: matchSep || editor.INVISIBLE_SPACE}, doc);
							editor.util.InsertAfter(sepNode, node);
							editor.selection.SetAfter(sepNode);
						}
					}
				}
			}
		}
	}
};

window.onTextareaKeyDownHandler = function(e, editor, formID)
{
	var keyCode = e.keyCode;

	if (MPFMention.listen && keyCode == editor.KEY_CODES.enter)
	{
		editor.textareaKeyDownPreventDefault = true;
		e.stopPropagation();
		e.preventDefault();
	}
};

window.onTextareaKeyUpHandler = function(e, editor, formID)
{
	var cursor = null;
	var value = '';
	var keyCode = e.keyCode;

	var selectorId = window.MPFgetSelectorId('bx-mention-' + formID + '-id');

	if (MPFMention.listen === true)
	{
		if (keyCode == 27) //ESC
		{
			window['BXfpdStopMent' + formID]();
		}
		else if (keyCode !== 13)
		{
			value = editor.textareaView.GetValue(false);
			cursor = editor.textareaView.GetCursorPosition();

			var mentText = '';
			var mentTextOrig = '';

			if (value.indexOf('+') !== -1 || value.indexOf('@') !== -1)
			{
				var valueBefore = value.substr(0, cursor);
				var charPos = Math.max(valueBefore.lastIndexOf('+'), valueBefore.lastIndexOf('@'));

				if (charPos >= 0)
				{
					mentText = valueBefore.substr(charPos);
					mentTextOrig = mentText;

					mentText = mentText.replace(/^[\+@]*/, '');
					MPFMention.bSearch = BX.Type.isStringFilled(mentText);

					var dialog = BX.UI.EntitySelector.Dialog.getById(selectorId);

					if (
						BX.Type.isStringFilled(mentText)
						&& dialog
					)
					{
						dialog.search(mentText);
					}
				}
			}

			if (MPFMention._lastText)
			{
				if (mentTextOrig === '')
				{
					window['BXfpdStopMent' + formID]();
				}
				else if (
					mentTextOrig !== ''
					&& mentText === ''
				)
				{
					MPFMention.bSearch = false;
					if (dialog)
					{
						dialog.search('');
					}
				}
			}

			MPFMention.lastText = mentText;
			MPFMention._lastText = mentTextOrig;
		}
	}
	else
	{
		if (keyCode == 16)
		{
			var _this = this;
			this.shiftPressed = true;
			if (this.shiftTimeout)
			{
				this.shiftTimeout = clearTimeout(this.shiftTimeout);
			}

			this.shiftTimeout = setTimeout(function()
			{
				_this.shiftPressed = false;
			}, 100);
		}

		if (keyCode == 107 || (e.shiftKey || e.modifiers > 3 || this.shiftPressed) &&
			BX.util.in_array(keyCode, [187, 50, 107, 43, 61]))
		{
			cursor = editor.textareaView.element.selectionStart;
			if (cursor > 0)
			{
				value = editor.textareaView.element.value;
				var lastChar = value.substr(cursor - 1, 1);

				if (lastChar && (lastChar === '+' || lastChar === '@'))
				{
					MPFMention.listen = true;
					MPFMention.listenFlag = true;
					MPFMention.text = '';
					MPFMention.textarea = true;
					MPFMention.bSearch = false;
					MPFMention.mode = 'plus';

					BX.onCustomEvent(window, 'BX.MPF.MentionSelector:open', [{
						formId: formID,
						bindPosition: BX.pos(document.getElementById('bx-b-mention-' + formID)),
					}]);
				}
			}
		}
	}
};

var getMentionNodePosition = function(mention, editor)
{
	var mentPos = BX.pos(mention);
	var editorPos = BX.pos(editor.dom.areaCont);
	var editorDocScroll = BX.GetWindowScrollPos(editor.GetIframeDoc());
	var top = editorPos.top + mentPos.bottom - editorDocScroll.scrollTop + 2;
	var left = editorPos.left + mentPos.right - editorDocScroll.scrollLeft;

	return {top: top, left: left};
};

window.BxInsertMention = function (params)
{
	var item = params.item;
	var type = params.type;
	var formID = params.formID;
	var editorId = params.editorId;
	var bNeedComa = params.bNeedComa;
	var editor = LHEPostForm.getEditor(editorId);
	var spaceNode;

		if (
		(
			type === 'user'
			|| type === 'project'
			|| type === 'department'
		)
		&& item
		&& item.entityId > 0
		&& editor
	)
	{
		if (editor.GetViewMode() == 'wysiwyg') // WYSIWYG
		{
			var doc = editor.GetIframeDoc();
			var range = editor.selection.GetRange();
			var mention = BX.create('SPAN',
					{
						props: {className: 'bxhtmled-metion'},
						text: BX.util.htmlspecialcharsback(item.name)
					}, doc);
				// &nbsp; - for chrome
			spaceNode = BX.create('SPAN', {html: (bNeedComa ? ',&nbsp;' : '&nbsp;')}, doc);

			var bxTagData = {
				tag: 'postuser',
				params: {
					value : item.entityId
				},
			};

			switch (type)
			{
				case 'project':
					bxTagData.projectId = item.entityId;
					bxTagData.projectName = item.name;
					break;
				case 'department':
					bxTagData.departmentId = item.entityId;
					bxTagData.departmentName = item.name;
					break;
				default:
					bxTagData.userId = item.entityId;
					bxTagData.userName = item.name;
			}

			editor.SetBxTag(mention, bxTagData);

			if (
				BX(MPFMention.node)
				&& MPFMention.node.parentNode
			)
			{
				editor.util.ReplaceNode(MPFMention.node, mention);
			}
			else
			{
				editor.selection.InsertNode(mention, range);
			}

			if (mention && mention.parentNode)
			{
				var parentMention = BX.findParent(mention, {className: 'bxhtmled-metion'}, doc.body);
				if (parentMention)
				{
					editor.util.InsertAfter(mention, parentMention);
				}
			}

			if (mention && mention.parentNode)
			{
				editor.util.InsertAfter(spaceNode, mention);
				editor.selection.SetAfter(spaceNode);
			}
		}
		else if (editor.GetViewMode() == 'code' && editor.bbCode) // BB Codes
		{
			editor.textareaView.Focus();

			var value = editor.textareaView.GetValue(false);
			var cursor = editor.textareaView.GetCursorPosition();
			var valueBefore = value.substr(0, cursor);
			var charPos = Math.max(valueBefore.lastIndexOf('+'), valueBefore.lastIndexOf('@'));

			if (charPos >= 0 && cursor > charPos)
			{
				editor.textareaView.SetValue(value.substr(0, charPos) + value.substr(cursor));
				editor.textareaView.element.setSelectionRange(charPos, charPos);
			}

			var bbCode = '';
			switch (type)
			{
				case 'user':
					bbCode = 'USER';
					break;
				case 'project':
					bbCode = 'PROJECT';
					break;
				case 'department':
					bbCode = 'DEPARTMENT';
					break;
				default:
			}

			editor.textareaView.WrapWith(false, false, "[" + bbCode + "=" + item.entityId + "]" + item.name + "[/" + bbCode + "]" + (bNeedComa ? ', ' : ' '));
		}

		if (params.fireAddEvent === true)
		{
			BX.onCustomEvent(window, 'onMentionAdd', [ item, type ]);
		}

		if (window['BXfpdStopMent' + formID])
		{
			window['BXfpdStopMent' + formID]();
		}

		MPFMention["text"] = '';

		if (editor.GetViewMode() == 'wysiwyg') // WYSIWYG
		{
			editor.Focus();
			editor.selection.SetAfter(spaceNode);
		}

		var handler = LHEPostForm.getHandler(editorId);

		if (
			handler
			&& handler.formEntityType === 'task'
			&& handler.editorParams.tasksLimitExceeded
		)
		{
			BX.Main.PostFormTasksLimit.showPopup({
				bindPosition: getMentionNodePosition(MPFMention.node, editor),
			});
		}

	}
};

window.MPFgetSelectorId = function(formId)
{
	var result = false;
	var formNode = BX(formId);
	if (!formNode)
	{
		return result;
	}

	result = formNode.getAttribute('data-bx-selector-id');
	return result;
};

window.MPFcreateSelectorDialog = function(dialogParams)
{
	new BX.UI.EntitySelector.Dialog({
		targetNode: 'mpf-mention-' + dialogParams.formId,
		id: dialogParams.selectorId,
		context: 'MENTION',
		multiple: false,
		enableSearch: dialogParams.enableSearch,
		clearSearchOnSelect: true,
		hideOnSelect: true,
		hideByEsc: true,
		entities: dialogParams.params.entities,
		height: 300,
		width: 400,
		compactView: true,
		events: {
			onShow: function() {
				window.BXfpdOnDialogOpen();
			},
			onHide: function() {
				window.BXfpdOnDialogClose({
					editorId: dialogParams.params.editorId,
				});
			},
			'Item:onSelect': function (event) {
				var selectedItem = event.getData().item;
				if (selectedItem)
				{
					window['BXfpdSelectCallbackMent' + dialogParams.formId]({
						item: {
							name: selectedItem.getTitle(),
							entityId: selectedItem.getId(),
							entityType: selectedItem.getEntityType(),
						},
						entityType: selectedItem.getEntityId(),
					});
				}
			}
		},
	});
};


window.MPFMentionInit = function(formId, params)
{
	repo.mentionParams[formId] = params;

	if (params.initDestination === true)
	{
		BX.addCustomEvent('onAutoSaveRestoreDestination', function(params) {

			if (
				BX.type.isNotEmptyObject(params)
				&& BX.type.isNotEmptyObject(params.data)
				&& BX.type.isNotEmptyString(params.data.DEST_DATA)
				&& BX.type.isNotEmptyString(params.formId)
				&& params.formId == formId
				&& BX.UI.EntitySelector
			)
			{
				var destData = JSON.parse(params.data.DEST_DATA);
				if (!Array.isArray(destData))
				{
					return;
				}

				var selectorInstance = BX.UI.EntitySelector.Dialog.getById('oPostFormLHE_blogPostForm');
				if (!BX.type.isNotEmptyObject(selectorInstance))
				{
					return;
				}

				selectorInstance.preselectedItems = destData;
				selectorInstance.setPreselectedItems(destData);
			}
		});

		BX.addCustomEvent(window, "onMentionAdd", function(item, type) {

			var selectorInstance = BX.UI.EntitySelector.Dialog.getById('oPostFormLHE_blogPostForm');
			if (!BX.type.isNotEmptyObject(selectorInstance))
			{
				return;
			}

			var entityType = '';
			if (type === 'user')
			{
				if (item.isExtranet === 'Y')
				{
					entityType = 'extranet';
				}
				else if (item.isEmail === 'Y')
				{
					entityType = 'email';
				}
				else
				{
					entityType = 'employee';
				}
			}
			else if (type === 'project')
			{
				if (item.isExtranet === 'Y')
				{
					entityType = 'extranet';
				}
			}

			if (item.entityType !== 'collaber')
			{
				selectorInstance.addItem({
					avatar: item.avatar,
					customData: {
						email: (BX.Type.isStringFilled(item.email) ? item.email : ''),
					},
					entityId: type,
					entityType: entityType,
					id: item.entityId,
					title: item.name
				}).select();
			}
		});
	}

	window["BXfpdSelectCallbackMent" + formId] = function(callbackParams) // item, type, search
	{
		window.BxInsertMention({
			item: callbackParams.item,
			type: callbackParams.entityType.toLowerCase(),
			formID: formId,
			editorId: params.editorId,
			fireAddEvent: params.initDestination
		});
	};

	window["BXfpdStopMent" + formId] = function ()
	{
		var selectorId = window.MPFgetSelectorId('bx-mention-' + formId + '-id');
		var dialog = BX.UI.EntitySelector.Dialog.getById(selectorId);
		if (dialog)
		{
			dialog.hide();
		}
	};

	if (BX(formId))
	{
		BX.addCustomEvent(BX(formId), 'OnUCFormAfterShow', function(ucFormManager) {
			if (
				!BX.type.isNotEmptyObject(ucFormManager)
				|| !BX.type.isArray(ucFormManager.id)
				|| !BX.Type.isStringFilled(ucFormManager.id[0])
			)
			{
				return;
			}

			var reg = new RegExp('EVENT\_(\\d+)','i'); // calendar test
			if (!reg.test(ucFormManager.id[0]))
			{
				return;
			}
		});
	}

	var handler = LHEPostForm.getHandlerByFormId(formId);
	if (handler)
	{
		handler.exec();
	}

	BX.ready(function() {
			var ment = BX('bx-b-mention-' + formId);

			BX.bind(
				ment,
				"click",
				function(e)
				{
					if (MPFMention.listen !== true)
					{
						var editor = LHEPostForm.getEditor(params.editorId);
						var doc = editor.GetIframeDoc();

						if (editor.GetViewMode() == 'wysiwyg' && doc)
						{
							MPFMention.listen = true;
							MPFMention.listenFlag = true;
							MPFMention.text = '';
							MPFMention.leaveContent = false;
							MPFMention.mode = 'button';

							var range = editor.selection.GetRange();

							if (BX(MPFMention.node))
							{
								BX.remove(BX(MPFMention.node));
							}
							editor.InsertHtml('<span id="bx-mention-node">' + editor.INVISIBLE_SPACE + '</span>', range);

							setTimeout(function()
							{
								BX.onCustomEvent(window, 'BX.MPF.MentionSelector:open', [{
									formId: formId,
									bindNode: ment,
								}]);

								MPFMention.node = doc.getElementById('bx-mention-node');
								if (MPFMention.node)
								{
									range.setStart(MPFMention.node, 0);
									if (
										MPFMention.node.firstChild
										&& MPFMention.node.firstChild.nodeType == 3
										&& MPFMention.node.firstChild.nodeValue.length > 0
									)
									{
										range.setEnd(MPFMention.node, 1);
									}
									else
									{
										range.setEnd(MPFMention.node, 0);
									}
									editor.selection.SetSelection(range);
								}

								editor.Focus();
							}, 100);
						}
						else if (editor.GetViewMode() == 'code')
						{
							MPFMention.listen = true;
							MPFMention.listenFlag = true;
							MPFMention.text = '';
							MPFMention.leaveContent = false;
							MPFMention.mode = 'button';

							// TODO: get current cusrsor position

							setTimeout(function()
							{
								BX.onCustomEvent(window, 'BX.MPF.MentionSelector:open', [{
									formId: formId,
									bindNode: ment
								}]);
							}, 100);
						}

						BX.onCustomEvent(ment, 'mentionClick');
					}
				}
			);
		}
	);
};

window.BXfpdOnDialogOpen = function ()
{
	MPFMention.listen = true;
	MPFMention.listenFlag = true;
};

window.BXfpdOnDialogClose = function (params)
{
	MPFMention.listen = false;

	setTimeout(function()
	{
		MPFMention.listenFlag = false;
		if (!MPFMention.listen)
		{
			var editor = LHEPostForm.getEditor(params.editorId);
			if (editor)
			{
				editor.Focus();
			}
		}
	}, 100);
};


	MPFEntitySelector = function(params)
	{
		this.selector = null;
		this.inputNode = null;
		this.messages = {};

		if (!BX.Type.isStringFilled(params.id))
		{
			return null;
		}

		if (repo.selector[params.id])
		{
			return repo.selector[params.id];
		}

		repo.selector[params.id] = this.init(params);
	};

	MPFEntitySelector.prototype.init = function(params)
	{
		if (!BX.type.isPlainObject(params))
		{
			params = {};
		}

		if (
			!BX.Type.isStringFilled(params.id)
			|| !BX.Type.isStringFilled(params.tagNodeId)
			|| !BX(params.tagNodeId)
		)
		{
			return null;
		}

		if (
			BX.Type.isStringFilled(params.inputNodeId)
			&& BX(params.inputNodeId)
		)
		{
			this.inputNode = BX(params.inputNodeId);
		}

		if (BX.type.isNotEmptyObject(params.messages))
		{
			this.messages = params.messages;
		}

		this.selector = new BX.UI.EntitySelector.TagSelector({

			id: params.id,
			dialogOptions: {
				id: params.id,
				context: (BX.Type.isStringFilled(params.context) ? params.context : null),

				preselectedItems: (BX.type.isArray(params.preselectedItems) ? params.preselectedItems : []),

				events: {
					'Item:onSelect': function() {
						this.recalcValue(this.selector.getDialog().getSelectedItems());
					}.bind(this),
					'Item:onDeselect': function() {
						this.recalcValue(this.selector.getDialog().getSelectedItems());
					}.bind(this)
				},
				entities: [
					{
						id: 'meta-user',
						options: {
							'all-users': {
								title: this.messages.allUsersTitle,
								allowView: (
									BX.type.isBoolean(params.allowToAll)
									&& params.allowToAll
								)
							}
						}
					},
					{
						id: 'user',
						options: {
							collabers: (BX.type.isBoolean(params.collabers) ? params.collabers : true),
							emailUsers: (BX.type.isBoolean(params.allowSearchEmailUsers) ? params.allowSearchEmailUsers : false),
							inviteGuestLink: (BX.type.isBoolean(params.allowSearchEmailUsers) ? params.allowSearchEmailUsers : false),
							myEmailUsers: true,
							footerInviteIntranetOnly: true,
						}
					},
					{
						id: 'project',
						options: {
							features: {
								blog:  [ 'premoderate_post', 'moderate_post', 'write_post', 'full_post' ]
							},
							'!type': ['collab'],
						}
					},
					{
						id: 'department',
						options: {
							selectMode: 'usersAndDepartments',
							allowFlatDepartments: false,
						}
					}
				]
			},
			addButtonCaption: BX.message('BX_FPD_LINK_1'),
			addButtonCaptionMore: BX.message('BX_FPD_LINK_2')
		});

		this.selector.renderTo(document.getElementById(params.tagNodeId));

		return this.selector;
	};

	MPFEntitySelector.prototype.recalcValue = function(selectedItems)
	{
		if (
			!BX.type.isArray(selectedItems)
			|| !this.inputNode
		)
		{
			return;
		}

		var result = [];

		selectedItems.forEach(function(item) {
			result.push([ item.entityId, item.id ]);
		});

		this.inputNode.value = JSON.stringify(result);
	};

	window.MPFEntitySelector = MPFEntitySelector;

})();


})();
//# sourceMappingURL=script.js.map