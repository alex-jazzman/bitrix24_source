import { Event, Loc } from 'main.core';

export const TableContextMenuComponent = {
	name: 'TableContextMenu',
	props: {
		editor: {
			type: Object,
			default: null,
		},
		editorTick: {
			type: Number,
			default: 0,
		},
	},
	data()
	{
		return {
			visible: false,
			posX: 0,
			posY: 0,
		};
	},
	computed: {
		menuItems(): Object[]
		{
			void this.editorTick;

			return [
				{
					key: 'addRowBefore',
					label: Loc.getMessage('NOTE_EDITOR_TABLE_ROW_BEFORE'),
					action: () => this.editor.chain().focus().addRowBefore().run(),
					canRun: this.editor?.can().addRowBefore() ?? false,
				},
				{
					key: 'addRowAfter',
					label: Loc.getMessage('NOTE_EDITOR_TABLE_ROW_AFTER'),
					action: () => this.editor.chain().focus().addRowAfter().run(),
					canRun: this.editor?.can().addRowAfter() ?? false,
				},
				{
					key: 'deleteRow',
					label: Loc.getMessage('NOTE_EDITOR_TABLE_ROW_DELETE'),
					action: () => this.editor.chain().focus().deleteRow().run(),
					canRun: this.editor?.can().deleteRow() ?? false,
				},
				{ key: 'sep1', separator: true },
				{
					key: 'addColumnBefore',
					label: Loc.getMessage('NOTE_EDITOR_TABLE_COL_BEFORE'),
					action: () => this.editor.chain().focus().addColumnBefore().run(),
					canRun: this.editor?.can().addColumnBefore() ?? false,
				},
				{
					key: 'addColumnAfter',
					label: Loc.getMessage('NOTE_EDITOR_TABLE_COL_AFTER'),
					action: () => this.editor.chain().focus().addColumnAfter().run(),
					canRun: this.editor?.can().addColumnAfter() ?? false,
				},
				{
					key: 'deleteColumn',
					label: Loc.getMessage('NOTE_EDITOR_TABLE_COL_DELETE'),
					action: () => this.editor.chain().focus().deleteColumn().run(),
					canRun: this.editor?.can().deleteColumn() ?? false,
				},
				{ key: 'sep2', separator: true },
				{
					key: 'mergeOrSplit',
					label: Loc.getMessage('NOTE_EDITOR_TABLE_MERGE_SPLIT'),
					action: () => this.editor.chain().focus().mergeOrSplit().run(),
					canRun: this.editor?.can().mergeOrSplit() ?? false,
				},
				{ key: 'sep3', separator: true },
				{
					key: 'deleteTable',
					label: Loc.getMessage('NOTE_EDITOR_TABLE_DELETE'),
					action: () => this.editor.chain().focus().deleteTable().run(),
					canRun: this.editor?.can().deleteTable() ?? false,
				},
			];
		},
	},
	mounted()
	{
		this.handleRightMouseDown = this.handleRightMouseDown.bind(this);
		this.handleContextMenu = this.handleContextMenu.bind(this);
		this.handleDocumentClick = this.handleDocumentClick.bind(this);
		this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
		this.close = this.close.bind(this);

		Event.bind(document, 'mousedown', this.handleRightMouseDown, true);
		Event.bind(document, 'contextmenu', this.handleContextMenu, true);
		Event.bind(document, 'click', this.handleDocumentClick, true);
		Event.bind(document, 'keydown', this.handleDocumentKeydown, true);
		Event.bind(window, 'scroll', this.close, { passive: true, capture: true });
		Event.bind(window, 'resize', this.close, { passive: true });
	},
	beforeUnmount()
	{
		Event.unbind(document, 'mousedown', this.handleRightMouseDown, true);
		Event.unbind(document, 'contextmenu', this.handleContextMenu, true);
		Event.unbind(document, 'click', this.handleDocumentClick, true);
		Event.unbind(document, 'keydown', this.handleDocumentKeydown, true);
		Event.unbind(window, 'scroll', this.close, true);
		Event.unbind(window, 'resize', this.close);
	},
	methods: {
		handleRightMouseDown(event: MouseEvent): void
		{
			if (event.button !== 2 || !this.editor?.isEditable)
			{
				return;
			}

			const editorDom = this.editor.view?.dom;
			if (!editorDom || !editorDom.contains(event.target))
			{
				return;
			}

			const cell = event.target.closest('td, th');
			if (!cell)
			{
				return;
			}

			const { selection } = this.editor.state;
			if (selection.$anchorCell)
			{
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		},
		handleContextMenu(event: Event): void
		{
			if (!this.editor?.isEditable)
			{
				return;
			}

			const editorDom = this.editor.view?.dom;
			if (!editorDom || !editorDom.contains(event.target))
			{
				this.close();

				return;
			}

			const cell = event.target.closest('td, th');
			if (!cell)
			{
				this.close();

				return;
			}

			event.preventDefault();
			this.posX = event.clientX;
			this.posY = event.clientY;
			this.visible = true;

			this.$nextTick(() => {
				this.clampPosition();
			});
		},
		clampPosition(): void
		{
			const menu = this.$refs.contextMenu;
			if (!menu)
			{
				return;
			}

			const rect = menu.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			if (this.posX + rect.width > viewportWidth)
			{
				this.posX = viewportWidth - rect.width - 4;
			}

			if (this.posY + rect.height > viewportHeight)
			{
				this.posY = viewportHeight - rect.height - 4;
			}

			if (this.posX < 0)
			{
				this.posX = 4;
			}

			if (this.posY < 0)
			{
				this.posY = 4;
			}
		},
		close(): void
		{
			this.visible = false;
		},
		handleDocumentClick(event: Event): void
		{
			if (!this.visible)
			{
				return;
			}

			const menu = this.$refs.contextMenu;
			if (menu && menu.contains(event.target))
			{
				return;
			}

			this.close();
		},
		handleDocumentKeydown(event: KeyboardEvent): void
		{
			if (this.visible && event.key === 'Escape')
			{
				this.close();
			}
		},
		executeAction(item: Object): void
		{
			if (!item.canRun)
			{
				return;
			}

			item.action();
			this.close();
		},
	},
	// language=Vue
	template: `
		<teleport to="#note-editor-app">
			<div
				v-if="visible"
				ref="contextMenu"
				class="note-editor-context-menu"
				:style="{ left: posX + 'px', top: posY + 'px' }"
			>
				<div class="note-editor-context-menu-card">
					<template v-for="item in menuItems" :key="item.key">
						<div v-if="item.separator" class="note-editor-context-menu-separator"></div>
						<button
							v-else
							class="note-editor-context-menu-item"
							:disabled="!item.canRun"
							@click="executeAction(item)"
						>{{ item.label }}</button>
					</template>
				</div>
			</div>
		</teleport>
	`,
};
