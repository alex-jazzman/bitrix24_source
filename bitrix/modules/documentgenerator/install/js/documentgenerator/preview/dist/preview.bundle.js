/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core_events,ui_dialogs_messagebox,main_popup,main_core,main_loader) {
	'use strict';

	/**
	 * @memberOf BX.Crm.DocumentGenerator
	 */
	class Button {
	  constructor(id, params) {
	    this.progress = false;
	    this.links = {};
	    this.linksLoaded = false;
	    this.intranetExtensions = null;
	    this.id = null;
	    this.text = 'Document';
	    this.className = '';
	    this.menuClassName = null;
	    this.provider = null;
	    this.value = null;
	    this.loaderPath = null;
	    this.documentUrl = null;
	    this.templateListUrl = null;
	    this.moduleId = null;
	    this.templatesText = 'Templates';
	    this.documentsText = 'Documents';
	    this.sliderWidth = null;
	    this.loader = null;
	    this.id = id;
	    this.fillParameters(params);
	  }
	  fillParameters(params) {
	    if (params.links && main_core.Type.isObjectLike(params.links) && Object.keys(params.links).length > 0) {
	      this.links = params.links;
	      if (this.links.length > 0) {
	        this.linksLoaded = true;
	      }
	    }
	    if (params.menuClassName && main_core.Type.isString(params.menuClassName)) {
	      this.menuClassName = params.menuClassName;
	    }
	    if (params.className && main_core.Type.isString(params.className)) {
	      this.className = params.className;
	    }
	    if (params.moduleId && main_core.Type.isString(params.moduleId)) {
	      this.moduleId = params.moduleId;
	    }
	    if (params.text && main_core.Type.isString(params.text)) {
	      this.text = params.text;
	    }
	    if (params.templatesText && main_core.Type.isString(params.templatesText)) {
	      this.templatesText = params.templatesText;
	    }
	    if (params.documentsText && main_core.Type.isString(params.documentsText)) {
	      this.documentsText = params.documentsText;
	    }
	    this.value = params.value || null;
	    this.provider = params.provider || null;
	    this.loaderPath = params.loaderPath || null;
	    this.templateListUrl = params.templateListUrl || null;
	    this.documentUrl = params.documentUrl || null;
	    this.sliderWidth = Object.hasOwn(params, 'sliderWidth') ? parseInt(params.sliderWidth, 10) : null;
	  }
	  getElement() {
	    return document.getElementById(this.id);
	  }
	  createElement() {
	    const node = this.getElement();
	    if (node) {
	      return node;
	    }
	    if (!this.id) {
	      return null;
	    }
	    const tagName = 'button';
	    let className = 'ui-btn ui-btn-md ui-btn-light-border ui-btn-dropdown ui-btn-themes';
	    if (this.className) {
	      className += ` ${this.className}`;
	    }
	    const attrs = {
	      id: this.id,
	      className
	    };
	    return main_core.Dom.create(tagName, {
	      attrs,
	      text: this.text
	    });
	  }
	  init() {
	    main_core.Event.bind(this.getElement(), 'click', () => {
	      if (this.linksLoaded) {
	        this.showPopup();
	      } else {
	        if (this.progress) {
	          return;
	        }
	        this.progress = true;
	        this.showLoader();
	        main_core.ajax.runAction('documentgenerator.api.document.getButtonTemplates', {
	          data: {
	            moduleId: this.moduleId,
	            provider: this.provider,
	            value: this.value
	          }
	        }).then(response => {
	          this.fillLinksFromResponse(response);
	          this.hideLoader();
	          this.progress = false;
	          setTimeout(() => this.showPopup(), 10);
	        }).catch(response => {
	          this.hideLoader();
	          this.progress = false;
	          ui_dialogs_messagebox.MessageBox.alert(response.errors.pop().message);
	        });
	      }
	    });
	    main_core_events.EventEmitter.subscribe('onPullEvent-documentgenerator', event => {
	      const [command] = event.getData();
	      if (command === 'updateTemplate') {
	        this.linksLoaded = false;
	        this.links = {};
	        main_popup.MenuManager.destroy(this.getPopupMenuId());
	      }
	    });
	  }
	  fillLinksFromResponse(response) {
	    this.linksLoaded = true;
	    this.links = {};
	    if (this.documentUrl && response.data.templates && main_core.Type.isArray(response.data.templates)) {
	      this.links.templates = [];
	      const length = response.data.templates.length;
	      for (let i = 0; i < length; i++) {
	        const url = BX.util.add_url_param(this.documentUrl, {
	          templateId: parseInt(response.data.templates[i].id, 10),
	          providerClassName: this.provider.replaceAll('\\', '\\\\'),
	          value: this.value,
	          analyticsLabel: 'generateDocument',
	          templateCode: response.data.templates[i].code
	        });
	        const docParams = {};
	        if (this.sliderWidth) {
	          docParams.sliderWidth = this.sliderWidth;
	        }
	        this.links.templates[i] = {
	          text: main_core.Text.encode(response.data.templates[i].name),
	          title: main_core.Text.encode(response.data.templates[i].name),
	          onclick: `BX.DocumentGenerator.Document.onBeforeCreate('${url}',${JSON.stringify(docParams)},'${this.loaderPath}','${this.moduleId}')`
	        };
	      }
	    }
	    if (response.data.documentList && this.documentUrl) {
	      this.links.documentList = BX.util.add_url_param(response.data.documentList, {
	        provider: this.provider.replaceAll('\\', '\\\\'),
	        module: this.moduleId,
	        value: this.value,
	        viewUrl: this.documentUrl,
	        loaderPath: this.loaderPath
	      });
	    }
	    if (response.data.canEditTemplate && this.templateListUrl) {
	      this.links.templateList = this.templateListUrl;
	    }
	    if (response.data.intranetExtensions) {
	      this.intranetExtensions = response.data.intranetExtensions;
	    }
	  }
	  prepareLinksForPopup() {
	    let result = [];
	    let addDelimiter = false;
	    if (!this.linksLoaded) {
	      return result;
	    }
	    if (this.links.templates && main_core.Type.isArray(this.links.templates)) {
	      result = this.links.templates;
	      addDelimiter = true;
	    }
	    if (this.links.documentList) {
	      if (addDelimiter) {
	        result[result.length] = {
	          delimiter: true
	        };
	        addDelimiter = false;
	      }
	      result[result.length] = {
	        text: this.documentsText,
	        onclick: `BX.DocumentGenerator.openUrl('${this.links.documentList}', null, 1060)`
	      };
	    }
	    if (this.links.templateList) {
	      if (addDelimiter) {
	        result[result.length] = {
	          delimiter: true
	        };
	      }
	      result[result.length] = {
	        text: this.templatesText,
	        onclick: `BX.DocumentGenerator.openUrl('${this.links.templateList}', null, 1060)`
	      };
	    }
	    if (this.intranetExtensions) {
	      result.push({
	        delimiter: true
	      }, this.intranetExtensions);
	    }
	    return result;
	  }
	  showPopup() {
	    main_popup.MenuManager.show(this.getPopupMenuId(), this.getElement(), this.prepareLinksForPopup(), {
	      offsetLeft: 0,
	      offsetTop: 0,
	      closeByEsc: true,
	      className: 'document-toolbar-menu',
	      maxWidth: 600
	    });
	  }
	  getPopupMenuId() {
	    return `${this.id}_menu`;
	  }
	  getLoader() {
	    if (!this.loader) {
	      this.loader = new main_loader.Loader({
	        size: 50
	      });
	    }
	    return this.loader;
	  }
	  showLoader() {
	    if (this.getElement() && !this.getLoader().isShown()) {
	      this.getLoader().show(this.getElement());
	    }
	  }
	  hideLoader() {
	    if (this.getLoader().isShown()) {
	      this.getLoader().hide();
	    }
	  }
	}

	function parseUrl(url, key) {
	  const parser = document.createElement('a');
	  const params = {};
	  let split = null;
	  let i = null;
	  parser.href = url;
	  const queries = parser.search.replace(/^\?/, '').split('&');
	  for (i = 0; i < queries.length; i++) {
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
	    hash: parser.hash
	  };
	  if (key && Object.hasOwn(result, key)) {
	    return result[key];
	  }
	  return result;
	}
	function openUrl(viewUrl, loaderPath, width) {
	  if (BX.SidePanel) {
	    if (!main_core.Type.isNumber(width)) {
	      width = 810;
	    }
	    BX.SidePanel.Instance.open(viewUrl, {
	      width,
	      cacheable: false,
	      loader: loaderPath
	    });
	    const menu = main_popup.MenuManager.getCurrentMenu();
	    if (menu && menu.popupWindow) {
	      menu.popupWindow.close();
	    }
	  } else {
	    location.href = viewUrl;
	  }
	}
	let popupConfirm = null;
	function showMessage(content, buttons, title, onclose) {
	  var _popupConfirm;
	  title = title || '';
	  if (main_core.Type.isNil(buttons) || main_core.Type.isObjectLike(buttons) && Object.keys(buttons).length <= 0) {
	    buttons = [new main_popup.PopupWindowButton({
	      text: main_core.Loc.getMessage('DOCGEN_PREVIEW_CLOSE_BUTTON'),
	      className: 'ui-btn ui-btn-md ui-btn-default',
	      events: {
	        click(e) {
	          this.popupWindow.close();
	          BX.PreventDefault(e);
	        }
	      }
	    })];
	  }
	  (_popupConfirm = popupConfirm) == null ? void 0 : _popupConfirm.destroy();
	  if (!main_core.Type.isDomNode(content)) {
	    const node = document.createElement('div');
	    node.innerHTML = content;
	    content = node;
	  }
	  if (!main_core.Type.isArray(content)) {
	    content = [content];
	  }
	  popupConfirm = new main_popup.Popup('bx-popup-documentgenerator-popup', null, {
	    zIndex: 200,
	    autoHide: true,
	    closeByEsc: true,
	    buttons,
	    closeIcon: true,
	    overlay: true,
	    events: {
	      onPopupClose() {
	        if (main_core.Type.isFunction(onclose)) {
	          onclose();
	        }
	        this.destroy();
	      },
	      onPopupDestroy: () => {
	        popupConfirm = null;
	      }
	    },
	    content: main_core.Dom.create('span', {
	      attrs: {
	        className: 'bx-popup-documentgenerator-popup-content-text'
	      },
	      children: content
	    }),
	    titleBar: title,
	    contentColor: 'white',
	    className: 'bx-popup-documentgenerator-popup',
	    maxWidth: 470
	  });
	  popupConfirm.show();
	}

	/**
	 * @memberOf BX.Crm.DocumentGenerator
	 */
	class Document {
	  static askAboutUsingPreviousDocumentNumber(provider, templateId, value, onsuccess, ondecline) {
	    if (main_core.Type.isString(provider) && parseInt(templateId, 10) > 0 && main_core.Type.isFunction(onsuccess)) {
	      if (Document.isProcessing === true) {
	        return;
	      }
	      try {
	        Document.isProcessing = true;
	        main_core.ajax.runAction('documentgenerator.api.document.list', {
	          data: {
	            select: ['id', 'number'],
	            filter: {
	              '=provider': provider.toLowerCase(),
	              '=templateId': templateId,
	              '=value': value
	            },
	            order: {
	              id: 'desc'
	            }
	          },
	          navigation: {
	            size: 1
	          }
	        }).then(response => {
	          Document.isProcessing = false;
	          if (response.data.documents.length > 0) {
	            const previousNumber = response.data.documents[0].number;
	            showMessage(main_core.Loc.getMessage('DOCGEN_PREVIEW_DO_USE_OLD_NUMBER'), [new main_popup.PopupWindowButton({
	              text: main_core.Loc.getMessage('DOCGEN_PREVIEW_NEW_BUTTON'),
	              className: 'ui-btn ui-btn-md ui-btn-primary',
	              events: {
	                click() {
	                  onsuccess();
	                  this.popupWindow.destroy();
	                }
	              }
	            }), new main_popup.PopupWindowButton({
	              text: main_core.Loc.getMessage('DOCGEN_PREVIEW_OLD_BUTTON'),
	              className: 'ui-btn ui-btn-md ui-btn-primary',
	              events: {
	                click() {
	                  onsuccess(previousNumber);
	                  this.popupWindow.destroy();
	                }
	              }
	            })], main_core.Loc.getMessage('DOCGEN_PREVIEW_NUMBER_TITLE'), ondecline);
	          } else {
	            onsuccess();
	          }
	        }).catch(() => {
	          Document.isProcessing = false;
	          if (main_core.Type.isFunction(ondecline)) {
	            ondecline();
	          }
	        });
	      } catch {
	        Document.isProcessing = false;
	        if (main_core.Type.isFunction(ondecline)) {
	          ondecline();
	        }
	      }
	    }
	  }
	  static onBeforeCreate(viewUrl, params, loaderPath, moduleId) {
	    const urlParams = parseUrl(viewUrl, 'params');
	    const provider = decodeURIComponent(urlParams.providerClassName).toLowerCase();
	    const templateId = urlParams.templateId;
	    const value = urlParams.value;
	    const sliderWidth = Object.hasOwn(params, 'sliderWidth') ? params.sliderWidth : null;
	    if (Object.hasOwn(urlParams, 'documentId')) {
	      openUrl(viewUrl, loaderPath, sliderWidth);
	    } else {
	      main_core.ajax.runAction('documentgenerator.api.dataprovider.isPrintable', {
	        data: {
	          provider,
	          value,
	          options: {},
	          module: moduleId
	        }
	      }).then(() => {
	        if (Object.hasOwn(urlParams, 'documentId')) {
	          openUrl(viewUrl, loaderPath, sliderWidth);
	        } else {
	          Document.askAboutUsingPreviousDocumentNumber(provider, templateId, value, previousNumber => {
	            if (previousNumber) {
	              viewUrl = BX.util.add_url_param(viewUrl, {
	                number: previousNumber
	              });
	            }
	            openUrl(viewUrl, loaderPath, sliderWidth);
	          });
	        }
	      }).catch(reason => {
	        showMessage(reason.errors.map(error => error.message).join('<br>'), [new main_popup.PopupWindowButton({
	          text: main_core.Loc.getMessage('DOCGEN_PREVIEW_CONTINUE_BUTTON'),
	          className: 'ui-btn ui-btn-md ui-btn-success',
	          events: {
	            click(e) {
	              this.popupWindow.close();
	              BX.PreventDefault(e);
	            }
	          }
	        })], main_core.Loc.getMessage('DOCGEN_PREVIEW_PRINT_TITLE'));
	      });
	    }
	  }
	}
	Document.isProcessing = false;

	let isPushEventInited = false;

	/**
	 * @memberOf BX.Crm.DocumentGenerator
	 */
	class DocumentPreview {
	  constructor(options) {
	    this.loader = null;
	    this.documentId = null;
	    this.pullTag = null;
	    this.startImageUrl = null;
	    this.imageUrl = null;
	    this.imageContainer = null;
	    this.imageNode = null;
	    this.printUrl = null;
	    this.pdfUrl = null;
	    this.hash = '';
	    this.isPublicMode = false;
	    this.isTransformationError = false;
	    this.transformationErrorNode = null;
	    this.transformationErrorMessage = '';
	    this.transformationErrorCode = 0;
	    this.previewNode = null;
	    this.onReady = () => {};
	    this.hash = options.hash || '';
	    this.isPublicMode = options.isPublicMode || false;
	    this.isTransformationError = false;
	    this.transformationErrorNode = null;
	    this.transformationErrorMessage = '';
	    this.transformationErrorCode = 0;
	    this.previewNode = null;
	    this.onReady = () => {};
	    this.applyOptions(options);
	    this.initPushEvent();
	    this.start();
	  }
	  isPullConnected() {
	    if (top.BX.PULL) {
	      if (main_core.Type.isFunction(top.BX.PULL.isConnected)) {
	        return top.BX.PULL.isConnected();
	      }
	      const debugInfo = top.BX.PULL.getDebugInfoArray();
	      return debugInfo.connected;
	    }
	    return false;
	  }
	  initPushEvent() {
	    if (!isPushEventInited) {
	      if (this.isPullConnected()) {
	        isPushEventInited = true;
	        top.BX.addCustomEvent('onPullEvent-documentgenerator', this.showImage.bind(this));
	      } else if (this.documentId > 0 && !this.imageUrl) {
	        let action = 'documentgenerator.api.document.get';
	        const data = {
	          id: this.documentId
	        };
	        if (this.isPublicMode && main_core.Type.isString(this.hash) && this.hash.length > 10) {
	          action = 'documentgenerator.api.publicdocument.get';
	          data.hash = this.hash;
	        }
	        isPushEventInited = true;
	        setTimeout(() => {
	          void main_core.ajax.runAction(action, {
	            data
	          }).then(response => {
	            isPushEventInited = false;
	            if (response.data.document.imageUrl) {
	              this.showImage('showImage', response.data.document);
	            } else {
	              this.initPushEvent();
	            }
	          }, () => {
	            isPushEventInited = false;
	          });
	        }, 5000);
	      }
	    }
	  }
	  applyOptions(options) {
	    if (options.id) {
	      this.documentId = options.id;
	    }
	    if (options.pullTag) {
	      this.pullTag = options.pullTag;
	    }
	    if (options.imageUrl) {
	      this.imageUrl = options.imageUrl;
	    }
	    if (options.startImageUrl) {
	      this.startImageUrl = options.startImageUrl;
	    }
	    if (options.printUrl) {
	      this.printUrl = options.printUrl;
	    }
	    if (options.pdfUrl) {
	      this.pdfUrl = options.pdfUrl;
	    }
	    if (options.emailDiskFile) {
	      this.emailDiskFile = options.emailDiskFile;
	    }
	    if (main_core.Type.isDomNode(options.imageContainer)) {
	      this.imageContainer = options.imageContainer;
	    }
	    if (main_core.Type.isDomNode(options.previewNode)) {
	      this.previewNode = options.previewNode;
	    }
	    if (main_core.Type.isDomNode(options.transformationErrorNode)) {
	      this.transformationErrorNode = options.transformationErrorNode;
	    }
	    if (main_core.Type.isBoolean(options.isTransformationError)) {
	      this.isTransformationError = options.isTransformationError;
	    }
	    if (main_core.Type.isString(options.transformationErrorMessage)) {
	      this.transformationErrorMessage = options.transformationErrorMessage;
	    } else {
	      this.transformationErrorMessage = '';
	    }
	    if (main_core.Type.isNumber(options.transformationErrorCode)) {
	      this.transformationErrorCode = options.transformationErrorCode;
	    } else {
	      this.transformationErrorCode = 0;
	    }
	    if (main_core.Type.isFunction(options.onReady)) {
	      this.onReady = options.onReady;
	    }
	    this.initPushEvent();
	  }
	  getLoader() {
	    if (!this.loader) {
	      this.loader = new main_loader.Loader({
	        size: 100,
	        offset: {
	          left: '-8%',
	          top: '6%'
	        }
	      });
	    }
	    return this.loader;
	  }
	  showLoader() {
	    if (this.imageContainer && !this.getLoader().isShown()) {
	      this.getLoader().show(this.imageContainer);
	    }
	    if (main_core.Type.isDomNode(this.imageNode)) {
	      main_core.Dom.style(this.imageNode, {
	        opacity: 0.5
	      });
	    }
	  }
	  hideLoader() {
	    if (this.getLoader().isShown()) {
	      this.getLoader().hide();
	    }
	    if (main_core.Type.isDomNode(this.imageNode)) {
	      main_core.Dom.style(this.imageNode, {
	        opacity: 1
	      });
	    }
	  }
	  isValidPullTag(command, params) {
	    return command === 'showImage' && params.pullTag === this.pullTag;
	  }
	  showImage(command, params) {
	    if (this.isValidPullTag(command, params)) {
	      this.applyOptions(params);
	      if (main_core.Type.isDomNode(this.previewNode)) {
	        // eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
	        BX.hide(this.previewNode);
	      }
	      if (main_core.Type.isDomNode(this.transformationErrorNode)) {
	        if (this.isTransformationError) {
	          // eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
	          BX.show(this.transformationErrorNode);
	        } else {
	          // eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
	          BX.hide(this.transformationErrorNode);
	        }
	      }
	      this.showImageNode();
	      this.onReady(params);
	      if (this.loader && this.loader.isShown()) {
	        this.loader.hide();
	      }
	    }
	  }
	  start() {
	    if (this.imageUrl) {
	      this.showImageNode();
	    } else if (this.startImageUrl) {
	      this.imageUrl = this.startImageUrl;
	      this.startImageUrl = null;
	      this.showImageNode();
	      if (main_core.Type.isDomNode(this.imageNode)) {
	        main_core.Dom.style(this.imageNode, {
	          opacity: 0.2
	        });
	      }
	      if (this.pullTag) {
	        this.showLoader();
	      }
	    } else if (!this.isTransformationError && !this.previewNode) {
	      this.showLoader();
	    }
	  }
	  showImageNode() {
	    if (!main_core.Type.isDomNode(this.imageContainer)) {
	      return;
	    }
	    if (!main_core.Type.isDomNode(this.imageNode)) {
	      this.imageNode = main_core.Dom.create('img', {
	        style: {
	          opacity: 0.1,
	          display: 'none'
	        }
	      });
	      main_core.Dom.append(this.imageNode, this.imageContainer);
	    }
	    if (this.imageUrl) {
	      this.imageNode.src = this.imageUrl;
	      // eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
	      BX.show(this.imageNode);
	      main_core.Dom.style(this.imageNode, {
	        opacity: 1
	      });
	    }
	  }
	}

	exports.openUrl = openUrl;
	exports.parseUrl = parseUrl;
	exports.showMessage = showMessage;
	exports.DocumentPreview = DocumentPreview;
	exports.Button = Button;
	exports.Document = Document;

}((this.BX.DocumentGenerator = this.BX.DocumentGenerator || {}),BX.Event,BX.UI.Dialogs,BX.Main,BX,BX));
//# sourceMappingURL=preview.bundle.js.map
