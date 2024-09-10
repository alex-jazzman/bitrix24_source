import { ajax, Loc, Text } from 'main.core';
import { UI } from 'ui.notification';
import { StubNotAvailable, StubType, StubLinkType } from 'ui.sidepanel-content';
import { SetupMember, Role, MemberRole } from './type';
import type {
	LoadedDocumentData,
	Communication,
	BlockData,
	LoadedBlock,
} from './type';

export type { SetupMember, Role };
export { MemberRole };

export class Api
{
	#post(endpoint: string, data: Object = null, notifyError: boolean): Promise<Object>
	{
		return this.#request('POST', endpoint, data, notifyError);
	}

	async #request(
		method: string,
		endpoint: string,
		data: ?Object,
		notifyError: ?boolean = true,
	): Promise<Object>
	{
		const config = { method };
		if (method === 'POST')
		{
			Object.assign(config, { data }, {
				preparePost: false,
				headers: [{
					name: 'Content-Type',
					value: 'application/json',
				}],
			});
		}

		try
		{
			const response = await ajax.runAction(endpoint, config);
			if (response.errors?.length > 0)
			{
				throw new Error(response.errors[0].message);
			}

			return response.data;
		}
		catch (ex)
		{
			if (!notifyError)
			{
				return ex;
			}

			const { message = `Error in ${endpoint}`, errors = [] } = ex;
			const errorCode = errors[0]?.code ?? '';

			if (errorCode === 'SIGN_CLIENT_CONNECTION_ERROR')
			{
				const stub = new StubNotAvailable({
					title: Loc.getMessage('SIGN_JS_V2_API_ERROR_CLIENT_CONNECTION_TITLE'),
					desc: Loc.getMessage('SIGN_JS_V2_API_ERROR_CLIENT_CONNECTION_DESC'),
					type: StubType.noConnection,
					link: {
						text: Loc.getMessage('SIGN_JS_V2_API_ERROR_CLIENT_CONNECTION_LINK_TEXT'),
						value: '18740976',
						type: StubLinkType.helpdesk,
					},
				});
				stub.openSlider();

				throw ex;
			}

			if (errorCode === 'LICENSE_LIMITATIONS')
			{
				top.BX.UI.InfoHelper.show('limit_office_e_signature_box');

				throw ex;
			}

			if (errorCode === 'SIGN_DOCUMENT_INCORRECT_STATUS')
			{
				const stub = new StubNotAvailable({
					title: Loc.getMessage('SIGN_DOCUMENT_INCORRECT_STATUS_STUB_TITLE'),
					desc: Loc.getMessage('SIGN_DOCUMENT_INCORRECT_STATUS_STUB_DESC'),
					type: StubType.notAvailable,
				});
				stub.openSlider();

				//close previous slider (with editor)
				const slider = BX.SidePanel.Instance.getTopSlider();
				const onSliderCloseHandler = (e: BX.SidePanel.Event): void => {
					if (slider !== e.getSlider())
					{
						return;
					}

					window.top.BX.removeCustomEvent(
						slider.getWindow(),
						'SidePanel.Slider:onClose',
						onSliderCloseHandler,
					);

					const sliders = window.top.BX.SidePanel.Instance.getOpenSliders();
					for (let i = sliders.length - 2; i >= 0; i--)
					{
						if (sliders[i].getUrl().startsWith('/sign/doc/'))
						{
							sliders[i].close();
							return;
						}
					}

				};

				window.top.BX.addCustomEvent(slider.getWindow(), 'SidePanel.Slider:onClose', onSliderCloseHandler);

				throw ex;
			}

			if (errorCode === 'B2E_RESTRICTED_ON_TARIFF' || errorCode === 'B2E_SIGNERS_LIMIT_REACHED_ON_TARIFF')
			{
				top.BX.UI.InfoHelper.show('limit_office_e_signature');

				throw ex;
			}

			const content = errors[0]?.message ?? message;
			UI.Notification.Center.notify({
				content: Text.encode(content),
				autoHideDelay: 4000,
			});

			throw ex;
		}
	}

	register(blankId: string, scenarioType: string | null = null): Promise<{ uid: string; }>
	{
		return this.#post('sign.api_v1.document.register', { blankId, scenarioType });
	}

	upload(uid: string): Promise<[]>
	{
		return this.#post('sign.api_v1.document.upload', { uid });
	}

	getPages(uid: string): Promise<Array<{ url: string; }>>
	{
		return this.#post('sign.api_v1.document.pages.list', { uid }, false);
	}

	loadBlanks(page: number, scenario: string | null = null): Promise<Array<{ title: string; id: number }>>
	{
		return this.#post('sign.api_v1.document.blank.list', { page, scenario });
	}

	createBlank(files: Array<string>, scenario: string | null = null): Promise<{ id: number; }>
	{
		return this.#post('sign.api_v1.document.blank.create', { files, scenario });
	}

	saveBlank(documentUid: string, blocks: []): Promise<[]>
	{
		return this.#post('sign.api_v1.document.blank.block.save', { documentUid, blocks }, false);
	}

	loadBlocksData(documentUid: string, blocks: []): Promise<BlockData>
	{
		return this.#post('sign.api_v1.document.blank.block.loadData', { documentUid, blocks });
	}

	changeDocument(uid: string, blankId: number): Promise<{ uid: string; }>
	{
		return this.#post('sign.api_v1.document.changeBlank', { uid, blankId });
	}

	changeDocumentLanguages(uid: string, lang: string): Promise
	{
		return this.#post('sign.api_v1.document.changeDocumentLanguages', { uid, lang });
	}

	changeRegionDocumentType(uid: string, type: string): Promise<{ status: string; data: []; errors: string[]; }>
	{
		return this.#post('sign.api_v1.document.modifyRegionDocumentType', { uid, type });
	}

	changeExternalId(uid: string, id: string): Promise<{ status: string; data: []; errors: string[]; }>
	{
		return this.#post('sign.api_v1.document.modifyExternalId', { uid, id });
	}

	changeExternalDate(uid: string, externalDate: string): Promise<{ status: string; data: []; errors: string[]; }>
	{
		return this.#post('sign.api_v1.document.modifyExternalDate', { uid, externalDate });
	}

	loadDocument(uid: string): Promise<LoadedDocumentData>
	{
		return this.#post('sign.api_v1.document.load', { uid });
	}

	configureDocument(uid: string): Promise<[]>
	{
		return this.#post('sign.api_v1.document.configure', { uid });
	}

	loadBlocksByDocument(documentUid: string): Promise<Array<LoadedBlock>>
	{
		return this.#post('sign.api_v1.document.blank.block.loadByDocument', {
			documentUid,
		});
	}

	startSigning(uid: string): Promise<[]>
	{
		return this.#post('sign.api_v1.document.signing.start', { uid });
	}

	addMember(
		documentUid: string,
		entityType: string,
		entityId: number,
		party: number,
		presetId: number,
	): Promise<{ uid: string; }>
	{
		return this.#post('sign.api_v1.document.member.add', {
			documentUid,
			entityType,
			entityId,
			party,
			presetId,
		});
	}

	removeMember(uid: string): Promise<[]>
	{
		return this.#post('sign.api_v1.document.member.remove', { uid });
	}

	loadMembers(documentUid: string): Promise<Array<{ entityId: number; uid: string; }>>
	{
		return this.#post('sign.api_v1.document.member.load', { documentUid });
	}

	modifyCommunicationChannel(
		uid: string,
		channelType: string,
		channelValue: string,
	): Promise<[]>
	{
		return this.#post('sign.api_v1.document.member.modifyCommunicationChannel', {
			uid,
			channelType,
			channelValue,
		});
	}

	loadCommunications(uid: String): Promise<Array<Communication>>
	{
		return this.#post('sign.api_v1.document.member.loadCommunications', { uid });
	}

	modifyTitle(uid: string, title: string): Promise<{blankTitle: string}>
	{
		return this.#post('sign.api_v1.document.modifyTitle', {
			uid,
			title,
		});
	}

	modifyInitiator(uid: string, initiator: string): Promise<[]>
	{
		return this.#post('sign.api_v1.document.modifyInitiator', {
			uid,
			initiator,
		});
	}

	modifyLanguageId(uid: string, langId: string): Promise
	{
		return this.#post('sign.api_v1.document.modifyLangId', {
			uid,
			langId,
		});
	}

	loadLanguages(): Promise
	{
		return this.#post('sign.api_v1.document.loadLanguage');
	}

	refreshEntityNumber(documentUid: string): Promise<[]>
	{
		return this.#post('sign.api_v1.document.refreshEntityNumber', {
			documentUid,
		});
	}

	changeDomain(): Promise
	{
		return this.#post('sign.api_v1.portal.changeDomain');
	}

	loadRestrictions(): Promise<{ smsAllowed: boolean; }>
	{
		return this.#post('sign.api_v1.portal.hasRestrictions');
	}

	saveStamp(memberUid: String, fileId: string): Promise<{ id: number; srcUri: string; }>
	{
		return this.#post('sign.api_v1.document.member.saveStamp', {
			memberUid, fileId,
		});
	}

	setupB2eParties(
		documentUid: string,
		representativeId: number,
		members: Array<SetupMember>,
	): Promise
	{
		return this.#post('sign.api_v1.document.member.setupB2eParties', {
			documentUid, representativeId, members,
		});
	}

	updateChannelTypeToB2eMembers(
		membersUids: Array<string>,
		channelType: string,
	): Promise
	{
		return this.#post('sign.api_v1.b2e.member.communication.updateMembersChannelType', {
			members: membersUids,
			channelType,
		});
	}

	loadB2eCompanyList(): Promise
	{
		return this.#post('sign.api_v1.integration.crm.b2ecompany.list');
	}

	modifyB2eCompany(documentUid: string, companyUid: string): Promise
	{
		return this.#post('sign.api_v1.document.modifyCompany', {
			documentUid, companyUid,
		});
	}

	modifyB2eDocumentScheme(uid: string, scheme: string): Promise
	{
		return this.#post('sign.api_v1.document.modifyScheme', {
			uid, scheme,
		});
	}

	loadB2eAvaialbleSchemes(documentUid: string): Promise
	{
		return this.#post('sign.api_v1.b2e.scheme.load', {
			documentUid,
		});
	}

	deleteB2eCompany(id: string): Promise
	{
		return this.#post('sign.api_v1.integration.crm.b2ecompany.delete', {
			id,
		});
	}

	getLinkForSigning(memberId: number, notifyError: boolean = true): Promise
	{
		return this.#post('sign.api_v1.b2e.member.link.getLinkForSigning', {
			memberId,
		}, notifyError);
	}

	memberLoadReadyForMessageStatus(memberIds: Array<number>): Promise
	{
		return this.#post('sign.api_v1.document.send.getMembersForResend', {
			memberIds,
		});
	}

	memberResendMessage(memberIds: Array<number>): Promise
	{
		return this.#post('sign.api_v1.document.send.resendMessage', {
			memberIds,
		});
	}

	getBlankById(id: number): Promise<{id: number, title: string, scenario: string}>
	{
		return this.#post('sign.api_v1.document.blank.getById', { id });
	}

	registerB2eCompany(providerCode: string, taxId: string): Promise<{ id: number }>
	{
		return this.#post('sign.api_v1.integration.crm.b2ecompany.register', {
			providerCode, taxId,
		});
	}

	setDecisionToSesB2eAgreement(): Promise<{decision: string}>
	{
		return this.#post('sign.api_v1.b2e.member.communication.setAgreementDecision', {});
	}

	getDocumentFillAndStartProgress(uid: string): Promise<{completed: boolean, progress: Number}>
	{
		return this.#post('sign.api_v1.document.getFillAndStartProgress', { uid });
	}
}
