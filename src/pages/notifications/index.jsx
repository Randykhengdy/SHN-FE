import React, { useEffect, useState, useCallback } from 'react'
import PageLayout from '@/components/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'
import { useAlert } from '@/hooks/useAlert'
import { useAppContext } from '@/context/AppContext'
import { getUserInfo } from '@/lib/jwtUtils'
import { notificationsService } from '@/services/notificationsService'

export default function NotificationsPage() {
  const { showAlert, AlertComponent } = useAlert()
  const { user } = useAppContext()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  // remove unread filter for now (no update API)

  const loadNotifications = useCallback(async () => {
    const fallbackInfo = getUserInfo?.() || {}
    const currentUserId = (user && user.id) || fallbackInfo.id || fallbackInfo.user_id
    if (!currentUserId) return
    try {
      setLoading(true)
      const res = await notificationsService.getByUser(currentUserId, { per_page: perPage, page: currentPage })
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : [])
      const transformed = data.map(n => ({
        id: n.id,
        title: n.title || '-',
        message: n.message || '-',
        type: n.type || 'general',
        createdAt: n.created_at || n.createdAt || null,
        isRead: !!(n.is_read || n.read_at),
        readAt: n.read_at || null,
      }))
      setItems(transformed)
      setTotalItems(res?.pagination?.total || res?.total || transformed.length)
    } catch (e) {
      showAlert('Error', e.message || 'Gagal mengambil notifikasi', 'error')
    } finally {
      setLoading(false)
    }
  }, [user, perPage, currentPage])

  useEffect(() => { loadNotifications() }, [loadNotifications])

  const getTypeBadge = (t) => {
    const s = String(t || '').toLowerCase().replace(/[-\s]/g, '_')
    switch (s) {
      case 'sales_order': return <Badge className="bg-blue-100 text-blue-800">Sales Order</Badge>
      case 'work_order': return <Badge className="bg-green-100 text-green-800">Work Order</Badge>
      case 'work_order_planning': return <Badge className="bg-purple-100 text-purple-800">Work Order Planning</Badge>
      default: return <Badge className="bg-gray-100 text-gray-800">General</Badge>
    }
  }

  return (
    <PageLayout title="Notifikasi" category="TRANSAKSI">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(parseInt(v)); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={loadNotifications} disabled={loading} className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Judul</TableHead>
                  <TableHead>Pesan</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">Tidak ada notifikasi</TableCell>
                  </TableRow>
                ) : (
                  items.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">{n.title}</TableCell>
                      <TableCell>{n.message}</TableCell>
                      <TableCell>{getTypeBadge(n.type)}</TableCell>
                      <TableCell>{n.createdAt ? new Date(n.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {items.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white border-t border-gray-200 gap-4">
              <div className="text-sm text-gray-700">
                {(() => {
                  const startItem = (currentPage - 1) * perPage + 1
                  const endItem = Math.min(currentPage * perPage, totalItems)
                  return `Menampilkan ${startItem}-${endItem} dari ${totalItems} data`
                })()}
              </div>
              {Math.ceil((totalItems || 0) / perPage) > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: Math.min(5, Math.ceil(totalItems / perPage)) }, (_, i) => {
                    let pageNum
                    const totalPages = Math.ceil(totalItems / perPage)
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded ${currentPage === pageNum ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:bg-gray-50'}`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= Math.ceil(totalItems / perPage)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertComponent />
    </PageLayout>
  )
}
