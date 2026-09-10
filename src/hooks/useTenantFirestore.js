import { useState, useEffect } from 'react';
import { query, onSnapshot, orderBy, where, Timestamp } from 'firebase/firestore';
import { useTenant } from '../contexts/TenantContext';

export const DEFAULT_FALLBACK_PRODUCTS = [
  {
    id: 'prod_polo_001',
    name: 'Classic Men Polo T-Shirt',
    category: 'Apparel & Fashion',
    retailPrice: 15.00,
    wholesalePrice: 12.00,
    showroomQty: 24,
    storeroomQty: 50,
    barcode: '1001',
    description: '100% Cotton breathable short-sleeve polo shirt.',
  },
  {
    id: 'prod_suit_002',
    name: 'Slim Fit Formal Italian Suit (2-Piece)',
    category: 'Apparel & Fashion',
    retailPrice: 85.00,
    wholesalePrice: 65.00,
    showroomQty: 10,
    storeroomQty: 20,
    barcode: '1002',
    description: 'Premium wool-blend tailored suit for business and ceremonies.',
  },
  {
    id: 'prod_shoes_003',
    name: 'Oxford Leather Dress Shoes (Brown)',
    category: 'Footwear',
    retailPrice: 45.00,
    wholesalePrice: 32.00,
    showroomQty: 12,
    storeroomQty: 28,
    barcode: '1003',
    description: 'Handcrafted genuine leather formal dress shoes.',
  },
  {
    id: 'prod_watch_004',
    name: 'Chronograph Stainless Steel Watch',
    category: 'Accessories',
    retailPrice: 35.00,
    wholesalePrice: 22.00,
    showroomQty: 15,
    storeroomQty: 30,
    barcode: '1004',
    description: 'Water-resistant luxury quartz men wristwatch.',
  },
  {
    id: 'prod_belt_005',
    name: 'Reversible Leather Belt (Black / Brown)',
    category: 'Accessories',
    retailPrice: 12.00,
    wholesalePrice: 8.00,
    showroomQty: 30,
    storeroomQty: 60,
    barcode: '1005',
    description: 'Double-sided genuine leather belt with alloy buckle.',
  },
];

export function useTenantCollection(collectionName, constraints = []) {
  const { getTenantCol, tenantId } = useTenant();
  const [docs, setDocs] = useState(() => {
    try {
      const cached = localStorage.getItem(`retailos_cached_${collectionName}_${tenantId}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return collectionName === 'products' ? DEFAULT_FALLBACK_PRODUCTS : [];
  });
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
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (data.length > 0) {
          setDocs(data);
          try {
            localStorage.setItem(`retailos_cached_${collectionName}_${tenantId}`, JSON.stringify(data));
          } catch (e) {}
        } else {
          // If Firestore collection is empty, load fallback for products
          if (collectionName === 'products') {
            setDocs(DEFAULT_FALLBACK_PRODUCTS);
          } else {
            setDocs([]);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.warn(`[useTenantCollection] ${collectionName} error (using offline cache):`, err);
        setError(err);
        try {
          const cached = localStorage.getItem(`retailos_cached_${collectionName}_${tenantId}`);
          if (cached) {
            setDocs(JSON.parse(cached));
          } else if (collectionName === 'products') {
            setDocs(DEFAULT_FALLBACK_PRODUCTS);
          }
        } catch (e) {
          if (collectionName === 'products') setDocs(DEFAULT_FALLBACK_PRODUCTS);
        }
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
