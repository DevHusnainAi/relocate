import { useState } from 'react';
import Button from './components/Button.jsx';
import MemberRow from './components/MemberRow.jsx';
import InviteForm from './components/InviteForm.jsx';
import t from './i18n.js';

const START = [{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }, { id: 3, name: 'Gamma' }];

export default function App() {
  const [members, setMembers] = useState(START);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState('');
  const [toast, setToast] = useState('');

  return (
    <main style={{ font: '15px system-ui', maxWidth: 640, margin: '40px auto' }}>
      <h1>{t('title')}</h1>
      <section>
        <h2>{t('members.heading')}</h2>
        <input type="search" placeholder={t('members.search')} value={query} onChange={e => setQuery(e.target.value)} />
        <p>Query: <span id="query">{query}</span></p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {members.map(m => <MemberRow key={m.id} member={m} onEdit={x => setEditing(`Editing ${x.name}`)} />)}
        </ul>
        <Button variant="danger" onClick={() => { setMembers(members.slice(0, -1)); setToast(t('toast.removed')); }}>{t('members.remove')}</Button>
      </section>
      <section>
        <h2>{t('invite.heading')}</h2>
        <InviteForm formId="invite-form" action="send" onSend={() => setToast(t('toast.invited'))} />
      </section>
      <section>
        <h2>{t('settings.heading')}</h2>
        <Button variant="solid" onClick={() => setToast(t('toast.saved'))}>{t('settings.save')}</Button>
      </section>
      <p id="editing">{editing}</p>
      <p id="toast" role="status">{toast}</p>
    </main>
  );
}
