import { Slider } from 'crm.ai.slider';
import { Attention, AttentionPresets, Textbox } from 'crm.ai.textbox';
import { AudioPlayer } from 'crm.audio-player';
import { Dom, Loc, Tag, Text, Type } from 'main.core';
import { UI } from 'ui.notification';

import 'ui.design-tokens';
import './style.css';

export const ActivityProvider: Object<string, string> = Object.freeze({
	call: 'VOXIMPLANT_CALL',
	openLine: 'IMOPENLINES_SESSION',
});

export type aiData = {
	activityId: number,
	activityCreated?: number,
	ownerTypeId: number,
	ownerId: number,
	languageTitle ?: string,
	clientDetailUrl ?: string,
	clientFullName ?: string,
	userPhotoUrl ?: string,
	jobId ?: number,
	assessmentSettingsId ?: number,
	activityProvider ?: string,
};

export class Base
{
	activityId: number;
	ownerTypeId: number;
	ownerId: number;
	languageTitle: ?string = null;
	activityProvider: ?string = null;

	id: string;
	sliderTitle: string;
	sliderWidth: number;
	textboxTitle: string;
	aiDataAction: string;

	wrapperSlider: Slider;
	audioPlayerApp: ?AudioPlayer = null;
	textbox: Textbox;
	topElementNode: ?HTMLElement = null;

	constructor(data: aiData)
	{
		this.initDefaultOptions();

		this.activityId = data.activityId;
		this.ownerTypeId = data.ownerTypeId;
		this.ownerId = data.ownerId;
		this.languageTitle = data.languageTitle ?? null;
		this.activityProvider = data.activityProvider ?? null;
		this.jobId = data.jobId ?? null;

		this.textbox = new Textbox({
			title: this.textboxTitle,
			previousTextContent: this.getTopElementNode(),
			attentions: this.getTextboxAttentions(),
		});

		this.sliderId = `${this.id}-${this.activityId}-${this.jobId ?? '0'}`;
		this.wrapperSlider = new Slider({
			url: this.sliderId,
			sliderTitle: this.sliderTitle,
			sliderContentClass: this.getSliderContentClass(),
			width: this.sliderWidth,
			extensions: this.getExtensions(),
			design: this.getSliderDesign(),
			events: this.getSliderEvents(),
			toolbar: this.getSliderToolbar(),
		});
	}

	getExtensions(): Array<string>
	{
		return ['crm.ai.textbox', 'crm.audio-player'];
	}

	getSliderContentClass(): ?string
	{
		return null;
	}

	getSliderDesign(): ?Object
	{
		return null;
	}

	getSliderToolbar(): ?Function
	{
		return null;
	}

	getSliderEvents(): Object
	{
		return {
			onLoad: () => {
				this.audioPlayerApp?.attachTemplate();
			},
			onClose: () => {
				this.audioPlayerApp?.detachTemplate();
			},
		};
	}

	open()
	{
		const content = new Promise((resolve, reject) => {
			this.getAiData()
				.then((response) => {
					if (this.activityProvider === ActivityProvider.call)
					{
						this.audioPlayerApp?.setAudioProps(this.prepareAudioProps(response));
					}
					else if (this.activityProvider === ActivityProvider.openLine)
					{
						Dom.append(this.getOpenLineElementNode(response.data.openline), this.topElementNode);
					}

					const aiJobResult = this.prepareAiJobResult(response);
					this.textbox.setText(aiJobResult);
					this.textbox.render();

					resolve(this.textbox.get());
				})
				.catch((response) => {
					this.showError(response);
					this.wrapperSlider.destroy();
				})
			;
		});

		this.wrapperSlider.setContent(content);
		this.wrapperSlider.open();
	}

	getAiData(): Promise
	{
		const actionData = {
			data: {
				activityId: this.activityId,
				ownerTypeId: this.ownerTypeId,
				ownerId: this.ownerId,
				jobId: this.jobId,
			},
		};

		return BX.ajax.runAction(this.aiDataAction, actionData);
	}

	showError(response)
	{
		UI.Notification.Center.notify({
			content: response.errors[0].message,
			autoHideDelay: 5000,
		});
	}

	prepareAiJobResult(response: Object): string
	{
		return '';
	}

	prepareAudioProps(response: Object): Object
	{
		const callRecord = response.data.callRecord;

		return {
			id: callRecord.id,
			src: callRecord.src,
			title: callRecord.title,
			context: window.top,
		};
	}

	getTextboxAttentions(): Array
	{
		const attentions = [this.getNotAccurateAttention()];

		const jobLanguageAttention = this.getJobLanguageAttention();
		if (jobLanguageAttention !== null)
		{
			attentions.push(jobLanguageAttention);
		}

		return attentions;
	}

	getNotAccurateAttention(): Attention
	{
		const helpdeskCode = '20412666';

		const content = Loc.getMessage(this.getNotAccuratePhraseCode(), {
			'[helpdesklink]': `<a href="##" onclick="top.BX.Helper.show('redirect=detail&code=${helpdeskCode}');">`,
			'[/helpdesklink]': '</a>',
		});

		return new Attention({
			content,
		});
	}

	getJobLanguageAttention(): ?Attention
	{
		if (!Type.isStringFilled(this.languageTitle))
		{
			return null;
		}

		const helpdeskCode = '20423978';
		const content = Loc.getMessage('CRM_COPILOT_CALL_JOB_LANGUAGE_ATTENTION', {
			'#LANGUAGE_TITLE#': `<span style="text-transform: lowercase">${Text.encode(this.languageTitle)}</span>`,
			'[helpdesklink]': `<a href="##" onclick="top.BX.Helper.show('redirect=detail&code=${helpdeskCode}');">`,
			'[/helpdesklink]': '</a>',
		});

		return new Attention({
			preset: AttentionPresets.COPILOT,
			content,
		});
	}

	getTopElementNode(): ?HTMLElement
	{
		if (this.activityProvider === ActivityProvider.call)
		{
			this.topElementNode = Tag.render`<div id="crm-textbox-audio-player"></div>`;

			// by default, we attach audio player to the top element node
			this.audioPlayerApp = new AudioPlayer({
				rootNode: this.topElementNode,
			});
		}
		else if (this.activityProvider === ActivityProvider.openLine)
		{
			this.topElementNode = Tag.render`<div id="crm-textbox-top-container"></div>`;
		}

		return this.topElementNode;
	}

	getOpenLineElementNode(openlineData: { dialogId: string, name: string}): HTMLElement
	{
		const openMessengerSliderFn = (dialogId) => {
			return () => {
				if (Type.isStringFilled(dialogId))
				{
					top.BXIM.openMessenger(dialogId);
				}
				else
				{
					throw new Error('Dialog ID is empty');
				}
			};
		};
		const element = Tag.render`
			<div onclick="${openMessengerSliderFn(openlineData.dialogId)}">
				${openlineData.name}
			</div>
		`;

		Dom.addClass(element, 'openline-element-container');

		return element;
	}

	getNotAccuratePhraseCode(): string
	{
		return '';
	}

	getSliderTitle(): string
	{
		return '';
	}

	getTextboxTitle(): string
	{
		return '';
	}

	initDefaultOptions(): void {}
}
