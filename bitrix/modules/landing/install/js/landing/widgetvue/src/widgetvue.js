import { BitrixVue, VueCreateAppResult } from 'ui.vue3';
import { Text, Type, Runtime, Loc } from 'main.core';
import { BaseEvent }  from 'main.core.events';
import { Loader } from 'main.loader';

import { Content } from './components/content';
import { Message } from './components/message';
import { Error } from './components/error';
import { WidgetOptions } from './internal/types';

import './css/style.css';

export class WidgetVue
{
	static runningAppNodes: Set<HTMLElement> = new Set();

	#rootNode: ?HTMLElement;
	#data: ?{};
	#blockId: number;
	#appId: number;

	#fetchable: boolean;
	#clickable: boolean;
	#allowedByTariff: boolean;

	#application: VueCreateAppResult;
	#contentComponent: Object;

	constructor(options: WidgetOptions): void
	{
		this.#rootNode = Type.isString(options.rootNode) ? document.querySelector(options.rootNode) : null;
		this.#data = Type.isObject(options.data) ? options.data : null;

		this.#blockId = options.blockId ? Text.toNumber(options.blockId) : 0;
		this.#appId = options.appId ? Text.toNumber(options.appId) : 0;
		this.#contentComponent = Runtime.clone(Content);

		this.#fetchable = options.fetchable || false;
		const isEditMode = Type.isFunction(BX.Landing.getMode) && BX.Landing.getMode() === 'edit';
		this.#clickable = !isEditMode;
		this.#allowedByTariff =
			(this.#appId && Type.isBoolean(options.allowedByTariff))
				? options.allowedByTariff
				: true
		;
	}

	mount()
	{
		if (
			this.#blockId > 0
			&& this.#rootNode
			&& !WidgetVue.runningAppNodes.has(this.#rootNode)
		)
		{
			this.loader = new Loader({
				target: this.#rootNode,
			});
			this.#contentComponent.template = this.#rootNode.innerHTML || '';
			this.#contentComponent.template = `<div>${this.#contentComponent.template}</div>`
			this.#createApp();
			WidgetVue.runningAppNodes.add(this.#rootNode);
		}
	}

	showLoader()
	{
		this.loader.show();
	}

	hideLoader()
	{
		this.loader.hide();
	}

	#createApp(): void
	{
		const context = this;

		this.#application = BitrixVue.createApp({
			name: 'BX widget ' + this.#blockId,

			components: {
				Message,
				Error,
				Content: this.#contentComponent,
			},

			props: {
				defaultData: {
					type: Object,
					default: null,
				},

				allowedByTariff: {
					type: Boolean,
					default: true,
				},
			},

			data() {
				return {
					message: null,
					error: null,
				};
			},

			created()
			{
				this.$bitrix.eventEmitter.subscribe('landing:widgetvue:startContentLoad', this.onShowLoader);
				this.$bitrix.eventEmitter.subscribe('landing:widgetvue:endContentLoad', this.onHideLoader);
				this.$bitrix.eventEmitter.subscribe('landing:widgetvue:onMessage', this.onShowMessage);
				this.$bitrix.eventEmitter.subscribe('landing:widgetvue:onHideMessage', this.onHideMessage);
				this.$bitrix.eventEmitter.subscribe('landing:widgetvue:onError', this.onShowError);
			},

			beforeUnmount()
			{
				this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:startContentLoad', this.onShowLoader);
				this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:endContentLoad', this.onHideLoader);
				this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:onMessage', this.onShowMessage);
				this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:onHideMessage', this.onHideMessage);
				this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:onError', this.onShowError);
			},

			methods: {
				onShowLoader()
				{
					// todo: move loader to comp
					this.$bitrix.Application.get().showLoader();
				},

				onHideLoader()
				{
					// todo: move loader to comp
					this.$bitrix.Application.get().hideLoader();
				},

				onShowMessage(event: BaseEvent)
				{
					const message = event.getData()?.message || null;
					this.message = message
						? {message: message}
						: null
					;
				},

				onHideMessage()
				{
					this.message = null;
				},

				onShowError(event: BaseEvent)
				{
					const message = event.getData()?.message || null;
					this.error = message
						? {message: message}
						: null
					;
				},
			},

			beforeCreate(): void
			{
				this.$bitrix.Application.set(context);
			},

			template: `
				<Error
					v-if="!allowedByTariff"
					message="${Loc.getMessage('LANDING_WIDGETVUE_ERROR_PAYMENT')}"
				>
				</Error>

				<Suspense v-else>
					<template #default>
						<div>
							<Error
								v-show="error !== null"
								v-bind="error && error.message !== null ? error : {}"
							/>
							<Message
								v-show="message !== null"
								v-bind="message && message.message !== null ? message : {}"
							/>
							<Content
								v-show="message === null && error === null"

								:defaultData="defaultData"
								:blockId=${this.#blockId}
								:appId="${this.#appId}"
								:fetchable=${this.#fetchable}
								:clickable=${this.#clickable}
							/>
						</div>
					</template>

					<template #fallback>
						<Message />
					</template>
				</Suspense>
			`,
		},
		{
			defaultData: this.#data,
			allowedByTariff: this.#allowedByTariff,
		});

		this.#application.mount(this.#rootNode);
	}
}