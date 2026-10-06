import { confirm } from 'crm.timeline.dialog';
import { Tag, Text, Type } from 'main.core';
import { Base } from './base';
import ConfigurableItem from '../configurable-item';

export class Comment extends Base
{
	getDeleteActionMethod(): string
	{
		return 'crm.timeline.comment.delete';
	}

	getDeleteActionCfg(recordId: Number, ownerTypeId: Number, ownerId: Number): Object
	{
		return {
			data: {
				id: recordId,
				ownerTypeId: ownerTypeId,
				ownerId: ownerId,
			}
		};
	}

	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData, animationCallbacks } = actionParams;
		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'Comment:Edit' || action === 'Comment:AddFile')
		{
			this.#showEditor(item);
		}

		if (action === 'Comment:Delete' && actionData)
		{
			this.#onCommentDelete(actionData, animationCallbacks);
		}

		if (action === 'Comment:StartEdit')
		{
			item.highlightContentBlockById('commentContentWeb', true);
		}

		if (action === 'Comment:FinishEdit')
		{
			item.highlightContentBlockById('commentContentWeb', false);
		}
	}

	#showEditor(item: ConfigurableItem): void
	{
		const commentBlock = item.getLayoutContentBlockById('commentContentWeb');
		if (commentBlock)
		{
			commentBlock.startEditing();
		}
		else
		{
			throw new Error('Vue component "CommentContent" was not found');
		}
	}

	#onCommentDelete(actionData: Object, animationCallbacks: ?Object): void
	{
		if (!this.#isValidParams(actionData))
		{
			return;
		}

		const confirmationText = Type.isStringFilled(actionData.confirmationText) ? actionData.confirmationText : '';
		if (confirmationText)
		{
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
			confirm({
				content: Tag.render`<div>${Text.encode(confirmationText)}</div>`,
				preset: 'YES_NO',
				destructive: true,
				onConfirm: () => {
					return this.runDeleteAction(actionData.commentId, actionData.ownerTypeId, actionData.ownerId, animationCallbacks);
				},
			});
		}
		else
		{
			this.runDeleteAction(actionData.commentId, actionData.ownerTypeId, actionData.ownerId);
		}
	}

	#isValidParams(params: Object): boolean
	{
		return Type.isNumber(params.commentId)
			&& Type.isNumber(params.ownerId)
			&& Type.isNumber(params.ownerTypeId);
	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return (item.getType() === 'Comment');
	}
}
