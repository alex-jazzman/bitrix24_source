/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup, ui_entitySelector, ui_buttons) {
	'use strict';

	class PostData {
		#cache = new main_core.Cache.MemoryCache();
		constructor(data) {
			this.setData(data);
		}
		setData(data) {
			this.#cache.set('data', data);
		}
		setFormData(formData) {
			const currentData = this.#cache.get('data');
			this.setData({
				...currentData,
				...formData
			});
		}
		prepareRequestData() {
			return {
				POST_TITLE: this.#getData('title'),
				POST_MESSAGE: this.#getData('message'),
				DEST_DATA: this.#getData('recipients'),
				UF_BLOG_POST_FILE: this.#getData('fileIds'),
				TAGS: this.#getData('tags')
			};
		}
		validateRequestData() {
			if (!this.getMessage()) {
				return main_core.Loc.getMessage('SN_PF_REQUEST_TEXT_VALIDATION_ERROR');
			}
			if (!this.getRecipients()) {
				return main_core.Loc.getMessage('SN_PF_REQUEST_RECIPIENTS_VALIDATION_ERROR');
			}
			return '';
		}
		getTitle() {
			return main_core.Type.isStringFilled(this.#getData('title')) ? this.#getData('title') : '';
		}
		getMessage() {
			return main_core.Type.isStringFilled(this.#getData('message')) ? this.#getData('message') : '';
		}
		getRecipients() {
			return main_core.Type.isStringFilled(this.#getData('recipients')) ? this.#getData('recipients') : '';
		}
		setRecipients(recipients) {
			const currentData = this.#cache.get('data');
			const newData = {
				recipients
			};
			this.setData({
				...currentData,
				...newData
			});
		}
		getAllUsersTitle() {
			return this.#getData('allUsersTitle');
		}
		isAllowEmailInvitation() {
			return this.#getData('allowEmailInvitation') === true;
		}
		isAllowToAll() {
			return this.#getData('allowToAll') === true;
		}
		#getData(param) {
			return this.#cache.get('data')[param];
		}
	}

	class PostFormManager extends main_core_events.EventEmitter {
		#formId;
		#LHEId;
		#isShownPostTitle;
		#LHEPostForm;
		#eventNode;
		#showPostTitleBtn;
		#editor;
		#userFieldControl;
		#blockFileShowEvent = false;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.PostFormManager');
			this.#formId = params.formId;
			this.#LHEId = params.LHEId;
			this.#isShownPostTitle = params.isShownPostTitle === true;
			main_core_events.EventEmitter.subscribe('OnEditorInitedAfter', event => {
				const [editor] = event.getData();
				this.#editorInited(editor);
			});
			main_core_events.EventEmitter.subscribe('onMentionAdd', this.#addMention.bind(this));
		}
		initLHE() {
			if (!window.LHEPostForm) {
				throw new Error('BX.Socialnetwork.PostFormManager: LHEPostForm not found');
			}
			this.#LHEPostForm = window.LHEPostForm;
			const handler = this.#LHEPostForm.getHandler(this.#LHEId);
			this.#eventNode = handler.eventNode;
			main_core_events.EventEmitter.emit(this.#eventNode, 'OnShowLHE', ['show']);
			this.#appendButtonShowingPostTitle();
			this.#userFieldControl = BX.Disk.Uploader.UserFieldControl.getById(this.#formId);
			main_core_events.EventEmitter.subscribe(this.#eventNode, 'onShowControllers', ({
				data
			}) => {
				if (this.#blockFileShowEvent === false && data.toString() === 'show') {
					setTimeout(() => {
						this.emit('showControllers');
					}, 100);
				}
				this.#blockFileShowEvent = false;
			});
			main_core_events.EventEmitter.subscribe(this.#eventNode, 'onShowControllers:File:Increment', ({
				data
			}) => {
				this.#blockFileShowEvent = true;
			});
		}
		getEditorText() {
			return this.#editor.GetContent();
		}
		clearEditorText() {
			main_core_events.EventEmitter.subscribeOnce(this.#editor, 'OnSetContentAfter', () => {
				this.#editor.ResizeSceleton();
			});
			this.#editor.SetContent('');
		}
		focusToEditor() {
			if (this.#editor) {
				this.#editor.Focus();
			}
		}
		#editorInited(editor) {
			if (editor.id === this.#LHEId) {
				this.#editor = editor;
				this.emit('editorInited');
				main_core_events.EventEmitter.subscribe(editor, 'OnFullscreenExpand', () => {
					this.emit('fullscreenExpand');
				});
			}
		}
		#addMention(baseEvent) {
			const [entity, type] = baseEvent.getCompatData();
			const entityType = this.#getEntityType(type, entity);
			this.emit('addMention', {
				type,
				entity,
				entityType
			});
		}
		#getEntityType(type, entity) {
			let entityType = '';
			if (type === 'user') {
				if (entity.isExtranet === 'Y') {
					entityType = 'extranet';
				} else if (entity.isEmail === 'Y') {
					entityType = 'email';
				} else {
					entityType = 'employee';
				}
			} else if (type === 'project') {
				if (entity.isExtranet === 'Y') {
					entityType = 'extranet';
				}
			}
			return entityType;
		}
		#appendButtonShowingPostTitle() {
			const activeClass = this.#isShownPostTitle ? 'feed-add-post-form-btn-active' : '';
			this.#showPostTitleBtn = main_core.Tag.render`
			<div
				data-id="sn-post-form-manager-show-title-btn"
				class="feed-add-post-form-title-btn ${activeClass}"
				title="${main_core.Loc.getMessage('SN_PF_TITLE_PLACEHOLDER')}"
			>
			</div>
		`;
			main_core.Event.bind(this.#showPostTitleBtn, 'click', this.#toggleVisibilityPostTitle.bind(this));
			const containerWithAdditionalButtons = this.#eventNode.querySelector('.feed-add-post-form-but-more-open');
			main_core.Dom.append(this.#showPostTitleBtn, containerWithAdditionalButtons);
		}
		#toggleVisibilityPostTitle() {
			this.emit('toggleVisibilityPostTitle');
			this.#isShownPostTitle = !this.#isShownPostTitle;
			main_core.Dom.toggleClass(this.#showPostTitleBtn, 'feed-add-post-form-btn-active');
		}
	}

	class PostFormRouter {
		#pathToDefaultRedirect;
		#pathToGroupRedirect;
		constructor(params) {
			this.#pathToDefaultRedirect = main_core.Type.isString(params.pathToDefaultRedirect) ? params.pathToDefaultRedirect : '';
			this.#pathToGroupRedirect = main_core.Type.isString(params.pathToGroupRedirect) ? params.pathToGroupRedirect : '';
		}
		redirectTo(groupId) {
			// the form can be opened from a page outside the feed, where there is nothing to reload
			if (!top.BX.Socialnetwork?.Spaces?.space) {
				return;
			}
			if (groupId) {
				if (this.#pathToGroupRedirect) {
					top.BX.Socialnetwork.Spaces.space.reloadPageContent(this.#pathToGroupRedirect.replace('#group_id#', groupId));
				} else {
					top.BX.Socialnetwork.Spaces.space.reloadPageContent();
				}
			} else {
				// eslint-disable-next-line no-lonely-if
				if (this.#pathToDefaultRedirect) {
					top.BX.Socialnetwork.Spaces.space.reloadPageContent(this.#pathToDefaultRedirect);
				} else {
					top.BX.Socialnetwork.Spaces.space.reloadPageContent();
				}
			}
		}
	}

	class PostFormTags {
		#formId;
		#form;
		constructor(formId, form) {
			if (!main_core.Type.isString(formId) || !formId) {
				throw new Error('BX.Socialnetwork.PostFormTags: formId not found');
			}
			if (!main_core.Type.isDomNode(form)) {
				throw new Error('BX.Socialnetwork.PostFormTags: form not found');
			}
			this.#formId = formId;
			this.#form = form;
		}
		isFilled() {
			const input = this.#getInput();
			return main_core.Type.isDomNode(input) && input.value;
		}
		getValue() {
			const input = this.#getInput();
			if (!main_core.Type.isDomNode(input)) {
				return '';
			}
			return input.value;
		}
		clear() {
			this.#getContainer().querySelectorAll('.feed-add-post-del-but').forEach(tag => {
				tag.click();
			});
			this.#hideContainer();
		}
		#getInput() {
			return this.#getContainer().querySelector('input[name="TAGS"]');
		}
		#getContainer() {
			return this.#form.querySelector(`#post-tags-block-${this.#formId}`);
		}
		#hideContainer() {
			main_core.Dom.style(this.#getContainer(), 'display', 'none');
		}
	}

	const UserOptions = main_core.Reflection.namespace('BX.userOptions');
	const NotificationCenter = main_core.Reflection.namespace('BX.UI.Notification.Center');
	class PostForm extends main_core_events.EventEmitter {
		#postId;
		#groupId;
		#preselectedRecipients;
		#isShownPostTitle;
		#initData;
		#formId;
		#jsObjName;
		#LHEId;
		#sended;
		#editMode;
		#popup;
		#sendBtn;
		#postData;
		#postFormManager;
		#postFormRouter;
		#postFormTags;
		#node;
		#titleNode;
		#recipientSelector;
		#errorLayout;
		#selector;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.PostForm');
			this.#postId = main_core.Type.isInteger(parseInt(params.postId, 10)) ? parseInt(params.postId, 10) : 0;
			this.#groupId = main_core.Type.isInteger(parseInt(params.groupId, 10)) ? parseInt(params.groupId, 10) : 0;
			this.#preselectedRecipients = main_core.Type.isArray(params.preselectedRecipients) ? params.preselectedRecipients.filter(code => main_core.Type.isStringFilled(code)) : null;
			this.#formId = `blogPostForm_${main_core.Text.getRandom().toLowerCase()}`;
			this.#jsObjName = `oPostFormLHE_blogPostForm${this.#formId}`;
			this.#LHEId = `idPostFormLHE_${this.#formId}`;
			this.#sended = false;
			this.#editMode = this.#postId > 0;
			this.#postFormRouter = new PostFormRouter({
				pathToDefaultRedirect: params.pathToDefaultRedirect,
				pathToGroupRedirect: params.pathToGroupRedirect
			});
			this.#errorLayout = {};
		}
		show() {
			if (this.#popup) {
				return new Promise((resolve, reject) => {
					this.#popup.subscribeOnce('onShow', () => {
						resolve();
					});
					this.#popup.show();
				});
			}
			return new Promise((resolve, reject) => {
				this.#init().then(() => {
					this.#createPopup();
					this.#popup.subscribeOnce('onShow', () => {
						resolve();
					});
					this.#popup.show();
				}).catch(() => reject());
			});
		}
		#init() {
			const data = {
				postId: this.#postId,
				groupId: this.#groupId
			};
			if (this.#preselectedRecipients !== null) {
				// the codes travel as JSON: an empty array does not survive form encoding, while an
				// empty recipient set must stay distinguishable from an absent parameter
				data.preselectedRecipients = JSON.stringify(this.#preselectedRecipients);
			}
			return main_core.ajax.runAction('socialnetwork.api.livefeed.blogpost.getPostFormInitData', {
				data
			}).then(response => {
				this.#initData = response.data;
				this.#postData = new PostData(this.#initData);
				this.#isShownPostTitle = this.#initData.isShownPostTitle === 'Y';
				this.#postFormManager = new PostFormManager({
					formId: this.#formId,
					LHEId: this.#LHEId,
					isShownPostTitle: this.#isShownPostTitle
				});
				this.#postFormManager.subscribe('editorInited', this.#afterEditorInit.bind(this));
				this.#postFormManager.subscribe('toggleVisibilityPostTitle', this.#toggleVisibilityPostTitle.bind(this));
				this.#postFormManager.subscribe('fullscreenExpand', this.#changePostFormPosition.bind(this));
				this.#postFormManager.subscribe('addMention', this.#addMention.bind(this));
				this.#postFormManager.subscribe('showControllers', this.#showControllers.bind(this));
				return this;
			}).catch(error => {
				this.#consoleError('init', error);
			});
		}
		#createPopup() {
			this.#popup = new main_popup.Popup({
				id: this.#formId,
				className: 'sn-post-form-popup --normal',
				content: this.#renderForm(),
				contentNoPaddings: true,
				minHeight: 370,
				width: 720,
				disableScroll: true,
				draggable: false,
				overlay: true,
				padding: 0,
				buttons: [this.#sendBtn = new ui_buttons.Button({
					text: main_core.Loc.getMessage('SN_PF_SEND_BTN'),
					color: ui_buttons.ButtonColor.PRIMARY,
					onclick: () => {
						this.#sendForm();
					}
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('SN_PF_CANCEL_BTN'),
					color: ui_buttons.ButtonColor.LINK,
					onclick: () => {
						this.#popup.close();
					}
				})],
				events: {
					onFirstShow: this.#firstShow.bind(this),
					onAfterShow: this.#onAfterShow.bind(this),
					onAfterClose: this.#afterClose.bind(this)
				}
			});
		}
		#firstShow() {
			this.#sendBtn.setWaiting(true);
			this.#initRecipientSelector();

			// eslint-disable-next-line promise/catch-or-return
			this.#renderMainPostForm().then(runtimePromise => {
				// eslint-disable-next-line promise/catch-or-return,promise/no-nesting
				runtimePromise.then(() => {
					this.#postFormManager.initLHE();
				});
			});
		}
		#onAfterShow() {
			this.#initTagsSelector();
			this.#postFormManager.focusToEditor();
		}
		#afterClose() {
			if (this.#sended) {
				this.#clearForm();
				if (BX.Livefeed && BX.Livefeed.PageInstance) {
					BX.Livefeed.PageInstance.refresh();
				} else {
					this.#postFormRouter.redirectTo(this.#groupId);
				}
			}
		}
		#sendForm() {
			if (this.#sendBtn.isWaiting()) {
				return;
			}
			this.#hideError();
			this.#postData.setFormData(this.#collectFormData());
			const errorMessage = this.#postData.validateRequestData();
			if (errorMessage) {
				this.#showError(errorMessage);
				this.#postFormManager.focusToEditor();
				return;
			}
			this.#sendBtn.setWaiting(true);
			const action = `socialnetwork.api.livefeed.blogpost.${this.#postId ? 'update' : 'add'}`;
			const data = this.#postId ? {
				id: this.#postId,
				params: this.#postData.prepareRequestData()
			} : {
				params: this.#postData.prepareRequestData()
			};
			main_core.ajax.runAction(action, {
				data,
				analyticsLabel: {
					b24statAction: 'addLogEntry',
					b24statContext: 'spaces'
				}
			}).then(response => {
				this.#sended = true;
				this.#popup.close();
			}).catch(error => {
				this.#sendBtn.setWaiting(false);
				this.#consoleError('sendForm', error);
			});
		}
		#clearForm() {
			this.#postData.setData(this.#initData);
			this.#clearSelector();
			this.#titleNode.querySelector('input').value = '';
			this.#postFormManager.clearEditorText();
			this.#clearFiles();
			this.#postFormTags.clear();
			this.#sended = false;
			this.#sendBtn.setWaiting(false);
		}
		#collectFormData() {
			const postFormData = {
				title: this.#titleNode.querySelector('input').value,
				message: this.#postFormManager.getEditorText()
			};
			postFormData.recipients = this.#postData.getRecipients();
			const fileIds = [];
			const userFieldControl = BX.Disk.Uploader.UserFieldControl.getById(this.#formId);
			userFieldControl.getFiles().forEach(file => {
				if (file.getServerFileId() !== null) {
					fileIds.push(file.getServerFileId());
				}
			});
			postFormData.fileIds = fileIds;
			if (this.#postFormTags.isFilled()) {
				postFormData.tags = this.#postFormTags.getValue();
			}
			return postFormData;
		}
		#clearFiles() {
			const userFieldControl = BX.Disk.Uploader.UserFieldControl.getById(this.#formId);
			userFieldControl.clear();
			userFieldControl.hide();
		}
		#showError(message) {
			main_core.Dom.removeClass(this.#errorLayout.container, '--hidden');
			this.#errorLayout.message.textContent = main_core.Text.encode(message);
		}
		#hideError() {
			main_core.Dom.addClass(this.#errorLayout.container, '--hidden');
			this.#errorLayout.message.textContent = '';
		}
		#renderMainPostForm() {
			return main_core.ajax.runAction('socialnetwork.api.livefeed.blogpost.getMainPostForm', {
				data: {
					params: {
						formId: this.#formId,
						jsObjName: this.#jsObjName,
						LHEId: this.#LHEId,
						postId: this.#postId,
						text: this.#postData.getMessage()
					}
				}
			}).then(response => {
				return main_core.Runtime.html(this.#node.querySelector('#sn-post-form'), response.data.html, {
					htmlFirst: true
				});
			}).catch(error => {
				this.#consoleError('afterShow', error);
			});
		}
		#renderForm() {
			this.#node = main_core.Tag.render`
			<div class="sn-post-form__discussion">
				${this.#renderErrorAlert()}
				${this.#renderRecipientSelector()}
				${this.#renderTitle()}
				<div id="sn-post-form"></div>
			</div>
		`;
			return this.#node;
		}
		#renderErrorAlert() {
			const {
				container,
				message
			} = main_core.Tag.render`
			<div
				class="sn-post-form__discussion-error-alert ui-alert ui-alert-danger --hidden"
				ref="container"
			>
				<span class="ui-alert-message" ref="message"></span>
			</div>
		`;
			this.#errorLayout.container = container;
			this.#errorLayout.message = message;
			return container;
		}
		#renderRecipientSelector() {
			this.#recipientSelector = main_core.Tag.render`
			<div class="sn-post-form__discussion-row --recipients"></div>
		`;
			return this.#recipientSelector;
		}
		#initRecipientSelector() {
			const selectorId = 'sn-post-form-recipient-selector';
			this.#selector = new ui_entitySelector.TagSelector({
				id: selectorId,
				dialogOptions: {
					id: selectorId,
					context: 'PostForm',
					preselectedItems: main_core.Type.isStringFilled(this.#postData.getRecipients()) ? JSON.parse(this.#postData.getRecipients()) : [],
					entities: [{
						id: 'meta-user',
						options: {
							'all-users': {
								title: this.#postData.getAllUsersTitle(),
								allowView: this.#postData.isAllowToAll()
							}
						}
					}, {
						id: 'user',
						options: {
							emailUsers: this.#postData.isAllowEmailInvitation(),
							inviteGuestLink: this.#postData.isAllowEmailInvitation(),
							myEmailUsers: true
						}
					}, {
						id: 'project',
						options: {
							features: {
								blog: ['premoderate_post', 'moderate_post', 'write_post', 'full_post']
							}
						}
					}, {
						id: 'department',
						options: {
							selectMode: 'usersAndDepartments',
							allowFlatDepartments: false
						}
					}],
					events: {
						'Item:onSelect': () => {
							this.#changeSelectedRecipients(this.#selector.getDialog().getSelectedItems());
						},
						'Item:onDeselect': () => {
							this.#changeSelectedRecipients(this.#selector.getDialog().getSelectedItems());
						}
					}
				}
			});
			this.#selector.renderTo(this.#recipientSelector);
			return this.#selector;
		}
		#clearSelector() {
			main_core.Dom.clean(this.#recipientSelector);
			this.#initRecipientSelector();
		}
		#initTagsSelector() {
			if (!this.#postFormTags) {
				this.#postFormTags = new PostFormTags(this.#formId, this.#node);
			}
		}
		#changeSelectedRecipients(selectedItems) {
			const recipients = [];
			selectedItems.forEach(item => {
				recipients.push([item.entityId, item.id]);
			});
			this.#postData.setRecipients(recipients.length > 0 ? JSON.stringify(recipients) : '');
		}
		#renderTitle() {
			const uiClasses = 'ui-ctl ui-ctl-textbox ui-ctl-no-border ui-ctl-w100 ui-ctl-no-padding ui-ctl-xs';
			const hiddenClass = this.#isShownPostTitle ? '' : '--hidden';
			this.#titleNode = main_core.Tag.render`
			<div class="sn-post-form__discussion-row ${hiddenClass}">
				<div class="${uiClasses}">
					<input
						type="text"
						class="ui-ctl-element sn-post-form__discussion_title"
						placeholder="${main_core.Loc.getMessage('SN_PF_TITLE_PLACEHOLDER')}"
						data-id="sn-post-form-title-input"
						value="${main_core.Text.encode(this.#postData.getTitle())}"
					>
				</div>
			</div>
		`;
			return this.#titleNode;
		}
		#afterEditorInit() {
			this.#sendBtn.setWaiting(false);
		}
		#toggleVisibilityPostTitle() {
			main_core.Dom.toggleClass(this.#titleNode, '--hidden');
			const isShown = !main_core.Dom.hasClass(this.#titleNode, '--hidden');
			if (isShown) {
				this.#titleNode.querySelector('input').focus();
			}
			UserOptions.save('socialnetwork', 'postEdit', 'showTitle', isShown ? 'Y' : 'N');
		}
		#changePostFormPosition() {
			main_core.Dom.toggleClass(this.#popup.getPopupContainer(), '--normal');
		}
		#addMention(baseEvent) {
			const {
				type,
				entity,
				entityType
			} = baseEvent.getData();
			this.#selector.getDialog().addItem({
				avatar: entity.avatar,
				customData: {
					email: main_core.Type.isStringFilled(entity.email) ? entity.email : ''
				},
				entityId: type,
				entityType: entityType,
				id: entity.entityId,
				title: entity.name
			}).select();
		}
		#showControllers(baseEvent) {
			const contentContainer = this.#popup.getContentContainer();
			contentContainer.scrollTo({
				top: contentContainer.scrollHeight - contentContainer.clientHeight,
				behavior: 'smooth'
			});
		}
		#consoleError(action, error) {
			// todo
			NotificationCenter.notify({
				content: main_core.Loc.getMessage('SN_PF_REQUEST_ERROR')
			});

			// eslint-disable-next-line no-console
			console.error(`PostForm: ${action} error`, error);
		}
	}

	exports.PostForm = PostForm;

})(this.BX.Socialnetwork = this.BX.Socialnetwork || {}, BX, BX.Event, BX.Main, BX.UI.EntitySelector, BX.UI);
//# sourceMappingURL=post-form.bundle.js.map
