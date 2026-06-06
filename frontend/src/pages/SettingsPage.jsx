import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import {
  DarkModeOutlined,
  LightModeOutlined,
  ManageAccountsOutlined,
  NotificationsOutlined,
  SettingsSuggestOutlined,
  WbSunnyOutlined,
} from "@mui/icons-material";
import { usePreferences } from "../context/usePreferences";

const APPEARANCE_OPTIONS = [
  {
    value: "light",
    labelKey: "settings.light",
    icon: <LightModeOutlined fontSize="small" />,
  },
  {
    value: "dark",
    labelKey: "settings.dark",
    icon: <DarkModeOutlined fontSize="small" />,
  },
  {
    value: "system",
    labelKey: "settings.system",
    icon: <SettingsSuggestOutlined fontSize="small" />,
  },
];

export default function SettingsPage() {
  const { appearance, setAppearance, resolvedTheme, t } = usePreferences();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            {t("settings.title")}
          </Typography>
          <Typography color="text.secondary">
            {t("settings.subtitle")}
          </Typography>
        </Box>

        <Card sx={{ p: 3, borderRadius: 2 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <WbSunnyOutlined color="primary" />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {t("settings.appearance")}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {t("settings.appearanceDesc")}
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1.5,
              }}
            >
              {APPEARANCE_OPTIONS.map((option) => {
                const isSelected = appearance === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={isSelected ? "contained" : "outlined"}
                    startIcon={option.icon}
                    onClick={() => setAppearance(option.value)}
                    sx={{
                      justifyContent: "flex-start",
                      borderRadius: 2,
                      py: 1.2,
                      fontWeight: 800,
                    }}
                  >
                    {t(option.labelKey)}
                  </Button>
                );
              })}
            </Box>

            <Typography color="text.secondary" variant="body2">
              Theme đang áp dụng:{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "text.primary" }}>
                {resolvedTheme === "dark" ? t("settings.dark") : t("settings.light")}
              </Box>
            </Typography>
          </Stack>
        </Card>

        <Card sx={{ p: 3, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ManageAccountsOutlined color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t("app.account")}
              </Typography>
            </Stack>
            <Typography color="text.secondary">
              {t("settings.accountDesc")}
            </Typography>
            <Button
              component={Link}
              to="/profile"
              variant="contained"
              sx={{ borderRadius: 999, width: "fit-content", px: 3 }}
            >
              {t("settings.openProfile")}
            </Button>
          </Stack>
        </Card>

        <Card sx={{ p: 3, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <NotificationsOutlined color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t("settings.notifications")}
              </Typography>
            </Stack>
            <Divider />
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
            >
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  {t("settings.orderEmail")}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {t("settings.orderEmailDesc")}
                </Typography>
              </Box>
              <Switch defaultChecked />
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
            >
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  {t("settings.recommendations")}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {t("settings.recommendationsDesc")}
                </Typography>
              </Box>
              <Switch />
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
