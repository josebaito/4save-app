import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { optimizedQueries } from '@/lib/db/optimizedQueries';
import { DashboardClient } from '@/components/tecnico/DashboardClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TecnicoDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.type !== 'tecnico') {
    redirect('/');
  }

  const token = (session as any)?.accessToken;
  let tickets = [];

  try {
    tickets = await optimizedQueries.getTicketsByTecnicoCached(session.user.id, token);
  } catch (error) {
    console.error('Erro ao carregar tickets no servidor:', error);
  }

  return <DashboardClient initialTickets={tickets} />;
}