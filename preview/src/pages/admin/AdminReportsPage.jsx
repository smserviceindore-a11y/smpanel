import {
  getAdminReports,
  exportAdminReportsExcel,
} from '../../services/api';
import PlatformReportsPage from '../shared/PlatformReportsPage';

export default function AdminReportsPage() {
  return (
    <PlatformReportsPage
      title="Ops Reports"
      subtitlePrefix="Operations snapshot"
      queryKey="admin-reports"
      fetchReports={getAdminReports}
      exportExcel={exportAdminReportsExcel}
      showMonthlyTrend
    />
  );
}
