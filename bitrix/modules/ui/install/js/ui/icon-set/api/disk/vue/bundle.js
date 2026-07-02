/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.IconSet = this.BX.UI.IconSet || {};
this.BX.UI.IconSet.Api = this.BX.UI.IconSet.Api || {};
this.BX.UI.IconSet.Api.Disk = this.BX.UI.IconSet.Api.Disk || {};
(function (exports, main_core, ui_iconSet_api_core) {
	'use strict';

	class LazyLoadManager {
		static #instance = null;
		#observer;
		#pendingElements = new WeakMap();
		constructor() {
			this.#observer = new IntersectionObserver(entries => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						const data = this.#pendingElements.get(entry.target);
						if (data) {
							data.callback();
							this.#observer.unobserve(entry.target);
							this.#pendingElements.delete(entry.target);
						}
					}
				});
			}, {
				root: null,
				rootMargin: '50px',
				threshold: 0.1
			});
		}
		static getInstance() {
			if (!LazyLoadManager.#instance) {
				LazyLoadManager.#instance = new LazyLoadManager();
			}
			return LazyLoadManager.#instance;
		}
		observe(element, callback) {
			this.#pendingElements.set(element, {
				callback
			});
			this.#observer.observe(element);
		}
	}

	const DiskIconType$1 = Object.freeze({
		png: 'png',
		jpg: 'jpg',
		jpeg: 'jpeg',
		gif: 'gif',
		bmp: 'bmp',
		webp: 'webp',
		svg: 'svg',
		xml: 'xml',
		pdf: 'pdf',
		xls: 'xls',
		xlsx: 'xlsx',
		doc: 'doc',
		docx: 'docx',
		txt: 'txt',
		ppt: 'ppt',
		pptx: 'pptx',
		rar: 'rar',
		zip: 'zip',
		gzip: 'gzip',
		gz: 'gz',
		archive: 'archive',
		folder: 'folder',
		folderGroup: 'folderGroup',
		folderShared: 'folderShared',
		folderCollab: 'folderCollab',
		folder24: 'folder24',
		folderPerson: 'folderPerson',
		mp4: 'mp4',
		avi: 'avi',
		mov: 'mov',
		wmv: 'wmv',
		webm: 'webm',
		mkv: 'mkv',
		video: 'video',
		file: 'file',
		board: 'board'
	});
	const TypeIcon = Object.freeze({
		[DiskIconType$1.file]: ui_iconSet_api_core.Disk.EMPTY,
		[DiskIconType$1.board]: ui_iconSet_api_core.Disk.BOARD,
		[DiskIconType$1.png]: ui_iconSet_api_core.Disk.IMAGE,
		[DiskIconType$1.jpg]: ui_iconSet_api_core.Disk.IMAGE,
		[DiskIconType$1.jpeg]: ui_iconSet_api_core.Disk.IMAGE,
		[DiskIconType$1.gif]: ui_iconSet_api_core.Disk.IMAGE,
		[DiskIconType$1.bmp]: ui_iconSet_api_core.Disk.IMAGE,
		[DiskIconType$1.webp]: ui_iconSet_api_core.Disk.IMAGE,
		[DiskIconType$1.svg]: ui_iconSet_api_core.Disk.SVG,
		[DiskIconType$1.xml]: ui_iconSet_api_core.Disk.XML,
		[DiskIconType$1.pdf]: ui_iconSet_api_core.Disk.PDF,
		[DiskIconType$1.xls]: ui_iconSet_api_core.Disk.XLS,
		[DiskIconType$1.xlsx]: ui_iconSet_api_core.Disk.XLSX,
		[DiskIconType$1.doc]: ui_iconSet_api_core.Disk.DOC,
		[DiskIconType$1.docx]: ui_iconSet_api_core.Disk.DOCX,
		[DiskIconType$1.txt]: ui_iconSet_api_core.Disk.TXT,
		[DiskIconType$1.ppt]: ui_iconSet_api_core.Disk.PPT,
		[DiskIconType$1.pptx]: ui_iconSet_api_core.Disk.PPTX,
		[DiskIconType$1.rar]: ui_iconSet_api_core.Disk.RAR,
		[DiskIconType$1.zip]: ui_iconSet_api_core.Disk.ZIP,
		[DiskIconType$1.gzip]: ui_iconSet_api_core.Disk.ARCHIVE,
		[DiskIconType$1.gz]: ui_iconSet_api_core.Disk.ARCHIVE,
		[DiskIconType$1.archive]: ui_iconSet_api_core.Disk.ARCHIVE,
		[DiskIconType$1.folder]: ui_iconSet_api_core.Disk.FOLDER,
		[DiskIconType$1.folderGroup]: ui_iconSet_api_core.Disk.FOLDER_GROUP,
		[DiskIconType$1.folderShared]: ui_iconSet_api_core.Disk.FOLDER_SHARED,
		[DiskIconType$1.folderCollab]: ui_iconSet_api_core.Disk.FOLDER_COLLAB,
		[DiskIconType$1.folder24]: ui_iconSet_api_core.Disk.FOLDER_24,
		[DiskIconType$1.folderPerson]: ui_iconSet_api_core.Disk.FOLDER_PERSON,
		[DiskIconType$1.mp4]: ui_iconSet_api_core.Disk.VIDEO || ui_iconSet_api_core.Disk.FILE,
		[DiskIconType$1.avi]: ui_iconSet_api_core.Disk.VIDEO || ui_iconSet_api_core.Disk.FILE,
		[DiskIconType$1.mov]: ui_iconSet_api_core.Disk.VIDEO || ui_iconSet_api_core.Disk.FILE,
		[DiskIconType$1.wmv]: ui_iconSet_api_core.Disk.VIDEO || ui_iconSet_api_core.Disk.FILE,
		[DiskIconType$1.webm]: ui_iconSet_api_core.Disk.VIDEO || ui_iconSet_api_core.Disk.FILE,
		[DiskIconType$1.mkv]: ui_iconSet_api_core.Disk.VIDEO || ui_iconSet_api_core.Disk.FILE,
		[DiskIconType$1.video]: ui_iconSet_api_core.Disk.VIDEO || ui_iconSet_api_core.Disk.FILE
	});
	const CompactTypeIcon = Object.freeze({
		[DiskIconType$1.file]: ui_iconSet_api_core.Disk.EMPTY,
		[DiskIconType$1.board]: ui_iconSet_api_core.DiskCompact.BOARD,
		[DiskIconType$1.png]: ui_iconSet_api_core.DiskCompact.IMAGE,
		[DiskIconType$1.jpg]: ui_iconSet_api_core.DiskCompact.IMAGE,
		[DiskIconType$1.jpeg]: ui_iconSet_api_core.DiskCompact.IMAGE,
		[DiskIconType$1.gif]: ui_iconSet_api_core.DiskCompact.IMAGE,
		[DiskIconType$1.bmp]: ui_iconSet_api_core.DiskCompact.IMAGE,
		[DiskIconType$1.webp]: ui_iconSet_api_core.DiskCompact.IMAGE,
		[DiskIconType$1.svg]: ui_iconSet_api_core.DiskCompact.IMAGE,
		[DiskIconType$1.xml]: ui_iconSet_api_core.DiskCompact.XML,
		[DiskIconType$1.pdf]: ui_iconSet_api_core.DiskCompact.PDF,
		[DiskIconType$1.xls]: ui_iconSet_api_core.DiskCompact.XLS,
		[DiskIconType$1.xlsx]: ui_iconSet_api_core.DiskCompact.XLSX,
		[DiskIconType$1.doc]: ui_iconSet_api_core.DiskCompact.DOC,
		[DiskIconType$1.docx]: ui_iconSet_api_core.DiskCompact.DOCX,
		[DiskIconType$1.txt]: ui_iconSet_api_core.DiskCompact.TXT,
		[DiskIconType$1.ppt]: ui_iconSet_api_core.DiskCompact.PPT,
		[DiskIconType$1.pptx]: ui_iconSet_api_core.DiskCompact.PPTX,
		[DiskIconType$1.rar]: ui_iconSet_api_core.DiskCompact.RAR,
		[DiskIconType$1.zip]: ui_iconSet_api_core.DiskCompact.ZIP,
		[DiskIconType$1.gzip]: ui_iconSet_api_core.DiskCompact.ARCHIVE,
		[DiskIconType$1.gz]: ui_iconSet_api_core.DiskCompact.ARCHIVE,
		[DiskIconType$1.archive]: ui_iconSet_api_core.DiskCompact.ARCHIVE,
		[DiskIconType$1.folder]: ui_iconSet_api_core.DiskCompact.FOLDER,
		[DiskIconType$1.folderGroup]: ui_iconSet_api_core.DiskCompact.FOLDER_GROUP,
		[DiskIconType$1.folderShared]: ui_iconSet_api_core.DiskCompact.FOLDER_SHARED,
		[DiskIconType$1.folderCollab]: ui_iconSet_api_core.DiskCompact.FOLDER_COLLAB,
		[DiskIconType$1.folder24]: ui_iconSet_api_core.DiskCompact.FOLDER_24,
		[DiskIconType$1.folderPerson]: ui_iconSet_api_core.DiskCompact.FOLDER_PERSON,
		[DiskIconType$1.mp4]: ui_iconSet_api_core.DiskCompact.VIDEO || ui_iconSet_api_core.DiskCompact.FILE,
		[DiskIconType$1.avi]: ui_iconSet_api_core.DiskCompact.VIDEO || ui_iconSet_api_core.DiskCompact.FILE,
		[DiskIconType$1.mov]: ui_iconSet_api_core.DiskCompact.VIDEO || ui_iconSet_api_core.DiskCompact.FILE,
		[DiskIconType$1.wmv]: ui_iconSet_api_core.DiskCompact.VIDEO || ui_iconSet_api_core.DiskCompact.FILE,
		[DiskIconType$1.webm]: ui_iconSet_api_core.DiskCompact.VIDEO || ui_iconSet_api_core.DiskCompact.FILE,
		[DiskIconType$1.mkv]: ui_iconSet_api_core.DiskCompact.VIDEO || ui_iconSet_api_core.DiskCompact.FILE,
		[DiskIconType$1.video]: ui_iconSet_api_core.DiskCompact.VIDEO || ui_iconSet_api_core.DiskCompact.FILE
	});

	class DiskIcon {
		#size;
		#type;
		#previewUrl;
		#alt;
		#title;
		#responsive = false;
		#container = null;
		#icon = null;
		#resizeObserver = null;
		constructor(options = {}) {
			this.#validateOptions(options);
			this.#size = options.size;
			this.#type = this.#isExistingIconType(options.type) ? options.type : DiskIconType$1.file;
			this.#previewUrl = options.previewUrl;
			this.#alt = options.alt ?? '';
			this.#title = options.title ?? '';
			this.#responsive = options.responsive ?? false;
		}
		static render(options) {
			const icon = new DiskIcon(options);
			return icon.render();
		}
		render() {
			const wrapper = this.#renderWrapper();
			this.#appendContentToWrapper(wrapper);
			this.#container = wrapper;
			if (this.#responsive) {
				this.#setupResizeObserver();
			}
			return wrapper;
		}
		#appendContentToWrapper(wrapper) {
			if (this.#previewUrl) {
				this.#appendIconWithLazyPreview(wrapper);
			} else {
				main_core.Dom.append(this.#renderIcon(), wrapper);
			}
		}
		setType(type) {
			if (!this.#isExistingIconType(type)) {
				console.warn(`DiskIcon: Type "${type}" is not supported`);
				return;
			}
			this.#type = type;
			this.#updateIcon();
		}
		setPreviewUrl(previewUrl) {
			this.#previewUrl = previewUrl;
			this.#updateContent();
		}
		setAlt(alt) {
			if (!this.#container) {
				return;
			}
			const img = this.#container.querySelector('img');
			if (img) {
				main_core.Dom.attr(img, 'alt', alt);
			}
		}
		setTitle(title) {
			if (!this.#container) {
				return;
			}
			main_core.Dom.attr(this.#container, 'title', title);
		}
		setSize(size) {
			if (!main_core.Type.isNumber(size) || size <= 0) {
				console.warn('DiskIcon: size must be the positive number');
				return;
			}
			this.#size = size;
			this.#updateSize();
			this.#updateIcon();
		}
		setResponsive(responsive) {
			this.#responsive = responsive;
			this.#updateWrapper();
			this.#updateIcon();
			if (this.#responsive) {
				this.#setupResizeObserver();
			} else {
				this.#destroyResizeObserver();
			}
		}
		renderOnNode(target) {
			const wrapper = this.#renderWrapper();
			main_core.Dom.clean(target);
			[...target.attributes].forEach(attr => {
				target.removeAttribute(attr.name);
			});
			[...wrapper.attributes].forEach(attr => {
				target.setAttribute(attr.name, attr.value);
			});
			this.#container = target;
			this.#appendContentToWrapper(target);
			if (this.#responsive) {
				this.#setupResizeObserver();
			}
		}
		destroy() {
			this.#destroyResizeObserver();
			this.#container = null;
			this.#icon = null;
		}
		#renderWrapper() {
			const wrapperClass = this.#responsive ? 'ui-icon-set_disk-icon --responsive' : 'ui-icon-set_disk-icon';
			const wrapper = main_core.Tag.render`<span title="${this.#title}" class="${wrapperClass}"></span>`;
			if (!this.#responsive) {
				main_core.Dom.style(wrapper, {
					width: `${this.#size}px`,
					height: `${this.#size}px`
				});
			}
			return wrapper;
		}
		#getIconType(width) {
			const effectiveWidth = width ?? this.#size;
			return effectiveWidth >= 40 ? TypeIcon[this.#type] : CompactTypeIcon[this.#type];
		}
		#createIconInstance(size, responsive) {
			const effectiveSize = size ?? this.#size;
			const effectiveResponsive = responsive ?? this.#responsive;
			return new ui_iconSet_api_core.Icon({
				icon: this.#getIconType(effectiveSize),
				size: effectiveSize,
				responsive: effectiveResponsive
			});
		}
		#renderIcon(size, responsive) {
			const icon = this.#createIconInstance(size, responsive);
			return icon.render();
		}
		#appendIconWithLazyPreview(container) {
			const icon = this.#renderIcon();
			const iconWrapper = main_core.Tag.render`<span class="ui-icon-set_disk-icon__temp-icon">${icon}</span>`;
			const img = main_core.Tag.render`
			<img
				class="ui-icon-set_disk-icon__img --hidden"
				alt="${this.#alt}"
			/>
		`;
			main_core.Dom.append(iconWrapper, container);
			main_core.Dom.append(img, container);
			const lazyManager = LazyLoadManager.getInstance();
			lazyManager.observe(container, () => {
				this.#loadPreviewImage(img, iconWrapper);
			});
		}
		#loadPreviewImage(img, iconWrapper) {
			main_core.Dom.attr(img, 'src', this.#previewUrl);
			main_core.bind(img, 'load', () => {
				main_core.Dom.removeClass(img, '--hidden');
				main_core.Dom.hide(iconWrapper);
			}, {
				once: true
			});
			main_core.bind(img, 'error', () => {
				main_core.Dom.removeClass(iconWrapper, 'ui-icon-set_disk-icon__temp-icon');
			}, {
				once: true
			});
		}
		#updateSize() {
			if (!this.#container) {
				return;
			}
			main_core.Dom.style(this.#container, {
				width: `${this.#size}px`,
				height: `${this.#size}px`
			});
		}
		#replaceIconElement(size, responsive) {
			if (!this.#container) {
				return;
			}
			const newIconElement = this.#renderIcon(size, responsive);
			const existingIconElement = this.#container.querySelector('.ui-icon-set');
			if (existingIconElement && existingIconElement.parentNode) {
				main_core.Dom.replace(existingIconElement, newIconElement);
			} else {
				main_core.Dom.append(newIconElement, this.#container);
			}
			this.#icon = this.#createIconInstance(size, responsive);
		}
		#updateIcon() {
			if (!this.#container || !this.#icon) {
				return;
			}
			this.#replaceIconElement(this.#size, this.#responsive);
		}
		#updateContent() {
			if (!this.#container) {
				return;
			}
			main_core.Dom.clean(this.#container);
			this.#appendContentToWrapper(this.#container);
		}
		#updateWrapper() {
			if (!this.#container) {
				return;
			}
			if (this.#responsive) {
				main_core.Dom.addClass(this.#container, '--responsive');
				main_core.Dom.style(this.#container, {
					width: '',
					height: ''
				});
			} else {
				main_core.Dom.removeClass(this.#container, '--responsive');
				main_core.Dom.style(this.#container, {
					width: `${this.#size}px`,
					height: `${this.#size}px`
				});
			}
		}
		#setupResizeObserver() {
			if (!this.#container || this.#resizeObserver) {
				return;
			}
			this.#resizeObserver = new ResizeObserver(entries => {
				for (const entry of entries) {
					const {
						width,
						height
					} = entry.contentRect;
					this.#onContainerResize(Math.min(width, height));
				}
			});
			this.#resizeObserver.observe(this.#container);
		}
		#destroyResizeObserver() {
			if (this.#resizeObserver) {
				this.#resizeObserver.disconnect();
				this.#resizeObserver = null;
			}
		}
		#onContainerResize(width) {
			if (!this.#responsive) {
				return;
			}
			const currentIconType = this.#getCurrentIconType();
			const expectedIconType = this.#getIconType(width);
			if (currentIconType !== expectedIconType) {
				this.#updateIconForResponsive(width);
			}
		}
		#getCurrentIconType() {
			if (!this.#icon) {
				return '';
			}
			return this.#icon.getIcon ? this.#icon.getIcon() : '';
		}
		#updateIconForResponsive(containerWidth) {
			this.#replaceIconElement(containerWidth, true);
		}
		#validateOptions(options) {
			let isValid = true;
			if (main_core.Type.isUndefined(options.type) !== false && !this.#isExistingIconType(options.type)) {
				console.warn(`DiskIcon: Type "${options.type}" is not supported`);
				isValid = false;
			}
			if (options.responsive === false && main_core.Type.isUndefined(options.size) !== false && (!main_core.Type.isNumber(options.size) || options.size <= 0)) {
				console.warn('DiskIcon: size must be the positive number');
				isValid = false;
			}
			if (main_core.Type.isNil(options.previewUrl) === false && !main_core.Type.isString(options.previewUrl)) {
				console.warn('DiskIcon: previewUrl must be a string or null');
				isValid = false;
			}
			if (main_core.Type.isUndefined(options.alt) !== false && !main_core.Type.isString(options.alt)) {
				console.warn('DiskIcon: alt must be a string');
				isValid = false;
			}
			if (main_core.Type.isUndefined(options.title) !== false && !main_core.Type.isString(options.title)) {
				console.warn('DiskIcon: title must be a string');
				isValid = false;
			}
			if (main_core.Type.isUndefined(options.responsive) !== false && !main_core.Type.isBoolean(options.responsive)) {
				console.warn('DiskIcon: responsive must be a boolean');
				isValid = false;
			}
			return isValid;
		}
		#isExistingIconType(type) {
			return Object.values(DiskIconType$1).includes(type);
		}
	}

	const DiskIconType = DiskIconType$1;
	const BDiskIcon = {
		props: {
			type: {
				type: String,
				required: false,
				default: 'file'
			},
			size: {
				type: Number,
				required: false
			},
			previewUrl: {
				type: String,
				required: false,
				default: null
			},
			alt: {
				type: String,
				required: false,
				default: ''
			},
			title: {
				type: String,
				required: false,
				default: ''
			},
			responsive: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				diskIcon: null
			};
		},
		watch: {
			type() {
				this.updateDiskIcon();
			},
			size() {
				this.updateDiskIcon();
			},
			previewUrl() {
				this.updateDiskIcon();
			},
			alt() {
				this.updateDiskIcon();
			},
			title() {
				this.updateDiskIcon();
			},
			responsive() {
				this.updateDiskIcon();
			}
		},
		mounted() {
			this.initDiskIcon();
		},
		beforeUnmount() {
			if (this.diskIcon) {
				this.diskIcon.destroy();
			}
		},
		methods: {
			initDiskIcon() {
				const options = {
					type: this.type,
					size: this.size,
					previewUrl: this.previewUrl || null,
					alt: this.alt,
					title: this.title,
					responsive: this.responsive
				};
				this.diskIcon = new DiskIcon(options);
				this.diskIcon.renderOnNode(this.$el);
			},
			updateDiskIcon() {
				if (!this.diskIcon) {
					return;
				}
				this.diskIcon.setType(this.type);
				if (this.responsive === false) {
					this.diskIcon.setSize(this.size);
				}
				this.diskIcon.setPreviewUrl(this.previewUrl || null);
				this.diskIcon.setAlt(this.alt);
				this.diskIcon.setTitle(this.title);
				this.diskIcon.setResponsive(this.responsive);
			}
		},
		template: '<div></div>'
	};

	exports.BDiskIcon = BDiskIcon;
	exports.DiskIconType = DiskIconType;

})(this.BX.UI.IconSet.Api.Disk.Vue = this.BX.UI.IconSet.Api.Disk.Vue || {}, BX, BX.UI.IconSet);
//# sourceMappingURL=bundle.js.map
