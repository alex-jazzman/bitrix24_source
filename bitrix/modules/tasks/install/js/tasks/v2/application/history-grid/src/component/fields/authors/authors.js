import { userService } from 'tasks.v2.provider.service.user-service';

import './authors.css';

// @vue/component
export const Authors = {
	props: {
		getGrid: {
			type: Function,
			required: true,
		},
	},
	data(): Object
	{
		return {
			authorsRefs: [],
			authors: [],
		};
	},
	methods: {
		async update(): Promise<void>
		{
			const authors = this.getGrid().querySelectorAll('[data-author][data-author-id]');

			this.authors = [...authors].map((authorNode: HTMLElement) => this.getAuthor(authorNode));

			await this.$nextTick();

			authors.forEach((authorNode: HTMLElement) => {
				const author = this.getAuthor(authorNode);
				authorNode.append(this.authorsRefs[author.rowId]);
			});
		},
		getAuthor(authorNode: HTMLElement): Object
		{
			const rowId = Number(authorNode.closest('[data-id]').dataset.id);
			const author = JSON.parse(authorNode.dataset.author);
			const authorId = Number(authorNode.dataset.authorId);
			const type = JSON.parse(authorNode.dataset.authorType);

			return {
				rowId,
				author,
				authorId,
				type,
			};
		},
		setRef(element: HTMLElement, rowId: number): void
		{
			this.authorsRefs ??= {};
			this.authorsRefs[rowId] = element;
		},
		getUserUrl(userId: number): string
		{
			return userService.getUrl(userId);
		},
	},
	template: `
		<template v-for="(author, id) in authors" :key="id">
			<a
				:ref="(el) => setRef(el, author.rowId)"
				:href="getUserUrl(author.authorId)"
				class="tasks-history-grid-author-column-element"
				:class="{ '--collaber' : author.type === 'collaber'}"
			>
				{{ author.author }}
			</a>
		</template>
	`,
};
