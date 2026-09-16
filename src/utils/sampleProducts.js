import { setDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export const SAMPLE_LIBERIAN_PRODUCTS = [
  {
    id: '738291040112',
    barcode: '738291040112',
    name: 'Club Beer (330ml Can)',
    category: 'Food & Beverages',
    retailPrice: 1.50,
    halfDozenPrice: 8.50,
    dozenPrice: 16.50,
    costPrice: 1.15,
    showroomQty: 24,
    storeroomQty: 72,
    reorderTrigger: 12,
    isSample: true,
  },
  {
    id: '738291040113',
    barcode: '738291040113',
    name: 'Vitalo Sparkling Juice (330ml)',
    category: 'Food & Beverages',
    retailPrice: 1.00,
    halfDozenPrice: 5.50,
    dozenPrice: 10.50,
    costPrice: 0.75,
    showroomQty: 30,
    storeroomQty: 60,
    reorderTrigger: 15,
    isSample: true,
  },
  {
    id: '738291040114',
    barcode: '738291040114',
    name: 'Milo Chocolate Drink (400g Tin)',
    category: 'Food & Beverages',
    retailPrice: 4.50,
    halfDozenPrice: 25.50,
    dozenPrice: 49.00,
    costPrice: 3.60,
    showroomQty: 15,
    storeroomQty: 30,
    reorderTrigger: 8,
    isSample: true,
  },
  {
    id: '738291040115',
    barcode: '738291040115',
    name: 'Diamond Laundry Bar Soap (Blue)',
    category: 'Provisions & Household',
    retailPrice: 0.60,
    halfDozenPrice: 3.40,
    dozenPrice: 6.50,
    costPrice: 0.40,
    showroomQty: 48,
    storeroomQty: 120,
    reorderTrigger: 20,
    isSample: true,
  },
  {
    id: '738291040116',
    barcode: '738291040116',
    name: 'Viva Concentrated Detergent (500g)',
    category: 'Provisions & Household',
    retailPrice: 1.25,
    halfDozenPrice: 7.00,
    dozenPrice: 13.50,
    costPrice: 0.90,
    showroomQty: 20,
    storeroomQty: 40,
    reorderTrigger: 10,
    isSample: true,
  },
  {
    id: '738291040117',
    barcode: '738291040117',
    name: 'Bella Sardines in Vegetable Oil',
    category: 'Food & Beverages',
    retailPrice: 0.85,
    halfDozenPrice: 4.80,
    dozenPrice: 9.20,
    costPrice: 0.60,
    showroomQty: 36,
    storeroomQty: 72,
    reorderTrigger: 18,
    isSample: true,
  },
  {
    id: '738291040118',
    barcode: '738291040118',
    name: 'Special Long Grain Rice (25kg Bag)',
    category: 'Provisions & Household',
    retailPrice: 18.50,
    halfDozenPrice: 108.00,
    dozenPrice: 210.00,
    costPrice: 16.50,
    showroomQty: 10,
    storeroomQty: 50,
    reorderTrigger: 5,
    isSample: true,
  },
  {
    id: '738291040119',
    barcode: '738291040119',
    name: 'Vaseline Pure Petroleum Jelly (100ml)',
    category: 'Cosmetics & Hair',
    retailPrice: 2.00,
    halfDozenPrice: 11.50,
    dozenPrice: 22.00,
    costPrice: 1.40,
    showroomQty: 16,
    storeroomQty: 32,
    reorderTrigger: 8,
    isSample: true,
  },
];

/**
 * Loads the 8 realistic sample Liberian retail products into the store's tenant collection.
 */
export async function loadSampleProducts(getTenantDoc) {
  const promises = SAMPLE_LIBERIAN_PRODUCTS.map((prod) => {
    const docRef = getTenantDoc('products', prod.id);
    const data = {
      ...prod,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    return setDoc(docRef, data, { merge: true });
  });
  await Promise.all(promises);
  return SAMPLE_LIBERIAN_PRODUCTS.length;
}

/**
 * Deletes all products flagged with `isSample: true` from the store's tenant collection.
 */
export async function clearSampleProducts(getTenantCol, getTenantDoc) {
  const colRef = getTenantCol('products');
  const snap = await getDocs(colRef);
  let deletedCount = 0;

  const deletePromises = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data.isSample === true || SAMPLE_LIBERIAN_PRODUCTS.some(p => p.id === d.id)) {
      deletePromises.push(deleteDoc(getTenantDoc('products', d.id)));
      deletedCount++;
    }
  });

  await Promise.all(deletePromises);
  return deletedCount;
}
