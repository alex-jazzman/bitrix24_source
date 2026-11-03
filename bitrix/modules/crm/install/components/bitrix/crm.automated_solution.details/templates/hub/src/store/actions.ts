import { ToolbarComponent } from 'crm.toolbar-component';
import { ajax as Ajax, Runtime, Type } from 'main.core';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import { RecoverSolution, type RecoverSolutionDeps } from '../feature/recover-solution';
import { VibeService } from '../infrastructure/service/vibe-service';
import { buildSaveFields } from '../lib/save-fields/save-fields';
import { type VibeVisibility } from '../lib/vibe-state/vibe-state';
import { type Error, type StateShape } from './index';
import { normalizeId, normalizeTitle, toDescriptionValue } from './validation';

export type RecoveryPayload = {
	// Replaces the outside-world event of a recovered solution: the unit harness does not load crm.toolbar-component.
	notifyUpdated?: RecoverSolutionDeps['notifyUpdated'],
};

export type SavePayload = RecoveryPayload & {
	// The hub description field rule (normalizeHubDescription of crm.settings-hub), applied to the request copy.
	normalizeDescription?: (value: unknown) => string,
	// The hub read-only mode (the app params); without it the page section counts as hidden.
	readOnly?: boolean,
};

export default {
	setState: (store: any, stateToSet: any): void => {
		store.commit('setState', stateToSet);
	},

	setErrors: (store: any, errors: Error[]): void => {
		store.commit('setErrors', errors);
	},
	removeError: (store: any, error: Error): void => {
		store.commit('removeError', error);
	},

	setTitle: (store: any, title: string): void => {
		store.commit('setTitle', title);
	},

	setDescription: (store: any, description: string): void => {
		store.commit('setDescription', description);
	},

	addTypeId: (store: any, typeId: number): void => {
		store.commit('addTypeId', typeId);
	},
	removeTypeId: (store: any, typeId: number): void => {
		store.commit('removeTypeId', typeId);
	},

	setIsVibeEnabled: (store: any, isVibeEnabled: boolean): void => {
		store.commit('setIsVibeEnabled', isVibeEnabled);
	},

	save: (store: any, payload: SavePayload = {}): Promise<void> => {
		if (RecoverSolution.isPending(store.state))
		{
			return Promise.reject(new Error('The created automated solution is not read back yet'));
		}

		let savePromise: Promise<any> | null = null;

		const saveContext = RecoverSolution.captureContext(store.state);
		const fields = buildSaveFields(
			store.state.automatedSolution,
			payload.normalizeDescription ?? toDescriptionValue,
			resolveVibeVisibility(store.state, payload.readOnly),
		);

		if (store.getters.isNew)
		{
			savePromise = runAjaxAction('crm.automatedsolution.add', {
				data: {
					fields,
				},
			});
		}
		else
		{
			savePromise = runAjaxAction('crm.automatedsolution.update', {
				data: {
					id: store.state.automatedSolution.id,
					fields,
				},
			});
		}

		return savePromise
			.then(({ data }: any) => {
				store.dispatch('setState', {
					automatedSolution: data.automatedSolution,
				});
				emitUpdateEventToOutsideWorld(data.automatedSolution);
			})
			.catch((response: any) => {
				// eslint-disable-next-line no-console
				console.warn('could not save automated solution', { response, state: Runtime.clone(store.state) });

				const errors = Array.isArray(response?.errors) ? response.errors : [];

				// The read-back runs on its own: the save is over, only the waiting of the recovery goes on.
				void RecoverSolution.startFromSaveError(store, response, saveContext, createRecoveryDeps(payload));

				let wasErrorHandled = false;
				for (const error of errors)
				{
					if (Type.isStringFilled(error.customData?.sliderCode))
					{
						FeaturePromotersRegistry.getPromoter({ code: error.customData.sliderCode }).show();
						wasErrorHandled = true;
					}
				}

				if (!wasErrorHandled)
				{
					// to show errors in ui
					store.dispatch('setErrors', errors);
				}

				throw errors;
			});
	},

	// Repeats only the read-back of a failed recovery; the save request is never sent again.
	retryRecovery: (store: any, payload: RecoveryPayload = {}): Promise<void> => {
		return RecoverSolution.retry(store, createRecoveryDeps(payload));
	},

	delete: (store: any): Promise<void> => {
		return runAjaxAction('crm.automatedsolution.delete', {
			data: {
				id: store.state.automatedSolution.id,
			},
		})
			.then(() => {
				store.dispatch('setState', {});
				emitUpdateEventToOutsideWorld({ id: store.state.automatedSolution.id });
			})
			.catch((response: any) => {
				// eslint-disable-next-line no-console
				console.warn('could not delete automated solution', { response, state: Runtime.clone(store.state) });

				const { errors } = response;

				for (const error of errors)
				{
					if (Type.isStringFilled(error.customData?.sliderCode))
					{
						FeaturePromotersRegistry.getPromoter({ code: error.customData.sliderCode }).show();
					}
				}

				store.dispatch('setErrors', errors);

				throw errors;
			});
	},
};

function runAjaxAction(...ajaxRunActionArgs: any[]): Promise<any>
{
	// vuex don't understand BX.Promise. 'this.$store.dispatch.then' and 'subscribeAction({after})' won't work
	// wrap it in native Promise to fix it

	return new Promise((resolve, reject) => {
		Ajax.runAction(...ajaxRunActionArgs)
			.then(resolve)
			.catch(reject);
	});
}

function resolveVibeVisibility(state: StateShape, readOnly: boolean | undefined): VibeVisibility | null
{
	if (Type.isNil(readOnly))
	{
		return null;
	}

	return {
		featureEnabled: state.isVibeFeatureEnabled,
		available: state.isVibeAvailable,
		readOnly,
	};
}

function createRecoveryDeps(payload: RecoveryPayload): RecoverSolutionDeps
{
	return {
		getSolution: (id: number) => VibeService.getSolution(id),
		notifyUpdated: payload.notifyUpdated ?? emitUpdateEventToOutsideWorld,
	};
}

function emitUpdateEventToOutsideWorld({ id, title, intranetCustomSectionId }: any): void
{
	const data = {
		id: normalizeId(id),
		title: normalizeTitle(title),
		intranetCustomSectionId: normalizeId(intranetCustomSectionId),
	};

	ToolbarComponent.Instance.emitAutomatedSolutionUpdatedEvent(data);
}
