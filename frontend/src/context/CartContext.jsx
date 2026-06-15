/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext(null);

function mapCartItem(item) {
  const book = item.book || {};
  const authorLabel =
    (book.authors || [])
      .map((author) => author.full_name)
      .filter(Boolean)
      .join(", ") || "Ebook";

  return {
    id: item.id,
    cartItemId: item.id,
    bookId: book.id,
    title: book.title || "Sách chưa xác định",
    author: authorLabel,
    price: Number(book.price || 0),
    originalPrice: Number(book.original_price || book.price || 0),
    promotionDiscountRate: Number(book.promotion_discount_rate || 0),
    promotionName: book.promotion_name || "",
    quantity: 1,
    cover: "📘",
    coverUrl: book.cover_url || "",
    formats: book.format_labels || [],
  };
}

function buildApiError(error, fallback) {
  const data = error.response?.data;
  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  if (data.book_id) {
    const message = Array.isArray(data.book_id) ? data.book_id[0] : data.book_id;
    if (message === "This book is already in your cart.") {
      return "Sách này đã có trong giỏ hàng.";
    }
    return message;
  }

  return fallback;
}

export function CartProvider({ children }) {
  const { isAuthenticated, isAuthReady } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [selectedCartItemIds, setSelectedCartItemIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const knownCartItemIdsRef = useRef([]);

  const refreshCart = useCallback(async () => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      setItems([]);
      setSelectedCartItemIds([]);
      knownCartItemIdsRef.current = [];
      setError("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await axiosClient.get("/cart/");
      const nextItems = (response.items || []).map(mapCartItem);
      const nextItemIds = nextItems.map((item) => item.id);
      const previousItemIds = new Set(knownCartItemIdsRef.current);

      setItems(nextItems);
      setSelectedCartItemIds((currentIds) => {
        const currentSelectedIds = new Set(currentIds.map(Number));
        const nextSelectedIds = nextItemIds.filter(
          (itemId) => currentSelectedIds.has(itemId) || !previousItemIds.has(itemId),
        );
        knownCartItemIdsRef.current = nextItemIds;
        return nextSelectedIds;
      });
    } catch (err) {
      setItems([]);
      setSelectedCartItemIds([]);
      knownCartItemIdsRef.current = [];
      setError(buildApiError(err, "Không thể tải giỏ hàng."));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthReady, isAuthenticated]);

  useEffect(() => {
    const loadTimer = window.setTimeout(refreshCart, 0);
    return () => window.clearTimeout(loadTimer);
  }, [refreshCart]);

  const addToCart = useCallback(
    async (bookOrId) => {
      if (!isAuthenticated) {
        const loginError = new Error("Vui lòng đăng nhập để thêm sách vào giỏ hàng.");
        loginError.code = "LOGIN_REQUIRED";
        throw loginError;
      }

      const bookId =
        typeof bookOrId === "object" ? bookOrId.id || bookOrId.bookId : bookOrId;

      try {
        await axiosClient.post("/cart/items/", { book_id: bookId });
        await refreshCart();
        return { status: "added" };
      } catch (err) {
        const message = buildApiError(err, "Không thể thêm sách vào giỏ hàng.");
        await refreshCart();
        if (message === "Sách này đã có trong giỏ hàng.") {
          return { status: "duplicate", message };
        }
        throw new Error(message, { cause: err });
      }
    },
    [isAuthenticated, refreshCart],
  );

  const removeFromCart = useCallback(
    async (cartItemId) => {
      await axiosClient.delete(`/cart/items/${cartItemId}/`);
      await refreshCart();
    },
    [refreshCart],
  );

  const clearLocalCart = useCallback(() => {
    setItems([]);
    setSelectedCartItemIds([]);
    knownCartItemIdsRef.current = [];
    setError("");
  }, []);

  const toggleCartItemSelection = useCallback((cartItemId) => {
    const normalizedId = Number(cartItemId);
    setSelectedCartItemIds((currentIds) =>
      currentIds.includes(normalizedId)
        ? currentIds.filter((itemId) => itemId !== normalizedId)
        : [...currentIds, normalizedId],
    );
  }, []);

  const selectAllCartItems = useCallback(() => {
    setSelectedCartItemIds(items.map((item) => item.id));
  }, [items]);

  const clearCartItemSelection = useCallback(() => {
    setSelectedCartItemIds([]);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  );
  const selectedCartItems = useMemo(() => {
    const selectedIds = new Set(selectedCartItemIds);
    return items.filter((item) => selectedIds.has(item.id));
  }, [items, selectedCartItemIds]);
  const selectedSubtotal = useMemo(
    () => selectedCartItems.reduce((sum, item) => sum + item.price, 0),
    [selectedCartItems],
  );
  const itemCount = items.length;

  const contextValue = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      selectedCartItemIds,
      selectedCartItems,
      selectedSubtotal,
      isLoading,
      error,
      refreshCart,
      addToCart,
      removeFromCart,
      clearLocalCart,
      toggleCartItemSelection,
      selectAllCartItems,
      clearCartItemSelection,
    }),
    [
      addToCart,
      clearCartItemSelection,
      clearLocalCart,
      error,
      isLoading,
      itemCount,
      items,
      refreshCart,
      removeFromCart,
      selectAllCartItems,
      selectedCartItemIds,
      selectedCartItems,
      selectedSubtotal,
      subtotal,
      toggleCartItemSelection,
    ],
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }
  return context;
}
