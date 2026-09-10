import { useState, useEffect } from 'react';
import { query, onSnapshot, orderBy, where, Timestamp } from 'firebase/firestore';
import { useTenant } from '../contexts/TenantContext';

export function useTenantCollection(collectionName, constraints = []) {
  const { getTenantCol, tenantId } = useTenant();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    let q;
    try {
      const colRef = getTenantCol(collectionName);
      q = query(colRef, ...constraints);
    } catch (e) {
      setError(e);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.warn(`[useTenantCollection] ${collectionName} error:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, tenantId, JSON.stringify(constraints.map(c => c.toString()))]);

  return { docs, loading, error };
}

export function useTenantDateFilteredCollection(collectionName, fromDate, toDate) {
  const { getTenantCol, tenantId } = useTenant();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId || !fromDate || !toDate) return;
    setLoading(true);

    const colRef = getTenantCol(collectionName);
    const q = query(
      colRef,
      where('timestamp', '>=', Timestamp.fromDate(fromDate)),
      where('timestamp', '<=', Timestamp.fromDate(toDate)),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.warn(`[useTenantDateFilteredCollection] ${collectionName} error:`, err);
        setLoading(false);
      }
    );

    return unsub;
  }, [collectionName, tenantId, fromDate?.toISOString(), toDate?.toISOString()]);

  return { docs, loading };
}
