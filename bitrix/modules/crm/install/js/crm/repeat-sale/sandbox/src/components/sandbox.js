import { DatetimeConverter } from 'crm.timeline.tools';
import { ajax as Ajax, Text, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { UI } from 'ui.notification';
import { TextEditor } from 'ui.text-editor';
import { TextEditorWrapperComponent } from './common/text-editor-wrapper-component';
import { ClientSelector } from './selector/client-selector';
import { SegmentSelector } from './selector/segment-selector';
import 'ui.forms';
import 'ui.layout-form';

export const Sandbox = {
	components: {
		ClientSelector,
		SegmentSelector,
		TextEditorWrapperComponent,
	},

	props: {
		segments: {
			type: Array,
			required: true,
		},
		onItemSentToAi: {
			type: Function,
			default: () => {},
		},
		textEditor: TextEditor,
	},

	data(): Object
	{
		return {
			currentEntityTypeId: BX.CrmEntityType.enumeration.deal,
			currentEntityId: null,
			currentClientId: null,
			currentClientTypeId: null,
			currentSegmentId: Type.isArrayFilled(this.segments) ? this.segments[0].id : 0,
			currentSegmentTitle: this.segments[0]?.title ?? '',
			markers: [],
			date: new Date(),
			fromPeriodDate: new Date(),
			toPeriodDate: new Date(),
			isSuitableItem: null,
			suitableItems: [],
		};
	},

	created()
	{
		this.clientEntityTypes = ['contact', 'company'];
		this.dealEntityTypes = ['deal'];
	},

	methods: {
		onSelectClient(data: Object): void
		{
			this.currentClientTypeId = BX.CrmEntityType.resolveId(data.entityId);
			this.currentClientId = data.id;

			this.isSuitableItem = null;
		},
		onSelectDeal(data: Object): void
		{
			this.currentEntityId = data.id;

			this.isSuitableItem = null;
		},
		onSelectSegment(data: Object): void
		{
			this.currentSegmentId = data.id;

			this.isSuitableItem = null;
			this.suitableItems = [];
		},
		getSegmentById(segmentId: number): ?Object
		{
			return this.segments.find((segment) => segment.id === segmentId) ?? null;
		},
		checkItem(): void
		{
			const dataParams = {
				entityId: this.currentEntityId,
				entityTypeId: BX.CrmEntityType.enumeration.deal,
				segmentId: this.currentSegmentId,
				clientId: this.currentClientId,
				clientTypeId: this.currentClientTypeId,
				date: this.getDateTimestamp(),
			};

			Ajax
				.runAction('crm.repeatsale.sandbox.checkItem', { data: dataParams })
				.then(
					({ data }) => {
						this.isSuitableItem = data.isSuitableItem;
					},
					(response) => {
						this.showError(response.errors[0].message);
					},
				)
				.catch((response) => {
					this.showError(response.errors[0].message);

					throw response;
				})
			;
		},
		checkPeriod(): void
		{
			const dataParams = {
				segmentId: this.currentSegmentId,
				fromDate: this.getFromPeriodDateTimestamp(),
				toDate: this.getToPeriodDateTimestamp(),
			};

			Ajax
				.runAction('crm.repeatsale.sandbox.checkPeriod', { data: dataParams })
				.then(
					({ data }) => {
						const { items } = data;
						this.suitableItems = items ?? [];
					},
					(response) => {
						this.showError(response.errors[0].message);
					},
				)
				.catch((response) => {
					this.showError(response.errors[0].message);

					throw response;
				})
			;
		},
		fetchMarkers(): void
		{
			const dataParams = {
				entityId: this.currentEntityId,
				entityTypeId: BX.CrmEntityType.enumeration.deal,
				segmentId: this.currentSegmentId,
				clientId: this.currentClientId,
				clientTypeId: this.currentClientTypeId,
			};

			if (!this.validateFetchMarkersParams(dataParams))
			{
				this.showError(this.fetchMarkersValidationErrorTitle);

				return;
			}

			Ajax
				.runAction('crm.repeatsale.sandbox.getMarkers', { data: dataParams })
				.then(
					({ data }) => {
						this.markers = data;
					},
					(response) => {
						this.showError(response.errors[0].message);
					},
				)
				.catch((response) => {
					this.showError(response.errors[0].message);

					throw response;
				})
			;
		},
		validateFetchMarkersParams(params: Object): boolean
		{
			let isSuccess = true;
			Object.keys(params).forEach((key: string) => {
				if (params[key] <= 0)
				{
					isSuccess = false;
				}
			});

			return isSuccess;
		},
		hideMarkers(): void
		{
			this.markers = null;
		},
		hideSuitableItems(): void
		{
			this.suitableItems = [];
		},
		showDatePicker(): void
		{
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.calendar({
				node: this.$refs.datePicker,
				bTime: false,
				bHideTime: true,
				bSetFocus: false,
				value: DateTimeFormat.format(DatetimeConverter.getSiteDateTimeFormat(), this.getDateTimestamp()),
				callback: this.onSetDateByCalendar.bind(this),
			});
		},
		showFromPeriodDatePicker(): void
		{
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.calendar({
				node: this.$refs.fromPeriodDatePicker,
				bTime: false,
				bHideTime: true,
				bSetFocus: false,
				value: DateTimeFormat.format(DatetimeConverter.getSiteDateTimeFormat(), this.getDateTimestamp()),
				callback: this.onSetFromPeriodDateByCalendar.bind(this),
			});
		},
		showToPeriodDatePicker(): void
		{
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.calendar({
				node: this.$refs.toPeriodDatePicker,
				bTime: false,
				bHideTime: true,
				bSetFocus: false,
				value: DateTimeFormat.format(DatetimeConverter.getSiteDateTimeFormat(), this.getDateTimestamp()),
				callback: this.onSetToPeriodDateByCalendar.bind(this),
			});
		},
		onSetDateByCalendar(date: Date): void
		{
			date.setHours(0, 0, 0);
			this.date = date;
		},
		onSetFromPeriodDateByCalendar(date: Date): void
		{
			date.setHours(0, 0, 0);
			this.fromPeriodDate = date;
		},
		onSetToPeriodDateByCalendar(date: Date): void
		{
			date.setHours(0, 0, 0);
			this.toPeriodDate = date;
		},
		getDateTimestamp(): number
		{
			return (this.date?.getTime() ?? 0) / 1000;
		},
		getFromPeriodDateTimestamp(): number
		{
			return (this.fromPeriodDate?.getTime() ?? 0) / 1000;
		},
		getToPeriodDateTimestamp(): number
		{
			return (this.toPeriodDate?.getTime() ?? 0) / 1000;
		},
		sendToAi(): void
		{
			const dataParams = {
				entityId: this.currentEntityId,
				entityTypeId: BX.CrmEntityType.enumeration.deal,
				segmentId: this.currentSegmentId,
				clientId: this.currentClientId,
				clientTypeId: this.currentClientTypeId,
			};

			Ajax
				.runAction('crm.repeatsale.sandbox.sendToAi', { data: dataParams })
				.then(
					({ data }) => {
						if (Type.isArrayFilled(data.errors))
						{
							this.showError(data.errors[0].message);

							return;
						}

						this.isItemChecked = true;

						this.onItemSentToAi(data);
					},
					() => {
						this.showError();
					},
				)
				.catch((response) => {
					this.showError(response.errors[0].message);

					throw response;
				})
			;
		},
		showError(message: ?string = null): void
		{
			if (message === null)
			{
				const messageCode = 'CRM_REPEAT_SALE_SANDBOX_ERROR';
				// eslint-disable-next-line no-param-reassign
				message = this.$Bitrix.Loc.getMessage(messageCode);
			}

			UI.Notification.Center.notify({
				content: Text.encode(message),
				autoHideDelay: 6000,
			});
		},
		getItemUrl(entityTypeId: number, entityId: number): string
		{
			return BX.Crm.Router.Instance.getItemDetailUrl(entityTypeId, entityId);
		},
	},

	computed: {
		segmentSelectorTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_SEGMENT_LABEL');
		},
		clientSelectorTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_CLIENT_LABEL');
		},
		dealSelectorTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_DEAL_LABEL');
		},
		dateTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_DATE');
		},
		datePeriodTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_DATE_PERIOD');
		},
		datePeriodFromTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_DATE_PERIOD_FROM');
		},
		datePeriodToTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_DATE_PERIOD_TO');
		},
		promptTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_PROMPT_LABEL');
		},
		aiAnswerTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_AI_ANSWER_LABEL');
		},
		submitTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_GET_MARKERS');
		},
		isSuitableItemCheckTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_IS_SUITABLE_ITEM_CHECK');
		},
		isSuitableItemTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_IS_SUITABLE_ITEM', {
				'#SEGMENT_NAME#': this.currentSegmentTitle,
			});
		},
		isNotSuitableItemTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_IS_NOT_SUITABLE_ITEM', {
				'#SEGMENT_NAME#': this.currentSegmentTitle,
			});
		},
		periodCheckTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_PERIOD_CHECK');
		},
		periodCheckInfoTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_PERIOD_CHECK_INFO');
		},
		sendToAiTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_AI_SEND');
		},
		fetchMarkersValidationErrorTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_GET_MARKERS_VALIDATE_ERROR');
		},
		hideTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_HIDE');
		},
		hasFilledMarkers(): boolean
		{
			return Type.isPlainObject(this.markers) && Object.keys(this.markers).length > 0;
		},
		hasSuitableItems(): boolean
		{
			return Type.isArrayFilled(this.suitableItems);
		},
		formattedDate(): string
		{
			return DateTimeFormat.format(DatetimeConverter.getSiteDateFormat(), this.getDateTimestamp());
		},
		fromPeriodFormattedDate(): string
		{
			return DateTimeFormat.format(DatetimeConverter.getSiteDateFormat(), this.getFromPeriodDateTimestamp());
		},
		toPeriodFormattedDate(): string
		{
			return DateTimeFormat.format(DatetimeConverter.getSiteDateFormat(), this.getToPeriodDateTimestamp());
		},
	},

	watch: {
		currentSegmentId(segmentId: number): void
		{
			const segment = this.getSegmentById(segmentId);
			this.textEditor.setText(segment?.prompt ?? '');

			this.currentSegmentTitle = segment?.title ?? '';
		},
	},

	// language=Vue
	template: `
		<div class="crm-repeat-sale__sandbox_container">
			<div class="ui-form">
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text">
							{{segmentSelectorTitle}}
						</div>
					</div>
					<div class="ui-form-content">
						<SegmentSelector
							:current-segment-id="currentSegmentId"
							:segments="segments"
							@onSelectItem="onSelectSegment"
						/>
					</div>
				</div>
				
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text">
							{{promptTitle}}
						</div>
					</div>
					<div class="ui-form-content">
						<TextEditorWrapperComponent
							:textEditor="textEditor"
						/>
					</div>
				</div>
				
				<div class="crm-repeat-sale__sandbox_mode_container">
					<div class="crm-repeat-sale__sandbox_mode">
						<div class="ui-form-row">
							<div class="ui-form-label">
								<div class="ui-ctl-label-text">
									{{clientSelectorTitle}}
								</div>
							</div>
							<div class="ui-form-content">
								<ClientSelector
									:current-entity-id="currentClientId"
									:current-entity-type-id="currentClientTypeId"
									:entity-types="clientEntityTypes"
									@onSelectItem="onSelectClient"
								/>
							</div>
						</div>

						<div class="ui-form-row">
							<div class="ui-form-label">
								<div class="ui-ctl-label-text">
									{{dealSelectorTitle}}
								</div>
							</div>
							<div class="ui-form-content">
								<ClientSelector
									:current-entity-id="currentEntityId"
									:current-entity-type-id="currentEntityTypeId"
									:entity-types="dealEntityTypes"
									@onSelectItem="onSelectDeal"
								/>
							</div>
						</div>
						
						<div class="ui-form-row">
							<div class="ui-form-label">
								<div class="ui-ctl-label-text">
									{{dateTitle}}
								</div>
							</div>
							<div class="ui-form-content">
								<div class="ui-ctl">
									<input
										@click="showDatePicker"
										type="text"
										ref="datePicker"
										class="ui-ctl-element"
										:value="formattedDate"
									/>
								</div>
							</div>
						</div>
						
						<div class="ui-form-row">
							<div class="ui-form-content">
								<button class="ui-btn" @click="checkItem">{{isSuitableItemCheckTitle}}</button>
								<div v-if="isSuitableItem !== null" class="ui-form-row">
									{{ isSuitableItem ? isSuitableItemTitle : isNotSuitableItemTitle }}
								</div>
							</div>
						</div>
						
						<div class="ui-form-row-inline">
							<div class="ui-form-content">
								<button class="ui-btn" @click="fetchMarkers">{{submitTitle}}</button>
								<button class="ui-btn" v-if="hasFilledMarkers" @click="hideMarkers">{{hideTitle}}</button>
							</div>
						</div>
						
						<div
							v-if="hasFilledMarkers"
							class="ui-form-row crm-repeat-sale__sandbox_filled-markers"
						>
							<div class="ui-form-content">
								<pre>{{ JSON.stringify(markers, null, 2) }}</pre>
							</div>
						</div>
				
						<div class="ui-form-row">
							<div class="ui-form-content">
								<button class="ui-btn" @click="sendToAi">{{sendToAiTitle}}</button>
							</div>
						</div>
					</div>
					<div class="crm-repeat-sale__sandbox_mode">
						<div class="ui-form-label">
							<div class="ui-ctl-label-text">{{datePeriodTitle}}</div>
						</div>
						<div class="ui-form-row">
							<div class="ui-form-content">
								<div>
									{{datePeriodFromTitle}}
								</div>
								<div class="ui-ctl">
									<input
										@click="showFromPeriodDatePicker"
										type="text"
										ref="fromPeriodDatePicker"
										class="ui-ctl-element"
										:value="fromPeriodFormattedDate"
									/>
								</div>
							</div>
						</div>
						
						<div class="ui-form-row">
							<div class="ui-form-content">
								<div>
									{{datePeriodToTitle}}
								</div>
								<div class="ui-ctl">
									<input
										@click="showToPeriodDatePicker"
										type="text"
										ref="toPeriodDatePicker"
										class="ui-ctl-element"
										:value="toPeriodFormattedDate"
									/>
								</div>
							</div>
						</div>
						
						<div class="ui-form-row-inline">
							<div class="ui-form-content">
								<button class="ui-btn" @click="checkPeriod">{{periodCheckTitle}}</button>
								<button class="ui-btn" v-if="hasSuitableItems" @click="hideSuitableItems">{{hideTitle}}</button>
							</div>
						</div>
						
						<div class="ui-form-row" v-if="hasSuitableItems">
							<div class="ui-form-content">
								<div class="crm-repeat-sale__sandbox_suitable-item-wrapper">
									<div
										class="crm-repeat-sale__sandbox_suitable-item"
										v-for="(item, index) in suitableItems"
									>
										<i>{{ index+1 }}. </i>
										<a :href="getItemUrl(item.entityTypeId, item.entityId)">
											{{ getItemUrl(item.entityTypeId, item.entityId) }}
										</a>
									</div>
									<p>{{ periodCheckInfoTitle }}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
