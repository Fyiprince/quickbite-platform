import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  menuItemId: string;
  name: string;
  pricePaise: number;
  isVeg: boolean;
  quantity: number;
}

interface CartState {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
}

interface CartContextValue {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  count: number;
  subtotalPaise: number;
  bump: number;
  addItem: (item: Omit<CartItem, "quantity">, restaurant: { id: string; name: string }) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "quickbite-cart-v1";

function loadCart(): CartState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed.restaurantId || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState | null>(() =>
    typeof window === "undefined" ? null : loadCart(),
  );
  const [bump, setBump] = useState(0);

  useEffect(() => {
    try {
      if (cart) localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, [cart]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, restaurant: { id: string; name: string }) => {
      setCart((prev) => {
        const base: CartState =
          prev && prev.restaurantId === restaurant.id
            ? prev
            : { restaurantId: restaurant.id, restaurantName: restaurant.name, items: [] };
        const existing = base.items.find((i) => i.menuItemId === item.menuItemId);
        const items = existing
          ? base.items.map((i) =>
              i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i,
            )
          : [...base.items, { ...item, quantity: 1 }];
        return { ...base, items };
      });
      setBump((b) => b + 1);
    },
    [],
  );

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    setCart((prev) => {
      if (!prev) return prev;
      if (quantity <= 0) {
        return { ...prev, items: prev.items.filter((i) => i.menuItemId !== menuItemId) };
      }
      return {
        ...prev,
        items: prev.items.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity } : i,
        ),
      };
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setCart((prev) =>
      prev ? { ...prev, items: prev.items.filter((i) => i.menuItemId !== menuItemId) } : prev,
    );
  }, []);

  const clear = useCallback(() => setCart(null), []);

  const value = useMemo<CartContextValue>(() => {
    const items = cart?.items ?? [];
    return {
      restaurantId: cart?.restaurantId ?? null,
      restaurantName: cart?.restaurantName ?? null,
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotalPaise: items.reduce((s, i) => s + i.pricePaise * i.quantity, 0),
      bump,
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [cart, bump, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
