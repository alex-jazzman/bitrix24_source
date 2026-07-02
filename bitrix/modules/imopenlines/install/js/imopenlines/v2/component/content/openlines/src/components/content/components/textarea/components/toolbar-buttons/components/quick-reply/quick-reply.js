import { Runtime, type JsonObject } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { Spinner, SpinnerSize, SpinnerColor } from 'im.v2.component.elements.loader';

import {
	type RawQuickReply,
	type QuickReplySaveFormData,
	type QuickReplyPermissions,
} from 'imopenlines.v2.provider.service';
import { type ImolModelQuickReplySection } from 'imopenlines.v2.model';
import { QuickReplyManager, ALL_SECTIONS_ID } from 'imopenlines.v2.lib.quick-reply';
import { runActionWithLoading } from 'imopenlines.v2.lib.utils';

import { QuickReplyPopup } from './quick-reply-popup';

const SEARCH_DEBOUNCE_MS = 400;

// @vue/component
export const QuickReply = {
	name: 'QuickReply',
	components: { BIcon, QuickReplyPopup, Spinner },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['selectReply'],
	data(): JsonObject
	{
		return {
			selectorElement: null,
			isPopupOpen: false,
			isInitialLoading: false,
			highlightedReplyId: 0,
			savedAsEdit: false,
			isFormOpen: false,
			editingReply: null,
			filter: {
				searchQuery: '',
				activeSectionId: ALL_SECTIONS_ID,
			},
			status: {
				isSaving: false,
				isLoadingNextPage: false,
			},
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		SpinnerSize: () => SpinnerSize,
		SpinnerColor: () => SpinnerColor,
		replies(): RawQuickReply[]
		{
			return this.$store.getters['openLines/quickReply/getList']();
		},
		filteredReplies(): RawQuickReply[]
		{
			const hasSectionFilter = this.filter.activeSectionId !== ALL_SECTIONS_ID;
			const query = this.filter.searchQuery.toLowerCase();
			const hasFilledQuery = query !== '';

			return this.replies.filter((reply) => {
				const isOutOfSection = reply.sectionId !== this.filter.activeSectionId;
				if (hasSectionFilter && isOutOfSection)
				{
					return false;
				}

				if (hasFilledQuery)
				{
					return reply.text.toLowerCase().includes(query);
				}

				return true;
			});
		},
		sections(): ImolModelQuickReplySection[]
		{
			const rawSections = this.$store.getters['openLines/quickReply/getSections']();
			const allSection = {
				id: ALL_SECTIONS_ID,
				name: this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_SECTION_ALL'),
				code: '',
			};

			return [allSection, ...rawSections];
		},
		isPopupOpenAndLoaded(): boolean
		{
			return this.isPopupOpen && !this.isInitialLoading;
		},
		hasNextPage(): boolean
		{
			return this.$store.getters['openLines/quickReply/hasNextPage']();
		},
		manageUrl(): string
		{
			return this.$store.getters['openLines/quickReply/getManageUrl']();
		},
		permissions(): QuickReplyPermissions
		{
			return this.$store.getters['openLines/quickReply/getPermissions']();
		},
	},
	created()
	{
		this.quickReplyManager = QuickReplyManager.getInstance();
		this.runServerSearch = Runtime.debounce(this.serverSearch, SEARCH_DEBOUNCE_MS, this);
	},
	mounted()
	{
		this.selectorElement = this.$refs.quickReplyButton;
	},
	methods: {
		togglePopup(): void
		{
			this.isPopupOpen = !this.isPopupOpen;
			if (this.isPopupOpen && this.quickReplyManager.hasStaleCache(this.dialogId))
			{
				void this.loadInitial();
			}
		},
		onPopupClose(): void
		{
			this.isPopupOpen = false;
			this.isFormOpen = false;
			this.editingReply = null;
		},
		async loadInitial(): Promise<void>
		{
			await runActionWithLoading(this, 'isInitialLoading', () => {
				return this.quickReplyManager.loadList(this.dialogId, {
					search: '',
					sectionId: ALL_SECTIONS_ID,
				});
			});
		},
		async onLoadNextPage(): Promise<void>
		{
			if (this.status.isLoadingNextPage)
			{
				return;
			}
			await runActionWithLoading(this.status, 'isLoadingNextPage', () => {
				return this.quickReplyManager.loadNextPage(this.dialogId);
			});
		},
		onQueryChange(query: string): void
		{
			this.filter.searchQuery = query;
			this.runServerSearch(query);
		},
		async serverSearch(query: string): Promise<void>
		{
			await this.quickReplyManager.search(this.dialogId, query);
		},
		async onSave(data: QuickReplySaveFormData): Promise<void>
		{
			const isEdit = data.id > 0;
			await runActionWithLoading(this.status, 'isSaving', async () => {
				const savedReply = await this.quickReplyManager.save(this.dialogId, data);
				if (savedReply)
				{
					this.highlightedReplyId = savedReply.id;
					this.savedAsEdit = isEdit;
					this.isFormOpen = false;
					this.editingReply = null;
				}

				return savedReply;
			});
		},
		onReplyAdd(): void
		{
			this.editingReply = null;
			this.isFormOpen = true;
		},
		onReplyEdit(reply: RawQuickReply): void
		{
			this.editingReply = reply;
			this.isFormOpen = true;
		},
		onFormClose(): void
		{
			this.isFormOpen = false;
			this.editingReply = null;
		},
		async onFilterBySection(sectionId: number): Promise<void>
		{
			this.filter.activeSectionId = sectionId;
			await this.quickReplyManager.loadList(this.dialogId, { sectionId });
		},
		onReplySelect(reply: RawQuickReply): void
		{
			this.quickReplyManager.selectReply(this.dialogId, reply);
			this.$emit('selectReply', reply.text);
			this.isPopupOpen = false;
		},
		onSuccessHide(): void
		{
			this.highlightedReplyId = 0;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<span ref="quickReplyButton">
			<Spinner
				v-if="isInitialLoading"
				:size="SpinnerSize.XS"
				:color="SpinnerColor.blue"
			/>
			<BIcon
				v-else
				:name="OutlineIcons.STRESS"
				:class="{ '--active': isPopupOpen }"
				:title="loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY')"
				class="bx-imol-textarea-icon"
				@click="togglePopup"
			/>
		</span>
		<QuickReplyPopup
			v-if="isPopupOpenAndLoaded"
			:bindElement="selectorElement"
			:filteredReplies="filteredReplies"
			:sections="sections"
			:activeSectionId="filter.activeSectionId"
			:isSaving="status.isSaving"
			:isLoadingNextPage="status.isLoadingNextPage"
			:hasNextPage="hasNextPage"
			:highlightedReplyId="highlightedReplyId"
			:savedAsEdit="savedAsEdit"
			:isFormOpen="isFormOpen"
			:editingReply="editingReply"
			:manageUrl="manageUrl"
			:permissions="permissions"
			@select="onReplySelect"
			@queryChange="onQueryChange"
			@loadNextPage="onLoadNextPage"
			@filter="onFilterBySection"
			@save="onSave"
			@successHide="onSuccessHide"
			@close="onPopupClose"
			@replyAdd="onReplyAdd"
			@replyEdit="onReplyEdit"
			@formClose="onFormClose"
		/>
	`,
};
