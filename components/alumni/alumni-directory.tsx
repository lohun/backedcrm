'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlumniTable } from '@/components/alumni/alumni-table'
import { AlumniModal } from '@/components/alumni/alumni-modal'
import { BulkUploadModal } from '@/components/alumni/bulk-upload-modal'
import { getAlumni, deleteAlumni, type Alumni } from '@/app/actions/alumni'

interface AlumniDirectoryProps {
  orgId: string
  adminId: string
}

export function AlumniDirectory({ orgId, adminId }: AlumniDirectoryProps) {
  const router = useRouter()
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadAlumni = useCallback(async () => {
    setIsLoading(true)
    const result = await getAlumni(orgId)
    
    if (result.success) {
      setAlumni(result.data)
    } else {
      console.error('Failed to load alumni:', result.error)
    }
    
    setIsLoading(false)
  }, [orgId])

  // Load alumni on mount and when orgId changes
  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      setIsLoading(true)
      const result = await getAlumni(orgId)
      
      if (isMounted) {
        if (result.success) {
          setAlumni(result.data)
        } else {
          console.error('Failed to load alumni:', result.error)
        }
        setIsLoading(false)
      }
    }
    
    fetchData()
    
    return () => {
      isMounted = false
    }
  }, [orgId])

  const handleAddNew = useCallback(() => {
    setSelectedAlumni(null)
    setIsModalOpen(true)
  }, [])

  const handleEdit = useCallback((alumni: Alumni) => {
    setSelectedAlumni(alumni)
    setIsModalOpen(true)
  }, [])

  const handleDelete = useCallback(async (alumni: Alumni) => {
    if (!confirm(`Are you sure you want to delete ${alumni.full_name}?`)) {
      return
    }

    setIsDeleting(true)
    const result = await deleteAlumni(alumni.id)
    
    if (result.success) {
      await loadAlumni()
    } else {
      alert('Failed to delete alumni: ' + result.error.message)
    }
    
    setIsDeleting(false)
  }, [loadAlumni])

  const handleSuccess = useCallback(async () => {
    await loadAlumni()
    router.refresh()
  }, [loadAlumni, router])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Alumni Directory</h2>
          <p className="text-muted-foreground">
            Manage your alumni network. {alumni.length} members total.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsBulkModalOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Bulk Upload
          </Button>
          <Button onClick={handleAddNew}>
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Alumni
          </Button>
        </div>
      </div>

      {/* Table */}
      <AlumniTable
        data={alumni}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading || isDeleting}
      />

      {/* Individual Entry Modal */}
      <AlumniModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        alumni={selectedAlumni}
        orgId={orgId}
        adminId={adminId}
        onSuccess={handleSuccess}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        orgId={orgId}
        adminId={adminId}
        onSuccess={handleSuccess}
      />
    </div>
  )
}