import { request } from '@/lib/request'

export const notificationsService = {
  getByUser: async (userId, params = {}) => {
    const query = new URLSearchParams()
    if (params.per_page) query.append('per_page', params.per_page)
    if (params.page) query.append('page', params.page)
    if (typeof params.unread !== 'undefined') query.append('unread', params.unread ? '1' : '0')
    const qs = query.toString() ? `?${query.toString()}` : ''
    return request(`/notifications/by-user/${userId}${qs}`, { method: 'GET' })
  },
  markAsRead: async (notificationId) => {
    return request(`/notifications/${notificationId}/read`, { method: 'PATCH' })
  }
}
