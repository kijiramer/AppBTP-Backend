import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function Effectif() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState('');
  const router = useRouter();
  const inputRef = useRef(null);
  const [showForm, setShowForm] = useState(true); // keep default visible

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`${API}/effectif`, { credentials: 'include' });
        if (res.status === 401) { router.push('/login'); return; }
        const data = await res.json();
        if (data && data.success) setItems(data.effectifs || []);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    fetchItems();
  }, [router]);

  const create = async (e) => {
    e.preventDefault();
    await fetch(`${API}/effectif`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, nombrePersonnes: 1, selectedDate: new Date().toISOString() })
    });
    setCompany('');
    const res = await fetch(`${API}/effectif`, { credentials: 'include' });
    const data = await res.json();
    if (data && data.success) setItems(data.effectifs || []);
  };

  const handleOpenForm = () => {
    // show the form and scroll to it
    setShowForm(true);
    try {
      if (inputRef && inputRef.current && typeof inputRef.current.scrollIntoView === 'function') {
        inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputRef.current.focus && inputRef.current.focus();
      } else if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {}
  };

  return (
    <div style={{ maxWidth: 920, margin: '3rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Effectif</h1>
        <button onClick={handleOpenForm} aria-label="Ouvrir le formulaire" style={{ fontSize: 20, padding: '4px 10px' }}>+</button>
      </div>
      {showForm && (
        <form onSubmit={create} style={{ marginBottom: 12 }}>
          <input ref={inputRef} value={company} onChange={e => setCompany(e.target.value)} placeholder="Société" style={{ padding: 8, width: '60%' }} />
          <button type="submit" style={{ marginLeft: 8 }}>Ajouter</button>
        </form>
      )}
      {loading && <p>Chargement...</p>}
      {!loading && (
        <ul>
          {items.map(i => (
            <li key={i._id}>{i.company} - {i.nombrePersonnes} - {new Date(i.selectedDate).toLocaleString()}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
