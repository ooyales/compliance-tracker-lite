import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import AppShell from '@/components/layout/AppShell';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ControlListPage from '@/pages/ControlListPage';
import ControlDetailPage from '@/pages/ControlDetailPage';
import POAMPage from '@/pages/POAMPage';
import EvidencePage from '@/pages/EvidencePage';
import BoundaryPage from '@/pages/BoundaryPage';
import UploadEvidencePage from '@/pages/UploadEvidencePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="controls" element={<ControlListPage />} />
        <Route path="controls/:id" element={<ControlDetailPage />} />
        <Route path="poam" element={<POAMPage />} />
        <Route path="evidence" element={<EvidencePage />} />
        <Route path="upload-evidence" element={<UploadEvidencePage />} />
        <Route path="boundary" element={<BoundaryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
