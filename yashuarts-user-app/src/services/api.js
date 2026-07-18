// YashuArts API Service Client

const API_BASE_URL = 'https://yashuarts-backend.onrender.com/api';

// Helper to get authentication token from localStorage
const getToken = () => {
  const profileStr = localStorage.getItem('yashuarts_profile');
  if (profileStr) {
    try {
      const profile = JSON.parse(profileStr);
      return profile?.token ?? null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Helper to format error messages nicely
const formatError = (error) => {
  const message = error?.message || '';
  if (
    message.includes('Failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('NetworkError') ||
    message.includes('ERR_CONNECTION_REFUSED') ||
    message.includes('ECONNREFUSED')
  ) {
    return 'Cannot reach the server. Please make sure the backend is running and your device is connected to the same network.';
  }
  if (message.includes('timed out') || error?.name === 'AbortError') {
    return 'Connection timed out. The server is taking too long to respond. Please try again.';
  }
  if (message.includes('401') || message.toLowerCase().includes('unauthorized')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (message.includes('403') || message.toLowerCase().includes('forbidden')) {
    return 'Access denied. You do not have permission to perform this action.';
  }
  if (message.includes('404')) {
    return 'The requested resource was not found on the server.';
  }
  if (message.includes('500') || message.toLowerCase().includes('internal server error')) {
    return 'The server encountered an unexpected error. Please try again later.';
  }
  return message || 'An unexpected error occurred. Please try again.';
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Core request fetch wrapper with authorization and retries
const request = async (path, options = {}, retries = 3) => {
  const headers = new Headers(options.headers || {});
  
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    const userFriendlyError = formatError(error);
    const isNetworkError =
      userFriendlyError.includes('Cannot reach') ||
      userFriendlyError.includes('timed out');
      
    if (retries > 0 && isNetworkError) {
      const delayMs = 1000 * 2 ** (3 - retries);
      console.warn(`[API] Network error. Retrying in ${delayMs}ms... (${retries} attempts left)`);
      await delay(delayMs);
      return request(path, options, retries - 1);
    }
    
    throw new Error(userFriendlyError);
  }
};

// Map backend Order format to client format
function mapOrder(order) {
  return {
    id: order._id,
    user_id: order.user_id,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    email_address: order.email_address,
    complete_address: order.complete_address,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    artwork_type: order.artwork_type,
    artwork_size: order.artwork_size,
    reference_image_url: order.reference_image_url,
    special_instructions: order.special_instructions,
    amount: order.amount,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    delivery_preference: order.delivery_preference,
    order_status: order.order_status,
    internal_notes: order.internal_notes,
    created_at: order.createdAt
  };
}

// Map backend Review format to client format
function mapReview(review) {
  return {
    id: review._id,
    artwork_id: review.artwork_id,
    user_id: review.user_id?._id || review.user_id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.createdAt,
    user_name: review.user_id?.full_name || 'Anonymous User',
    user_avatar: review.user_id?.avatar_url || ''
  };
}

// Map backend Message format to client format
function mapMessage(msg) {
  return {
    id: msg._id,
    sender_id: msg.sender_id,
    recipient_id: msg.recipient_id,
    message: msg.message,
    created_at: msg.createdAt
  };
}

export const api = {
  checkHealth: async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        return { ok: true, message: (await res.json()).service || 'Server is online' };
      }
      return { ok: false, message: 'Server returned an error response.' };
    } catch (e) {
      return { ok: false, message: 'Cannot reach the server. Please ensure the backend is running.' };
    }
  },

  auth: {
    login: async (email, password) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('yashuarts_profile', JSON.stringify(data));
      return data;
    },
    adminLogin: async (email, password) => {
      const data = await request('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('yashuarts_profile', JSON.stringify(data));
      return data;
    },
    register: async (email, password, fullName) => {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: fullName })
      });
      localStorage.setItem('yashuarts_profile', JSON.stringify(data));
      return data;
    },
    forgotPassword: async (email) => 
      await request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),
    verifyOtp: async (email, otp) => 
      await request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      }),
    resetPassword: async (email, otp, newPassword) => 
      await request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword })
      }),
    getProfile: async () => {
      const profile = await request('/auth/profile');
      return {
        id: profile._id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.createdAt,
        updated_at: profile.updatedAt
      };
    },
    updateProfile: async (profileData) => {
      const updated = await request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      const local = localStorage.getItem('yashuarts_profile');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          localStorage.setItem('yashuarts_profile', JSON.stringify({ ...parsed, ...updated }));
        } catch (e) {}
      }
      return updated;
    },
    logout: () => {
      localStorage.removeItem('yashuarts_profile');
    }
  },

  profile: {
    get: async () => await request('/profile'),
    update: async (data) => await request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    uploadPhoto: async (imageFile) => {
      const formData = new FormData();
      formData.append('image', imageFile);
      return await request('/profile/photo', {
        method: 'POST',
        body: formData
      });
    }
  },

  pricing: {
    getPublicPricing: async () => await request('/pricing'),
    getAllPricing: async () => await request('/pricing/all'),
    addPricing: async (pricingData) => await request('/pricing', {
      method: 'POST',
      body: JSON.stringify(pricingData)
    }),
    updatePricing: async (id, pricingData) => await request(`/pricing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pricingData)
    }),
    deletePricing: async (id) => await request(`/pricing/${id}`, {
      method: 'DELETE'
    }),
    seedDefaults: async () => await request('/pricing/reset', {
      method: 'POST'
    })
  },

  artworks: {
    getAll: async () => {
      const list = await request('/artworks');
      return list.map((item) => ({
        id: item._id,
        title: item.title,
        description: item.description,
        category: item.category,
        price: item.price,
        image_url: item.image_url,
        is_featured: item.is_featured,
        is_visible: item.is_visible === undefined ? true : item.is_visible,
        likes_count: item.likes_count,
        views_count: item.views_count,
        created_at: item.createdAt
      }));
    },
    getById: async (id) => {
      const t = await request(`/artworks/${id}`);
      return {
        id: t._id,
        title: t.title,
        description: t.description,
        category: t.category,
        price: t.price,
        image_url: t.image_url,
        is_featured: t.is_featured,
        is_visible: t.is_visible === undefined ? true : t.is_visible,
        likes_count: t.likes_count,
        views_count: t.views_count,
        created_at: t.createdAt
      };
    },
    create: async (data) => {
      const t = await request('/artworks', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return {
        id: t._id,
        title: t.title,
        description: t.description,
        category: t.category,
        price: t.price,
        image_url: t.image_url,
        is_featured: t.is_featured,
        is_visible: t.is_visible === undefined ? true : t.is_visible,
        likes_count: t.likes_count,
        views_count: t.views_count,
        created_at: t.createdAt
      };
    },
    update: async (id, data) => {
      const n = await request(`/artworks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return {
        id: n._id,
        title: n.title,
        description: n.description,
        category: n.category,
        price: n.price,
        image_url: n.image_url,
        is_featured: n.is_featured,
        is_visible: n.is_visible === undefined ? true : n.is_visible,
        likes_count: n.likes_count,
        views_count: n.views_count,
        created_at: n.createdAt
      };
    },
    delete: async (id) => await request(`/artworks/${id}`, {
      method: 'DELETE'
    }),
    like: async (id) => await request(`/artworks/${id}/like`, {
      method: 'POST'
    }),
    unlike: async (id) => await request(`/artworks/${id}/like`, {
      method: 'DELETE'
    }),
    getLikes: async () => await request('/artworks/likes')
  },

  orders: {
    create: async (data) => mapOrder(await request('/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    })),
    getAll: async () => {
      const list = await request('/orders');
      return list.map(mapOrder);
    },
    getById: async (id) => mapOrder(await request(`/orders/${id}`)),
    updateStatus: async (id, orderStatus, paymentStatus, paymentMethod, internalNotes) => 
      mapOrder(await request(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          order_status: orderStatus,
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          internal_notes: internalNotes
        })
      })),
    delete: async (id) => await request(`/orders/${id}`, {
      method: 'DELETE'
    })
  },

  reviews: {
    getByArtwork: async (artworkId) => {
      const list = await request(`/reviews/${artworkId}`);
      return list.map(mapReview);
    },
    create: async (artworkId, rating, comment) => 
      mapReview(await request(`/reviews/${artworkId}`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      }))
  },

  cart: {
    get: async () => {
      console.log('[API] Fetching cart...');
      const res = await request('/cart');
      console.log('[API] Fetch cart response:', res);
      return res;
    },
    getCount: async () => await request('/cart/count'),
    add: async (artworkId) => {
      console.log('[API] Adding to cart:', artworkId);
      const res = await request(`/cart/${artworkId}`, { method: 'POST' });
      console.log('[API] Add to cart response:', res);
      return res;
    },
    updateQuantity: async (artworkId, quantity) => await request(`/cart/${artworkId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    }),
    clear: async () => await request('/cart/clear', { method: 'DELETE' }),
    remove: async (artworkId) => {
      console.log('[API] Removing from cart:', artworkId);
      const res = await request(`/cart/${artworkId}`, { method: 'DELETE' });
      console.log('[API] Remove from cart response:', res);
      return res;
    }
  },

  messages: {
    getHistory: async (userId) => {
      const url = userId ? `/messages?userId=${userId}` : '/messages';
      const list = await request(url);
      return list.map(mapMessage);
    },
    send: async (messageText, recipientId) => 
      mapMessage(await request('/messages', {
        method: 'POST',
        body: JSON.stringify({ message: messageText, recipient_id: recipientId })
      })),
    getActiveChatUsers: async () => await request('/messages/users')
  },

  upload: {
    uploadImage: async (imageFile, folderName = 'yashuarts') => {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('folder', folderName);
      const res = await request('/upload', {
        method: 'POST',
        body: formData
      });
      return res.publicUrl;
    }
  },

  analytics: {
    logActivity: async (action, details, artworkId, metadata, sessionId) => 
      await request('/analytics/log', {
        method: 'POST',
        body: JSON.stringify({ action, details, artwork_id: artworkId, metadata, session_id: sessionId })
      }),
    startSession: async (sessionId, deviceInfo, pageUrl) => 
      await request('/analytics/session/start', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, device_info: deviceInfo, page_url: pageUrl })
      }),
    endSession: async (sessionId, duration) => 
      await request('/analytics/session/end', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, duration })
      }),
    getSummary: async () => request('/analytics/summary'),
    getCharts: async () => request('/analytics/charts'),
    getFunnel: async () => request('/analytics/funnel'),
    getAiInsights: async () => request('/analytics/ai-insights'),
    getHeatmap: async () => request('/analytics/heatmap')
  },

  users: {
    getAll: async () => request('/auth/users'),
    getDetails: async (id) => request(`/auth/users/${id}`),
    updateFcmToken: async (token) => await request('/auth/fcm-token', {
      method: 'PUT',
      body: JSON.stringify({ fcm_token: token })
    })
  }
};

export default api;
