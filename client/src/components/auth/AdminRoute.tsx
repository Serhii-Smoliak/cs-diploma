import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/missions" replace />;
  }

  return <>{children}</>;
}
