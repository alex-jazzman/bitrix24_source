import { Dom, Loc, Tag, Type } from 'main.core';
import { Api, MemberRole, type SetupMember } from 'sign.v2.api';
import './style.css';
import { ProviderCode } from 'sign.v2.b2e.company-selector';
import { DocumentSend } from 'sign.v2.b2e.document-send';
import { DocumentSetup } from 'sign.v2.b2e.document-setup';
import { Parties as CompanyParty } from 'sign.v2.b2e.parties';
import { UserParty } from 'sign.v2.b2e.user-party';
import { SectionType } from 'sign.v2.editor';
import { type SignOptions, SignSettings } from 'sign.v2.sign-settings';
import type { Metadata } from 'ui.wizard';

export class B2ESignSettings extends SignSettings
{
	#companyParty: CompanyParty;
	#userParty: UserParty;
	#api: Api;

	constructor(containerId: string, signOptions: SignOptions)
	{
		super(containerId, signOptions, {
			next: { className: 'ui-btn-success' },
			complete: { className: 'ui-btn-success' },
			swapButtons: true,
		});
		const { config } = signOptions;
		const { blankSelectorConfig, documentSendConfig, userPartyConfig } = config;
		this.documentSetup = new DocumentSetup(blankSelectorConfig);
		this.documentSend = new DocumentSend(documentSendConfig);
		this.#companyParty = new CompanyParty(blankSelectorConfig.region);
		this.#api = new Api();
		this.#userParty = new UserParty({ mode: 'edit', ...userPartyConfig });
		this.subscribeOnEvents();
	}

	subscribeOnEvents(): void
	{
		super.subscribeOnEvents();
		this.documentSend.subscribe('changeTitle', ({ data }) => {
			this.documentSetup.setDocumentTitle(data.title);
		});
		this.documentSend.subscribe('disableBack', () => {
			this.wizard.toggleBtnActiveState('back', true);
		});
		this.documentSend.subscribe('enableBack', () => {
			this.wizard.toggleBtnActiveState('back', false);
		});
	}

	async #setupParties()
	{
		const { uid } = this.documentSetup.setupData;
		const companyData = this.#companyParty.getParties();
		const { representative, company, validation } = companyData;
		const { entityId: companyId } = company;
		const { entityId: representativeId } = representative;
		const userPartyIds = this.#userParty.getUserIds();
		let currentParty = 1;
		const members = validation.map((item) => ({ ...item, party: currentParty++ }));
		members.push(this.#getAssignee(currentParty, companyId));
		currentParty++;
		members.push(...userPartyIds.map(userId => this.#getSigner(currentParty, userId)));
		try
		{
			await this.#api.setupB2eParties(uid, representativeId, members);
		}
		catch (ex)
		{
			throw ex;
		}

		const membersData = await this.#api.loadMembers(uid);
		if (!Type.isArrayFilled(membersData))
		{
			throw new Error();
		}

		return membersData.map((memberData) => {
			return {
				presetId: memberData?.presetId,
				part: memberData?.party,
				uid: memberData?.uid,
				entityTypeId: memberData?.entityTypeId ?? null,
				entityId: memberData?.entityId ?? null,
				role: memberData?.role ?? null,
			};
		});
	}

	#getAssignee(currentParty: number, companyId: number): SetupMember
	{
		return {
			entityType: 'company',
			entityId: companyId,
			party: currentParty,
			role: MemberRole.assignee,
		};
	}

	#getSigner(currentParty: number, userId: number): SetupMember
	{
		return {
			entityType: 'user',
			entityId: userId,
			party: currentParty,
			role: MemberRole.signer,
		};
	}

	#reflowLayout(layout: HTMLElement)
	{
		this.#wrapContent(layout);
		document.documentElement.scrollTop = 0;
	}

	#wrapContent(layout: HTMLElement)
	{
		const layoutItems = [...layout.children].filter((child) => {
			return Dom.hasClass(child, 'sign-b2e-settings__item');
		});
		const hasCounter = layoutItems.some((node) => {
			return Dom.hasClass(node.firstElementChild, 'sign-b2e-settings__counter');
		});
		if (hasCounter)
		{
			return;
		}

		layoutItems.forEach((node, index) => {
			const connectionNode = index === layoutItems.length - 1
				? Tag.render`<span class="sign-b2e-settings__counter_connect">`
				: null;
			const counter = Tag.render`
				<div class="sign-b2e-settings__counter">
					<span class="sign-b2e-settings__counter_num" data-num="${index + 1}"></span>
					${connectionNode}
				</div>
			`;
			Dom.prepend(counter, node);
		});
	}

	#parseMembers(loadedMembers: SetupMember[]): { [$Keys<typeof MemberRole>]: number[]; }
	{
		return loadedMembers.reduce((acc, member) => {
			const { entityType, entityId } = member;
			if (entityType !== 'user')
			{
				return acc;
			}

			const role = `${member.role}s`;

			return {
				...acc,
				[role]: [
					...acc[role] ?? [],
					entityId,
				],
			};
		}, {});
	}

	async applyDocumentData(uid: string): Promise<boolean>
	{
		const setupData = await this.setupDocument(uid, true);
		if (!setupData)
		{
			return false;
		}

		const { entityId, representativeId, companyUid } = setupData;
		this.documentSend.documentData = setupData;
		this.editor.documentData = setupData;
		this.#companyParty.setEntityId(entityId);
		if (companyUid)
		{
			this.#companyParty.loadCompany(companyUid);
		}

		if (representativeId)
		{
			this.#companyParty.loadRepresentative(representativeId);
		}

		const members = await this.#api.loadMembers(uid);
		const parsedMembers = this.#parseMembers(members);
		const { signers = [], reviewers = [], editors = [] } = parsedMembers;
		if (signers.length > 0)
		{
			this.#userParty.load(signers);
		}

		if (reviewers.length > 0)
		{
			this.#companyParty.loadValidator(reviewers[0], MemberRole.reviewer);
		}

		if (editors.length > 0)
		{
			this.#companyParty.loadValidator(editors[0], MemberRole.editor);
		}

		return true;
	}

	getStepsMetadata(): Metadata
	{
		const signSettings = this;

		return {
			setup: {
				get content()
				{
					const layout = signSettings.documentSetup.layout;
					signSettings.#reflowLayout(layout);

					return layout;
				},
				title: Loc.getMessage('SIGN_SETTINGS_B2B_LOAD_DOCUMENT'),
				beforeCompletion: async () => {
					const isValid = this.documentSetup.validate();
					if (!isValid)
					{
						return false;
					}

					const setupData = await this.setupDocument();
					if (!setupData)
					{
						return false;
					}

					this.#companyParty.setEntityId(setupData.entityId);

					return true;
				},
			},
			company: {
				get content()
				{
					const layout = signSettings.#companyParty.getLayout();
					signSettings.#reflowLayout(layout);

					return layout;
				},
				title: Loc.getMessage('SIGN_SETTINGS_B2E_COMPANY'),
				beforeCompletion: async () => {
					const { uid } = this.documentSetup.setupData;
					try
					{
						await this.#companyParty.save(uid);
					}
					catch
					{
						return false;
					}

					return true;
				},
			},
			employees: {
				title: Loc.getMessage('SIGN_SETTINGS_B2E_EMPLOYEES'),
				get content()
				{
					const layout = signSettings.#userParty.getLayout();
					signSettings.#reflowLayout(layout);

					return layout;
				},
				beforeCompletion: async () => {
					try
					{
						const isValid = this.#userParty.validate();
						if (!isValid)
						{
							return isValid;
						}

						const entityData = await this.#setupParties();
						const { uid, title, isTemplate, externalId, entityId } = this.documentSetup.setupData;
						const blocks = await this.documentSetup.loadBlocks(uid);
						const partiesData = this.#companyParty.getParties();

						const selectedProvider = this.#companyParty.getSelectedProvider();
						this.editor.setSectionVisibilityByType(
							SectionType.SecondParty,
							selectedProvider.code !== ProviderCode.sesRu,
						);

						Object.assign(partiesData, {
							employees: this.#userParty.getUserIds().map((userId) => {
								return {
									entityType: 'user',
									entityId: userId,
								};
							}),
						});
						this.documentSend.documentData = { uid, title, blocks, externalId };
						this.documentSend.setPartiesData(partiesData);
						this.documentSend.members = entityData;
						this.editor.documentData = { isTemplate, uid, blocks, entityId };
						this.editor.entityData = entityData;
						await this.editor.waitForPagesUrls();
						await this.editor.renderDocument();
						this.wizard.toggleBtnLoadingState('next', false);
						await this.editor.show();

						return true;
					}
					catch (e)
					{
						console.error(e);

						return false;
					}
				},
			},
			send: {
				get content()
				{
					const layout = signSettings.documentSend.getLayout();
					signSettings.#reflowLayout(layout);

					return layout;
				},
				title: Loc.getMessage('SIGN_SETTINGS_SEND_DOCUMENT'),
				beforeCompletion: () => {
					return this.documentSend.sendForSign();
				},
			},
		};
	}
}
