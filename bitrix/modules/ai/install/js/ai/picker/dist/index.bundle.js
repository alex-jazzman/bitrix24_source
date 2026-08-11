/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ai_engine, ai_payload_textpayload, main_core, main_popup, main_core_events, ui_iconSet_api_core, ui_iconSet_actions, ui_iconSet_icon_actions, ui_notification, clipboard, ui_buttons, ui_iconSet_main, ai_ajaxErrorHandler, ai_agreement) {
	'use strict';

	class Loc {
		static generalKeys = ['help_link', 'agree_with_terms'];
		#messages = {
			header: null,
			submit: null,
			action_use: null,
			action_copy: null,
			action_copy_notify: null,
			max_capacity: null,
			placeholder: null
		};
		static getInstance() {
			if (!Loc.instance) {
				Loc.instance = new Loc();
			}
			return Loc.instance;
		}

		/**
		 * Sets language space. For different interface may be used different phrases.
		 * See all bunches of phrases in lang/config.php.
		 *
		 * @param {string} spaceCode
		 */
		setSpace(spaceCode) {
			Object.keys(this.#messages).forEach(key => {
				this.#messages[key] = main_core.Loc.getMessage(`AI_JS_PICKER_${spaceCode.toUpperCase()}_${key.toUpperCase()}`);
			});
			Loc.generalKeys.forEach(key => {
				this.#messages[key] = main_core.Loc.getMessage(`AI_JS_PICKER_GENERAL_${key.toUpperCase()}`);
			});
		}

		/**
		 * Returns phrase by certain message code.
		 *
		 * @param {messageCode} messageCode
		 * @return {string}
		 */
		getMessage(messageCode) {
			return this.#messages[messageCode];
		}
	}

	class Base extends main_core_events.EventEmitter {
		#loc;
		constructor(props) {
			super(props);
			this.props = props;
			this.#loc = Loc.getInstance();
			this.setEventNamespace('AI:Picker:UI');
		}
		getMessage(code) {
			return this.#loc.getMessage(code);
		}
		render() {
			return null;
		}
	}

	class IconClose extends Base {
		render() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Actions.CROSS_40,
				size: 24
			});
			return main_core.Tag.render`
			<div class="ai__picker_icon-close" onclick="${this.props.onClick}">${icon.render()}</div>
		`;
		}
	}

	class Header extends Base {
		#articleCode;
		#className;
		constructor(props) {
			super(props);
			this.#articleCode = main_core.Type.isNumber(props.articleCode) ? props.articleCode : null;
			this.#className = main_core.Type.isString(props.className) ? props.className : '';
			this.setEventNamespace('AI:Picker:Header');
		}
		render() {
			const closeIcon = new IconClose({
				onClick: () => {
					this.emit('click-close-icon');
				}
			});
			return main_core.Tag.render`
			<div class="ai__picker_header ${this.#className}">
				<div class="ai__picker_header-icon"></div>
				<div style="margin-top: -10px;">
					<h3 class="ui-typography-heading-h3 ui- ai__picker_header-title">
						${this.getMessage('header')}
					</h3>
					${this.#renderHelpLink()}
				</div>

				${closeIcon.render()}
			</div>
		`;
		}
		#renderHelpLink() {
			if (!this.#articleCode || !top.BX || !top.BX.Helper) {
				return null;
			}
			const helpLink = main_core.Tag.render`
			<a href="" class="ai__picker_header-subtitle">
				${this.getMessage('help_link')}
			</a>
		`;
			const articleCode = this.#articleCode;
			main_core.bind(helpLink, 'click', e => {
				if (top.BX && top.BX.Helper) {
					top.BX.Helper.show(`redirect=detail&code=${articleCode}`);
				}
				e.preventDefault();
				return false;
			});
			return helpLink;
		}
	}

	class HistoryBase extends Base {
		constructor(props) {
			super(props);
			this.setEventNamespace('AI:Picker:History');
			this.onGenerate = props.onGenerate;
			this.onLoadHistory = props.onLoadHistory;
			this.onSelect = props.onSelect;
			this.notifiers = new Map();
			this.listWrapper = this.getListWrapper();
			this.items = props.items || [];
			this.capacity = props.capacity || 30;
			this.isHistoryLoaded = true;
		}

		/**
		 * Called when user want to use HistoryItem somewhere outside.
		 *
		 * @param {HistoryItem} item
		 */
		onSelectClick(item) {
			this.onSelect(item);
		}

		/**
		 * Shows notification near the Node.
		 *
		 * @param {HTMLElement} node Near this node notification will appear.
		 * @param {string} code Unique id.
		 * @param message Notification message.
		 */
		showNotify(node, code, message) {
			if (!this.notifiers.has(code)) {
				const popup = new main_popup.Popup(code, node, {
					content: message,
					darkMode: true,
					autoHide: true,
					angle: true,
					offsetLeft: 20,
					bindOptions: {
						position: 'top'
					}
				});
				main_core.bind(node, 'mouseout', () => {
					setTimeout(() => {
						this.notifiers.get(code).close();
					}, 300);
				});
				this.notifiers.set(code, popup);
			}
			this.notifiers.get(code).show();
		}

		/**
		 * Builds History container after loading History items.
		 *
		 */
		buildHistory() {
			// you must implement this method
		}
		addNewItem(item) {
			// you must implement this method
		}

		/**
		 * Returns label with note about History limitation.
		 *
		 * @param {number} capacity
		 * @return {HTMLElement}
		 */
		getCapacityLabel(capacity) {
			const iconColor = getComputedStyle(document.body).getPropertyValue('--ui-color-base-35');
			const arrowIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Actions.ARROW_TOP,
				size: 14,
				color: iconColor
			});
			return main_core.Tag.render`
			<div class="ai__picker-text_capacity-label">
				${arrowIcon.render()}
				<div class="ai__picker-text_capacity-label-text">
					${this.getMessage('max_capacity').replace('#capacity#', capacity)}
				</div>
			</div>
		`;
		}

		/**
		 * Returns the loader or text when loading History.
		 *
		 * @return {HTMLElement}
		 */
		getListWrapper() {
			return main_core.Tag.render`
			<div class="ai__picker_list-wrapper">
				<div class="ai__picker_list-wrapper-loader-text">
					${main_core.Loc.getMessage('AI_JS_PICKER_HISTORY_LOADING')}
				</div>
			</div>
		`;
		}

		/**
		 * Returns wrapper for History.
		 *
		 * @return {HTMLElement}
		 */
		getWrapper() {
			return main_core.Tag.render`
			<div class="ai__picker_history">
				${this.listWrapper}
			</div>
		`;
		}

		/**
		 * Returns to parent.
		 *
		 * @return {HTMLElement}
		 */
		render() {
			return this.getWrapper();
		}
		loadHistory() {
			if (!this.onLoadHistory) {
				return null;
			}
			return new Promise((resolve, reject) => {
				this.onLoadHistory().then(res => {
					this.isHistoryLoaded = true;
					this.items = res.data.items;
					this.capacity = res.data.capacity;
					resolve(res);
				}).catch(error => {
					reject(error);
				});
			});
		}
		generate(message, engineCode) {
			// you must implement this method
		}
	}

	class ImageLoader extends Base {
		#text;
		#textElem;
		#container;
		#isAnimate;
		constructor(props = {}) {
			super(props);
			this.#text = main_core.Type.isString(props?.text) ? props.text : '';
			this.#textElem = null;
			this.#container = null;
			this.#isAnimate = false;
		}
		render() {
			this.#textElem = this.#renderTextContainer();
			this.#container = main_core.Tag.render`
			<div class="ai__picker_image-loader-container ${this.#isAnimate ? '--animating' : ''}">
				<div class="ai__picker_image-loader">
					<div class="ai__picker_image-loader-star ai__picker_image-loader-right-star --pulse"></div>
					<div class="ai__picker_image-loader-left-star-container">
						<div class="ai__picker_image-loader-left-star ai__picker_image-loader-star --pulse"></div>
					</div>
					<div class="ai__picker_image-loader-square">
						<div class="ai__picker_image-loader-square-image"></div>
						<div class="ai__picker_image-loader-square-star ai__picker_image-loader-star --pulse"></div>
						<div class="ai__picker_image-loader-square-loader-line"></div>
					</div>
				</div>
				<div class="ai__picker_image-loader-text-container">
					${this.#textElem}
				</div>
			</div>
		`;
			return this.#container;
		}
		getLayout() {
			return this.#container;
		}
		setText(text) {
			this.#text = text;
			if (this.#textElem) {
				this.#textElem.innerText = text;
			}
		}
		start() {
			this.#isAnimate = true;
			if (this.#container) {
				main_core.Dom.addClass(this.#container, '--animating');
			}
		}
		stop() {
			this.#isAnimate = false;
			if (this.#container) {
				main_core.Dom.removeClass(this.#container, '--animating');
			}
		}
		#renderTextContainer() {
			return main_core.Tag.render`<div class="ai__picker_image-loader-text">${this.#text}</div>`;
		}
	}

	const HistoryImageGroupItemState = Object.freeze({
		EMPTY: 'empty',
		ERROR: 'error',
		GENERATING: 'generating',
		IN_LINE_FOR_GENERATING: 'in_line_for_generating',
		IMAGE_LOADING: 'image_loading',
		IMAGE_LOADING_SUCCESS: 'image_loading_success',
		IMAGE_LOADING_ERROR: 'image_loading_error'
	});
	class HistoryImageGroupItem extends Base {
		#image;
		#state;
		#loader;
		#imageElement;
		#itemElement;
		#onSelect;
		constructor(props) {
			super(props);
			this.#onSelect = main_core.Type.isFunction(props.onSelect) ? props.onSelect : null;
			this.#state = props.state;
			this.setImage(props.image);
			this.#loader = new ImageLoader();
			this.#itemElement = null;
			this.#imageElement = null;
		}
		render() {
			this.#imageElement = this.#renderImageElement();
			this.#itemElement = main_core.Tag.render`
			<div class="ai__picker_history-image-group-item --empty">
				<div class="ai__picker_history-image-group-item-controls">
					${this.#renderActionButton()}
				</div>
				${this.#renderLoader()}
				${this.#imageElement}
			</div>
		`;
			return this.#itemElement;
		}
		setImage(image) {
			this.#image = image;
			if (this.#imageElement) {
				this.#state = this.#image ? HistoryImageGroupItemState.IMAGE_LOADING : HistoryImageGroupItemState.IMAGE_LOADING_ERROR;
				if (this.#state === HistoryImageGroupItemState.IMAGE_LOADING_ERROR) {
					main_core.Dom.removeClass(this.#itemElement, '--empty');
					main_core.Dom.addClass(this.#itemElement, '--error');
				}
				this.#imageElement.setAttribute('src', this.#image);
			}
		}
		getImage() {
			return this.#image;
		}
		getState() {
			return this.#state;
		}
		isEmpty() {
			return this.#state === HistoryImageGroupItemState.EMPTY;
		}
		isInQueue() {
			return this.#state === HistoryImageGroupItemState.IN_LINE_FOR_GENERATING;
		}
		isGenerating() {
			return this.#state === HistoryImageGroupItemState.GENERATING;
		}
		setGeneratingState() {
			this.#state = HistoryImageGroupItemState.GENERATING;
			this.#loader.start();
		}
		#renderActionButton() {
			const actionUseBtnClassname = 'ai__picker_text-history-item-action-btn --paste --accent';
			const useBtn = main_core.Tag.render`
			<button
				class="${actionUseBtnClassname}"
			>
				<span class="ai__picker_text-history-item-action-icon"></span>
				${this.getMessage('action_use')}
			</button>
		`;
			main_core.bind(useBtn, 'click', async () => {
				try {
					this.#onSelect(this.#prepareImageToSelect(this.#image));
				} catch (err) {
					console.error(err);
				}
			});
			return useBtn;
		}

		/**
		 * Prevent CORS error, see 180894
		 * @param image
		 * @return {*}
		 */
		#prepareImageToSelect(image) {
			const url = new URL(image);
			url.searchParams.set('t', Date.now());
			return url.href;
		}
		#renderLoader() {
			if (this.#state === HistoryImageGroupItemState.GENERATING) {
				this.#loader.start();
			}
			return main_core.Tag.render`
			<div class="ai__picker_history-image-group-item-loader">
				${this.#loader.render()}
			</div>
		`;
		}
		#renderImageElement() {
			const imageElement = main_core.Tag.render`
			<img
				loading="lazy" 
				class="ai__picker_history-image-group-item-image"
			/>
		`;
			if (this.#state !== HistoryImageGroupItemState.GENERATING) {
				imageElement.setAttribute('src', this.#image);
			}
			imageElement.onload = () => {
				this.#state = HistoryImageGroupItemState.IMAGE_LOADING_SUCCESS;
				main_core.Dom.removeClass(this.#itemElement, '--empty');
				main_core.Dom.removeClass(this.#itemElement, '--error');
				this.#loader.getLayout().remove();
			};
			imageElement.onerror = () => {
				if (this.#state === HistoryImageGroupItemState.GENERATING || this.#state === HistoryImageGroupItemState.EMPTY) {
					this.#state = HistoryImageGroupItemState.IMAGE_LOADING_ERROR;
					main_core.Dom.removeClass(this.#itemElement, '--empty');
					main_core.Dom.addClass(this.#itemElement, '--error');
					this.#loader.getLayout().remove();
				}
			};
			return imageElement;
		}
	}

	class HistoryImageGroup extends Base {
		#title;
		#size;
		#item;
		#itemsContainer;
		#items;
		#layout;
		#isNew;
		#onSelect;
		constructor(props = {}) {
			super(props);
			this.#title = main_core.Type.isString(props?.item?.payload) ? props.item.payload : '';
			this.#size = main_core.Type.isInteger(props.size) ? props.size : 4;
			this.#item = props.item || [];
			this.#isNew = main_core.Type.isBoolean(props.isNew) ? props.isNew : false;
			this.#onSelect = main_core.Type.isFunction(props.onSelect) ? props.onSelect : null;
			this.#items = [];
			this.#layout = null;
		}
		render() {
			this.#layout = main_core.Tag.render`
			<div class="ai__picker_history-image-group">
				<div class="ai__picker_history-image-group-title">${BX.util.htmlspecialchars(this.#title)}</div>
				<div class="ai__picker_history-image-group-items">
					${this.#renderItems()}
				</div>
			</div>
		`;
			return this.#layout;
		}
		getLayout() {
			return this.#layout;
		}
		remove() {
			if (this.getLayout()) {
				this.getLayout().remove();
			}
		}
		addImage(image) {
			const loadingItem = this.#items.find(item => item.isGenerating());
			if (!loadingItem) {
				return;
			}
			loadingItem.setImage(image);
			const emptyItem = this.#items.find(item => item.isInQueue());
			if (!emptyItem) {
				return;
			}
			emptyItem.setGeneratingState();
		}
		geGeneratedImagesCount() {
			return this.#items.filter(item => {
				return item.getState() === HistoryImageGroupItemState.IMAGE_LOADING || item.getState() === HistoryImageGroupItemState.IMAGE_LOADING_ERROR || item.getState() === HistoryImageGroupItemState.IMAGE_LOADING_SUCCESS;
			}).length;
		}
		#renderItems() {
			this.#itemsContainer = main_core.Tag.render`<div class="ai__picker_history-image-group-items"></div>`;
			this.#getGroupImages().forEach(image => {
				const state = this.#isNew ? HistoryImageGroupItemState.GENERATING : HistoryImageGroupItemState.EMPTY;
				const newItem = new HistoryImageGroupItem({
					image,
					state,
					onSelect: this.#onSelect
				});
				newItem.subscribe('select', event => {
					this.emit('select', {
						item: event.data.item
					});
				});
				this.#items.push(newItem);
				main_core.Dom.append(newItem.render(), this.#itemsContainer);
			});
			return this.#itemsContainer;
		}
		#getGroupImages() {
			const result = [];
			const images = this.#item.groupData || JSON.parse(this.#item.data);
			for (let imageIndex = 0; imageIndex < this.#size; imageIndex++) {
				const image = images[imageIndex] || '';
				result.push(image);
			}
			return result;
		}
	}

	class ImageHistoryEmptyState extends Base {
		render() {
			const text = main_core.Loc.getMessage('AI_JS_PICKER_IMAGE_EMPTY_STATE');
			return main_core.Tag.render`
			<div class="ai__picker_image-history-empty-state">
				<div class="ai__picker_image-history-empty-state-icon"></div>
				<div class="ai__picker_image-history-empty-state-text">
					${text}
				</div>
			</div>
		`;
		}
	}

	class HistoryImage extends HistoryBase {
		static imagesInItem = 1;
		render() {
			this.buildHistory();
			return this.getWrapper();
		}
		generate(prompt) {
			if (!this.onGenerate) {
				return null;
			}
			if (this.items.length === 0) {
				main_core.Dom.clean(this.listWrapper);
			}
			const item = this.#createItemWithPrompt(prompt);
			const historyImageGroup = this.#addNewHistoryItem(item);
			return new Promise((resolve, reject) => {
				this.onGenerate(prompt).then(res => {
					this.items.push(res.data.last);
					const images = JSON.parse(res.data.result);
					images.forEach(image => {
						historyImageGroup.addImage(image);
					});
					resolve(res);
				}).catch(err => {
					this.#removeHistoryImageGroup(historyImageGroup);
					reject(err);
				});
			});
		}
		buildHistory() {
			main_core.Dom.clean(this.listWrapper);
			if (this.items.length === 0) {
				const emptyState = new ImageHistoryEmptyState();
				main_core.Dom.append(emptyState.render(), this.listWrapper);
			}
			this.items.forEach(historyItem => {
				try {
					this.#addHistoryItem(historyItem);
				} catch (e) {
					console.error('AI.Picker: history item error', e, historyItem);
				}
			});
			if (this.items.length > 3) {
				main_core.Dom.append(this.getCapacityLabel(this.capacity), this.listWrapper);
			}
		}
		#addHistoryItem(item) {
			const imageGroup = this.#createImageGroup(item);
			const imageGroupWrapper = this.#renderImageGroup(imageGroup);
			main_core.Dom.append(imageGroupWrapper, this.listWrapper);
			main_core.Dom.style(imageGroupWrapper, 'opacity', 1);
			return imageGroup;
		}
		#addNewHistoryItem(item) {
			const imageGroup = this.#createImageGroup(item, true);
			const imageGroupWrapper = this.#renderImageGroup(imageGroup);
			main_core.Dom.prepend(imageGroupWrapper, this.listWrapper);
			const {
				height
			} = main_core.Dom.getPosition(imageGroupWrapper);
			main_core.Dom.style(imageGroupWrapper, 'height', 0);
			requestAnimationFrame(() => {
				main_core.Dom.style(imageGroupWrapper, {
					opacity: 1,
					height: `${height}px`
				});
			});
			return imageGroup;
		}
		#renderImageGroup(imageGroup) {
			const wrapper = main_core.Tag.render`
			<div class="ai__history-image_item-wrapper"></div>
		`;
			main_core.Dom.append(imageGroup.render(), wrapper);
			return wrapper;
		}
		#createImageGroup(item, isNew = false) {
			return new HistoryImageGroup({
				item,
				size: HistoryImage.imagesInItem,
				isNew,
				onSelect: this.onSelect
			});
		}
		#createItemWithPrompt(payload) {
			return {
				payload,
				id: Math.random(),
				groupData: [],
				data: ''
			};
		}
		#removeHistoryImageGroup(group) {
			if (!group.getLayout() || !group.getLayout().parentElement) {
				return;
			}
			const groupWrapper = group.getLayout().parentElement;
			main_core.Dom.style(groupWrapper, 'height', 0);
			main_core.Dom.style(groupWrapper, 'padding-bottom', 0);
			main_core.bind(groupWrapper, 'transitionend', () => {
				main_core.Dom.remove(groupWrapper);
			});
		}
	}

	class TextLoader extends Base {
		render() {
			return main_core.Tag.render`
			<div class="ai__picker_text-loader">
				<div class="ai__picker_text-loader-line --one"></div>
				<div class="ai__picker_text-loader-line --two"></div>
				<div class="ai__picker_text-loader-line --three"></div>
				<div class="ai__picker_text-loader-line --four"></div>
				<div class="ai__picker_text-loader-cursor">
					<div class="ai__picker_text-loader-cursor-inner">
						<div class="ai__picker_text-loader-cursor-icon"></div>
						<span class="ai__picker_text-loader-cursor-text">
							${main_core.Loc.getMessage('AI_JS_PICKER_TEXT_LOADER')}
						</span>
					</div>
				</div>
			</div>
		`;
		}
	}

	class HistoryText extends HistoryBase {
		#previousItemsContainer;
		#previousItemsListContainer;
		#previousItemsLabel;
		#lastItem;
		#lastItemContainer;
		#loaderContainer;
		#isShowCapacityLabel;
		#onCopy;
		constructor(props) {
			super(props);
			this.#onCopy = props.onCopy;
			this.#isShowCapacityLabel = false;
		}
		async generate(message) {
			if (!this.onGenerate) {
				return null;
			}
			this.emit('ai-generate-start');
			await Promise.all([this.#showLoader(), this.moveLastToHistory()]);
			return this.#generateNewItem(message);
		}
		async #generateNewItem(message) {
			try {
				const res = await this.onGenerate(message);
				await this.#addNewItem(res.data.last);
				this.emit('ai-generate-finish');
				return res;
			} catch (err) {
				this.#handleFailedGenerate(err);
				throw err;
			}
		}
		render() {
			this.buildHistory();
			return this.getWrapper();
		}

		/**
		 * Called when user want to copy HistoryItem in buffer.
		 *
		 * @param {HistoryItem} item
		 * @param {PointerEvent} event
		 */
		onCopyClick(item, event) {
			this.showNotify(event.target, `action_copy_notify_${item.id}`, this.getMessage('action_copy_notify'));
			this.#onCopy(item);
		}
		#showLoader() {
			return new Promise(resolve => {
				if (!this.#lastItemContainer) {
					resolve(true);
				}
				main_core.Dom.style(this.#lastItem, 'height', `${this.#lastItemContainer?.scrollHeight}px`);
				main_core.bindOnce(this.#lastItem, 'transitionend', () => {
					resolve(true);
				});
				this.#loaderContainer.hidden = false;
				main_core.Dom.append(new TextLoader().render(), this.#loaderContainer);
				main_core.Dom.style(this.#loaderContainer, 'opacity', 1);
				main_core.Dom.style(this.#lastItem, 'height', `${this.#loaderContainer.offsetHeight}px`);
			});
		}
		#hideLoader() {
			return new Promise(resolve => {
				if (this.#loaderContainer.hidden === true) {
					resolve(true);
				}
				main_core.Dom.style(this.#loaderContainer, 'opacity', 0);
				main_core.bindOnce(this.#loaderContainer, 'transitionend', () => {
					main_core.Dom.clean(this.#loaderContainer);
					this.#loaderContainer.hidden = true;
					resolve(true);
				});
			});
		}

		/**
		 * Builds History container after loading History items.
		 *
		 */
		buildHistory() {
			main_core.Dom.style(this.listWrapper, 'opacity', 0);
			main_core.Dom.style(this.listWrapper, 'transform', 'translateY(-30px)');
			main_core.Dom.clean(this.listWrapper);
			setTimeout(() => {
				const firstItem = this.items[0];
				this.#renderLastItem(firstItem);
				this.#renderPreviousItems(this.items.slice(1));
				this.#addCapacityLabelIfNeeded();
				main_core.Dom.style(this.listWrapper, {
					opacity: 1,
					transform: 'translateY(0)'
				});
				main_core.bindOnce(this.listWrapper, 'transitionend', () => {
					main_core.Dom.style(this.listWrapper, 'transform', null);
				});
			}, 50);
		}
		#renderLastItem(item) {
			this.#lastItem = main_core.Tag.render`<div class="ai__picker__text-history-last"></div>`;
			this.#renderLoaderContainer();
			this.#lastItemContainer = main_core.Tag.render`<div class="ai__picker__text-history-last-item"></div>`;
			main_core.Dom.append(this.#lastItemContainer, this.#lastItem);
			main_core.Dom.append(this.#loaderContainer, this.#lastItem);
			main_core.Dom.clean(this.listWrapper);
			if (item) {
				const itemWrapper = this.#renderHistoryItemWrapper();
				const itemNode = this.#renderHistoryItem(item, true);
				main_core.Dom.append(itemNode, itemWrapper);
				main_core.Dom.append(itemWrapper, this.#lastItemContainer);
			}
			main_core.Dom.prepend(this.#lastItem, this.listWrapper);
		}
		#renderLoaderContainer() {
			this.#loaderContainer = main_core.Tag.render`
			<div class="ai__picker__text-history-loader"></div>
		`;
			this.#loaderContainer.hidden = true;
			main_core.Dom.style(this.#loaderContainer, 'opacity', 0);
			return this.#loaderContainer;
		}
		#renderPreviousItems(items) {
			this.#previousItemsContainer = main_core.Tag.render`
			<div class="ai__picker__text-history-previous"></div>
		`;
			if (items.length > 1) {
				this.#previousItemsLabel = this.#renderHistoryItemDivider(main_core.Loc.getMessage('AI_JS_PICKER_TEXT_PREVIOUS_ITEMS_LABEL'));
				main_core.Dom.append(this.#previousItemsLabel, this.#previousItemsContainer);
			}
			this.#previousItemsListContainer = main_core.Tag.render`<div class="ai__picker__text-history-previous-items"></div>`;
			main_core.Dom.append(this.#previousItemsListContainer, this.#previousItemsContainer);
			items.slice(1).forEach(item => {
				const node = this.#renderHistoryItem(item);
				const nodeWrapper = this.#renderHistoryItemWrapper();
				main_core.Dom.append(node, nodeWrapper);
				main_core.Dom.append(nodeWrapper, this.#previousItemsListContainer);
			});
			main_core.Dom.append(this.#previousItemsContainer, this.listWrapper);
		}
		#addNewItem(item) {
			return new Promise(resolve => {
				main_core.Dom.style(this.#lastItemContainer, {
					opacity: 0,
					transform: 'translateY(-5px)'
				});
				this.items.unshift(item);
				this.#addCapacityLabelIfNeeded();
				this.#hideLoader().then(() => {
					const firstItemWrapper = this.#renderHistoryItemWrapper();
					const firstItemNode = this.#renderHistoryItem(item, true);
					main_core.Dom.append(firstItemNode, firstItemWrapper);
					main_core.Dom.append(firstItemWrapper, this.#lastItemContainer);
					this.#lastItemContainer.style = null;
					main_core.Dom.style(this.#lastItem, 'height', `${this.#lastItem.scrollHeight}px`);
					const clearLastItemContainerStyle = () => {
						this.#lastItemContainer.removeAttribute('style');
					};
					main_core.bindOnce(this.#lastItemContainer, 'transitionend', () => {
						clearLastItemContainerStyle();
						resolve(true);
					});
				}).catch(err => {
					// eslint-disable-next-line no-console
					console.error(err);
				});
			});
		}
		async #handleFailedGenerate() {
			await this.#hideLoader();
			if (this.items.length === 0) {
				this.emit('ai-generate-failed');
				return;
			}
			await this.moveTopHistoryItem();
			this.emit('ai-generate-failed');
		}
		moveLastToHistory() {
			return new Promise(resolve => {
				const lastNodeWrapper = this.#lastItemContainer?.firstElementChild;
				if (!lastNodeWrapper) {
					resolve(true);
				}
				if (this.items.length > 0 && !this.#previousItemsLabel) {
					this.#previousItemsLabel = this.#renderHistoryItemDivider(main_core.Loc.getMessage('AI_JS_PICKER_TEXT_PREVIOUS_ITEMS_LABEL'));
					this.#previousItemsContainer.prepend(this.#previousItemsLabel);
				}
				main_core.Dom.removeClass(lastNodeWrapper.firstElementChild, '--first');
				this.#makeElemFixedWithSavingPosition(lastNodeWrapper);
				const spaceNodeForNewItem = this.#addSpaceNodeForHistoryItem();
				main_core.bindOnce(lastNodeWrapper, 'transitionend', () => {
					spaceNodeForNewItem.remove();
					main_core.Dom.prepend(lastNodeWrapper, this.#previousItemsListContainer);
					lastNodeWrapper.style = null;
					resolve(true);
				});
				const loaderHeight = this.#loaderContainer?.offsetHeight || 0;
				const lastNodeHeight = lastNodeWrapper.offsetHeight;
				const shift = -main_core.Dom.getRelativePosition(lastNodeWrapper, spaceNodeForNewItem).y - (lastNodeHeight - loaderHeight);
				main_core.Dom.style(lastNodeWrapper, 'transform', `translateY(${shift}px)`);
				main_core.Dom.style(spaceNodeForNewItem, 'height', `${lastNodeWrapper.offsetHeight}px`);
			});
		}
		moveTopHistoryItem() {
			return new Promise(resolve => {
				this.#lastItemContainer.style = null;
				const firstHistoryItem = this.#previousItemsListContainer.children[0];
				this.#makeElemFixedWithSavingPosition(firstHistoryItem);
				const spaceNodeForHistoryItem = this.#addSpaceNodeForHistoryItem(firstHistoryItem);
				requestAnimationFrame(() => {
					const shift = -main_core.Dom.getRelativePosition(this.#lastItem, spaceNodeForHistoryItem).y;
					main_core.bindOnce(firstHistoryItem, 'transitionend', () => {
						firstHistoryItem.style = null;
						this.#lastItemContainer.prepend(firstHistoryItem);
						resolve(true);
					});
					main_core.bindOnce(spaceNodeForHistoryItem, 'transitionend', () => {
						spaceNodeForHistoryItem.remove();
					});
					main_core.Dom.style(firstHistoryItem, 'transform', `translateY(${-shift}px`);
					main_core.Dom.addClass(firstHistoryItem.children[0], '--first');
					main_core.Dom.style(spaceNodeForHistoryItem, 'height', '0px');
					const firstHistoryItemHeight = main_core.Dom.getPosition(firstHistoryItem).height;
					main_core.Dom.style(this.#lastItem, 'height', `${firstHistoryItemHeight}px`);
				});
			});
		}
		#renderHistoryItem(item, justAdded) {
			if (!item) {
				return null;
			}
			const itemClassname = `ai__picker_text-history-item ${justAdded ? '--first' : ''}`;
			const actionBtnAccentModifier = justAdded ? '--accent' : '';
			const actionCopyBtnClassname = 'ai__picker_text-history-item-action-btn --copy';
			const actionUseBtnClassname = `ai__picker_text-history-item-action-btn --paste ${actionBtnAccentModifier}`;
			return main_core.Tag.render`
			<article
				class="${itemClassname}"
			>
				<div class="ai__picker_text-history-item-text">
					${main_core.Text.encode(item.data).replaceAll(/(\r\n|\r|\n)/g, '<br>')}
				</div>
				<div class="ai__picker_text-history-item-actions">
					<div class="ai__picker_text-history-item-action">
						<button
							class="${actionUseBtnClassname}"
							onclick="${this.onSelectClick.bind(this, item)}"
						>
							<span class="ai__picker_text-history-item-action-icon"></span>
							${this.getMessage('action_use')}
						</button>
					</div>
					<div class="ai__picker_text-history-item-action">
						<button
							class="${actionCopyBtnClassname}"
							onclick="${this.onCopyClick.bind(this, item)}"
						>
							<span class="ai__picker_text-history-item-action-icon"></span>
							${this.getMessage('action_copy')}
						</button>
					</div>
				</div>
			</article>
		`;
		}
		#renderHistoryItemWrapper() {
			return main_core.Tag.render`<div class="ai__picker_text-history-item-wrapper"></div>`;
		}
		#renderHistoryItemDivider(text) {
			const textElem = text ? main_core.Tag.render`<span class="ai__picker_text-history-item-divider-text">${text}</span>` : '';
			return main_core.Tag.render`
			<div class="ai__picker_text-history-item-divider">
				<hr class="ai__picker_text-history-item-divider-line"/>
				${textElem}
			</div>
		`;
		}
		#makeElemFixedWithSavingPosition(elem) {
			const position = main_core.Dom.getPosition(elem);
			main_core.Dom.style(elem, {
				position: 'fixed',
				top: `${position.y}px`,
				left: `${position.x}px`,
				width: `${position.width}px`
			});
			return elem;
		}
		#addSpaceNodeForHistoryItem(historyItem) {
			const historyItemHeight = main_core.Dom.getPosition(historyItem).height;
			const spaceNodeForHistoryItem = main_core.Tag.render`<div class="ai__picker_text-history-space-for-new-item"></div>`;
			main_core.Dom.style(spaceNodeForHistoryItem, 'height', `${historyItemHeight}px`);
			if (historyItem) {
				main_core.Dom.insertBefore(spaceNodeForHistoryItem, historyItem.nextSibling);
			} else {
				this.#previousItemsListContainer.prepend(spaceNodeForHistoryItem);
			}
			return spaceNodeForHistoryItem;
		}
		#addCapacityLabelIfNeeded() {
			if (this.items.length > Math.round(this.capacity / 2) && !this.#isShowCapacityLabel) {
				main_core.Dom.append(this.getCapacityLabel(this.capacity), this.listWrapper);
				this.#isShowCapacityLabel = true;
			}
		}
	}

	class TextField extends Base {
		#textarea;
		#text;
		#placeholder;
		constructor(props) {
			super();
			this.#textarea = null;
			this.#text = main_core.Type.isString(props.value) ? props.value : '';
			this.#placeholder = main_core.Type.isString(props.placeholder) ? props.placeholder : '';
		}
		getValue() {
			return this.#textarea.value;
		}
		setValue(text) {
			if (main_core.Type.isString(text) && this.#textarea) {
				this.#textarea.value = text;
			}
		}
		render() {
			return main_core.Tag.render`
			<div class="ai__picker_textarea_wrapper">
				${this.#renderTextArea()}
			</div>
		`;
		}
		disable() {
			this.#textarea.disabled = true;
		}
		enable() {
			this.#textarea.disabled = false;
		}
		focus() {
			const contentLength = this.#textarea.value.length;
			this.#textarea.setSelectionRange(contentLength, contentLength);
			this.#textarea.focus();
		}
		isDisabled() {
			return this.#textarea.disabled;
		}
		#renderTextArea() {
			this.#textarea = main_core.Tag.render`
			<textarea
				class="ai__picker_textarea"
				placeholder="${this.#placeholder}"
			>
				${this.#text}
			</textarea>
		`;
			main_core.bind(this.#textarea, 'input', this.#handleInput.bind(this));
			this.setValue(this.#text);
			return this.#textarea;
		}
		#handleInput(e) {
			const {
				value
			} = e.target;
			main_core_events.EventEmitter.emit(this, 'input', {
				value
			});
			this.setValue(value);
		}
	}

	const TextMessageSubmitButtonIcon = Object.freeze({
		PENCIL: 'pencil',
		BRUSH: 'brush'
	});
	class TextMessage extends Base {
		#submitBtn;
		#textField;
		#hintPopup;
		#buttonIcon;
		#container;
		#submitBtnContainer;
		#isLoading;
		constructor(props) {
			super(props);
			this.setEventNamespace('AI:Picker:TextMessage');
			this.#hintPopup = null;
			this.#container = null;
			this.#buttonIcon = this.#isValidButtonIcon(props.submitButtonIcon) ? props.submitButtonIcon : 'pencil';
			this.#isLoading = props.isLoading;
		}
		#isValidButtonIcon(buttonIcon) {
			return Object.values(TextMessageSubmitButtonIcon).includes(buttonIcon);
		}
		focus() {
			if (!this.#textField) {
				return;
			}
			this.#textField.focus();
		}
		#renderButton() {
			if (this.#submitBtnContainer) {
				this.#submitBtnContainer.innerHTML = '';
				main_core.Dom.append(this.getButton(), this.#submitBtnContainer);
			}
		}
		#getTextArea() {
			const placeholder = this.getMessage('placeholder');
			const textarea = new TextField({
				value: this.props.message,
				placeholder
			});
			this.#textField = textarea;
			main_core_events.EventEmitter.subscribe(textarea, 'input', this.#handleTextareaInput.bind(this));
			return textarea;
		}
		#handleTextareaInput(event) {
			if (event.data.value && this.#isLoading === false) {
				this.#setSubmitBtnState(null);
			} else {
				this.#setSubmitBtnState(ui_buttons.Button.State.DISABLED);
			}
		}
		getButton() {
			const btn = new ui_buttons.Button({
				text: this.getMessage('submit'),
				round: true,
				color: ui_buttons.Button.Color.PRIMARY,
				icon: ui_buttons.ButtonIcon.SEARCH,
				onclick: button => {
					if (button.getState() === null && this.#textField.getValue() !== '') {
						this.emit('submit', {
							text: this.#textField.getValue()
						});
					}
				},
				state: this.props.message ? '' : ui_buttons.Button.State.DISABLED,
				className: `ai__picker_submit-btn --${this.#buttonIcon}`
			});
			this.#submitBtn = btn;
			return btn.render();
		}
		closeMenu() {
			if (this.#hintPopup) {
				this.#hintPopup.close();
			}
		}
		#getButtonState() {
			if (this.#isLoading) {
				return ui_buttons.Button.State.CLOCKING;
			}
			if (!this.#textField.getValue()) {
				return ui_buttons.Button.State.DISABLED;
			}
			return null;
		}
		render() {
			this.#submitBtnContainer = main_core.Tag.render`<div></div>`;
			this.#container = main_core.Tag.render`
			<div class="ai__picker_text-message">
				<div class="ai__picker_text-message_text-field-wrapper">
					${this.#getTextArea().render()}
				</div>
				${this.#submitBtnContainer}
			</div>
		`;
			this.#renderButton();
			return this.#container;
		}
		disable() {
			if (this.#textField) {
				this.#textField.disable();
			}
			this.#setSubmitBtnState(ui_buttons.Button.State.DISABLED);
		}
		enable() {
			this.#textField.enable();
			if (this.#textField.getValue()) {
				this.#setSubmitBtnState(null);
			}
		}
		startLoading() {
			this.#isLoading = true;
			this.#textField.disable();
			this.#setSubmitBtnState(ui_buttons.Button.State.CLOCKING);
		}
		finishLoading() {
			this.#isLoading = false;
			this.#textField.enable();
			const btnState = this.#getButtonState();
			this.#setSubmitBtnState(btnState);
		}
		#setSubmitBtnState(state) {
			if (this.#submitBtn) {
				this.#submitBtn.getContainer().blur();
				this.#submitBtn.setState(state);
			}
		}
	}

	var UI = {
		Header,
		HistoryText,
		TextMessage
	};

	class PickerBase extends Base {
		constructor(props = {}) {
			super(props);
			this.onGenerate = props.onGenerate;
			this.onLoadHistory = props.onLoadHistory;
			this.onTariffRestriction = props.onTariffRestriction;
			this.startMessage = props.startMessage;
			this.engines = props.engines;
			this.items = [];
			this.capacity = 30;
			this.historyContainer = null;
			this.isToolingLoading = false;
			this.engine = props.engine;
			this.context = props.context;
			this.isResultCopied = false;
			this.isResultSelected = false;
			this.onSelect = props.onSelect;
			this.pickerType = '';
			this.setEventNamespace('AI:PickerBase');
		}
		render() {
			throw new Error('You must implement render method');
		}
		setEngineParameters(parameters) {
			if (this.engine) {
				this.engine.setParameters(parameters);
			}
		}
		setOnGenerate(onGenerate) {
			this.onGenerate = onGenerate;
		}
		setEngine(engine) {
			this.engine = engine;
		}
		setOnLoadHistory(onLoadHistory) {
			this.onLoadHistory = onLoadHistory;
		}
		setStartMessage(startMessage) {
			this.startMessage = startMessage;
		}
		setContext(context) {
			this.context = context;
		}
		isResultUsed() {
			return this.isResultCopied || this.isResultSelected;
		}
		resetResultUsedFlag() {
			this.isResultCopied = false;
			this.isResultSelected = false;
		}
		closeAllMenus() {
			this.textMessage.closeMenu();
		}
		async initTooling(category) {
			this.isToolingLoading = true;
			if (this.textMessage) {
				this.textMessage.startLoading();
			}
			try {
				const res = await this.engine.getImagePickerTooling();
				this.engines = res.data.engines;
				this.items = res.data.history.items;
				this.capacity = res.data.history.capacity;
				if (this.textMessage) {
					this.textMessage.finishLoading();
					this.textMessage.focus();
				}
			} catch (err) {
				console.error(err);
				BX.UI.Notification.Center.notify({
					id: 'AI_JS_PICKER_INIT_ERROR',
					content: main_core.Loc.getMessage('AI_JS_PICKER_INIT_ERROR'),
					showOnTopWindow: true
				});
			} finally {
				if (this.history) {
					this.history.items = this.items;
					main_core.Dom.style(this.historyContainer, 'opacity', 0);
					main_core.bindOnce(this.historyContainer, 'transitionend', () => {
						main_core.Dom.clean(this.historyContainer);
						main_core.Dom.append(this.history.render(), this.historyContainer);
						main_core.Dom.style(this.historyContainer, 'opacity', 1);
					});
				}
				if (this.textMessage) {
					this.textMessage.finishLoading();
				}
				this.isToolingLoading = false;
			}
		}
		renderTextMessage() {
			this.initTextMessage();
			return main_core.Tag.render`
			<div class="ai__picker-text_message-field">
				${this.textMessage.render()}
			</div>
		`;
		}
		initTextMessage() {
			this.textMessage = new UI.TextMessage({
				message: this.startMessage,
				engines: this.engines,
				submitButtonIcon: this.getTextMessageSubmitButtonIcon(),
				hint: this.getHint(),
				context: this.context,
				isLoading: this.isToolingLoading
			});
			this.textMessage.subscribe('submit', this.handleTextMessageSubmit.bind(this));
		}
		handleSelect(event) {
			this.isResultSelected = true;
			this.emit('select', {
				item: event.data.item
			});
		}
		handleCopy(event) {
			this.isResultCopied = true;
			this.emit('copy', {
				item: event.data.item
			});
		}
		getTextMessageSubmitButtonIcon() {
			return TextMessageSubmitButtonIcon.PENCIL;
		}
		getHint() {
			return null;
		}
		handleTextMessageSubmit(event) {
			const prompt = event.data.text;
			this.generate(prompt);
		}
		generate(prompt) {
			this.textMessage.startLoading();
			this.history.generate(prompt).then(() => {
				this.textMessage.finishLoading();
			}).catch(err => {
				this.textMessage.finishLoading();
				const firstError = err.errors?.[0];
				if (this.#isAgreementError(firstError)) {
					this.#handleAgreementError(firstError, prompt);
				} else if (firstError?.code === 'LIMIT_IS_EXCEEDED_MONTHLY' || firstError?.code === 'LIMIT_IS_EXCEEDED_DAILY' || firstError?.code === 'LIMIT_IS_EXCEEDED_BAAS' || firstError?.code === 'SERVICE_IS_NOT_AVAILABLE_BY_TARIFF' || firstError?.code === 'ERROR_CODE_FORCE') {
					ai_ajaxErrorHandler.AjaxErrorHandler.handleImageGenerateError({
						errorCode: firstError?.code,
						showSliderWithMsg: firstError?.customData?.showSliderWithMsg,
						sliderCode: firstError?.customData?.sliderCode,
						baasOptions: {
							bindElement: this.context.querySelector('.ai__picker_submit-btn'),
							useSlider: firstError?.customData?.showSliderWithMsg ?? true,
							context: 'notSet'
						},
						forceCodeRules: ['sliderCode', 'msgWithHtmlLink'],
						forceOption: firstError?.customData,
						bindElement: this.context.querySelector('.ai__picker_submit-btn')
					});
					this.textMessage.finishLoading();
				} else {
					this.handleGenerateFail(firstError);
				}
			});
		}
		#isAgreementError(err) {
			return err?.code === 'AGREEMENT_IS_NOT_ACCEPTED';
		}
		#handleAgreementError(err, prompt) {
			const agreementData = err.customData;
			const currentEngine = this.engines.find(e => e.selected);
			const agreement = new ai_agreement.Agreement({
				agreement: {
					title: agreementData.title,
					text: agreementData.text,
					accepted: agreementData.accepted
				},
				engineCode: currentEngine.code,
				engine: this.engine,
				type: this.pickerType
			});
			agreement.showAgreementPopup(() => {
				this.generate(prompt);
			});
		}
		handleGenerateFail(err) {
			BX.UI.Notification.Center.notify({
				id: 'AI_JS_PICKER_TEXT_GENERATE_FAILED',
				content: err?.message ?? main_core.Loc.getMessage('AI_JS_PICKER_TEXT_GENERATE_FAILED'),
				showOnTopWindow: true
			});
			this.textMessage.finishLoading();
		}
	}

	class PickerText extends PickerBase {
		#onCopy;
		constructor(props = {}) {
			super(props);
			this.#onCopy = props.onCopy;
			this.pickerType = 'text';
			this.setEventNamespace('AI:PickerText');
		}
		render() {
			return main_core.Tag.render`
			<div class="ai__picker-text">
				${this.renderTextMessage()}
				${this.#renderHistory()}
			</div>
		`;
		}
		#renderHistory() {
			this.initHistory();
			this.historyContainer = main_core.Tag.render`
			<div class="ai__picker-text_history">
				${this.isToolingLoading ? this.#renderHistoryLoadingState() : this.history.render()}
			</div>
		`;
			return this.historyContainer;
		}
		initHistory() {
			const generate = prompt => {
				const engine = this.engines.find(e => e.selected);
				const engineCode = engine?.code ?? this.engines[0].code;
				return this.onGenerate(prompt, engineCode);
			};
			this.history = new UI.HistoryText({
				items: this.items,
				capacity: this.capacity,
				onGenerate: generate,
				onSelect: this.onSelect,
				onCopy: this.#onCopy
			});
		}
		#renderHistoryLoadingState() {
			return main_core.Tag.render`
			<div class="ai__picker-text_history-loader">${main_core.Loc.getMessage('AI_JS_PICKER_HISTORY_LOADING')}</div>
		`;
		}
		async acceptAgreement(engineCode) {
			return this.engine.acceptTextAgreement(engineCode);
		}
	}

	class PickerImage extends PickerBase {
		constructor(props = {}) {
			super(props);
			this.pickerType = 'image';
			this.setEventNamespace('AI:PickerImage');
		}
		render() {
			return main_core.Tag.render`
			<div class="ai__picker-image">
				<div class="ai__picker-image_input-field-baas-point"></div>
				${this.renderTextMessage()}
				${this.#renderHistory()}
			</div>
		`;
		}
		getTextMessageSubmitButtonIcon() {
			return TextMessageSubmitButtonIcon.BRUSH;
		}
		initHistory() {
			const generate = prompt => {
				const engine = this.engines.find(e => e.selected);
				const engineCode = engine?.code ?? this.engines[0].code;
				return this.onGenerate(prompt, engineCode);
			};
			this.history = new HistoryImage({
				items: this.items,
				capacity: this.capacity,
				onGenerate: generate,
				onSelect: this.onSelect
			});
		}
		#renderHistory() {
			this.initHistory();
			this.historyContainer = main_core.Tag.render`
			<div class="ai__picker-image_history">
				${this.isToolingLoading ? this.#renderHistoryLoadingState() : this.history.render()}
			</div>
		`;
			return this.historyContainer;
		}
		#renderHistoryLoadingState() {
			return main_core.Tag.render`
			<div class="ai__picker-text_history-loader">${main_core.Loc.getMessage('AI_JS_PICKER_HISTORY_LOADING')}</div>
		`;
		}
		getHint() {
			if (main_core.Loc.getMessage('LANGUAGE_ID') !== 'en') {
				return {
					title: main_core.Loc.getMessage('AI_JS_PICKER_IMAGE_HINT_TITLE'),
					text: main_core.Loc.getMessage('AI_JS_PICKER_IMAGE_HINT_TEXT')
				};
			}
			return null;
		}
		acceptAgreement(engineCode) {
			return this.engine.acceptImageAgreement(engineCode);
		}
		isResultUsed() {
			return this.isResultSelected;
		}
	}

	class ScrollTopButton extends Base {
		#button;
		#isShow;
		constructor(props) {
			super(props);
			this.setEventNamespace('AI:Picker:ScrollTopButton');
			this.#button = null;
			this.#isShow = true;
		}
		render() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Actions.CHEVRON_UP,
				size: 26
			});
			this.#button = main_core.Tag.render`
			<button class="ai__picker_go-top-btn">
				${icon.render()}
			</button>
		`;
			main_core.Dom.style(this.#button, {
				visibility: this.#isShow ? '' : 'hidden'
			});
			main_core.bind(this.#button, 'click', () => {
				this.emit('click');
			});
			return this.#button;
		}
		show() {
			if (this.#isShow) {
				return;
			}
			this.#isShow = true;
			if (this.#button) {
				main_core.Dom.style(this.#button, 'visibility', null);
				setTimeout(() => {
					main_core.Dom.style(this.#button, 'opacity', 1);
				}, 10);
			}
		}
		hide() {
			if (!this.#isShow) {
				return;
			}
			this.#isShow = false;
			if (this.#button) {
				main_core.Dom.style(this.#button, 'opacity', 0);
				main_core.bindOnce(this.#button, 'transitionend', () => {
					main_core.Dom.style(this.#button, 'visibility', 'hidden');
				});
			}
		}
		isShow() {
			this.#isShow = true;
		}
	}

	class PickerAnalytic {
		#analyticLabel;
		constructor(props) {
			this.#analyticLabel = props.analyticLabel;
		}
		labels = Object.freeze({
			open: () => this.#putOpenLabel(),
			generate: text => this.#putGenerateLabel(text),
			copy: () => this.#putCopyLabel(),
			paste: () => this.#putPasteLabel(),
			cancel: () => this.#putCancelLabel()
		});
		getAnalyticLabel() {
			return this.#analyticLabel;
		}
		setAnalyticLabel(analyticLabel) {
			this.#analyticLabel = analyticLabel;
		}
		#putOpenLabel() {
			this.#putLabel('open');
		}
		#putGenerateLabel(text) {
			const croppedText = text ? text.slice(0, 50) : '';
			this.#putLabel('generate', {
				text: croppedText
			});
		}
		#putCopyLabel() {
			return this.#putLabel('copy');
		}
		#putPasteLabel() {
			return this.#putLabel('past');
		}
		#putCancelLabel() {
			return this.#putLabel('cancel');
		}
		#putLabel(action, params = {}) {
			let url = '/bitrix/images/1.gif';
			const timestamp = Date.now();
			const data = {
				module: 'ai',
				context: this.#analyticLabel,
				action: `picker.${action}`,
				ts: timestamp,
				...params
			};
			const preparedData = main_core.ajax.prepareData(data);
			if (preparedData) {
				url += (url.includes('?') ? '&' : '?') + preparedData;
			}
			main_core.ajax({
				method: 'GET',
				url
			});
		}
	}

	class Picker {
		static LangSpace = {
			text: 'text',
			image: 'image'
		};
		#startMessage;
		#onSelectCallback;
		#onTariffRestriction;
		#engine;
		#popups;
		#currentPopup;
		#popupContainer;
		#contentWrapper;
		#scrollTopButton;
		#saveImages;
		#engines;
		#promptsHistory;
		#articleCode;
		#analytic;
		#analyticLabel;
		#pickerImage;
		#pickerText;
		#verticalMargin;
		constructor(options) {
			// super(options);
			this.#engine = new ai_engine.Engine();
			this.#popups = new Map();
			this.#popupContainer = options.popupContainer || document.body;
			this.#startMessage = options.startMessage;
			this.#onSelectCallback = options.onSelect;
			this.#onTariffRestriction = options.onTariffRestriction;
			this.#articleCode = null;
			this.#analyticLabel = options.analyticLabel;
			this.#saveImages = options.saveImages === true;
			this.#engines = {};
			this.#promptsHistory = {};
			this.#verticalMargin = 25;
			this.#analytic = new PickerAnalytic({
				analyticLabel: this.#analyticLabel
			});
			this.#engine.setModuleId(options.moduleId).setContextId(options.contextId).setHistoryState(options.history);
			this.#pickerImage = null;
			this.#pickerText = null;
		}
		async initTooling() {
			const res = await this.#engine.getTooling('text');
			this.#engines.text = res.data.engines;
			this.#promptsHistory.text = res.data.history;
			return true;
		}

		/**
		 * Sets language space. For different interface may be used different phrases.
		 * See all bunches of phrases in lang/config.php.
		 *
		 * @param {LangSpace} spaceCode
		 * @return {Picker}
		 */
		setLangSpace(spaceCode) {
			Loc.getInstance().setSpace(spaceCode);
			return this;
		}
		setSelectCallback(callback) {
			this.#onSelectCallback = callback;
		}
		setEngineParameters(parameters) {
			if (this.#engine) {
				this.#engine.setParameters(parameters);
				if (this.#pickerImage) {
					this.#pickerImage.setEngineParameters(parameters);
				}
				if (this.#pickerText) {
					this.#pickerText.setEngineParameters(parameters);
				}
			}
		}
		setStartMessage(message) {
			this.#startMessage = main_core.Type.isString(message) ? message : this.#startMessage;
		}

		/**
		 * Shows popup for text completion.
		 */
		text() {
			this.#analytic.labels.open();
			this.#articleCode = 17_587_362;
			const popup = this.#popups.get('text');
			if (this.#pickerText) {
				const scroll = this.#popupContainer === document.body ? window.pageYOffset : 0;
				popup.setBindElement({
					left: this.#popupContainer.offsetWidth - popup.getWidth() - 25,
					top: 25 + scroll
				});
				popup.adjustPosition();
				this.#currentPopup = popup;
				this.#pickerText.resetResultUsedFlag();
				this.#show();
			} else {
				this.#initPickerText();
				this.#registerPopup('text', this.#pickerText.render({
					textMessageText: this.#startMessage
				}), {
					contentClassname: ''
				});
				this.#pickerText.resetResultUsedFlag();
				this.#show();
			}
		}

		/**
		 * Shows popup for image completion.
		 */
		async image() {
			const isRestrictedByEula = main_core.Extension.getSettings('ai.picker').get('isRestrictedByEula');
			let Feature = null;
			if (isRestrictedByEula) {
				Feature = await main_core.Runtime.loadExtension('bitrix24.license.feature');
				try {
					await Feature.Feature.checkEulaRestrictions('ai_available_by_version');
				} catch (err) {
					if (main_core.Type.isFunction(err?.callback)) {
						err?.callback();
					}
				}
			} else {
				this.#analytic.labels.open();
				this.#articleCode = 17_586_054;
				if (this.#pickerImage) {
					const popup = this.#popups.get('image');
					const scroll = this.#popupContainer === document.body ? window.pageYOffset : 0;
					this.#currentPopup = popup;
					popup.setBindElement({
						left: this.#popupContainer.offsetWidth - popup.getWidth() - 25,
						top: 25 + scroll
					});
					popup.adjustPosition();
				} else {
					this.#initPickerImage();
					this.#registerPopup('image', this.#pickerImage.render(), {
						width: 550,
						contentClassname: '--image',
						headerClassname: '--image'
					});
				}
				this.#pickerImage.resetResultUsedFlag();
				this.#show();
			}
		}

		/**
		 * Called when user want to use HistoryItem somewhere outside.
		 * @param {HistoryItem} item
		 * @param {Promise} promise
		 */
		#onSelect(item, promise) {
			if (main_core.Type.isFunction(this.#onSelectCallback)) {
				this.#onSelectCallback(item, promise);
			}
			this.#currentPopup.close();
		}

		/**
		 * Shows selected popup.
		 */
		#show() {
			this.#currentPopup.show();
		}
		#getScrollWidth() {
			const div = main_core.Tag.render`<div style="overflow-y: scroll; width: 50px; height: 50px; opacity: 0; pointer-events: none; position: absolute;"></div>`;
			main_core.Dom.append(div, document.body);
			const scrollWidth = div.offsetWidth - div.clientWidth;
			main_core.Dom.remove(div);
			return scrollWidth;
		}
		#fixOverlayFreez(popupId) {
			if (!popupId) {
				return;
			}
			const overlayNode = this.#popups.get(popupId).overlay.element;
			main_core.Dom.style(overlayNode, 'padding-right', `${this.#getScrollWidth()}px`);
		}

		/**
		 * Registers certain popup.
		 *
		 * @param {string} popupId
		 * @param content
		 * @param options
		 */
		#registerPopup(popupId, content, options) {
			const popupWidth = options?.width || 450;
			const contentClassname = options.contentClassname || '';
			const headerClassname = options.headerClassname || '';
			const adjustPosition = this.#adjustPopupPosition.bind(this);
			if (!this.#popups.has(popupId)) {
				this.#popups.set(popupId, new main_popup.Popup({
					bindElement: this.#getPopupPosition(popupWidth),
					className: 'ai__picker-popup',
					autoHide: false,
					closeByEsc: false,
					width: popupWidth,
					height: this.#getPopupMaxHeight(),
					disableScroll: true,
					padding: 0,
					borderRadius: '12px',
					contentBorderRadius: '12px',
					overlay: {
						backgroundColor: '#fff',
						opacity: 50
					},
					animation: {
						showClassName: 'ai__picker-popup-show',
						closeClassName: 'ai__picker-popup-hide',
						closeAnimationType: 'animation'
					},
					targetContainer: this.#popupContainer,
					events: {
						onPopupShow: () => {
							this.#fixOverlayFreez(popupId);
							main_core.Dom.style(document.body, 'overflow-x', 'hidden');
						},
						onPopupAfterClose: popup => {
							main_core.Dom.style(document.body, 'overflow-x', null);
							popup.destroy();
						},
						onAfterShow: () => {
							main_core.bind(window, 'resize', adjustPosition);
						},
						onPopupClose: () => {
							this.#sendCancelAnalyticLabelIfNeeded();
							if (this.#pickerImage) {
								this.#pickerImage.closeAllMenus();
							}
							if (this.#pickerText) {
								this.#pickerText.closeAllMenus();
							}
							main_core.unbind(window, 'resize', adjustPosition);
						}
					}
				}));
			}
			this.#currentPopup = this.#popups.get(popupId);
			if (this.#currentPopup.isShown()) {
				this.#currentPopup.close();
			}
			this.#setContent(this.#currentPopup, this.#renderPopupContent(content, {
				contentClassname,
				headerClassname
			}));
		}
		#sendCancelAnalyticLabelIfNeeded() {
			if (this.#pickerText && !this.#pickerText.isResultUsed()) {
				this.#analytic.labels.cancel();
			}
			if (this.#pickerImage && !this.#pickerImage.isResultUsed()) {
				this.#analytic.labels.cancel();
			}
		}
		#adjustPopupPosition() {
			this.#currentPopup.setBindElement(this.#getPopupPosition());
			this.#currentPopup.setHeight(this.#getPopupMaxHeight());
			this.#currentPopup.adjustPosition();
			main_core.Dom.style(this.#contentWrapper, 'height', `${this.#getContentMaxHeight()}px`);
		}
		#getPopupPosition(popupWidthParam) {
			const scroll = this.#popupContainer === document.body ? window.pageYOffset : 0;
			const popupWidth = popupWidthParam || this.#currentPopup.getWidth();
			return {
				left: this.#popupContainer.offsetWidth - popupWidth - 25,
				top: 25 + scroll
			};
		}
		#getPopupMaxHeight() {
			const height = this.#popupContainer.clientHeight > window.innerHeight ? window.innerHeight : this.#popupContainer.clientHeight;
			return height - this.#verticalMargin * 2;
		}

		/**
		 * Sets content to certain popup.
		 * Content depends on specified fields before popup registration.
		 *
		 * @param {Popup} popup
		 * @param content
		 */
		// eslint-disable-next-line class-methods-use-this
		#setContent(popup, content) {
			popup.setContent(content);
		}
		#getContentMaxHeight() {
			const headerHeight = 94;
			return this.#currentPopup.getHeight() - headerHeight;
		}
		#renderPopupContent(contentElem, options) {
			const contentStyle = `height: ${this.#getContentMaxHeight()}px`;
			const contentClassname = options?.contentClassname || '';
			const headerClassname = options?.headerClassname || '';
			this.#contentWrapper = main_core.Tag.render`
			<div
				class="ai__picker_content ${main_core.Browser.isMac() ? '--is-mac-os' : ''} ${contentClassname}"
				style="${contentStyle}"
			>
				${contentElem}
			</div>
		`;
			main_core.bind(this.#contentWrapper, 'scroll', () => {
				if (this.#contentWrapper.scrollTop > 200) {
					this.#scrollTopButton.show();
				} else {
					this.#scrollTopButton.hide();
				}
				if (this.#pickerImage) {
					this.#pickerImage.closeAllMenus();
				}
				if (this.#pickerText) {
					this.#pickerText.closeAllMenus();
				}
			});
			this.#scrollTopButton = new ScrollTopButton();
			this.#scrollTopButton.hide();
			this.#scrollTopButton.subscribe('click', () => {
				this.#contentWrapper.scrollTo({
					top: 0
				});
			});
			return main_core.Tag.render`
			<div class="ai__picker">
				<div>
					<div class="ai__picker-header">
						${this.#renderPopupHeader({
			className: headerClassname
		})}
					</div>
				</div>
				${this.#contentWrapper}
				${this.#scrollTopButton.render()}
			</div>
		`;
		}
		#renderPopupHeader(options = {}) {
			const header = new UI.Header({
				articleCode: this.#articleCode,
				className: options.className
			});
			header.subscribe('click-close-icon', () => {
				this.#currentPopup.close();
			});
			return header.render();
		}
		async #initPickerText() {
			if (this.#pickerText) {
				return;
			}
			this.#pickerText = new PickerText({
				onTariffRestriction: this.#onTariffRestriction,
				onSelect: this.#handleSelect.bind(this),
				onCopy: this.#handleCopy.bind(this)
			});
			const generate = (prompt, engineCode) => {
				this.#engine.setPayload(new ai_payload_textpayload.Text({
					engineCode,
					prompt
				}));
				this.#analytic.labels.generate(prompt);
				return this.#engine.textCompletions();
			};
			this.#pickerText.setOnGenerate(generate);
			this.#pickerText.setStartMessage(this.#startMessage);
			this.#pickerText.setEngine(this.#engine);
			this.#pickerText.setContext(this.#popupContainer);
			this.#pickerText.initTooling('text');
			this.#pickerText.subscribe('select', this.#handleSelect.bind(this));
		}
		#initPickerImage() {
			if (this.#pickerImage) {
				return;
			}
			this.#pickerImage = new PickerImage({
				onTariffRestriction: this.#onTariffRestriction,
				onSelect: this.#handleImageSelect.bind(this),
				context: this.#popupContainer
			});
			const generate = (prompt, engineCode) => {
				this.#engine.setPayload(new ai_payload_textpayload.Text({
					prompt,
					engineCode
				}));
				this.#analytic.labels.generate(prompt);
				this.#engine.setAnalyticParameters({
					type: 'create_image',
					c_section: this.#getCSection()
				});
				return this.#engine.imageCompletions();
			};
			this.#pickerImage.setOnGenerate(generate);
			this.#pickerImage.setStartMessage(this.#startMessage);
			this.#pickerImage.setEngine(this.#engine);
			this.#pickerImage.setContext(this.#popupContainer);
			this.#pickerImage.initTooling('image');
			this.#pickerImage.subscribe('select', this.#handleSelect.bind(this));
		}
		#handleSelect(item) {
			this.#analytic.labels.paste();
			this.#onSelect(item);
		}
		#handleCopy(item) {
			BX.clipboard.copy(item.data);
			this.#analytic.labels.copy();
		}
		async #handleImageSelect(pictureUrl) {
			this.#analytic.labels.paste();
			if (this.#saveImages) {
				const promise = new Promise((resolve, reject) => {
					this.#engine.saveImage(pictureUrl).then(res => {
						resolve(res.data);
					}).catch(err => {
						reject(err);
					});
				});
				this.#onSelect(pictureUrl, promise);
			} else {
				this.#onSelect(pictureUrl);
			}
		}
		#getCSection() {
			if (!this.#analyticLabel) {
				return '';
			}
			return this.#analyticLabel.split('_').map(word => {
				return word[0].toUpperCase() + word.slice(1);
			}).join('');
		}
	}

	exports.Picker = Picker;

})(this.BX.AI = this.BX.AI || {}, BX.AI, BX.AI.Payload, BX, BX.Main, BX.Event, BX.UI.IconSet, window, BX, BX.UI.Notification, BX, BX.UI, window, BX.AI, BX.AI);
//# sourceMappingURL=index.bundle.js.map
