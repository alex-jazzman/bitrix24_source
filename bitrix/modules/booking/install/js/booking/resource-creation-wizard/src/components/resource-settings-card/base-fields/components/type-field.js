import { Text } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Dialog } from 'ui.entity-selector';
import { EntitySelectorEntity } from 'booking.const';
import { ResourceTypeModel } from 'booking.model.resource-types';
import { resourceTypeService } from 'booking.provider.service.resources-type-service';
import { UiErrorMessage } from 'booking.component.ui-error-message';

// @vue/component
export const TypeField = {
	name: 'ResourceTypeField',
	components: {
		UiErrorMessage,
	},
	props: {
		initialTypeId: {
			type: [Number, String],
			default: null,
		},
		initialTypeName: {
			type: String,
			default: '',
		},
		invalid: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['typeUpdate'],
	data(): Object
	{
		return {
			entityId: EntitySelectorEntity.ResourceType,
			typeSelectorId: `booking-resource-creation-types${Text.getRandom()}`,
			typeName: this.initialTypeName,
		};
	},
	methods: {
		showTypeSelector(): void
		{
			const dialog = this.getTypeSelectorDialog(this.$refs.typeSelectorAngle);
			dialog.show();
		},
		getTypeSelectorDialog(bindElement: HTMLElement): Dialog
		{
			const existing = Dialog.getById(this.typeSelectorId);
			if (existing)
			{
				existing.setTargetNode(bindElement);

				return existing;
			}

			return new Dialog({
				id: this.typeSelectorId,
				targetNode: bindElement,
				width: 300,
				height: 400,
				enableSearch: true,
				dropdownMode: true,
				context: 'bookingResourceCreationType',
				multiple: false,
				cacheable: true,
				preselectedItems: [[this.entityId, this.initialTypeId]],
				entities: [{ id: this.entityId, dynamicLoad: true, dynamicSearch: true }],
				popupOptions: {
					targetContainer: this.$root.$el.querySelector('.resource-creation-wizard__wrapper'),
				},
				searchOptions: {
					allowCreateItem: true,
					footerOptions: { label: this.loc('BRCW_SETTINGS_CARD_TYPE_SELECTOR_CREATE_BTN') },
				},
				events: {
					'Search:onItemCreateAsync': (event: BaseEvent) => {
						return new Promise((resolve) => {
							const query = event.getData().searchQuery.getQuery();
							this.createType(query)
								.then((type) => {
									this.updateResourceType(type.id, type.name);
									event.getTarget().addItem(this.prepareTypeToDialog(type));
									event.getTarget().hide();
									resolve();
								})
								.catch(() => resolve());
						});
					},
					'Item:onSelect': (event: BaseEvent) => {
						const item = event.getData().item;
						this.updateResourceType(item.getId(), item.getTitle());
					},
				},
			});
		},
		async createType(name: string): Promise<ResourceTypeModel>
		{
			return resourceTypeService.add({ moduleId: 'booking', name });
		},
		prepareTypeToDialog(type: ResourceTypeModel): ItemOptions
		{
			return {
				id: type.id,
				entityId: this.entityId,
				title: type.name,
				sort: 1,
				selected: true,
				tabs: 'recents',
				supertitle: this.loc('BRCW_SETTINGS_CARD_TYPE_SELECTOR_SUPER_TITLE'),
				avatar: '/bitrix/js/booking/images/entity-selector/resource-type.svg',
			};
		},
		updateResourceType(typeId: number, typeName: string): void
		{
			this.typeName = typeName;
			this.$emit('typeUpdate', typeId);
		},
	},
	template: `
		<div class="ui-form-row booking--rcw--type-field">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">
					{{ loc('BRCW_SETTINGS_CARD_TYPE_LABEL') }}
				</div>
			</div>
			<div class="ui-form-content booking--rcw--field-with-validation">
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
					<div ref="typeSelectorAngle" class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						data-id="brcw-settings-resource-type-selector"
						class="ui-ctl-element resource-creation-wizard__form-settings-element"
						:class="{'--placeholder': !typeName, '--error': invalid}"
						@click="showTypeSelector"
					>
						{{ typeName || loc('BRCW_SETTINGS_CARD_TYPE_PLACEHOLDER') }}
					</div>
				</div>
				<UiErrorMessage
					v-if="invalid"
					:message="loc('BRCW_SETTINGS_CARD_REQUIRED_FIELD')"
				/>
			</div>
		</div>
	`,
};
