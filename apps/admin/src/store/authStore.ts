import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthStore {
  token: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  slug: string | null;
  setAuth: (data: { token: string; restaurantId: string; restaurantName: string; slug: string }) => void;
  clearAuth: () => void;
  isLoggedIn: () => boolean;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      restaurantId: null,
      restaurantName: null,
      slug: null,
      setAuth: (data) => {
        localStorage.setItem('od_token', data.token);
        set({ token: data.token, restaurantId: data.restaurantId, restaurantName: data.restaurantName, slug: data.slug });
      },
      clearAuth: () => {
        localStorage.removeItem('od_token');
        set({ token: null, restaurantId: null, restaurantName: null, slug: null });
      },
      isLoggedIn: () => !!get().token,
    }),
    { name: 'od-auth', storage: createJSONStorage(() => localStorage) }
  )
);

export default useAuthStore;
