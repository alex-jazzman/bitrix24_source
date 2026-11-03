;(function(){
	BX.namespace('BX.rest');

	if(!!BX.rest.AppLayout)
	{
		return;
	}

	var AVAILABILITY_GRACE_TIMEOUT = 3000;
	var AVAILABILITY_PROBE_TIMEOUT = 8000;

	var DIAGNOSTIC_ACTION = 'rest.v2.Application.AppDiagnostic.diagnose';
	var DIAGNOSTIC_TEXT_MESSAGE = {
		certificate_mincifry: 'REST_APP_FRAME_UNAVAILABLE_TEXT_MINCIFRY',
		certificate_untrusted: 'REST_APP_FRAME_UNAVAILABLE_TEXT_UNTRUSTED',
		host_unreachable: 'REST_APP_FRAME_UNAVAILABLE_TEXT_UNREACHABLE'
	};
	var DIAGNOSTIC_CERTIFICATE_REASON = ['certificate_mincifry', 'certificate_untrusted'];

	BX.rest.AppLayout = function(params)
	{
		this.params = {
			firstRun: !!params.firstRun,
			appHost: params.appHost,
			appHandlerSignature: params.appHandlerSignature,
			appPort: params.appPort,
			appProto: params.appProto,
			skipAvailabilityCheck: !!params.skipAvailabilityCheck,
			authId: params.authId,
			authExpires: params.authExpires,
			refreshId: params.refreshId,
			placement: params.placement,
			formName: params.formName,
			frameName: params.frameName,
			loaderName: params.loaderName,
			layoutName: params.layoutName,
			ajaxUrl: params.ajaxUrl,
			controlUrl: params.controlUrl,
			isAdmin: !!params.isAdmin,
			staticHtml: !!params.staticHtml,
			id: params.id,
			appId: params.appId,
			appV: params.appV,
			appI: params.appI,
			appSid: params.appSid,
			memberId: params.memberId,
			restPath: params.restPath,
			proto: params.proto,
			userOptions: params.userOptions,
			appOptions: params.appOptions,
			placementId: !!params.placementId ? params.placementId : 0,
			placementOptions: params.placementOptions
		};

		this.userSelectorControl = [null, null];
		this.userSelectorControlCallback = null;
		this.bAccessLoaded = false;
		this._appOptionsStack = [];

		this._inited = false;
		this._destroyed = false;

		this._appConnected = false;
		this._appReachable = false;
		this._probeRunning = false;
		this._retryRequested = false;
		this._stubDismissed = false;
		this._availabilityTimer = null;
		this._unavailableStub = null;
		this._retryNode = null;
		this._textNode = null;
		this._firefoxNode = null;
		this._helpNode = null;

		this._diagnosticReason = '';
		this._diagnosticRunning = false;

		this.deniedInterface = [];

		this.selectUserCallback_1_value = [];

		this.messageInterface = new (BX.rest.AppLayout.initializePlacement(this.params.placement))();

		BX.bind(window, 'message', BX.proxy(this.receiveMessage, this));
	};

	BX.rest.AppLayout.openApplication = function(applicationId, placementOptions, additionalComponentParam, closeCallback)
	{
		var url = BX.message('REST_APPLICATION_URL').replace('#ID#', parseInt(applicationId));
		url = BX.util.add_url_param(url, {'_r': Math.random()});

		var sidePanelSettings = {};

		if (placementOptions && typeof placementOptions === "object")
		{
			for (var param in placementOptions) // separation side panel settings and placement options
			{
				if (!placementOptions.hasOwnProperty(param))
				{
					continue;
				}

				if (param.search("bx24_") === 0)
				{
					var key = param.replace("bx24_", "");
					sidePanelSettings[key] = placementOptions[param];

					delete placementOptions[param];
				}
			}

			if (placementOptions.hasOwnProperty("options"))
			{
				if (typeof placementOptions.options === "object")
				{
					appOptions = placementOptions.options;
				}

				if (placementOptions.hasOwnProperty("params"))
				{
					placementOptions = placementOptions.params;
				}
			}
		}

		var params = {
			ID: applicationId,
			PLACEMENT_OPTIONS: placementOptions,
			POPUP: 1
		};

		if(!!additionalComponentParam)
		{
			if(typeof additionalComponentParam.PLACEMENT !== 'undefined')
			{
				params.PLACEMENT = additionalComponentParam.PLACEMENT;
			}
			if(typeof additionalComponentParam.PLACEMENT_ID !== 'undefined')
			{
				params.PLACEMENT_ID = additionalComponentParam.PLACEMENT_ID;
			}
		}
		var link = {
			url : url,
			anchor : null,
			target : null
		};
		var rule = BX.SidePanel.Instance.getUrlRule(url, link);
		var options = rule && rule.options ? BX.clone(rule.options) : {};
		options["cacheable"] = false;
		options["contentCallback"] = function(sliderPage)
		{
			var promise = new top.BX.Promise();

			top.BX.ajax.post(
				sliderPage.url,
				{
					sessid: BX.bitrix_sessid(),
					site: BX.message('SITE_ID'),
					PARAMS: {
						template: '',
						params: params
					}
				},
				function(result)
				{
					promise.fulfill(result);
				}
			);

			return promise;
		};
		options["events"] = (options["events"] ? options["events"] : {});
		options["events"]["onClose"] = function()
		{
			if(!!closeCallback)
			{
				closeCallback();
			}
		};

		var availableSidePanelSettings = ["width", "leftBoundary", "title", "label"];
		for (var setting in sidePanelSettings)
		{
			if (!sidePanelSettings.hasOwnProperty(setting))
			{
				continue;
			}

			for (var i in availableSidePanelSettings)
			{
				if (setting === availableSidePanelSettings[i])
				{
					switch (setting)
					{
						case "leftBoundary":
							if (BX.type.isNumber(sidePanelSettings[setting]))
							{
								options["customLeftBoundary"] = Number(sidePanelSettings[setting]);
							}

							break;
						case "width":
							if (BX.type.isNumber(sidePanelSettings[setting]))
							{
								options["width"] = Number(sidePanelSettings[setting]);
							}

							break;
						case "title":
							if (BX.type.isString(sidePanelSettings[setting]))
							{
								options["title"] = String(sidePanelSettings[setting]);
							}

							break;
						case "label":
							var label = sidePanelSettings[setting];

							if (BX.type.isObject(label))
							{
								var availableBgColors = {
									aqua: "#06bab1",
									green: "#a5de00",
									orange: "#ffa801",
									brown: "#b57051",
									pink: "#f968b6",
									blue: "#2eceff",
									grey: "#a1a6ac",
									violet: "#6b52cc"
								};
								if (label.hasOwnProperty("bgColor"))
								{
									var replaceColorCode = "";

									for (var color in availableBgColors) // separation side panel settings and placement options
									{
										if (label.bgColor === color)
										{
											replaceColorCode = availableBgColors[color];
											break;
										}
									}

									sidePanelSettings[setting]["bgColor"] = replaceColorCode;
								}
								options["label"] = sidePanelSettings[setting];
							}

							break;
					}
				}
			}
		}

		BX.SidePanel.Instance.open(url, options);

		var slider = top.BX.SidePanel.Instance.getTopSlider();
		top.BX.addCustomEvent(top, 'Rest:AppLayout:ApplicationInstall', function(installed, eventResult)
		{
			eventResult.redirect = false;

			slider.close(false, function(){
				BX.rest.AppLayout.openApplication(applicationId, placementOptions, additionalComponentParam, closeCallback);
			});
		});
	};

	BX.rest.AppLayout.openPath = function(applicationCode, params, callback)
	{
		if (!BX.browser.IsMobile())
		{
			var path = BX.type.isString(params['path']) ? params['path'] : '';
			var pathUrl;

			try
			{
				path = decodeURIComponent(path);
				pathUrl = new URL(path, window.location.origin);

			}
			catch (e)
			{
				path = '';
			}

			if (
				path !== ''
				&& path.startsWith('/')
				&& pathUrl
				&& pathUrl.origin === window.location.origin
				&& (pathUrl.protocol === 'http:' || pathUrl.protocol === 'https:')
			)
			{
				var from = 'from=rest_placement&from_app=' + applicationCode;
				path += (path.indexOf('?') === -1 ? '?' : '&') + from;
				var link = {
					url : path,
					anchor : null,
					target : null,
				};
				var rule = BX.SidePanel.Instance.getUrlRule(path, link);
				var options = rule && rule.options ? BX.clone(rule.options) : {};
				options["cacheable"] = false;

				if (!('events' in options))
				{
					options['events'] = {};
				}
				options["events"]["onClose"] = function()
				{
					if(!!callback && BX.type.isFunction(callback))
					{
						callback(
							{
								'result': 'close',
							}
						);
					}
				};
				BX.SidePanel.Instance.open(path, options);
			}
			else
			{
				if (!!callback && BX.type.isFunction(callback))
				{
					callback(
						{
							'result': 'error',
							'errorCode': 'PATH_NOT_AVAILABLE'
						}
					);
				}
			}
		}
		else
		{
			callback(
				{
					'result': 'error',
					'errorCode': 'METHOD_NOT_SUPPORTED_ON_DEVICE'
				}
			);
		}
	};

	BX.rest.AppLayout.prototype = {
		init: function()
		{
			if(!this._inited && !!document.forms[this.params.formName])
			{
				var loader = BX(this.params.loaderName);
				var startAvailabilityCheck = BX.delegate(this.startAvailabilityCheck, this);
				BX.bind(BX(this.params.frameName), 'load', function()
				{
					BX.addClass(loader, 'app-loading-msg-loaded');
					BX.removeClass(this, 'app-loading');
					BX.remove(loader);
					startAvailabilityCheck();
				});

				this.loadFrame();

				this._inited = true;
			}
		},

		loadFrame: function()
		{
			var form = document.forms[this.params.formName];
			var frame = BX(this.params.frameName);
			if(!form || !frame)
			{
				return;
			}

			if(this.params.staticHtml)
			{
				frame.src = form.action;
			}
			else
			{
				form.submit();
			}
		},

		destroy: function()
		{
			BX.unbind(window, 'message', BX.proxy(this.receiveMessage, this));

			if(this._availabilityTimer)
			{
				clearTimeout(this._availabilityTimer);
				this._availabilityTimer = null;
			}

			this.hideUnavailableStub();

			if (BX(this.params.frameName))
			{
				BX(this.params.frameName).parentNode.removeChild(BX(this.params.frameName));
			}
			this._destroyed = true;
		},

		getAppUrl: function()
		{
			var form = document.forms[this.params.formName];
			var url = form ? form.action : '';

			return /^https?:\/\//i.test(url) ? url : '';
		},

		startAvailabilityCheck: function()
		{
			if(this.params.skipAvailabilityCheck)
			{
				return;
			}

			if(this._availabilityTimer)
			{
				clearTimeout(this._availabilityTimer);
				this._availabilityTimer = null;
			}

			this.hideUnavailableStub();
			this._appReachable = false;
			this._stubDismissed = false;

			if(this._appConnected || this._destroyed || !window.fetch)
			{
				return;
			}

			this._availabilityTimer = setTimeout(BX.delegate(this.probeAppHost, this), AVAILABILITY_GRACE_TIMEOUT);
		},

		getAppOrigin: function()
		{
			var origin = this.params.appProto + '://' + this.params.appHost;

			return /^https?:\/\/[^/]+$/i.test(origin) ? origin : '';
		},

		probeAppHost: function()
		{
			this._availabilityTimer = null;

			var url = this.getAppOrigin();
			if(this._appConnected || this._appReachable || this._destroyed || this._probeRunning || !url)
			{
				return;
			}

			this._probeRunning = true;
			this.setRetryBusy(true);

			var options = {mode: 'no-cors', credentials: 'omit', cache: 'no-store'};

			var controller = window.AbortController ? new AbortController() : null;
			if(controller)
			{
				options.signal = controller.signal;
			}

			var abortTimer = setTimeout(BX.delegate(function()
			{
				if(controller)
				{
					controller.abort();
				}

				this._probeRunning = false;
				this.setRetryBusy(false);
				this.handleProbeFailure();
			}, this), AVAILABILITY_PROBE_TIMEOUT);

			window.fetch(url, options).then(
				BX.delegate(function()
				{
					clearTimeout(abortTimer);
					this._probeRunning = false;
					this._appReachable = true;
					this.setRetryBusy(false);
					this.reloadFrameOnRetry();
					this.hideUnavailableStub();
				}, this),
				BX.delegate(function()
				{
					clearTimeout(abortTimer);
					this._probeRunning = false;
					this.setRetryBusy(false);
					this.handleProbeFailure();
				}, this)
			).catch(function(error)
			{
				BX.debug(error);
			});
		},

		handleProbeFailure: function()
		{
			this._retryRequested = false;

			if(this._appConnected || this._appReachable || this._destroyed)
			{
				return;
			}

			this.showUnavailableStub();
		},

		retryAvailabilityCheck: function()
		{
			this._retryRequested = true;
			this.probeAppHost();
		},

		reloadFrameOnRetry: function()
		{
			if(!this._retryRequested)
			{
				return;
			}

			this._retryRequested = false;
			this.loadFrame();
		},

		setRetryBusy: function(busy)
		{
			if(!this._retryNode)
			{
				return;
			}

			var retryText = getMessage('REST_APP_FRAME_UNAVAILABLE_RETRY');

			this._retryNode.disabled = busy;
			this._retryNode.textContent = busy
				? (getMessage('REST_APP_FRAME_UNAVAILABLE_RETRYING') || retryText)
				: retryText;
		},

		dismissUnavailableStub: function()
		{
			this._stubDismissed = true;
			this.hideUnavailableStub();
		},

		showUnavailableStub: function()
		{
			var layout = BX(this.params.layoutName);
			if(this._unavailableStub || this._stubDismissed || !layout)
			{
				return;
			}

			var stub = this.createUnavailableStub();
			if(!stub)
			{
				return;
			}

			this._unavailableStub = stub;
			layout.appendChild(stub);
			this.setFrameInert(true);

			this.requestDiagnostic();
		},

		hideUnavailableStub: function()
		{
			if(!this._unavailableStub)
			{
				return;
			}

			BX.remove(this._unavailableStub);
			this._unavailableStub = null;
			this._retryNode = null;
			this._textNode = null;
			this._firefoxNode = null;
			this._helpNode = null;
			this.setFrameInert(false);
		},

		requestDiagnostic: function()
		{
			if(this._diagnosticReason || this._diagnosticRunning || !BX.ajax || !BX.ajax.runAction)
			{
				return;
			}

			if(!BX.type.isNotEmptyString(this.params.appHandlerSignature))
			{
				return;
			}

			this._diagnosticRunning = true;

			BX.ajax.runAction(DIAGNOSTIC_ACTION, {
				data: {
					signedHandlerUrl: this.params.appHandlerSignature
				}
			}).then(
				BX.delegate(function(response)
				{
					this._diagnosticRunning = false;

					var data = !!response && !!response.data ? response.data : {};
					var reason = data.reason;
					if(!BX.type.isNotEmptyString(reason))
					{
						return;
					}

					if(!DIAGNOSTIC_TEXT_MESSAGE.hasOwnProperty(reason))
					{
						return;
					}

					this._diagnosticReason = reason;
					this.applyDiagnostic();
				}, this),
				BX.delegate(function()
				{
					this._diagnosticRunning = false;
				}, this)
			);
		},

		applyDiagnostic: function()
		{
			if(!this._unavailableStub || !this._textNode)
			{
				return;
			}

			this._textNode.textContent = this.getStubText();
			this.updateDiagnosticHelp();

			if(this._firefoxNode || !this.isCertificateReason())
			{
				return;
			}

			var note = this.createFirefoxNote();
			if(note)
			{
				this._firefoxNode = note;
				BX.insertAfter(note, this._textNode);
			}
		},

		isCertificateReason: function()
		{
			return BX.util.in_array(this._diagnosticReason, DIAGNOSTIC_CERTIFICATE_REASON);
		},

		isMincifryReason: function()
		{
			return this._diagnosticReason === 'certificate_mincifry';
		},

		updateDiagnosticHelp: function()
		{
			if(!this.isMincifryReason())
			{
				if(this._helpNode)
				{
					BX.remove(this._helpNode);
					this._helpNode = null;
				}

				return;
			}

			if(!this._helpNode)
			{
				this._helpNode = this.createHelpLink();
				if(this._helpNode)
				{
					this._unavailableStub.appendChild(this._helpNode);
				}
			}
		},

		createHelpLink: function()
		{
			var helpUrl = getMessage('REST_APP_FRAME_UNAVAILABLE_HELP_URL');
			if(!/^https?:\/\//i.test(helpUrl))
			{
				return null;
			}

			return BX.create('A', {
				props: {
					className: 'app-frame-unavailable-help',
					href: helpUrl,
					target: '_blank',
					rel: 'noopener noreferrer'
				},
				text: getMessage('REST_APP_FRAME_UNAVAILABLE_HELP')
			});
		},

		getStubText: function()
		{
			var reason = this._diagnosticReason;
			var text = DIAGNOSTIC_TEXT_MESSAGE.hasOwnProperty(reason)
				? getMessage(DIAGNOSTIC_TEXT_MESSAGE[reason])
				: '';
			if(!text)
			{
				text = getMessage('REST_APP_FRAME_UNAVAILABLE_TEXT');
			}

			return text.split('#HOST#').join(this.params.appHost);
		},

		createFirefoxNote: function()
		{
			if(!BX.browser || !BX.browser.IsFirefox())
			{
				return null;
			}

			var text = getMessage('REST_APP_FRAME_UNAVAILABLE_FIREFOX');
			if(!text)
			{
				return null;
			}

			return BX.create('DIV', {
				props: {className: 'app-frame-unavailable-hint'},
				text: text
			});
		},

		setFrameInert: function(inert)
		{
			var frame = BX(this.params.frameName);
			if(!frame)
			{
				return;
			}

			frame.inert = inert;

			if(inert)
			{
				frame.setAttribute('aria-hidden', 'true');
			}
			else
			{
				frame.removeAttribute('aria-hidden');
			}
		},

		createUnavailableStub: function()
		{
			this._retryNode = null;
			this._textNode = null;
			this._firefoxNode = null;
			this._helpNode = null;

			var title = getMessage('REST_APP_FRAME_UNAVAILABLE_TITLE');
			if(!title)
			{
				return null;
			}

			this._textNode = BX.create('DIV', {
				props: {className: 'app-frame-unavailable-text'},
				text: this.getStubText()
			});

			var children = [
				BX.create('H3', {
					props: {className: 'app-frame-unavailable-title'},
					text: title
				}),
				this._textNode
			];

			if(this.isCertificateReason())
			{
				this._firefoxNode = this.createFirefoxNote();
				if(this._firefoxNode)
				{
					children.push(this._firefoxNode);
				}
			}

			var url = this.getAppUrl();
			if(url)
			{
				children.push(
					BX.create('A', {
						props: {
							className: 'app-frame-unavailable-button',
							href: url,
							target: '_blank',
							rel: 'noopener noreferrer'
						},
						text: getMessage('REST_APP_FRAME_UNAVAILABLE_OPEN')
					}),
					BX.create('DIV', {
						props: {className: 'app-frame-unavailable-hint'},
						text: getMessage('REST_APP_FRAME_UNAVAILABLE_OPEN_HINT')
					})
				);
			}

			var retryText = getMessage('REST_APP_FRAME_UNAVAILABLE_RETRY');
			if(retryText)
			{
				this._retryNode = BX.create('BUTTON', {
					props: {className: 'app-frame-unavailable-action', type: 'button'},
					text: retryText,
					events: {click: BX.delegate(this.retryAvailabilityCheck, this)}
				});
				children.push(this._retryNode);
			}

			var dismissText = getMessage('REST_APP_FRAME_UNAVAILABLE_DISMISS');
			if(dismissText)
			{
				children.push(BX.create('BUTTON', {
					props: {className: 'app-frame-unavailable-action', type: 'button'},
					text: dismissText,
					events: {click: BX.delegate(this.dismissUnavailableStub, this)}
				}));
			}

			if(this.isMincifryReason())
			{
				this._helpNode = this.createHelpLink();
				if(this._helpNode)
				{
					children.push(this._helpNode);
				}
			}

			return BX.create('DIV', {
				props: {className: 'app-frame-unavailable'},
				attrs: {role: 'status', 'aria-atomic': 'false'},
				children: children
			});
		},

		query: function(param, callback)
		{
			var query = {
				sessid: BX.bitrix_sessid(),
				site: BX.message('SITE_ID'),
				PARAMS: {
					template: '',
					params: {
						ID: this.params.id
					}
				}
			};

			if(!!param)
			{
				query = BX.mergeEx(query, param);
			}

			return BX.ajax({
				dataType: 'json',
				method: 'POST',
				url:this.params.ajaxUrl,
				data: query,
				onsuccess: callback
			});
		},

		receiveMessage: function(e)
		{
			e = e || window.event;

			if (
				(
					e.origin !== this.params.appProto + '://' + this.params.appHost
					&& e.origin + ':' + this.params.appPort !== this.params.appProto + '://' + this.params.appHost
				)
				|| (!BX.type.isString(e.data) && !BX.type.isObject(e.data))
			)
			{
				return;
			}

			var cmd = {},
				args = [],
				appSid = '',
				method = '',
				cb = false
			;

			if (BX.type.isObject(e.data))
			{
				method = e.data.method;
				appSid = e.data.appSid;
				cb = e.data.callback;
				args = !!e.data.params ? e.data.params : [];
			}
			else
			{
				cmd = split(e.data, ':');
				method = cmd[0];
				cb = cmd[2];
				appSid = cmd[3];
				if (cmd[1])
				{
					args = JSON.parse(cmd[1]);
				}
			}

			if (appSid != this.params.appSid)
			{
				return;
			}

			this._appConnected = true;
			this.hideUnavailableStub();

			if (!!this.messageInterface[method] && !BX.util.in_array(method, this.deniedInterface))
			{
				var _cb = !cb ? BX.DoNothing : BX.delegate(function(res)
				{
					var f = BX(this.params.frameName);
					if (!!f && !!f.contentWindow)
					{
						f.contentWindow.postMessage(
							cb + ':' + (typeof res == 'undefined' ? '' : JSON.stringify(res)),
							this.params.appProto + '://' + this.params.appHost
						);
					}
				}, this);

				this.messageInterface[method].apply(this, [args, _cb, this]);
			}
		},

		denyInterface: function(deniedList)
		{
			this.deniedInterface = BX.util.array_merge(this.deniedInterface, deniedList);
		},

		allowInterface: function(allowedList)
		{
			var newDeniedInterface = [];
			for(var i = 0; i < this.deniedInterface.length; i++)
			{
				if(!BX.util.in_array(this.deniedInterface[i], allowedList))
				{
					newDeniedInterface.push(this.deniedInterface[i]);
				}
			}

			this.deniedInterface = newDeniedInterface;
		},

		sendAppOptions: function()
		{
			if(this._appOptionsStack.length > 0)
			{
				var stack = this._appOptionsStack;
				this._appOptionsStack = [];

				var opts = [];
				for(var i = 0; i < stack.length; i++)
				{
					opts.push({name: stack[i][0], value: stack[i][1]});
				}

				var params = {
					action: 'set_option',
					options: opts
				};

				this.query(
					params,
					function(data)
					{
						for(var i = 0; i < stack.length; i++)
						{
							stack[i][2](data);
						}
					}
				);
			}
		},

		loadControl: function(name, params, cb)
		{
			if(!params)
			{
				params = {};
			}

			params.control = name;
			params.sessid = BX.bitrix_sessid();

			BX.ajax({
				method: 'POST',
				url: this.params.controlUrl,
				data: params,
				processScriptsConsecutive: true,
				onsuccess: cb
			});
		},

		reInstall: function()
		{
			BX.proxy(this.messageInterface.setInstallFinish, this)({value: false});
		},

		selectUserCallback_0: function(v)
		{
			var value = BX.util.array_values(v);
			if(!!value && value.length > 0)
			{
				BX.defer(this.userSelectorControl[0].close, this.userSelectorControl[0])();

				if(!!this.userSelectorControlCallback)
				{
					this.userSelectorControlCallback.apply(this, [value[0]]);
				}
			}
		},

		selectUserCallback_1: function(v)
		{
			if(v === true)
			{
				var value = BX.util.array_values(this.selectUserCallback_1_value);

				BX.defer(this.userSelectorControl[1].close, this.userSelectorControl[1])();

				if(!!this.userSelectorControlCallback)
				{
					this.userSelectorControlCallback.apply(this, [value]);
				}
			}
			else
			{
				this.selectUserCallback_1_value = v;
			}
		},

		hideUpdate: function(version, cb)
		{
			BX.userOptions.save('app_options', 'params_' + this.params.appId + '_' + this.params.appV, 'skip_update_' + version, 1);
			cb();
		}

	};


	BX.rest.AppLayout.initizalizePlacementInterface = function(parent)
	{
		var f = function(){};
		BX.extend(f, parent);

		f.prototype.events = BX.clone(f.superclass.events);

		return f;
	};

	BX.rest.AppLayout.initializePlacement = function(placement)
	{
		placement = (placement + '').toUpperCase();

		if(!BX.rest.AppLayout.placementInterface[placement])
		{
			BX.rest.AppLayout.placementInterface[placement] = BX.rest.AppLayout.initizalizePlacementInterface(
				placement === 'DEFAULT'
					? BX.rest.AppLayout.MessageInterface
					: BX.rest.AppLayout.MessageInterfacePlacement
			);
		}

		return BX.rest.AppLayout.placementInterface[placement];
	};

	BX.rest.AppLayout.initializePlacementByEvent = function(placement, event)
	{
		BX.addCustomEvent(event, function(PlacementInterface){
			var MessageInterface = BX.rest.AppLayout.initializePlacement(placement);
			if(!!PlacementInterface.events)
			{
				for(var i = 0; i < PlacementInterface.events.length; i++)
				{
					MessageInterface.prototype.events.push(PlacementInterface.events[i]);
				}
			}

			for(var method in PlacementInterface)
			{
				if(method !== 'events' && PlacementInterface.hasOwnProperty(method))
				{
					MessageInterface.prototype[method] = PlacementInterface[method];
				}
			}
		});
	};

	BX.rest.AppLayout.MessageInterface = function(){};
	BX.rest.AppLayout.MessageInterface.prototype = {

		events: [],

		getInitData: function(params, cb)
		{
			cb({
				LANG: BX.message('LANGUAGE_ID'),
				DOMAIN: location.host,
				PROTOCOL: this.params.proto,
				PATH: this.params.restPath,
				AUTH_ID: this.params.authId,
				AUTH_EXPIRES: this.params.authExpires,
				REFRESH_ID: this.params.refreshId,
				MEMBER_ID: this.params.memberId,
				FIRST_RUN: this.params.firstRun,
				IS_ADMIN: this.params.isAdmin,
				INSTALL: this.params.appI,
				USER_OPTIONS: this.params.userOptions,
				APP_OPTIONS: this.params.appOptions,
				PLACEMENT: this.params.placement,
				PLACEMENT_OPTIONS: this.params.placementOptions
			});
			this.params.firstRun = false;
		},

		getInterface: function(params, cb)
		{
			var result = {command: [], event: []};

			for(var cmd in this.messageInterface)
			{
				// no hasOwnProperty check here!
				if(
					cmd !== 'events'
					&& cmd !== 'constructor'
					&& !BX.rest.AppLayout.MessageInterfacePlacement.prototype[cmd]
					&& !BX.util.in_array(cmd, this.deniedInterface)
				)
				{
					result.command.push(cmd);
				}
			}

			for(var i = 0; i < this.messageInterface.events.length; i++)
			{
				result.event.push(this.messageInterface.events[i]);
			}

			cb(result);
		},

		refreshAuth: function(params, cb)
		{
			params = {action: 'access_refresh'};
			this.query(params, BX.delegate(function(data)
			{
				if(!!data['access_token'])
				{
					this.params.authId = data['access_token'];
					this.params.authExpires = data['expires_in'];
					this.params.refreshId = data['refresh_token'];
					cb({
						AUTH_ID: this.params.authId,
						AUTH_EXPIRES: this.params.authExpires,
						REFRESH_ID: this.params.refreshId
					});
				}
				else
				{
					alert('Unable to get new token! Reload page, please!');
				}
			}, this));
		},

		resizeWindow: function(params, cb)
		{
			var f = BX(this.params.layoutName);
			params.width = params.width == '100%' ? params.width : ((parseInt(params.width) || 100) + 'px');
			params.height = parseInt(params.height);

			if(!!params.width)
			{
				f.style.width = params.width;
			}
			if(!!params.height)
			{
				f.style.height = params.height + 'px';
			}

			var p = BX.pos(f);
			cb({width: p.width, height: p.height});
		},

		setTitle: function(params, cb)
		{
			BX.ajax.UpdatePageTitle(params.title);
			cb(params);
		},

		setScroll: function(params, cb)
		{
			if(!!params && typeof params.scroll != 'undefined' && params.scroll >= 0)
			{
				window.scrollTo(BX.GetWindowScrollPos().scrollLeft, parseInt(params.scroll));
			}
			cb(params);
		},

		setUserOption: function(params, cb)
		{
			this.params.userOptions[params.name] = params.value;
			BX.userOptions.save('app_options', 'options_' + this.params.appId, params.name, params.value);
			cb(params);
		},

		setAppOption: function(params, cb)
		{
			if(this.params.isAdmin)
			{
				this._appOptionsStack.push([params.name, params.value, cb]);
				BX.defer(this.sendAppOptions, this)();
			}
		},

		setInstall: function(params, cb)
		{
			BX.userOptions.save('app_options', 'params_' + this.params.appId + '_' + this.params.appV, 'install', !!params['install'] ? 1 : 0);
			cb(params);
		},

		setInstallFinish: function(params, cb)
		{
			var p = {
				action: 'set_installed',
				v: typeof params.value == 'undefined' || params.value !== false ? 'Y' : 'N'
			};

			this.query(p, BX.delegate(function(data)
			{
				var eventResult = {
					redirect: true
				};

				top.BX.onCustomEvent(top, 'Rest:AppLayout:ApplicationInstall', [p.v, eventResult], false);

				if(eventResult.redirect)
				{
					window.location = BX.util.add_url_param(window.location.href, {install_finished: !!data.result ? 'Y' : 'N'});
				}
			}, this));
		},

		selectUser: function(params, cb)
		{
			this.userSelectorControlCallback = cb;

			var mult = parseInt(params.mult + 0);

			if(mult)
			{
				// fully reinitialize multiple selector
				if(this.userSelectorControl[mult])
				{
					this.userSelectorControl[mult].close();
					this.userSelectorControl[mult].destroy();
					this.userSelectorControl[mult] = null;
				}
			}
			else if(!!this.userSelectorControl[mult])
			{
				// reuse single selector if already loaded
				this.userSelectorControl[mult].show();
				return;
			}

			var p = {
				name: 'USER_' + mult,
				onchange: "user_selector_cb_" + (parseInt(Math.random() * 100000)),
				site_id: BX.message('SITE_ID')
			};

			if(mult)
			{
				p.mult = true;
			}

			window[p.onchange] = BX.delegate(this['selectUserCallback_' + mult], this);

			this.loadControl('user_selector', p, BX.delegate(function(result)
			{
				this.userSelectorControl[mult] = BX.PopupWindowManager.create(
					"app-user-popup-" + mult,
					null,
					{
						autoHide: true,
						content: result,
						zIndex: 5000
					}
				);
				if(mult)
				{
					this.userSelectorControl[mult].setButtons([
						new BX.PopupWindowButton({
							text: BX.message('REST_ALT_USER_SELECT'),
							className: "popup-window-button-accept",
							events: {
								click: function() {
									window[p.onchange](true);
								}
							}
						})
					]);
				}

				this.userSelectorControl[parseInt(params.mult + 0)].show();
				BX('USER_' + mult + '_selector_content').style.display = 'block';

			}, this));

		},

		selectAccess: function(params, cb)
		{
			if(!this.bAccessLoaded)
			{
				this.loadControl('access_selector', {}, BX.defer(function()
				{
					this.bAccessLoaded = true;
					BX.defer(this.messageInterface.selectAccess, this)(params, cb);
				}, this));
			}
			else
			{
				BX.Access.Init({
					groups: {disabled: true}
				});

				params.value = params.value || [];
				var startValue = {};
				for(var i = 0; i < params.value.length; i++)
				{
					startValue[params.value[i]] = true;
				}

				BX.Access.SetSelected(startValue);
				BX.Access.ShowForm({
					zIndex : 5000,
					callback: function(arRights)
					{
						var res = [];

						for(var provider in arRights)
						{
							if(arRights.hasOwnProperty(provider))
							{
								for(var id in arRights[provider])
								{
									if(arRights[provider].hasOwnProperty(id))
									{
										res.push(arRights[provider][id]);
									}
								}
							}
						}

						cb(res);
					}
				});
			}
		},

		selectCRM: function(params, cb, loaded)
		{
			if(loaded !== true)
			{
				this.loadControl(
					'crm_selector',
					{
						entityType: params.entityType,
						multiple: !!params.multiple ? 'Y' : 'N',
						value: params.value
					},
					BX.delegate(function()
					{
						BX.defer(this.messageInterface.selectCRM, this)(params, cb, true);
					}, this)
				);

				return;
			}

			if(!window.obCrm)
			{
				setTimeout(BX.delegate(function()
				{
					BX.proxy(this.messageInterface.selectCRM, this)(params, cb, true);
				}, this), 500);
			}
			else
			{
				obCrm['restCrmSelector'].Open();
				obCrm['restCrmSelector'].AddOnSaveListener(function(result)
				{
					cb(result);
					obCrm['restCrmSelector'].Clear();
				});
			}
		},

		reloadWindow: function()
		{
			window.location.reload();
		},

		imCallTo: function(params)
		{
			top.BXIM.callTo(params.userId, !!params.video)
		},

		imPhoneTo: function(params)
		{
			top.BXIM.phoneTo(params.phone)
		},

		imOpenMessenger: function(params)
		{
			top.BXIM.openMessenger(params.dialogId)
		},

		imOpenHistory: function(params)
		{
			top.BXIM.openHistory(params.dialogId)
		},

		openApplication: function(params, cb)
		{
			BX.rest.AppLayout.openApplication(this.params.id, params, {}, cb);
		},

		openPath: function(params, callback)
		{
			BX.rest.AppLayout.openPath(this.params.appId, params, callback);
		},

		closeApplication: function(params, cb)
		{
			var url = BX.message('REST_APPLICATION_VIEW_URL').replace('#APP#', this.params.appId);
			if (
				top.BX.SidePanel.Instance.isOpen()
				&& top.BX.SidePanel.Instance.getTopSlider().url.match(
					new RegExp('^' + url)
				)
			)
			{
				top.BX.SidePanel.Instance.close(false, cb);
			}
			else
			{
				url = BX.message('REST_PLACEMENT_URL').replace('#PLACEMENT_ID#', parseInt(this.params.placementId));
				if(
					top.BX.SidePanel.Instance.isOpen()
					&& top.BX.SidePanel.Instance.getTopSlider().url.match(
					new RegExp('^' + url)
					)
				)
				{
					top.BX.SidePanel.Instance.close(false, cb);
				}
				else
				{
					url = BX.message('REST_APPLICATION_URL').replace('#ID#', parseInt(this.params.id));
					if(
						top.BX.SidePanel.Instance.isOpen()
						&& top.BX.SidePanel.Instance.getTopSlider().url.match(
						new RegExp('^' + url)
						)
					)
					{
						top.BX.SidePanel.Instance.close(false, cb);
					}
				}
			}
		},

		showAppForm: function(params, cb)
		{
			(new BX.Rest.AppForm(params)).show();
		}
	};

	BX.rest.AppLayout.MessageInterfacePlacement = BX.rest.AppLayout.initizalizePlacementInterface(BX.rest.AppLayout.MessageInterface);

	BX.rest.AppLayout.MessageInterfacePlacement.prototype.placementBindEvent = function(param, cb)
	{
		if(!!param.event && BX.util.in_array(param.event, this.messageInterface.events))
		{
			var f = BX.delegate(function()
			{
				if(!this._destroyed)
				{
					cb.apply(this, arguments);
				}
				else
				{
					BX.removeCustomEvent(param.event, f);
				}
			}, this);

			BX.addCustomEvent(param.event, f);
		}
	};

	BX.rest.layoutList = {};
	BX.rest.placementList = {};
	BX.rest.AppLayout.placementInterface = {};

	BX.rest.AppLayout.get = function(id)
	{
		return BX.rest.layoutList[id];
	};

	BX.rest.AppLayout.set = function(placement, sid, params)
	{
		placement = (placement + '').toUpperCase();

		params.appSid = sid;
		params.placement = placement;

		BX.rest.layoutList[sid] = new BX.rest.AppLayout(params);

		return BX.rest.layoutList[sid];
	};

	BX.rest.AppLayout.getPlacement = function(placement)
	{
		return BX.rest.placementList[(placement + '').toUpperCase()];
	};

	BX.rest.AppLayout.setPlacement = function(placement, ob)
	{
		BX.rest.placementList[(placement + '').toUpperCase()] = ob;
	};

	BX.rest.AppLayout.initialize = function(placement, sid)
	{
		placement = (placement + '').toUpperCase();

		BX.rest.layoutList[placement] = BX.rest.layoutList[sid];
		BX.rest.layoutList[placement].init();
	};

	BX.rest.AppLayout.destroy = function(id)
	{
		var layout = BX.rest.AppLayout.get(id);
		if(!!layout)
		{
			layout.destroy();
		}

		BX.rest.layoutList[layout.params.appSid] = null;

		if(!!BX.rest.AppLayout.placementInterface[id])
		{
			BX.rest.layoutList[id] = null;
		}
	};

	function getMessage(id)
	{
		var message = BX.message(id);

		return BX.type.isNotEmptyString(message) ? message : '';
	}

	function split(s, ss)
	{
		var r = s.split(ss);
		return [r[0], r.slice(1, r.length - 2).join(ss), r[r.length - 2], r[r.length - 1]];
	}

})();
