import { useCallback, useEffect, useMemo, useState } from "react";
import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { PreferencesContext } from "./usePreferences";

const APPEARANCE_KEY = "readify_appearance";

const APPEARANCE_OPTIONS = ["light", "dark", "system"];

const TRANSLATIONS = {
  vi: {
    "app.home": "Trang chủ",
    "app.browse": "Khám phá",
    "app.wishlist": "Yêu thích",
    "app.library": "Thư viện",
    "app.orders": "Đơn hàng",
    "app.dashboard": "Dashboard",
    "app.profile": "Hồ sơ",
    "app.settings": "Cài đặt",
    "app.premium": "Premium",
    "app.cart": "Giỏ hàng",
    "app.login": "Đăng nhập",
    "app.register": "Đăng ký",
    "app.logout": "Đăng xuất",
    "app.searchPlaceholder": "Tìm ebook...",
    "app.personalProfile": "Hồ sơ cá nhân",
    "app.account": "Tài khoản",
    "app.overview": "Tổng quan",
    "app.admin": "Quản trị",
    "app.system": "Hệ thống",
    "app.manageBooks": "Quản lý sách",
    "app.uploadBook": "Upload sách",
    "app.manageReviews": "Quản lý đánh giá",
    "app.manageInvoices": "Quản lý hóa đơn",
    "app.manageUsers": "Quản lý người dùng",
    "app.backHome": "Về trang chủ",
    "settings.title": "Cài đặt",
    "settings.subtitle": "Quản lý tùy chọn tài khoản và trải nghiệm đọc sách.",
    "settings.appearance": "Giao diện",
    "settings.appearanceDesc": "Chọn chế độ hiển thị phù hợp với môi trường làm việc của bạn.",
    "settings.light": "Sáng",
    "settings.dark": "Tối",
    "settings.system": "Thiết bị",
    "settings.accountDesc": "Thông tin cá nhân, ảnh đại diện và mật khẩu được quản lý trong trang hồ sơ.",
    "settings.openProfile": "Mở hồ sơ",
    "settings.notifications": "Thông báo",
    "settings.orderEmail": "Email cập nhật đơn hàng",
    "settings.orderEmailDesc": "Nhận thông báo khi đơn hàng hoặc thư viện có thay đổi.",
    "settings.recommendations": "Gợi ý sách mới",
    "settings.recommendationsDesc": "Nhận đề xuất ebook theo lịch sử đọc và mua sách.",
    "footer.tagline": "Nền tảng ebook hàng đầu Việt Nam. Hàng nghìn đầu sách chất lượng, đọc mọi lúc mọi nơi trên mọi thiết bị.",
    "footer.explore": "Khám phá",
    "footer.support": "Hỗ trợ",
    "footer.newsletter": "Nhận thông báo",
    "footer.newsletterDesc": "Đăng ký để nhận ưu đãi độc quyền, sách mới và nội dung hay mỗi tuần.",
    "footer.subscribe": "Đăng ký ngay",
    "footer.emailPlaceholder": "Nhập email của bạn...",
    "footer.success": "Đăng ký thành công! Cảm ơn bạn.",
    "footer.privacyNote": "Chúng tôi không bao giờ chia sẻ email của bạn.",
    "footer.rights": "Đã đăng ký bản quyền.",
  },
};

function getStoredValue(key, fallback, validOptions) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const storedValue = window.localStorage.getItem(key);
  return validOptions.includes(storedValue) ? storedValue : fallback;
}

function getSystemTheme() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

function buildMuiTheme(resolvedTheme) {
  const isDark = resolvedTheme === "dark";
  const openSansFontFamily =
    '"Open Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  return createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: {
        main: "#E75B5B",
        light: "#FCA5A5",
        dark: "#B42323",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: "#F97316",
        light: "#FDBA74",
        dark: "#C2410C",
        contrastText: "#FFFFFF",
      },
      error: {
        main: "#DC2626",
      },
      background: {
        default: isDark ? "#171113" : "#FFF7F7",
        paper: isDark ? "#21181B" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#F8FAFC" : "#0F172A",
        secondary: isDark ? "#CBD5E1" : "#475569",
      },
    },
    typography: {
      fontFamily: openSansFontFamily,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: openSansFontFamily,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontFamily: openSansFontFamily,
            textTransform: "none",
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontFamily: openSansFontFamily,
          },
          input: {
            fontFamily: openSansFontFamily,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontFamily: openSansFontFamily,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}

export function PreferencesProvider({ children }) {
  const [appearance, setAppearanceState] = useState(() =>
    getStoredValue(APPEARANCE_KEY, "system", APPEARANCE_OPTIONS),
  );
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const resolvedTheme = appearance === "system" ? systemTheme : appearance;
  const muiTheme = useMemo(() => buildMuiTheme(resolvedTheme), [resolvedTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) {
      return undefined;
    }

    const handleSystemThemeChange = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    handleSystemThemeChange(mediaQuery);
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.appearance = appearance;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [appearance, resolvedTheme]);

  useEffect(() => {
    document.documentElement.lang = "vi";
    window.localStorage.removeItem("readify_language");
  }, []);

  const setAppearance = useCallback((nextAppearance) => {
    const safeAppearance = APPEARANCE_OPTIONS.includes(nextAppearance)
      ? nextAppearance
      : "system";
    window.localStorage.setItem(APPEARANCE_KEY, safeAppearance);
    setAppearanceState(safeAppearance);
  }, []);

  const t = useCallback(
    (key) => TRANSLATIONS.vi[key] || key,
    [],
  );

  const value = useMemo(
    () => ({
      appearance,
      setAppearance,
      resolvedTheme,
      t,
    }),
    [appearance, resolvedTheme, setAppearance, t],
  );

  return (
    <PreferencesContext.Provider value={value}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </PreferencesContext.Provider>
  );
}
