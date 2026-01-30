import { DashboardClient } from '@/components/admin/DashboardClient';
import { optimizedQueries } from '@/lib/db/optimizedQueries';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.accessToken;

  // Fetch initial data on the server
  // This utilizes strict typing from optimizedQueries
  const [stats, tickets, tecnicos] = await Promise.all([
    optimizedQueries.getDashboardStatsCached(token),
    optimizedQueries.getTicketsCached(token),
    optimizedQueries.getTecnicosOnlineCached(token)
  ]);

  return (
    <DashboardClient
      initialStats={stats}
      initialTickets={tickets}
      initialTecnicosOnline={tecnicos}
    />
  );
}