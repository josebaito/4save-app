const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchAPI(endpoint: string, options: RequestInit = {}, token?: string) {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    console.log(`[API] Fetching ${endpoint} | Token present: ${!!token} ${token ? `(${token.substring(0, 10)}...)` : ''}`);

    if (token) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 204) return null;
        const errorText = await response.text();
        console.error(`[API Error] ${response.status} ${endpoint}:`, errorText);
        throw new Error(`API Error: ${response.statusText} - ${errorText}`);
    }

    // Check if response has content
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

export const api = {
    tickets: {
        list: (token?: string) => fetchAPI('/tickets', {}, token),
        listByTecnico: (id: string, token?: string) => fetchAPI(`/tickets/tecnico/${id}`, {}, token),
        get: (id: string, token?: string) => fetchAPI(`/tickets/${id}`, {}, token),
        create: (data: any, token?: string) => fetchAPI('/tickets', { method: 'POST', body: JSON.stringify(data) }, token),
        update: (id: string, data: any, token?: string) => fetchAPI(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    },
    users: {
        list: (token?: string) => fetchAPI('/users', {}, token),
        listTecnicos: (token?: string) => fetchAPI('/users/tecnicos', {}, token),
        getOnline: (token?: string) => fetchAPI('/users/tecnicos/online', {}, token),
        get: (id: string, token?: string) => fetchAPI(`/users/${id}`, {}, token),
        create: (data: any, token?: string) => fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }, token),
        update: (id: string, data: any, token?: string) => fetchAPI(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
        delete: (id: string, token?: string) => fetchAPI(`/users/${id}`, { method: 'DELETE' }, token),
    },
    relatorios: {
        list: (token?: string) => fetchAPI('/relatorios', {}, token),
        getStats: (token?: string) => fetchAPI('/relatorios/stats', {}, token),
        get: (id: string, token?: string) => fetchAPI(`/relatorios/${id}`, {}, token),
        getByTicket: (ticketId: string, token?: string) => fetchAPI(`/relatorios/ticket/${ticketId}`, {}, token),
        create: (data: any, token?: string) => fetchAPI('/relatorios', { method: 'POST', body: JSON.stringify(data) }, token),
        update: (id: string, data: any, token?: string) => fetchAPI(`/relatorios/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    },
    clientes: {
        list: (token?: string) => fetchAPI('/clientes', {}, token),
        get: (id: string, token?: string) => fetchAPI(`/clientes/${id}`, {}, token),
        create: (data: any, token?: string) => fetchAPI('/clientes', { method: 'POST', body: JSON.stringify(data) }, token),
        update: (id: string, data: any, token?: string) => fetchAPI(`/clientes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    },
    contratos: {
        list: (token?: string) => fetchAPI('/contratos', {}, token),
        get: (id: string, token?: string) => fetchAPI(`/contratos/${id}`, {}, token),
        create: (data: any, token?: string) => fetchAPI('/contratos', { method: 'POST', body: JSON.stringify(data) }, token),
        update: (id: string, data: any, token?: string) => fetchAPI(`/contratos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    },
    // Maintenance endpoints (to be implemented in backend if not exists, for now mocking or mapping)
    manutencao: {
        listCronogramas: async (token?: string) => [], // TODO: Implement in backend
        listHistorico: async (token?: string) => [], // TODO: Implement in backend
        verifySystem: async () => ({ ticketsCriados: 0, ticketsAtribuidos: 0, tecnicosAtribuidos: 0 }),
        createCronograma: async (contratoId: string, plano: any) => { },
        updateCronograma: async (id: string, data: any) => { },
        deleteCronograma: async (id: string) => { },
    }
};
