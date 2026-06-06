/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshCart = useCallback(async () => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      setItems([]);
      setError("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await axiosClient.get("/cart/");
      setItems((response.items || []).map(mapCartItem));
    } catch (err) {
      setItems([]);
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
    setError("");
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  );
  const itemCount = items.length;

  const contextValue = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      isLoading,
      error,
      refreshCart,
      addToCart,
      removeFromCart,
      clearLocalCart,
    }),
    [
      addToCart,
      clearLocalCart,
      error,
      isLoading,
      itemCount,
      items,
      refreshCart,
      removeFromCart,
      subtotal,
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
