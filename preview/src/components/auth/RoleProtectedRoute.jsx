import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, roleHome } from '../../store/authStore';

export default function RoleProtectedRoute({ roles, children }) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
}
