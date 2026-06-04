import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Container, Box, Typography, Button, Card, Avatar, Divider, Stack } from '@mui/material';
import { AccountCircleOutlined, ExitToAppOutlined } from '@mui/icons-material';

const Account = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.light', fontSize: '2rem', fontWeight: 'bold', mb: 2 }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : <AccountCircleOutlined sx={{ fontSize: 50 }} />}
          </Avatar>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Hồ Sơ Cá Nhân
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Quản lý thông tin tài khoản mua sách của bạn
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2} sx={{ my: 3, textAlign: 'left' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#f8f9fa', borderRadius: 2 }}>
            <Typography color="text.secondary">Tên tài khoản:</Typography>
            <Typography sx={{ fontWeight: 600 }}>{user?.name || 'Hồ Nhật Lưu'}</Typography> 
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#f8f9fa', borderRadius: 2 }}>
            <Typography color="text.secondary">Quyền truy cập:</Typography>
            <Typography color="success.main" sx={{ fontWeight: 600 }}>
              Thành viên chính thức
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Button
          variant="outlined"
          color="error"
          fullWidth
          startIcon={<ExitToAppOutlined />}
          onClick={logout}
          sx={{ mt: 2, p: 1.2, borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
        >
          Đăng Xuất Khỏi Hệ Thống
        </Button>
      </Card>
    </Container>
  );
};

export default Account;