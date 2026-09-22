import { addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

const STORAGE_KEY_PREFIX = 'retailos_pending_sales_';

/**
 * Retrieves all pending offline sales for a given tenant.
 */
export function getPendingSales(tenantId) {
  if (!tenantId || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + tenantId);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Error reading pending sales from storage:', err);
    return [];
  }
}

/**
 * Saves a completed sale to the local offline storage queue.
 */
export function savePendingSale(tenantId, sale) {
  if (!tenantId || typeof localStorage === 'undefined') return;
  try {
    const current = getPendingSales(tenantId);
    // Avoid duplicate entry if already present
    if (!current.some(s => s.id === sale.id)) {
      current.push({
        ...sale,
        queuedAt: Date.now(),
        isOfflinePending: true,
      });
      localStorage.setItem(STORAGE_KEY_PREFIX + tenantId, JSON.stringify(current));
    }
  } catch (err) {
    console.error('Error saving pending sale to storage:', err);
  }
}

/**
 * Removes a sale from the offline queue once it has synced to the cloud.
 */
export function removePendingSale(tenantId, saleId) {
  if (!tenantId || typeof localStorage === 'undefined') return;
  try {
    const current = getPendingSales(tenantId);
    const filtered = current.filter(s => s.id !== saleId);
    localStorage.setItem(STORAGE_KEY_PREFIX + tenantId, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error removing pending sale from storage:', err);
  }
}

/**
 * Attempts to sync all pending offline sales to Firestore.
 * Uses a safe per-item timeout so slow or dropped networks fail fast without blocking the user.
 */
export async function syncPendingSales(tenantId, getTenantCol, getTenantDoc) {
  if (!tenantId || typeof navigator !== 'undefined' && !navigator.onLine) {
    return 0;
  }

  const pending = getPendingSales(tenantId);
  if (pending.length === 0) return 0;

  let syncedCount = 0;

  for (const sale of pending) {
    try {
      // 1. Prepare clean Firestore payload (omit client-only flags)
      const { id, queuedAt, isOfflinePending, ...rawPayload } = sale;
      const cleanPayload = {
        ...rawPayload,
        timestamp: serverTimestamp(),
        syncedFromOfflineAt: serverTimestamp(),
      };

      // Wrap in 4-second timeout to prevent hanging forever
      const writePromise = (async () => {
        // Write sale
        await addDoc(getTenantCol('sales'), cleanPayload);

        // Decrement product showroom quantities
        if (Array.isArray(sale.items)) {
          for (const item of sale.items) {
            if (item.productId) {
              try {
                await updateDoc(getTenantDoc('products', item.productId), {
                  showroomQty: increment(-item.quantity),
                });
              } catch (stkErr) {
                console.warn('Stock decrement notice:', stkErr);
              }
            }
          }
        }

        // Update customer credit/debt balance and loyalty points
        if (sale.customerId) {
          try {
            if (String(sale.customerId).startsWith('cust_')) {
              // Newly entered customer at POS checkout - create new customer record
              await addDoc(getTenantCol('customers'), {
                name: sale.customerName || 'Customer',
                phone: sale.customerPhone || '',
                outstandingDebtUSD: Number(sale.balanceOwed || 0),
                currentDebt: Number(sale.balanceOwed || 0),
                loyaltyPoints: Math.floor(Number(sale.amountPaid || sale.total || 0)),
                totalPurchases: Number(sale.total || 0),
                lastDebtDate: sale.balanceOwed > 0 ? new Date().toISOString() : null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            } else {
              // Existing customer - update debt, points, and aging timestamp
              const updatePayload = {
                totalPurchases: increment(Number(sale.total || 0)),
                loyaltyPoints: increment(Math.floor(Number(sale.amountPaid || sale.total || 0))),
                updatedAt: serverTimestamp()
              };
              if (sale.balanceOwed > 0) {
                updatePayload.outstandingDebtUSD = increment(Number(sale.balanceOwed));
                updatePayload.currentDebt = increment(Number(sale.balanceOwed));
                updatePayload.lastDebtDate = new Date().toISOString();
              }
              await updateDoc(getTenantDoc('customers', sale.customerId), updatePayload);
            }
          } catch (cErr) {
            console.warn('Customer debt & points sync notice:', cErr);
          }
        }
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout during offline sync')), 4000)
      );

      await Promise.race([writePromise, timeoutPromise]);

      // Successfully written - remove from pending queue
      removePendingSale(tenantId, sale.id);
      syncedCount++;
    } catch (err) {
      console.warn(`Could not sync sale ${sale.id} (will retry later):`, err.message);
      // Stop iteration on network failure to avoid hammer
      break;
    }
  }

  return syncedCount;
}
