import {
  getSuperReports,
  exportSuperReportsExcel,
} from '../../services/api';
import PlatformReportsPage from '../shared/PlatformReportsPage';

export default function SuperAdminReportsPage() {
  return (
    <PlatformReportsPage
      title="Master Reports"
      subtitlePrefix="Full platform report"
      queryKey="super-admin-reports"
      fetchReports={getSuperReports}
      exportExcel={exportSuperReportsExcel}
      showMonthlyTrend
    />
  );
}
