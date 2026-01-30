'use client';

import { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Ticket } from '@/types';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO, isSameDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TicketsTrendChartProps {
    tickets: Ticket[];
}

export function TicketsTrendChart({ tickets }: TicketsTrendChartProps) {
    const chartData = useMemo(() => {
        if (!tickets || tickets.length === 0) return [];

        // Create a range for the last 30 days
        const end = new Date();
        const start = subDays(end, 30);
        const days = eachDayOfInterval({ start, end });

        return days.map(day => {
            // Filter tickets created on this specific day
            const count = tickets.filter(t =>
                isSameDay(parseISO(t.created_at), day)
            ).length;

            return {
                date: format(day, 'dd/MM', { locale: ptBR }),
                fullDate: format(day, 'dd ' + 'MMMM', { locale: ptBR }),
                tickets: count
            };
        });
    }, [tickets]);

    return (
        <Card className="col-span-1 lg:col-span-2 bg-card border-border shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-card-foreground">
                    Histórico de Tickets (Últimos 30 dias)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                interval={4}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--popover)',
                                    borderColor: 'var(--border)',
                                    borderRadius: 'var(--radius)',
                                    color: 'var(--popover-foreground)',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                itemStyle={{ color: 'var(--primary)' }}
                                labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}
                                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="tickets"
                                stroke="var(--primary)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorTickets)"
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
