import Button from './Button.jsx';
import styles from './MemberRow.module.css';
import t from '../i18n.js';

export default function MemberRow({ member, onEdit }) {
  return (
    <li className={styles.row}>
      <span>{member.name}</span>
      <Button onClick={() => onEdit(member)}>{t('members.edit')}</Button>
    </li>
  );
}
