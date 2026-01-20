(function(){

	function Warn(message)
	{
		if (window.console && console.warn)
		{
			// console.warn(message || '[DEPRECATED] This javascript-loader of CRM-forms is deprecated. Please, change to new javascript-loader.');
		}
	}
	Warn();

	function ParseHost(link)
	{
		return link.match(/((http|https):\/\/[^\/]+?)\//)[1];
	}

	var defaultHost = (function(){
		var scriptNode = document.querySelector('script[src*="/bitrix/js/crm/form_loader.js"]')
		if (scriptNode && scriptNode.src)
		{
			return ParseHost(scriptNode.src) ;
		}

		return null;
	})();

	var loaders = {};
	try
	{
		loaders = JSON.parse(window.sessionStorage.getItem('b24:form:compatible:loaders')) || {};
	}
	catch (e) {}

	var parametersList = [];
	function InvokeLoader(parameters, loaders)
	{
		parametersList.push(parameters);
		parameters.compatibility = {
			id: Math.random().toString().split('.')[1] + Math.random().toString().split('.')[1]
		};

		var anchorScript = document.createElement('div');
		anchorScript.innerHTML = loaders.form[parameters.type];
		anchorScript = anchorScript.children[0];
		anchorScript.dataset.b24Id = parameters.compatibility.id;
		parameters.compatibility.anchorScript = anchorScript;

		var execScript = document.createElement('script');
		execScript.type = 'text/javascript';
		execScript.appendChild(document.createTextNode(anchorScript.textContent))



		if(parameters.click && parameters.type === 'click')
		{
			parameters.click.forEach(function (node) {
				node.parentNode.insertBefore(anchorScript.cloneNode(true), node);
			});
		}
		else if(parameters.node)
		{
			parameters.node.appendChild(anchorScript);
		}
		else if (parameters.defaultNode)
		{
			if (parameters.defaultNode.nextElementSibling)
			{
				parameters.defaultNode.parentNode.insertBefore(
					anchorScript,
					parameters.defaultNode.nextElementSibling
				);
			}
			else if (parameters.defaultNode)
			{
				parameters.defaultNode.parentNode.appendChild(anchorScript);
			}
		}
		else
		{
			return;
		}

		if (parametersList.length === 1)
		{
			window.addEventListener('b24:form:init:before', function (event) {
				var options = event.detail.data;
				var form = event.detail.object;
				if (!options || !options.identification)
				{
					return;
				}

				var parameters = parametersList.filter(function (parameters) {
					if (parseInt(options.identification.id) !== parseInt(parameters.id))
					{
						return false;
					}

					if (options.identification.sec !== parameters.sec)
					{
						return false;
					}

					if (options.id && parameters.compatibility && parameters.compatibility.id)
					{
						return parseInt(options.id) === parseInt(parameters.compatibility.id);
					}

					return true;
				})[0];
				if (!parameters)
				{
					return;
				}

				if (parameters.compatibility && form)
				{
					parameters.compatibility.instance = form;
				}
				window.b24form.Compatibility.applyOldenLoaderData(options, parameters);
			});
		}

		document.head.appendChild(execScript);
	}

	var requestPromises = {};
	function LoadCompatible(parameters)
	{
		var host = ParseHost(parameters.ref) || defaultHost;
		if (!host)
		{
			throw new Error('Could not load form without parameter `ref`');
		}

		var cacheId = host + '|' + parameters.id;
		if (loaders[cacheId]) // check loaded
		{
			InvokeLoader(parameters, loaders[cacheId]);
			return;
		}

		if (!requestPromises[cacheId]) // check loading
		{
			requestPromises[cacheId] = new Promise(function (resolve, reject) {
				var uri = host + '/bitrix/services/main/ajax.php?action=crm.site.form.get'
					+ '&id=' + parameters.id
					+ '&sec=' + parameters.sec
					+ '&loaderOnly=y';

				window.fetch(
					uri,
					{
						method: 'GET',
						mode: 'cors',
						cache: 'no-cache',
						headers: {
							'Origin': window.location.origin
						}
					}
				)
					.then(function (response) {
						return response.json();
					})
					.then(function (data) {
						loaders[cacheId] = data.result.loader;
						try
						{
							window.sessionStorage.setItem('b24:form:compatible:loaders', JSON.stringify(loaders));
						}
						catch (e) {}
						resolve(parameters, data.result.loader);
					})
					.catch(reject);
			});
		}

		requestPromises[cacheId].then(function () {
			InvokeLoader(parameters, loaders[cacheId]);
		});
	}

	function UnLoadCompatible(parameters)
	{
		if (!parameters.compatibility || !parameters.compatibility.instance)
		{
			return;
		}

		parameters.compatibility.instance.destroy();
		parameters.compatibility.anchorScript.remove();
	}

	window.Bitrix24FormLoader = {
		init: function()
		{
			this.yaId = null;
			this.forms = {};
			this.eventHandlers = [];
			this.frameHeight = '200';
			this.defaultNodeId = 'bx24_form_';

			if(!window.Bitrix24FormObject || !window[window.Bitrix24FormObject])
				return;

			var b24form = window[window.Bitrix24FormObject];
			b24form.forms = b24form.forms || [];
			var forms = b24form.forms;
			forms.ntpush = forms.push;
			forms.push = function (params)
			{
				forms.ntpush(params);
				this.preLoad(params);
			}.bind(this);
			forms.forEach(this.preLoad, this);
		},
		preLoad: function(params)
		{
			var defaultNode = params.defaultNode = document.getElementById(this.defaultNodeId + params.type);
			if(!params.node && !params.defaultNode)
			{
				throw new Error('Could not load form: node not found.')
			}

			switch(params.type)
			{
				case 'click':
				case 'button':
				case 'link':
					var click = params.click || Array.prototype.slice.call(document.getElementsByClassName("b24-web-form-popup-btn-" + params.id));
					if(click && Object.prototype.toString.call(click) !== "[object Array]")
					{
						click = [click];
					}
					if(!click && defaultNode)
					{
						click = [defaultNode.nextElementSibling];
					}
					params.click = click;
					params.type = 'click';
					break;
				case 'delay':
					params.type = 'auto';
					break;
				case 'inline':
				default:
					params.type = 'inline';
					break;
			}

			this.load(params);
		},
		createPopup: function(params)
		{
			Warn();
		},
		resizePopup: function()
		{
			Warn();
		},
		showPopup: function(params)
		{
			Warn();
		},
		hidePopup: function(params)
		{
			Warn();
		},
		scrollToPopupMiddle: function(uniqueLoadId)
		{
			Warn();
		},
		util: {
			addClass: function(element, className)
			{
				if (element && typeof element.className == "string" && element.className.indexOf(className) === -1)
				{
					element.className += " " + className;
					element.className = element.className.replace('  ', ' ');
				}
			},
			removeClass: function(element, className)
			{
				if (!element || !element.className)
				{
					return;
				}

				element.className = element.className.replace(className, '').replace('  ', ' ');
			},
			hasClass: function(node, className)
			{
				var classList = this.nodeListToArray(node.classList);
				var filtered = classList.filter(function (name) { return name == className});
				return filtered.length > 0;
			},
			isIOS: function()
			{
				return (/(iPad;)|(iPhone;)/i.test(navigator.userAgent));
			},
			isMobile: function()
			{
				return (/(ipad|iphone|android|mobile|touch)/i.test(navigator.userAgent));
			}
		},
		createFrame: function(params)
		{
			Warn();
		},
		getUniqueLoadId: function(params)
		{
			var type = params.type;
			switch(type)
			{
				case 'click':
				case 'button':
				case 'link':
					type = 'button';
					break;
			}

			return type + '_' + params.id;
		},
		isFormExisted: function(params)
		{
			return !!this.forms[this.getUniqueLoadId(params)];
		},
		load: function(params)
		{
			params.loaded = false;
			params.handlers = params.handlers || {};
			params.options = params.options || {};

			LoadCompatible(params);
		},
		unload: function(params)
		{
			params = params || {};
			UnLoadCompatible(params);
			var uniqueLoadId = this.getUniqueLoadId(params);
			this.forms[uniqueLoadId] = null;
		},
		doFrameAction: function(dataString, uniqueLoadId)
		{
			Warn();
		},
		checkHash: function(uniqueLoadId)
		{
			Warn();
		},
		sendDataToFrame: function(uniqueLoadId, data)
		{
			Warn();
		},
		onFrameLoad: function(uniqueLoadId)
		{
			Warn();
		},

		isGuestLoaded: function()
		{
			return window.b24Tracker && window.b24Tracker.guest;
		},
		guestLoadedChecker: function()
		{
			Warn();
		},
		onGuestLoaded: function()
		{
			Warn();
		},

		addEventListener: function(el, eventName, handler)
		{
			el = el || window;
			if (window.addEventListener)
			{
				el.addEventListener(eventName, handler, false);
			}
			else
			{
				el.attachEvent('on' + eventName, handler);
			}
		},
		addEventHandler: function(target, eventName, handler)
		{
			Warn();
		},
		execEventHandler: function(target, eventName, params)
		{
			Warn();
		},

		setFrameHeight: function(uniqueLoadId, height)
		{
			Warn();
		}
	};

	window.Bitrix24FormLoader.init();
})();
