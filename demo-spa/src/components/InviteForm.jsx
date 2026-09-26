import Button from './Button.jsx';
import t from '../i18n.js';

export default function InviteForm({ formId, action, onSend }) {
  return (
    <form id={formId} onSubmit={e => e.preventDefault()}>
      <input type="email" placeholder="name@company.com" />
      <Button variant="solid" data-testid={`${formId}-${action}`} onClick={onSend}>{t(`invite.${action}`)}</Button>
    </form>
  );
}
