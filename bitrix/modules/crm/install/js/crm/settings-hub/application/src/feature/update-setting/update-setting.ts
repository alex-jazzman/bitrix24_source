import { Type } from 'main.core';

import { type SettingsStateController, type UpdateSettingHandler } from '../../context/settings-state';
import {
	type SettingObjectValue,
	type SettingValue,
	type SettingsPresentation,
} from '../../infrastructure/service/settings/types';
import { settingBindingRegistry } from '../../registry/setting-binding-registry';

export type SettingsUpdateService = Readonly<{
	update: (code: string, value: SettingValue) => Promise<SettingsPresentation>,
}>;

type UpdateErrorHandler = () => void;

const ignoreUpdateError: UpdateErrorHandler = () => {};

function isSettingObjectValue(value: SettingValue): value is SettingObjectValue
{
	return Type.isPlainObject(value);
}

function applyOptimisticValues(
	presentation: SettingsPresentation,
	optimisticValues: ReadonlyMap<string, SettingValue>,
): SettingsPresentation
{
	return {
		settings: presentation.settings.map((setting) => {
			const optimisticValue = optimisticValues.get(setting.code);

			return optimisticValue === undefined
				? setting
				: { ...setting, value: optimisticValue };
		}),
	};
}

export function createUpdateSetting(
	context: SettingsStateController,
	service: SettingsUpdateService,
	onError: UpdateErrorHandler = ignoreUpdateError,
): UpdateSettingHandler
{
	const mutationQueues = new Map<string, Promise<void>>();
	const optimisticValues = new Map<string, SettingValue>();

	return async (id, projectedValue): Promise<void> => {
		const binding = settingBindingRegistry.get(id);
		const state = context.getHydrated(id);
		if (
			binding?.kind !== 'v2'
			|| state === null
			|| !state.canEdit
			|| context.isCodePending(binding.code)
		)
		{
			return;
		}

		const snapshot = state.setting;
		let value = projectedValue;
		if (binding.valuePath !== undefined)
		{
			if (!isSettingObjectValue(snapshot.value))
			{
				return;
			}

			value = { ...snapshot.value, [binding.valuePath]: projectedValue };
		}

		try
		{
			context.applyOptimisticValue(binding.code, value);
		}
		catch
		{
			return;
		}
		optimisticValues.set(binding.code, value);

		const update = async (): Promise<void> => {
			try
			{
				const presentation = await service.update(binding.code, value);
				optimisticValues.delete(binding.code);
				context.replacePresentation(applyOptimisticValues(presentation, optimisticValues));
			}
			catch
			{
				optimisticValues.delete(binding.code);
				context.restoreSnapshot(snapshot);
				onError();
			}
			finally
			{
				context.setPending(binding.code, false);
			}
		};

		context.setPending(binding.code, true);
		if (binding.mutationGroup === undefined)
		{
			await update();

			return;
		}

		const previous = mutationQueues.get(binding.mutationGroup);
		const queued = previous === undefined
			? update()
			: previous.catch(ignoreUpdateError).then(update);
		mutationQueues.set(binding.mutationGroup, queued);
		try
		{
			await queued;
		}
		finally
		{
			if (mutationQueues.get(binding.mutationGroup) === queued)
			{
				mutationQueues.delete(binding.mutationGroup);
			}
		}
	};
}
