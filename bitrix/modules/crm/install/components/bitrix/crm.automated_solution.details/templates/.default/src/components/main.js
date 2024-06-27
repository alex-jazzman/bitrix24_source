import { Dom, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import type { Error } from '../store';
import { CommonTab } from './tabs/common-tab';
import { TypesTab } from './tabs/types-tab';
import '../css/main.css';

export const Main = {
	components: {
		CommonTab,
		TypesTab,
	},
	props: {
		initialActiveTabId: String,
	},
	data(): Object
	{
		return {
			tabs: {
				// tab show flags
				common: this.initialActiveTabId === 'common',
				types: this.initialActiveTabId === 'types',
			},
		};
	},

	computed: {
		allTabIds(): string[]
		{
			return Object.keys(this.tabs);
		},
		saveButton(): HTMLElement
		{
			return document.getElementById('ui-button-panel-save');
		},
		cancelButton(): HTMLElement
		{
			return document.getElementById('ui-button-panel-cancel');
		},
		deleteButton(): ?HTMLElement
		{
			return document.getElementById('ui-button-panel-remove');
		},
		allButtons(): HTMLElement[]
		{
			const buttons = [this.saveButton, this.cancelButton];

			if (this.deleteButton)
			{
				buttons.push(this.deleteButton);
			}

			return buttons;
		},

		errors(): Error[]
		{
			return this.$store.state.errors;
		},

		hasErrors(): boolean
		{
			return Type.isArrayFilled(this.errors);
		},
	},

	mounted()
	{
		EventEmitter.subscribe('BX.Crm.AutomatedSolution.Details:showTab', this.showTabFromEvent);
		EventEmitter.subscribe('BX.Crm.AutomatedSolution.Details:save', this.save);
		EventEmitter.subscribe('BX.Crm.AutomatedSolution.Details:delete', this.delete);
	},

	beforeUnmount()
	{
		EventEmitter.unsubscribe('BX.Crm.AutomatedSolution.Details:showTab', this.showTabFromEvent);
		EventEmitter.unsubscribe('BX.Crm.AutomatedSolution.Details:save', this.save);
		EventEmitter.unsubscribe('BX.Crm.AutomatedSolution.Details:delete', this.delete);
	},

	methods: {
		showTabFromEvent(event: BaseEvent): void
		{
			const { tabId } = event.getData();

			this.showTab(tabId);
		},

		showTab(tabId: string): void
		{
			if (!this.allTabIds.includes(tabId))
			{
				throw new Error('invalid tab id');
			}

			for (const id of this.allTabIds)
			{
				this.tabs[id] = false;
			}
			this.tabs[tabId] = true;
		},

		save(): void
		{
			this.$store.dispatch('save')
				.then(() => {
					this.$Bitrix.Application.get().closeSliderOrRedirect();
				})
				.catch(() => {}) // errors will be displayed reactively
				.finally(() => this.unlockButtons())
			;
		},

		delete(): void
		{
			this.$store.dispatch('delete')
				.then(() => {
					this.$Bitrix.Application.get().closeSliderOrRedirect();
				})
				.catch(() => {}) // errors will be displayed reactively
				.finally(() => this.unlockButtons())
			;
		},

		unlockButtons(): void
		{
			this.allButtons.forEach((button: HTMLElement) => {
				Dom.removeClass(button, 'ui-btn-wait');
			});
		},

		hideError(error: Error): void
		{
			this.$store.dispatch('removeError', error);
		},
	},

	template: `
		<div class="crm-automated-solution-details">
			<form class="ui-form">
				<div v-if="hasErrors" class="ui-alert ui-alert-danger">
					<template
						v-for="error in errors"
						:key="error.message"
					>
						<span class="ui-alert-message">{{error.message}}</span>
						<span class="ui-alert-close-btn" @click="hideError(error)"></span>
					</template>
				</div>
				<CommonTab v-show="tabs.common"/>
				<TypesTab v-show="tabs.types"/>
			</form>
		</div>
	`,
};
