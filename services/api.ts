
/**
 * CUTERIAA - PRO CLOUD SYNC SERVICE
 * Updated Endpoint URL: AKfycbzUPm0ybw1iaRk2nchXaUwlxH5ZEy6-QTZ0GPsZ684cbgYiy5eAnSNRep4DHDD-2yeF
 */

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzUPm0ybw1iaRk2nchXaUwlxH5ZEy6-QTZ0GPsZ684cbgYiy5eAnSNRep4DHDD-2yeF/exec';

async function cloudRequest(action: string, data?: any) {
  try {
    const url = `${WEB_APP_URL}?action=${action}&_t=${Date.now()}`;
    const options: RequestInit = {
      method: data ? 'POST' : 'GET',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow'
    };
    
    if (data) {
      // Use text/plain to avoid preflight issues in some environments
      options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
      options.body = JSON.stringify({ action: action, data: data });
    }
    
    console.log(`Cloud Sync [${action}] Starting...`, data ? '(with payload)' : '');
    const response = await fetch(url, options);
    const text = await response.text();
    
    if (!response.ok) {
      console.error(`HTTP Error [${action}]: ${response.status}`, text);
      return { error: `Server returned ${response.status}: ${text.slice(0, 50)}` };
    }
    
    try {
      const json = JSON.parse(text);
      console.log(`Cloud Sync [${action}] Success:`, json);
      return json;
    } catch (e) {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('success') || lowerText.includes('online') || lowerText.includes('complete')) {
        console.log(`Cloud Sync [${action}] Text-Verified Success`);
        return { status: 'success' };
      }
      console.warn(`Cloud Sync [${action}] returned non-JSON:`, text.slice(0, 100));
      return { error: "Sync connection acknowledged but response was malformed", raw: text };
    }
  } catch (error) {
    console.error(`Cloud Request Critical Failure [${action}]:`, error);
    return { error: error instanceof Error ? error.message : "Network/CORS failure" };
  }
}

export const sheetApi = {
  async authenticate(userId: string, pass: string) {
    const cleanId = userId.trim();
    const cleanPass = pass.trim();
    const users = await cloudRequest('getAuth');
    if (users && Array.isArray(users)) {
      // Robust matching: trim and case-insensitive for ID, normalize object keys
      const found = users.find((u: any) => {
        // Find keys case-insensitively
        const uIdKey = Object.keys(u).find(k => k.toLowerCase() === 'id');
        const uPassKey = Object.keys(u).find(k => k.toLowerCase() === 'pass');
        
        if (!uIdKey || !uPassKey) return false;
        
        const uId = String(u[uIdKey]).trim().toLowerCase();
        const uPass = String(u[uPassKey]).trim();
        
        return uId === cleanId.toLowerCase() && uPass === cleanPass;
      });
      if (found) return found;
    }
    return null;
  },

  async fetchProducts() {
    const data = await cloudRequest('getProducts');
    if (data && Array.isArray(data)) {
      try {
        localStorage.setItem('cuteriaa_products', JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to cache products to localStorage:', e);
      }
      return data;
    }
    return null;
  },

  async saveProduct(product: any) {
    return await cloudRequest('saveProduct', product);
  },

  async deleteProduct(id: string) {
    return await cloudRequest('deleteProduct', { id });
  },

  async fetchCategories() {
    const data = await cloudRequest('getCategories');
    if (data && Array.isArray(data)) {
      try {
        localStorage.setItem('cuteriaa_categories', JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to cache categories to localStorage:', e);
      }
      return data;
    }
    return null;
  },

  async saveCategory(category: any) {
    return await cloudRequest('saveCategory', category);
  },

  async deleteCategory(id: string) {
    return await cloudRequest('deleteCategory', { id });
  },

  async fetchOrders() {
    return await cloudRequest('getOrders');
  },

  async updateOrder(order: any) {
    return await cloudRequest('updateOrder', order);
  },

  async syncOrder(order: any) {
    return await cloudRequest('addOrder', order);
  },

  async fetchChats() {
    return await cloudRequest('getChats');
  },

  async syncChat(session: any) {
    return await cloudRequest('saveChat', session);
  },

  async runCloudSetup() {
    return await cloudRequest('setup');
  }
};
