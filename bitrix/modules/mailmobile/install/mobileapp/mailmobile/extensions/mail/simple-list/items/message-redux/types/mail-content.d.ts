import { Mail, User } from '../../../../types/common';

declare type MessageContentProps = {
	item: Mail,
	users: Array<User>,
	onDeleteMail: (id: number) => Promise<void>,
	onUpdateMail: (items: Array<Mail>) => void,
}
