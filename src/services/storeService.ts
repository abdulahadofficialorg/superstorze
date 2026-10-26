import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Category, Order, SiteSettings, UserProfile, CartItem, DepositRequest, WalletTransaction } from '../types';
import { initialProducts, initialCategories, initialSiteSettings } from '../data/seedData';

const SETTINGS_DOC_ID = 'main_config';

import { auth } from '../lib/firebase';

/**
 * Recursively strips undefined fields from objects before sending to Firestore,
 * preventing 'Unsupported field value: undefined' errors.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Initialize Firestore database with seed data if empty (Admin only)
 */
export async function initializeDatabaseIfEmpty(): Promise<boolean> {
  const currentUser = auth.currentUser;
  // Guest visitors cannot write to products/categories/siteSettings
  if (!currentUser || currentUser.email !== 'abdulahad.onr2@gmail.com') {
    return false;
  }

  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      for (const prod of initialProducts) {
        await setDoc(doc(db, 'products', prod.id), {
          ...prod,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      for (const cat of initialCategories) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }

      await setDoc(doc(db, 'siteSettings', SETTINGS_DOC_ID), initialSiteSettings);

      await setDoc(doc(db, 'admins', currentUser.uid), {
        email: currentUser.email,
        role: 'admin',
        createdAt: new Date().toISOString(),
      });

      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Site Settings Listeners and Updaters
 */
export function subscribeSiteSettings(
  callback: (settings: SiteSettings) => void,
  onError?: (err: Error) => void
) {
  const settingsDocRef = doc(db, 'siteSettings', SETTINGS_DOC_ID);
  return onSnapshot(
    settingsDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SiteSettings);
      } else {
        callback(initialSiteSettings);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, `siteSettings/${SETTINGS_DOC_ID}`);
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    }
  );
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  const path = `siteSettings/${SETTINGS_DOC_ID}`;
  try {
    await setDoc(doc(db, 'siteSettings', SETTINGS_DOC_ID), sanitizeForFirestore(settings), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Product Subscriptions and Mutations
 */
export function subscribeProducts(
  callback: (products: Product[]) => void,
  onError?: (err: Error) => void
) {
  const productsRef = collection(db, 'products');
  return onSnapshot(
    productsRef,
    (snapshot) => {
      if (snapshot.empty) {
        callback(initialProducts);
      } else {
        const list: Product[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Product);
        });
        callback(list);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'products');
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    }
  );
}

export async function getProductById(id: string): Promise<Product | null> {
  const path = `products/${id}`;
  try {
    const snap = await getDoc(doc(db, 'products', id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Product;
    }
    const seedMatch = initialProducts.find((p) => p.id === id);
    return seedMatch || null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveProduct(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    const payload = sanitizeForFirestore({
      ...product,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'products', product.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Categories Subscriptions and Mutations
 */
export function subscribeCategories(
  callback: (categories: Category[]) => void,
  onError?: (err: Error) => void
) {
  const catRef = collection(db, 'categories');
  return onSnapshot(
    catRef,
    (snapshot) => {
      if (snapshot.empty) {
        callback(initialCategories);
      } else {
        const list: Category[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Category);
        });
        list.sort((a, b) => a.order - b.order);
        callback(list);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    }
  );
}

export async function saveCategory(category: Category): Promise<void> {
  const path = `categories/${category.id}`;
  try {
    await setDoc(doc(db, 'categories', category.id), sanitizeForFirestore(category), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const path = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Orders Management
 */
export function generateOrderId(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `SSBD-${randomNum}`;
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  const orderId = generateOrderId();
  const path = `orders/${orderId}`;
  const now = new Date().toISOString();

  const fullOrder: Order = {
    ...orderData,
    customerEmail: orderData.customerEmail || '',
    customerNotes: orderData.customerNotes || '',
    userId: orderData.userId || '',
    id: orderId,
    createdAt: now,
    updatedAt: now,
  };

  const payload = sanitizeForFirestore(fullOrder);

  try {
    await setDoc(doc(db, 'orders', orderId), payload);
    return fullOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const normalizedId = orderId.trim().toUpperCase();
  const path = `orders/${normalizedId}`;
  try {
    let snap = await getDoc(doc(db, 'orders', normalizedId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Order;
    }
    // If not found and input didn't have SSBD- prefix, try with prefix
    if (!normalizedId.startsWith('SSBD-')) {
      const prefixed = `SSBD-${normalizedId}`;
      snap = await getDoc(doc(db, 'orders', prefixed));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Order;
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getOrdersByPhone(phone: string): Promise<Order[]> {
  const cleanPhone = phone.trim();
  const path = 'orders';
  try {
    const q = query(collection(db, 'orders'), where('customerPhone', '==', cleanPhone));
    const snap = await getDocs(q);
    const list: Order[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Order);
    });

    if (list.length === 0) {
      // Try alternate format (+880 vs 01...)
      const altPhone = cleanPhone.startsWith('+88')
        ? cleanPhone.replace('+88', '')
        : cleanPhone.startsWith('88')
        ? cleanPhone.replace('88', '')
        : `+88${cleanPhone}`;
      const qAlt = query(collection(db, 'orders'), where('customerPhone', '==', altPhone));
      const snapAlt = await getDocs(qAlt);
      snapAlt.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Order);
      });
    }

    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeUserOrders(
  userId: string,
  callback: (orders: Order[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'orders';
  const q = query(collection(db, 'orders'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Order);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    }
  );
}

export function subscribeAllOrders(
  callback: (orders: Order[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'orders';
  return onSnapshot(
    collection(db, 'orders'),
    (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Order);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    }
  );
}

export async function updateOrderStatus(
  orderId: string,
  orderStatus: Order['orderStatus'],
  paymentStatus: Order['paymentStatus'],
  digitalDeliveryNotes?: string,
  adminNotes?: string
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const updateData: Record<string, any> = {
      orderStatus,
      paymentStatus,
      updatedAt: new Date().toISOString(),
    };
    if (digitalDeliveryNotes !== undefined) {
      updateData.digitalDeliveryNotes = digitalDeliveryNotes;
    }
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    await updateDoc(doc(db, 'orders', orderId), sanitizeForFirestore(updateData));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * User Profile & Wallet
 */
export async function getOrCreateUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    const isAdminUser = Boolean(
      user.email && user.email.trim().toLowerCase() === 'abdulahad.onr2@gmail.com'
    );

    if (snap.exists()) {
      const profile = snap.data() as UserProfile;
      // Auto elevate owner email if not yet set, and demote any unauthorized admin role
      if (isAdminUser && profile.role !== 'admin') {
        profile.role = 'admin';
        await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
      } else if (!isAdminUser && profile.role === 'admin') {
        profile.role = 'customer';
        await setDoc(doc(db, 'users', user.uid), { role: 'customer' }, { merge: true });
      }

      // Automatically reset erroneous 850 / 800 legacy bug balances to 0
      const bal = Number(profile.walletBalance);
      if (bal === 850 || bal === 800 || (profile.walletBalance as any) === '850' || (profile.walletBalance as any) === '800') {
        profile.walletBalance = 0;
        await updateDoc(doc(db, 'users', user.uid), {
          walletBalance: 0,
          updatedAt: new Date().toISOString(),
        }).catch((err) => {
          console.warn('Auto-reset legacy balance error:', err);
        });
      }

      return profile;
    }

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Customer',
      photoURL: user.photoURL || '',
      walletBalance: 0,
      role: isAdminUser ? 'admin' : 'customer',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', user.uid), sanitizeForFirestore(newProfile));
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fix legacy automatic 850/800 balances assigned to users
 */
export async function resetLegacy850Balances(adminEmail: string = 'admin'): Promise<number> {
  const path = 'users';
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let updatedCount = 0;
    const now = new Date().toISOString();

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      const bal = Number(data.walletBalance);
      if (bal === 850 || bal === 800 || (data.walletBalance as any) === '850' || (data.walletBalance as any) === '800') {
        await updateDoc(doc(db, 'users', userDoc.id), {
          walletBalance: 0,
          updatedAt: now,
        });

        // Record in ledger
        const txRef = doc(collection(db, 'walletTransactions'));
        await setDoc(
          txRef,
          sanitizeForFirestore({
            id: txRef.id,
            userId: userDoc.id,
            userEmail: data.email || '',
            userName: data.displayName || 'Customer',
            type: 'ADMIN_DEDUCT',
            amount: bal || 850,
            previousBalance: bal || 850,
            newBalance: 0,
            adminEmail,
            reason: 'সিস্টেম ফিক্স: অটোমেটিক ৮৫০/৮০০ ব্যালেন্স রিসেট করে ৳০ করা হয়েছে',
            createdAt: now,
          })
        );
        updatedCount++;
      }
    }
    return updatedCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserWallet(uid: string, newBalance: number): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      walletBalance: newBalance,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

async function checkIsAdminDoc(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function setAdminRole(uid: string, email: string): Promise<void> {
  try {
    await setDoc(doc(db, 'admins', uid), {
      email,
      role: 'admin',
      grantedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', uid), { role: 'admin' }, { merge: true });
  } catch (error) {
    console.error('Failed to set admin role', error);
  }
}

/**
 * Deposit Requests Management
 */
export function generateDepositId(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `DEP-${randomNum}`;
}

export async function createDepositRequest(
  data: Omit<DepositRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<DepositRequest> {
  const depositId = generateDepositId();
  const path = `depositRequests/${depositId}`;
  const now = new Date().toISOString();

  const fullRequest: DepositRequest = {
    ...data,
    id: depositId,
    status: 'Pending',
    createdAt: now,
    updatedAt: now,
  };

  const payload = sanitizeForFirestore(fullRequest);

  try {
    await setDoc(doc(db, 'depositRequests', depositId), payload);
    return fullRequest;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserDepositRequests(
  userId: string,
  callback: (requests: DepositRequest[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'depositRequests';
  const q = query(collection(db, 'depositRequests'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: DepositRequest[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as DepositRequest);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    }
  );
}

export function subscribeAllDepositRequests(
  callback: (requests: DepositRequest[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'depositRequests';
  return onSnapshot(
    collection(db, 'depositRequests'),
    (snapshot) => {
      const list: DepositRequest[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as DepositRequest);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    }
  );
}

export async function approveDepositRequest(
  requestId: string,
  adminEmail: string = 'admin'
): Promise<void> {
  const path = `depositRequests/${requestId}`;
  try {
    const reqRef = doc(db, 'depositRequests', requestId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(reqRef);
      if (!snap.exists()) {
        throw new Error('ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি।');
      }
      const reqData = snap.data() as DepositRequest;
      if (reqData.status === 'Approved') {
        return; // Already approved - prevent duplicate approval
      }

      const now = new Date().toISOString();
      const depositAmount = Number(reqData.amount) || 0;
      if (depositAmount <= 0) {
        throw new Error('অবৈধ ডিপোজিট টাকার পরিমাণ।');
      }

      const userRef = doc(db, 'users', reqData.userId);
      const userSnap = await transaction.get(userRef);

      let prevBal = 0;
      if (userSnap.exists()) {
        prevBal = Number(userSnap.data()?.walletBalance || 0);
        transaction.update(userRef, {
          walletBalance: prevBal + depositAmount,
          updatedAt: now,
        });
      } else {
        const newUserPayload = sanitizeForFirestore({
          uid: reqData.userId,
          email: reqData.userEmail || '',
          displayName: reqData.userName || 'Customer',
          walletBalance: depositAmount,
          role: 'customer',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
        });
        transaction.set(userRef, newUserPayload);
      }

      // Mark deposit request as Approved
      transaction.update(reqRef, {
        status: 'Approved',
        processedAt: now,
        processedBy: adminEmail || 'admin',
        updatedAt: now,
      });

      // Record in wallet ledger
      const txRef = doc(collection(db, 'walletTransactions'));
      const ledgerEntry = sanitizeForFirestore({
        id: txRef.id,
        userId: reqData.userId,
        userEmail: reqData.userEmail || '',
        userName: reqData.userName || '',
        type: 'CREDIT_DEPOSIT',
        amount: depositAmount,
        previousBalance: prevBal,
        newBalance: prevBal + depositAmount,
        referenceId: requestId,
        method: reqData.paymentMethod || 'bKash',
        trxId: reqData.transactionId || '',
        adminEmail: adminEmail || 'admin',
        description: `Deposit #${requestId} approved (৳${depositAmount} via ${reqData.paymentMethod || 'Manual'})`,
        createdAt: now,
      });
      transaction.set(txRef, ledgerEntry);
    });
  } catch (error) {
    console.error('approveDepositRequest failed:', error);
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function rejectDepositRequest(
  requestId: string,
  adminNote: string = 'পেমেন্ট ভেরিফিকেশন ব্যর্থ হয়েছে',
  adminEmail: string = 'admin'
): Promise<void> {
  const path = `depositRequests/${requestId}`;
  try {
    const reqRef = doc(db, 'depositRequests', requestId);
    const snap = await getDoc(reqRef);
    if (!snap.exists()) {
      throw new Error('ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি।');
    }
    const current = snap.data() as DepositRequest;
    if (current.status === 'Approved') {
      throw new Error('অনুমোদিত ডিপোজিট বাতিল করা যাবে না।');
    }
    const now = new Date().toISOString();
    await updateDoc(reqRef, {
      status: 'Rejected',
      adminNote: adminNote || 'পেমেন্ট ভেরিফিকেশন ব্যর্থ হয়েছে',
      processedAt: now,
      processedBy: adminEmail || 'admin',
      updatedAt: now,
    });
  } catch (error) {
    console.error('rejectDepositRequest failed:', error);
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Wallet-Only Order Placement with Atomic Deduction & Ledger
 */
export async function placeWalletOrder(params: {
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'paymentStatus' | 'orderStatus' | 'paymentMethod'>;
  userId: string;
}): Promise<Order> {
  const orderId = generateOrderId();
  const orderRef = doc(db, 'orders', orderId);
  const userRef = doc(db, 'users', params.userId);
  const path = `orders/${orderId}`;
  const now = new Date().toISOString();

  try {
    let createdOrder: Order | null = null;
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('কাস্টমার একাউন্ট পাওয়া যায়নি।');
      }
      const userData = userSnap.data();
      const currentBalance = userData.walletBalance || 0;
      const orderTotal = params.orderData.totalAmount;

      if (currentBalance < orderTotal) {
        throw new Error(
          `অপর্যাপ্ত ওয়ালেট ব্যালেন্স! আপনার বর্তমান ব্যালেন্স ৳${currentBalFormatted(currentBalance)}, কিন্তু অর্ডারের মূল্য ৳${orderTotal.toFixed(2)}। দয়া করে প্রথমে ওয়ালেটে টাকা ডিপোজিট করুন।`
        );
      }

      const newBalance = currentBalance - orderTotal;

      // 1. Deduct balance from user
      transaction.update(userRef, {
        walletBalance: newBalance,
        updatedAt: now,
      });

      // 2. Create Order
      const fullOrder: Order = {
        ...params.orderData,
        id: orderId,
        userId: params.userId,
        paymentMethod: 'SSBD Wallet',
        paymentStatus: 'Paid',
        orderStatus: 'Pending',
        createdAt: now,
        updatedAt: now,
      };
      createdOrder = fullOrder;
      const payload = sanitizeForFirestore(fullOrder);
      transaction.set(orderRef, payload);

      // 3. Record in Wallet Ledger
      const txRef = doc(collection(db, 'walletTransactions'));
      const ledgerPayload = sanitizeForFirestore({
        id: txRef.id,
        userId: params.userId,
        userEmail: params.orderData.customerEmail || '',
        userName: params.orderData.customerName || 'Customer',
        type: 'DEBIT_PURCHASE',
        amount: orderTotal,
        previousBalance: currentBalance,
        newBalance: newBalance,
        referenceId: orderId,
        description: `Order #${orderId} purchase (${params.orderData.items.map((i) => i.productName).join(', ')})`,
        createdAt: now,
      });
      transaction.set(txRef, ledgerPayload);
    });

    if (!createdOrder) {
      throw new Error('অর্ডার সম্পন্ন করা সম্ভব হয়নি।');
    }
    return createdOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

function currentBalFormatted(val: number): string {
  return val.toFixed(2);
}

/**
 * User Management for Admin Panel
 */
export function subscribeAllUsers(
  callback: (users: UserProfile[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'users';
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      const list: UserProfile[] = [];
      const buggedDocs: { uid: string; email: string; name: string; amount: number }[] = [];

      snapshot.forEach((d) => {
        const data = { uid: d.id, ...d.data() } as UserProfile;
        const bal = Number(data.walletBalance);
        if (bal === 850 || bal === 800 || (data.walletBalance as any) === '850' || (data.walletBalance as any) === '800') {
          // Immediately fix local representation to ৳0
          data.walletBalance = 0;
          buggedDocs.push({
            uid: d.id,
            email: data.email || '',
            name: data.displayName || 'Customer',
            amount: bal || 850,
          });
        }
        list.push(data);
      });

      // Self-heal immediately in Firestore in background
      if (buggedDocs.length > 0) {
        (async () => {
          const now = new Date().toISOString();
          for (const item of buggedDocs) {
            try {
              await updateDoc(doc(db, 'users', item.uid), {
                walletBalance: 0,
                updatedAt: now,
              });
              const txRef = doc(collection(db, 'walletTransactions'));
              await setDoc(
                txRef,
                sanitizeForFirestore({
                  id: txRef.id,
                  userId: item.uid,
                  userEmail: item.email,
                  userName: item.name,
                  type: 'ADMIN_DEDUCT',
                  amount: item.amount,
                  previousBalance: item.amount,
                  newBalance: 0,
                  adminEmail: 'system_auto_fix',
                  reason: 'সিস্টেম অটোমেটিক ফিক্স: ভুলবশত যুক্ত হওয়া ৮৫০/৮০০ ব্যালেন্স রিসেট করে ৳০ করা হয়েছে',
                  createdAt: now,
                })
              );
            } catch (err) {
              console.warn('Auto-fix balance error for user:', item.uid, err);
            }
          }
        })();
      }

      list.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });
      callback(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    }
  );
}

export async function adminAdjustUserWallet(params: {
  userId: string;
  amount: number;
  actionType: 'ADD' | 'DEDUCT';
  reason: string;
  adminEmail: string;
}): Promise<void> {
  const userRef = doc(db, 'users', params.userId);
  const path = `users/${params.userId}`;
  const now = new Date().toISOString();

  try {
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('ইউজার খুঁজে পাওয়া যায়নি।');
      }
      const userData = userSnap.data();
      const currentBal = userData.walletBalance || 0;
      let newBal = currentBal;

      if (params.actionType === 'DEDUCT') {
        if (currentBal < params.amount) {
          throw new Error(`ইউজারের পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স ৳${currentBal.toFixed(2)}`);
        }
        newBal = currentBal - params.amount;
      } else {
        newBal = currentBal + params.amount;
      }

      transaction.update(userRef, {
        walletBalance: newBal,
        updatedAt: now,
      });

      const txRef = doc(collection(db, 'walletTransactions'));
      const ledgerEntry = sanitizeForFirestore({
        id: txRef.id,
        userId: params.userId,
        userEmail: userData.email || '',
        userName: userData.displayName || 'Customer',
        type: params.actionType === 'ADD' ? 'ADMIN_ADD' : 'ADMIN_DEDUCT',
        amount: params.amount,
        previousBalance: currentBal,
        newBalance: newBal,
        reason: params.reason || '',
        adminEmail: params.adminEmail || 'admin',
        description: `Admin ${params.actionType === 'ADD' ? 'Added' : 'Deducted'} ৳${params.amount}. Reason: ${params.reason}`,
        createdAt: now,
      });
      transaction.set(txRef, ledgerEntry);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeAllWalletTransactions(
  callback: (txs: WalletTransaction[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'walletTransactions';
  return onSnapshot(
    collection(db, 'walletTransactions'),
    (snapshot) => {
      const list: WalletTransaction[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as WalletTransaction);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    }
  );
}

export function subscribeUserWalletTransactions(
  userId: string,
  callback: (txs: WalletTransaction[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'walletTransactions';
  const q = query(collection(db, 'walletTransactions'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: WalletTransaction[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as WalletTransaction);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    }
  );
}


