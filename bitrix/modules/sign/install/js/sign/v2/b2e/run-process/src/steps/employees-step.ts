import { Dom, Extension, Loc, Tag } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Alert, AlertDesign } from 'ui.system.alert';
import { Text } from 'ui.system.typography';

import { MemberRole } from 'sign.type';
import { Api, type ProcessStartMember } from 'sign.v2.api';
import { UserParty } from 'sign.v2.b2e.user-party';

import { type RunProcessStore } from '../store';
import {
	normalizeMembers,
	type SelectedEntity,
} from './employees-selection';
import { type FormError, readErrors } from './parameters-form';

import './employees-step.css';

const EXTENSION_NAME = 'sign.v2.b2e.run-process';

const RECOUNT_DELAY = 100;

const SELECTION_EVENTS = [
	'BX.UI.EntitySelector.TagSelector:onAfterTagAdd',
	'BX.UI.EntitySelector.TagSelector:onAfterTagRemove',
	'BX.Sign.V2.B2E.UserPartyRefused:onChange',
] as const;

export type EmployeesStepOptions = {
	title: string,
	store: RunProcessStore,
	onLaunchRefused: (errors: FormError[]) => boolean,
};

export class EmployeesStep
{
	readonly title: string;

	#store: RunProcessStore;
	#onLaunchRefused: (errors: FormError[]) => boolean;
	#api: Api = new Api();
	#userParty: UserParty;
	#container: HTMLElement;
	#errorBox: HTMLElement;
	#noticeBox: HTMLElement;
	#recountTimeout: ReturnType<typeof setTimeout> | null = null;
	#recountToken: number = 0;
	#unsubscribe: Array<() => void> = [];

	constructor(options: EmployeesStepOptions)
	{
		this.title = options.title;
		this.#store = options.store;
		this.#onLaunchRefused = options.onLaunchRefused;

		// UserParty reads region at runtime, but its Flow options do not declare the field.
		const region = getRegion();
		const partyOptions = {
			mode: 'edit',
			region,
			b2eSignersLimitCount: null,
			preselectedUserIds: [] as [],
			preselectedSigners: null,
			role: MemberRole.signer,
		};
		this.#userParty = new UserParty(partyOptions);

		this.#errorBox = Tag.render`<div class="sign-b2e-run-process-employees__errors"></div>`;
		this.#noticeBox = Tag.render`
			<div
				class="sign-b2e-run-process-employees__notice"
				data-testid="sign-b2e-run-process-exclusion"
			></div>
		`;
		this.#container = Tag.render`
			<div
				class="sign-b2e-run-process__step sign-b2e-run-process-employees"
				data-testid="sign-b2e-run-process-step-employees"
			>
				${this.#errorBox}
				${this.#userParty.getLayout(region)}
				${this.#noticeBox}
			</div>
		`;

		this.#subscribe();
	}

	get content(): HTMLElement
	{
		return this.#container;
	}

	async beforeCompletion(): Promise<boolean>
	{
		if (!this.#store.canLaunch)
		{
			this.#explainRefusedLaunch();

			return false;
		}

		this.#clearErrors();
		this.#store.setLaunching(true);

		try
		{
			const { launchId } = await this.#api.process.start(
				this.#store.process?.id ?? 0,
				this.#store.members,
				this.#store.parameters,
				this.#userParty.isRejectExcludedEnabled(),
			);
			this.#store.setLaunchId(launchId);
			this.#store.setLaunching(false);

			return true;
		}
		catch (exception)
		{
			this.#store.setLaunching(false);
			this.#showLaunchErrors(readErrors(exception));

			return false;
		}
	}

	destroy(): void
	{
		this.#recountToken += 1;

		if (this.#recountTimeout !== null)
		{
			clearTimeout(this.#recountTimeout);
			this.#recountTimeout = null;
		}

		this.#unsubscribe.forEach((unsubscribe: () => void) => unsubscribe());
		this.#unsubscribe = [];
		this.#userParty.closeCounterGuide();
	}

	#subscribe(): void
	{
		const recount = (): void => this.#scheduleRecount();

		SELECTION_EVENTS.forEach((eventName: string) => {
			EventEmitter.subscribe(eventName, recount);
			this.#unsubscribe.push(() => EventEmitter.unsubscribe(eventName, recount));
		});
	}

	#scheduleRecount(): void
	{
		this.#recountToken += 1;

		if (this.#recountTimeout !== null)
		{
			clearTimeout(this.#recountTimeout);
		}

		const members = normalizeMembers(this.#userParty.getEntities() as SelectedEntity[]);
		const excludeRefused = this.#userParty.isRejectExcludedEnabled();
		this.#store.setMembers(members);
		this.#store.setCountPending(members.length > 0);
		this.#clearErrors();
		this.#renderNotice();

		if (members.length === 0)
		{
			this.#recountTimeout = null;

			return;
		}

		const token = this.#recountToken;
		this.#recountTimeout = setTimeout(() => {
			this.#recountTimeout = null;
			void this.#recount(token, members, excludeRefused);
		}, RECOUNT_DELAY);
	}

	async #recount(token: number, members: ProcessStartMember[], excludeRefused: boolean): Promise<void>
	{
		try
		{
			const countResult = await this.#api.getUniqUserCountForMembers(members, excludeRefused);
			if (token !== this.#recountToken)
			{
				return;
			}

			this.#store.setCountResult(countResult);
			this.#store.setCountPending(false);
			this.#renderNotice();
		}
		catch
		{
			if (token === this.#recountToken)
			{
				this.#store.setCountPending(false);
			}
		}
	}

	#renderNotice(): void
	{
		Dom.clean(this.#noticeBox);

		const message = this.#getNoticeMessage();
		if (message === null)
		{
			return;
		}

		const design = this.#store.isNobodyLeft ? AlertDesign.tintedAlert : AlertDesign.tintedWarning;
		Dom.append(renderMessage(message, design), this.#noticeBox);
	}

	#getNoticeMessage(): string | null
	{
		if (this.#store.isNobodyLeft)
		{
			return Loc.getMessage('SIGN_B2E_RUN_PROCESS_EMPLOYEES_NOBODY_LEFT') ?? null;
		}

		if (this.#store.hasExclusion)
		{
			return Loc.getMessage('SIGN_B2E_RUN_PROCESS_EMPLOYEES_EXCLUDED', {
				'#EXCLUDED_COUNT#': String(this.#store.excludedCount),
				'#LAUNCH_COUNT#': String(this.#store.launchCount),
			}) ?? null;
		}

		return null;
	}

	#showLaunchErrors(errors: FormError[]): void
	{
		if (this.#onLaunchRefused(errors))
		{
			return;
		}

		errors
			.filter((error: FormError) => error.name === '')
			.forEach((error: FormError) => {
				Dom.append(renderMessage(error.message, AlertDesign.tintedAlert), this.#errorBox);
			})
		;
	}

	#explainRefusedLaunch(): void
	{
		if (this.#store.members.length > 0)
		{
			return;
		}

		this.#clearErrors();
		Dom.append(
			renderMessage(
				Loc.getMessage('SIGN_B2E_RUN_PROCESS_EMPLOYEES_NOBODY_CHOSEN') ?? '',
				AlertDesign.tintedAlert,
			),
			this.#errorBox,
		);
	}

	#clearErrors(): void
	{
		Dom.clean(this.#errorBox);
	}
}

function renderMessage(message: string, design: string): HTMLElement
{
	const alert = new Alert({ design, content: Text.render(message, { size: '2xs', tag: 'div' }) });

	return Tag.render`<div role="alert">${alert.render()}</div>`;
}

function getRegion(): string
{
	return Extension.getSettings(EXTENSION_NAME).get('region') ?? '';
}
