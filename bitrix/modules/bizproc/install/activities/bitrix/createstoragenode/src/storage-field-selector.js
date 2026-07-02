import { ref } from 'ui.vue3';
import { Runtime } from 'main.core';
import type { StorageFieldProp } from './types';

export const StorageFieldSelector = {
	name: 'StorageFieldSelector',
	props: {
		field: {
			type: [Object, Array],
			required: true,
		},
	},
	setup(
		{ field }: { field: StorageFieldProp },
	): Object
	{
		const initialItems = Array.isArray(field?.value) ? [...field.value] : [];
		const items = ref(initialItems);
		const options = field?.property?.Options || {};

		const onRemoveField = (index: number): void => {
			items.value.splice(index, 1);
		};

		const onAddFieldClick = async (): Promise<void> => {
			try
			{
				const { Router } = await Runtime.loadExtension('bizproc.router');
				Router.openStorageFieldEdit({
					requestMethod: 'get',
					requestParams: { storageId: 0, fieldId: null, skipSave: true },
					events: {
						onCloseComplete: (event) => {
							const slider = event.getSlider();
							const dictionary = slider ? slider.getData() : null;
							if (dictionary && dictionary.has('data'))
							{
								items.value.push(dictionary.get('data'));
							}
						},
					},
				});
			}
			catch (error)
			{
				console.error(error);
			}
		};

		const onCopyCode = (code: string): void => {
			BX.clipboard.copy(code);
			BX.UI.Notification.Center.notify({
				content: options.copyNotification ?? '',
			});
		};

		const jsonStringify = (val: Object): string => JSON.stringify(val);

		return { items, options, onAddFieldClick, onRemoveField, onCopyCode, jsonStringify };
	},
	template: `
		<div class="storage-fields">
			<div class="bizproc-create-storage__outer-block">

				<div class="bizproc-create-storage__fields-container">
					<div v-for="(item, index) in items" :key="index" class="bizproc-create-storage__field-row">
						<input
							type="hidden"
							name="SelectedFields[]"
							:value="jsonStringify(item)"
						>
						<div class="bizproc-create-storage__field-row-content">
		                      <span class="bizproc-create-storage__field-name">
		                         {{ item.name }}
		                      </span>
							<a
								href="#"
								class="storage-fields__code-button"
								:title="item.code"
								@click.prevent="onCopyCode(item.code)"
							>
								{{ options.codeCaption ?? '' }}
							</a>
							<div class="bizproc-create-storage__delete-button" @click="onRemoveField(index)">
								<div class="ui-icon-set --cross-m"></div>
							</div>
						</div>
					</div>
				</div>

				<div class="node-settings-add-field-button" @click="onAddFieldClick">
					<div class="ui-icon-set --plus-m bizproc-create-storage__icon-plus"></div>
					<span>{{ field.property.Name }}</span>
				</div>

			</div>
		</div>
	`,
};
