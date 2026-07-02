;(function ()
{

	if (window.BXMailView)
	{
		return;
	}

	var BXMailView = function (options)
	{
		if (BXMailView.__views[options.messageId])
		{
			return BXMailView.__views[options.messageId];
		}

		this.mailboxId = options.mailboxId;
		this.id = options.messageId;
		this.options = options;
		this.progressPercent = 0;
		this.progressInterval = 0;

		BXMailView.__views[this.id] = this;
		BXMailView.__views[this.id].init();
	};

	BXMailView.__views = {};

	BXMailView.getView = function (id)
	{
		return BXMailView.__views[id];
	};

	BXMailView.prototype.init = function ()
	{
		this.initIframe();

		if (this.options.isAjaxBody && this.options.messageBodyElementId)
		{
			this.ajaxLoadMessageBody();
		}
		else
		{
			this.ajaxLoadAttachments();
		}
		this.addPageSwapper();

		if (this.options.fileRefreshButtonId)
		{
			this.setRefreshFileButtonAction();
		}

		this.initAnalytics();
		this.bindActions();
		this.overridePrint();
	};

	BXMailView.prototype.initIframe = function()
	{
		const options = this.options;
		const messageBodyElement = document.getElementById(options.messageBodyElementId);
		if (!messageBodyElement)
		{
			return;
		}

		const messageId = parseInt(messageBodyElement.dataset.messageId, 10);
		const useAjax = messageBodyElement.dataset.useAjax === '1';

		if (!useAjax)
		{
			const messageHtml = messageBodyElement.dataset.messageHtml;
			if (messageHtml)
			{
				this.renderMessageBody(messageBodyElement, messageHtml, messageId);
			}
		}
	};

	BXMailView.prototype.renderMessageBody = function(container, html, messageId)
	{
		if (!this.messageBody)
		{
			this.messageBody = new BX.Mail.MessageBody({
				container,
				messageId,
				prefix: 'mail-msg',
			});
		}

		this.messageBody.renderTo(html);
	};

	BXMailView.prototype.ajaxLoadMessageBody = function ()
	{
		const messageId = this.options.messageId;
		if (!messageId)
		{
			return;
		}

		this.startProgress();
		this.bindErrorClose();

		BX.ajax.runComponentAction('bitrix:mail.client.message.view', 'getHtmlBody', {
			mode: 'class',
			data: {id: messageId},
		}).then((response) =>
		{
			this.handleSuccessResponse(response.data);
		}, () =>
		{
			this.handleFailedResponse();
		});
	}

	BXMailView.prototype.handleSuccessResponse = function (data)
	{
		this.stopProgress();
		if (BX.type.isNotEmptyObject(data) && BX.type.isString(data.messageHtml))
		{
			this.insertBodyText(data.messageHtml);

			if (BX.type.isString(data.quote))
			{
				this.insertQuoteText(data.quote);
			}
		}
		safeHide(this.options.warningWaitElementId);

		this.showControls();
		this.ajaxLoadAttachments();
	}

	BXMailView.prototype.insertQuoteText = function (quote)
	{
		const options = this.options;
		if (BX.type.isString(quote)
			&& BX.type.isString(options.formId)
			&& BX.type.isString(options.quoteFieldName)
			&& BX.type.isObject(BXMainMailForm)
			&& BX.type.isObject(BXMainMailForm.getForm(options.formId))
			&& BX.type.isArray(BXMainMailForm.getForm(options.formId).fields))
		{
			const fields = BXMainMailForm.getForm(options.formId).fields;
			for (const i in fields)
			{
				if (fields.hasOwnProperty(i))
				{
					if (BX.type.isObject(fields[i]) && fields[i].name === options.quoteFieldName)
					{
						fields[i].value = quote;
						break;
					}
				}
			}
		}
	}

	BXMailView.prototype.insertBodyText = function (html)
	{
		const options = this.options;
		const messageBodyElement = document.getElementById(options.messageBodyElementId);
		if (!messageBodyElement)
		{
			return;
		}

		const iframeUrl = messageBodyElement.dataset.iframeUrl;
		const messageId = parseInt(messageBodyElement.dataset.messageId, 10);

		if (iframeUrl)
		{
			this.createIframe(messageBodyElement, iframeUrl, messageId);
		}
		else
		{
			this.renderMessageBody(messageBodyElement, html, messageId);
		}

		if (BX.type.isObject(options.bxMailMessage))
		{
			BX.onCustomEvent(options.bxMailMessage, 'MailMessage:reInitMessageBody');
		}
	};


	BXMailView.prototype.ajaxLoadAttachments = function ()
	{
		const options = this.options;
		const self = this;
		if (!options.ajaxAttachmentElementId || !options.messageId)
		{
			return;
		}

		const ajaxAttachmentElement = document.getElementById(options.ajaxAttachmentElementId);
		if (!ajaxAttachmentElement)
		{
			return;
		}

		const ajaxAttachmentLoader = new BX.Loader({
			target: ajaxAttachmentElement,
			mode: 'inline',
			size: 20,
			color: '#828b95',
		});
		ajaxAttachmentLoader.show();

		BX.ajax.runComponentAction('bitrix:mail.client.message.view', 'getAttachments', {
			mode: 'class',
			data: {
				id: options.messageId,
				mail_uf_message_token: options.mailUfMessageToken,
			},
		}).then(function (response)
		{
			if (BX.type.isNotEmptyObject(response.data) && BX.type.isString(response.data.attachmentsHtml))
			{
				ajaxAttachmentLoader.hide();
				ajaxAttachmentElement.innerHTML = response.data.attachmentsHtml;
				if (options.fileRefreshButtonId)
				{
					self.setRefreshFileButtonAction();
				}
			}
		}, function ()
		{
			ajaxAttachmentLoader.hide();
			BX.hide(ajaxAttachmentElement.parentElement);
		});
	}

	BXMailView.prototype.showError = function ()
	{
		safeHide(this.options.warningWaitElementId);
		safeShow(this.options.warningFailElementId);
	}

	BXMailView.prototype.startProgress = function ()
	{
		const options = this.options;
		if (!options.bodyLoaderElementId || !options.bodyLoaderMaxTime)
		{
			return;
		}
		const progressContainer = document.getElementById(options.bodyLoaderElementId);
		if (!progressContainer)
		{
			return;
		}
		const myProgress = new BX.UI.ProgressBar({
			maxValue: 100,
			value: 0,
		});
		myProgress.renderTo(BX(options.bodyLoaderElementId));

		const stepTime = options.bodyLoaderMaxTime / 100 * 1000;
		this.progressInterval = setInterval(() =>
		{
			if (this.progressPercent >= 100)
			{
				this.stopProgress();
				this.progressPercent = 100;
			}
			else
			{
				this.progressPercent += 1;
			}
			myProgress.setValue(this.progressPercent);
			myProgress.update();
		}, stepTime);
	}

	BXMailView.prototype.stopProgress = function ()
	{
		clearInterval(this.progressInterval);
	}

	BXMailView.prototype.handleFailedResponse = function ()
	{
		this.stopProgress();
		this.showError();
		this.showControls();
		this.ajaxLoadAttachments();
	}

	BXMailView.prototype.showControls = function ()
	{
		safeShow(this.options.messageControlElementId);
		safeShow(this.options.fastReplyElementId);
		this.bindActions();
	}

	BXMailView.prototype.bindActions = function ()
	{
		this.bindDiscussInChat();
	}

	BXMailView.prototype.overridePrint = function ()
	{
		const slider = BX.SidePanel.Instance.getTopSlider();
		if (!slider)
		{
			return;
		}

		const printLabel = slider.getPrintLabel();
		if (!printLabel)
		{
			return;
		}

		this.slider = slider;
		const defaultOnclick = printLabel.getOnclick();
		printLabel.setOnclick((label, currentSlider) => {
			if (!this.messageBody)
			{
				if (defaultOnclick)
				{
					defaultOnclick(label, currentSlider);
				}

				return;
			}

			const headerHtml = this.collectPrintHeaderHtml();
			const headerStyles = this.getPrintHeaderStyles();
			this.messageBody.print(headerHtml, headerStyles);
		});
	};

	BXMailView.prototype.collectPrintHeaderHtml = function ()
	{
		const sliderDocument = this.slider ? this.slider.iframe.contentDocument : document;
		const esc = BX.util.htmlspecialchars;

		let html = '';

		const subject = sliderDocument.querySelector('#pagetitle');
		if (subject)
		{
			html += '<div class="print-subject">' + esc(subject.textContent.trim()) + '</div>';
		}

		html += '<div class="print-meta">';

		const senderName = sliderDocument.querySelector('.mail-msg-view-sender-name');
		const senderEmail = sliderDocument.querySelector('.mail-msg-view-sender-email');
		if (senderName)
		{
			html += '<div class="print-from">';
			html += '<span class="print-from-name">' + esc(senderName.textContent.trim()) + '</span>';
			if (senderEmail)
			{
				html += ' &lt;' + esc(senderEmail.textContent.trim()) + '&gt;';
			}
			html += '</div>';
		}

		const rcptWrapper = sliderDocument.querySelector('.mail-msg-view-rcpt-wrapper');
		if (rcptWrapper)
		{
			const rcptLines = rcptWrapper.querySelectorAll(':scope > span');
			rcptLines.forEach(function (line) {
				const label = line.querySelector('.mail-msg-view-rcpt-list');
				const blocks = line.querySelectorAll('.mail-msg-view-rcpt-block');
				if (label && blocks.length > 0)
				{
					html += '<div class="print-rcpt-line">';
					html += '<span class="print-rcpt-label">' + esc(label.textContent.trim()) + '</span> ';
					const names = [];
					blocks.forEach(function (block) {
						const link = block.querySelector('.mail-msg-view-rcpt-link, .mail-msg-view-rcpt');
						if (link)
						{
							names.push(esc(link.textContent.trim()));
						}
					});
					html += names.join(', ');
					html += '</div>';
				}
			});
		}

		const dateEl = sliderDocument.querySelector('.mail-msg-view-date');
		if (dateEl)
		{
			html += '<div class="print-date">' + esc(dateEl.textContent.trim()) + '</div>';
		}

		html += '</div>';

		return html;
	};

	BXMailView.prototype.getPrintHeaderStyles = function ()
	{
		return '.print-header { display: none; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333; padding: 10px 20px 0; }'
			+ '.print-subject { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 12px; }'
			+ '.print-meta { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e3e5; }'
			+ '.print-from { margin-bottom: 4px; }'
			+ '.print-from-name { font-size: 15px; font-weight: bold; color: #333; }'
			+ '.print-rcpt-line { margin-bottom: 2px; color: #80868e; font-size: 13px; }'
			+ '.print-rcpt-label { color: #80868e; }'
			+ '.print-date { margin-top: 4px; color: #80868e; font-size: 13px; }'
			+ '@media print { .print-header { display: block; padding: 0 20px; } }';
	};

	BXMailView.prototype.bindDiscussInChat = function ()
	{
		const controlBlock = document.getElementById(this.options.messageControlElementId);
		if (!controlBlock)
		{
			return;
		}

		const button = controlBlock.querySelector('.js-mail-discuss-in-chat');
		if (!button)
		{
			return;
		}

		const messageId = this.id;
		if (!messageId)
		{
			return;
		}

		BX.bind(button, 'click', (event) => {
			event.preventDefault();
			BX.Mail.Client.Action.DiscussInChat.open(messageId, button);
		});
	}

	BXMailView.prototype.bindErrorClose = function ()
	{
		if (!this.options.warningFailElementId)
		{
			return;
		}

		const errorContainer = document.getElementById(this.options.warningFailElementId);
		if (!errorContainer)
		{
			return;
		}

		const closeElement = errorContainer.querySelector('.ui-alert-close-btn');
		if (!closeElement)
		{
			return;
		}

		BX.bind(closeElement, 'click', function ()
		{
			BX.hide(errorContainer);
		});
	}

	BXMailView.prototype.addPageSwapper = function()
	{
		const slider = BX.SidePanel.Instance.getTopSlider();
		const container = slider.iframe.contentDocument.getElementById('header-page-swapper-container');
		if (!container)
		{
			return;
		}

		if (container.firstChild)
		{
			return;
		}

		const pagesHref = slider.getData().get('hrefList');
		if (!slider || !BX.UI.SidePanel.PageSwapper || !pagesHref)
		{
			container.remove();

			return;
		}

		this.pageSwapper = new BX.UI.SidePanel.PageSwapper({
			slider,
			container,
			pagesHref,
			pageType: 'mail',
		});
		this.pageSwapper.init();
		const openSliders = BX.SidePanel.Instance.getOpenSliders();
		const count = openSliders.length;
		const prevSliderWindow = openSliders[count - 2].getFrameWindow();
		const enableNextPage = slider.getData().get('enableNextPage');
		if (prevSliderWindow && enableNextPage && !this.pageSwapper.hasPagesBeforeEnd(3))
		{
			prevSliderWindow.document.querySelector('.main-grid-more-btn').click();
		}
	};

	BXMailView.prototype.setRefreshFileButtonAction = function()
	{
		const button = document.getElementById(this.options.fileRefreshButtonId);
		if (!button)
		{
			return;
		}

		const icon = document.querySelector('.mail-msg-refresh-files-button-icon');
		if (!icon)
		{
			return;
		}

		const toggleButton = () => {
			const rotateButtonClass = 'mail-msg-refresh-files-button-icon-rotate';
			if (this.refreshFilesInProgress)
			{
				BX.Dom.removeClass(icon, rotateButtonClass);
				this.refreshFilesInProgress = false;

				return;
			}

			BX.Dom.addClass(icon, rotateButtonClass);
			this.refreshFilesInProgress = true;
		};

		BX.bind(button, 'click', () => {
			if (this.refreshFilesInProgress)
			{
				return;
			}

			toggleButton();
			BX.ajax.runAction('mail.syncingattachments.resyncAttachments', {
				data: {
					messageId: this.id,
					mailboxId: this.mailboxId,
				},
			}).then((response) => {
				if (response.status !== 'success')
				{
					toggleButton();

					return;
				}

				location.reload();
			}).catch(() => {
				toggleButton();
			});
		});
	};

	BXMailView.prototype.initAnalytics = function()
	{
		const options = this.options;
		const form = document.getElementById(options.formId);
		let currentCElement = 'fast_reply';

		if (!form)
		{
			return;
		}

		const controlBlock = document.getElementById(options.messageControlElementId);

		if (controlBlock)
		{
			const setCElement = function(type)
			{
				currentCElement = type;
			};

			const replyBtn = controlBlock.querySelector('.js-msg-view-control-reply');
			const replyAllBtn = controlBlock.querySelector('.js-msg-view-control-replyall');

			if (replyBtn)
			{
				BX.bind(replyBtn, 'click', setCElement.bind(null, 'reply'));
			}

			if (replyAllBtn)
			{
				BX.bind(replyAllBtn, 'click', setCElement.bind(null, 'reply_all'));
			}
		}

		const sendButton = form.querySelector('.main-mail-form-submit-button');

		if (sendButton)
		{
			const sendAnalytics = function()
			{
				BX.UI.Analytics.sendData({
					tool: 'mail',
					category: 'mail_operations',
					event: 'mail_send',
					type: 'mail',
					c_section: options.analyticsSource || 'mail',
					c_element: currentCElement,
				});
			};

			BX.bind(sendButton, 'click', sendAnalytics.bind());
		}
	};

	function safeHide(elementId)
	{
		if (elementId)
		{
			const element = document.getElementById(elementId);
			if (element)
			{
				BX.hide(element);
			}
		}
	}

	function safeShow(elementId)
	{
		if (elementId)
		{
			const element = document.getElementById(elementId);
			if (element && element.style && element.style.display === 'none')
			{
				element.style.display = '';
			}
		}
	}

	window.BXMailView = BXMailView;

})();
