import type {B24Options} from './type';
import {Conv, Type} from './util/registry';
import {Button} from './util/button';
import * as Form from './form/registry';
import * as Compatibility from './compatibility';

type PendingSiteButtonForm = {
	show: () => void,
	hide: () => void,
};

function createTelemetryAttempt(): Object
{
	let attemptId = createUuidV4();
	let startRequest = null;

	return {
		appendTo: (formData: FormData): void => {
			formData.set('attemptId', attemptId);
		},
		// the server ignores events of an attempt it has not started yet
		ensureStarted: (sendStart: Function): Promise => {
			startRequest = startRequest || Promise.resolve(sendStart());

			return startRequest;
		},
		rotate: (): void => {
			attemptId = createUuidV4();
			startRequest = null;
		},
	};
}

function createUuidV4(): string
{
	const bytes = new Uint8Array(16);
	if (window.crypto?.getRandomValues)
	{
		window.crypto.getRandomValues(bytes);
	}
	else
	{
		for (let index = 0; index < bytes.length; index += 1)
		{
			bytes[index] = Math.floor(Math.random() * 256);
		}
	}

	bytes[6] = (bytes[6] & 0x0F) | 0x40;
	bytes[8] = (bytes[8] & 0x3F) | 0x80;

	return [...bytes]
		.map((byte, index) => {
			const separator = [4, 6, 8, 10].includes(index) ? '-' : '';
			const hex = byte.toString(16);

			return separator + (hex.length === 1 ? `0${hex}` : hex);
		})
		.join('')
	;
}

class Application
{
	#forms: Array<Form.Controller> = [];
	#userProviderPromise: Promise;
	#agreementRefreshRequests: Object = {};
	#pendingSiteButtonForms: {[string]: PendingSiteButtonForm} = {};

	list(): Array<Form.Controller>
	{
		return this.#forms;
	}

	get(id: string): Form.Controller | PendingSiteButtonForm | null
	{
		const form = this.#forms.filter((form) => {
			return form.getId() === id;
		})[0];

		return form || this.#pendingSiteButtonForms[id] || null;
	}

	create(options: Form.Options): Form.Controller
	{
		const form = new Form.Controller(options);
		this.#forms.push(form);
		return form;
	}

	remove(id: String): void
	{
		this.#forms = this.#forms.filter(form => form.getId() !== id);
	}

	post(uri: string, body: FormData, headers: Object): Promise
	{
		return window.fetch(
			uri,
			{
				method: 'POST',
				mode: 'cors',
				cache: 'no-cache',
				headers: Object.assign(
					headers || {},
					{
						'Origin': window.location.origin,
					}
				),
				body: body
			}
		)
	}

	createForm24(b24options: B24Options, options: Form.Options): Form.Controller
	{
		const telemetry = createTelemetryAttempt();
		options.provider = options.provider || {};
		if (!options.provider.user)
		{
			options.provider.user = this.getUserProvider24(b24options, options);
		}

		if (!options.provider.entities)
		{
			let entities = b24form.util.url.parameter.get('b24form_entities');
			if (entities)
			{
				entities = JSON.parse(entities);
				if (typeof entities === 'object')
				{
					options.provider.entities = entities;
				}
			}
		}

		Object.assign(options.provider, {
			submit: this.getSubmitProvider24(b24options, telemetry),
		});
		Object.assign(options, {
			analyticsHandler: this.getAnalyticsSender(b24options, telemetry),
		});

		if (b24options.lang)
		{
			options.language = b24options.lang;
		}

		options.proxy = b24form.common?.properties?.proxy || {};
		options.abuse = b24form.common?.properties?.abuse || {};
		options.languages = b24form.common.languages || [];
		options.messages = options.messages || {};
		options.messages = Object.assign(
			b24form.common.messages,
			options.messages || {}
		);
		options.identification = {
			type: 'b24',
			id: b24options.id,
			sec: b24options.sec,
			address: b24options.address,
		};

		const instance = this.create(options);
		instance.subscribe(Form.EventTypes.destroy, () => this.remove(instance.getId()));

		return instance;
	}

	createWidgetForm24(b24options: B24Options, options: Form.Options): Form.Controller
	{
		let pos = parseInt(BX.SiteButton.config.location) || 4;
		let positions = {
			1: ['left', 'top'],
			2: ['center', 'top'],
			3: ['right', 'top'],
			4: ['right', 'bottom'],
			5: ['center', 'bottom'],
			6: ['left', 'bottom'],
		};

		options.view = {
			type: (((options.fields || []).length + (options.agreements || []).length) <= 3)
				? 'widget'
				: 'panel',
			position: positions[pos][0],
			vertical: positions[pos][1]
		};

		Compatibility.performEventOfWidgetFormInit(b24options, options);
		const instance = this.createForm24(b24options, options);
		instance.subscribe(Form.EventTypes.hide, () => BX.SiteButton.onWidgetClose());

		return instance;
	}

	getUserProvider24(b24options: B24Options): Promise|Object
	{
		let signTtl = 3600 * 24;
		let sign = b24form.util.url.parameter.get('b24form_data');
		if (!sign)
		{
			sign = b24form.util.url.parameter.get('b24form_user');
			if (sign)
			{
				b24options.sign = sign;
				if (b24form.util.ls.getItem('b24-form-sign', signTtl))
				{
					sign = null;
				}
			}
		}

		const eventData = {sign};
		dispatchEvent(new CustomEvent(
			'b24:form:app:user:init',
			{
				detail: {
					object: this,
					data: eventData,
				}
			}
		));
		sign = eventData.sign;

		let ttl = 3600 * 24 * 28;
		if (!sign)
		{
			if (b24form.user && typeof b24form.user === 'object')
			{
				b24options.entities = b24options.entities || b24form.user.entities || [];
				return b24form.user.fields || {};
			}

			try
			{
				let user = b24form.util.ls.getItem('b24-form-user', ttl);
				if (user !== null && typeof user === 'object')
				{
					return user.fields || {};
				}
			}
			catch (e)
			{

			}
		}

		if (this.#userProviderPromise)
		{
			return this.#userProviderPromise;
		}

		if (!sign)
		{
			return null;
		}

		b24options.sign = sign;
		b24form.util.ls.setItem('b24-form-sign', sign, signTtl);

		let formData = new FormData();
		formData.set('id', b24options.id);
		formData.set('sec', b24options.sec);
		formData.set('security_sign', b24options.sign);

		this.#userProviderPromise = this.post(
			b24options.address + '/bitrix/services/main/ajax.php?action=crm.site.user.get',
			formData
		).then((response) => {
			return response.json();
		}).then(data => {
			if (data.error)
			{
				throw new Error(data.error_description || data.error);
			}

			data = data.result;
			data = data && typeof data === 'object' ? data : {};
			data.fields = data && typeof data.fields === 'object' ? data.fields : {};

			let properties = data.properties || {};
			delete data.properties;

			this.list()
				.filter(form => form.identification.id === b24options.id)
				.forEach(form => {
					Object
						.keys(properties)
						.forEach(key => form.setProperty(key, properties[key]))
				})
			;

			b24form.util.ls.setItem('b24-form-user', data, ttl);

			dispatchEvent(new CustomEvent(
				'b24:form:app:user:loaded',
				{
					detail: {
						object: this,
						data: {},
					}
				}
			));

			return data.fields;
		});

		return this.#userProviderPromise;
	}

	getSubmitProvider24(b24options: B24Options, telemetry: Object): Promise
	{
		return (form: Form.Controller, formData: FormData) => {

			let trace = (b24options.usedBySiteButton && BX.SiteButton)
				? BX.SiteButton.getTrace()
				: (window.b24Tracker && b24Tracker.guest) ? b24Tracker.guest.getTrace() : null;

			const eventData = {
				id: b24options.id,
				sec: b24options.sec,
				language: b24options.language,
				sign: b24options.sign,
			};
			form.emit('submit:post:before', eventData);

			formData.set('id', b24options.id);
			formData.set('sec', b24options.sec);
			formData.set('lang', form.language);
			formData.set('trace', trace);
			formData.set('entities', JSON.stringify(b24options.entities || []));
			formData.set('security_sign', eventData.sign || b24options.sign);
			const explicitConsents = (form.agreements || []).reduce((selected, agreement) => {
				if (!agreement.isAcceptedBySubmit() && agreement.value() === 'Y')
				{
					selected[agreement.name] = 'Y';
				}

				return selected;
			}, {});
			formData.set('explicitConsents', JSON.stringify(explicitConsents));
			const displayedSubmitAgreements = (form.agreements || []).reduce((displayed, agreement) => {
				if (agreement.isAcceptedBySubmit())
				{
					displayed[agreement.name] = agreement.options.revision;
				}

				return displayed;
			}, {});
			formData.set('displayedSubmitAgreements', JSON.stringify(displayedSubmitAgreements));
			formData.set('telemetry_sign', b24options.telemetrySign || '');
			telemetry.appendTo(formData);

			return this.post(
				b24options.address + '/bitrix/services/main/ajax.php?action=crm.site.form.fill',
				formData
			).then((response) => {
				return response.json();
			}).then((data) => {
				if (data.error)
				{
					throw new Error(data.error_description || data.error);
				}

				data = data.result;
				if (data && data.gid && window.b24Tracker && b24Tracker.guest && b24Tracker.guest.setGid)
				{
					b24Tracker.guest.setGid(data.gid);
				}

				if (data?.resultId && data?.refill?.active)
				{
					telemetry.rotate();
				}

				return new Promise(resolve => {
					resolve(data);
				});
			});
		};
	}

	initFormScript24(b24options: B24Options): Form.Controller|null
	{
		return this.mountFormScript24(b24options);
	}

	refreshSubmitAgreements24(b24options: B24Options): Promise
	{
		if (b24options.data?.acceptBySubmitEnabled !== true)
		{
			return Promise.resolve();
		}

		const key = JSON.stringify([b24options.address, b24options.id, b24options.sec]);
		let request = this.#agreementRefreshRequests[key];
		if (!request)
		{
			const formData = new FormData();
			formData.set('id', b24options.id);
			formData.set('sec', b24options.sec);
			formData.set('agreementsOnly', 'Y');

			request = this.post(
				b24options.address + '/bitrix/services/main/ajax.php?action=crm.site.form.get',
				formData,
			)
				.then(response => response.json())
				.then(response => {
					const agreements = response?.result?.agreements
						?? response?.result?.config?.data?.agreements;
					if (!Array.isArray(agreements))
					{
						throw new Error('Could not refresh form agreements');
					}

					return agreements;
				})
				.then(agreements => {
					setTimeout(() => {
						if (this.#agreementRefreshRequests[key] === request)
						{
							delete this.#agreementRefreshRequests[key];
						}
					}, 15000);

					return agreements;
				})
				.catch(error => {
					delete this.#agreementRefreshRequests[key];
					throw error;
				})
			;
			this.#agreementRefreshRequests[key] = request;
		}

		return request
			.then(agreements => {
				b24options.data.agreements = Conv.cloneDeep(agreements);
			})
			.catch(() => {
				b24options.data.agreements = (b24options.data.agreements || []).map(agreement => ({
					...agreement,
					agreementNoticeAllowed: false,
					...(agreement.acceptBySubmit === true
						? { acceptBySubmit: false, checked: false, required: true }
						: {}),
				}));
			});
	}

	mountFormScript24(b24options: B24Options): Form.Controller|null
	{
		const mountWithCurrentAgreements = (mount) => {
			if (b24options.data?.acceptBySubmitEnabled !== true)
			{
				mount();
				return;
			}

			this.refreshSubmitAgreements24(b24options).then(mount);
		};

		if (b24options.usedBySiteButton)
		{
			const id = b24options.data.id;
			let shouldShow = false;
			this.#pendingSiteButtonForms[id] = {
				show: () => {
					shouldShow = true;
				},
				hide: () => {
					shouldShow = false;
				},
			};
			mountWithCurrentAgreements(() => {
				const form = this.createWidgetForm24(b24options, Conv.cloneDeep(b24options.data));
				delete this.#pendingSiteButtonForms[id];
				if (shouldShow)
				{
					form.show();
				}
			});
			return;
		}

		let nodes = document.querySelectorAll('script[data-b24-form]');
		nodes = Array.prototype.slice.call(nodes);
		nodes.forEach(node => {
			if (node.hasAttribute('data-b24-loaded'))
			{
				return;
			}

			let attributes = node.getAttribute('data-b24-form').split('/');
			if (attributes[1] !== b24options.id || attributes[2] !== b24options.sec)
			{
				return;
			}
			const form24Options = {
				...b24options,
				telemetrySign: node.getAttribute('data-b24-form-telemetry-sign')
					|| b24options.telemetrySign
					|| new URLSearchParams(window.location.search).get('telemetry_sign'),
			};

			node.setAttribute('data-b24-loaded', true);
			const id = node.getAttribute('data-b24-id');
			const formOptions = () => {
				const options = Conv.cloneDeep(b24options.data);
				if (id)
				{
					options.id = id;
				}

				return options;
			};

			switch (attributes[0])
			{
				case 'auto':
					setTimeout(() => {
						mountWithCurrentAgreements(() => {
							this.createForm24(
								form24Options,
								Object.assign(formOptions(), { view: b24options.views.auto }),
							).show();
						});
					}, (b24options.views.auto.delay || 1) * 1000);
					break;
				case 'click':
					let clickElement = node.nextElementSibling;
					const buttonUseMode = b24options?.views?.click?.button?.use === '1';
					if (buttonUseMode)
					{
						const newButton = Button.create(b24options);
						node.after(newButton);
						clickElement = newButton.querySelector('.b24-form-click-btn');
					}
					if (clickElement)
					{
						let form;
						let pending = false;
						clickElement.addEventListener('click',  () => {
							if (form)
							{
								form.show();
								return;
							}

							if (!pending)
							{
								pending = true;
								mountWithCurrentAgreements(() => {
									pending = false;
									form = this.createForm24(
										form24Options,
										Object.assign(formOptions(), { view: b24options.views.click }),
									);
									form.show();
								});
							}
						});
					}
						break;
				default:
					mountWithCurrentAgreements(() => {
						if (!node.parentElement)
						{
							return;
						}

						const target = document.createElement('div');
						node.parentElement.insertBefore(target, node);
						this.createForm24(form24Options, Object.assign(formOptions(), { node: target }));
					});
					break;
			}
		});
	}

	getAnalyticsSender(b24options, telemetry: Object)
	{
		const send = (counter: string, formId: string, analyticsData: Object) => {
			const formData = new FormData();
			let telemetryCounter = counter;
			const legacyStartKey = `b24-analytics-counter-${formId}-start`;
			if (counter === 'start' && window.sessionStorage)
			{
				if (sessionStorage.getItem(legacyStartKey) === 'y')
				{
					telemetryCounter = 'telemetry_start';
				}
				else
				{
					sessionStorage.setItem(legacyStartKey, 'y');
				}
			}

			formData.append('counter', telemetryCounter);
			formData.append('formId', formId);
			if (counter === 'start' || counter === 'error')
			{
				formData.append('sec', b24options.sec);
				telemetry.appendTo(formData);
				formData.append('telemetry_sign', b24options.telemetrySign || '');
			}

			if (counter !== 'error' && counter !== 'start' && window.sessionStorage)
			{
				const key = `b24-analytics-counter-${formId}-${counter}`;
				if (sessionStorage.getItem(key) === 'y')
				{
					return Promise.resolve([]);
				}

				sessionStorage.setItem(key, 'y');
			}

			if (counter === 'error' && ['validation', 'other'].includes(analyticsData.errorType))
			{
				formData.append('errorType', analyticsData.errorType);
			}

			return this.post(
				b24options.address + '/bitrix/services/main/ajax.php?action=crm.site.form.handleAnalytics',
				formData
			).then((response) =>
			{
				return response.json();
			}).then((data) =>
			{
				if (data.error)
				{
					throw new Error(data.error_description || data.error);
				}
				return new Promise(resolve =>
				{
					resolve(data);
				});
			}).catch(() => []);
		};

		return (counter: string, formId: string, analyticsData: Object = {}) => {
			if (counter === 'start')
			{
				return telemetry.ensureStarted(() => send(counter, formId, analyticsData));
			}

			if (counter === 'error')
			{
				return telemetry
					.ensureStarted(() => send('start', formId, {}))
					.then(() => send(counter, formId, analyticsData))
				;
			}

			return send(counter, formId, analyticsData);
		};
	}
}

const App = new Application();
export {
	App,
	Compatibility,
}
