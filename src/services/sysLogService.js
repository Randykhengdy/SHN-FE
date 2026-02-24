import { request } from '@/lib/request';

const sysLogService = {
    getPaginated: async (page = 1, perPage = 10, search = "", sortBy = "", sortDir = "asc") => {
        const params = new URLSearchParams({
            search: search || "",
            page: page.toString(),
            per_page: perPage.toString()
        });

        if (sortBy && sortDir) {
            params.append('sort', `${sortBy},${sortDir}`);
        }

        return request(`/sys-log?${params}`, { method: 'GET' });
    },

    create: async (data) => {
        return request('/sys-log', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    delete: async (id) => {
        return request(`/sys-log/${id}`, {
            method: 'DELETE',
        });
    },

    clearAll: async () => {
        return request('/sys-log/clear', {
            method: 'DELETE',
        });
    }
};

export default sysLogService;
