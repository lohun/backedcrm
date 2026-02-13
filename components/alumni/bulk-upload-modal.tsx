'use client'

import { useState, useCallback, useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { bulkUploadAlumni, validateCSVHeaders } from '@/app/actions/alumni'
import { ALUMNI_CSV_HEADERS, REQUIRED_CSV_HEADERS } from '@/lib/validations/alumni'
import type { ActionResponse } from '@/lib/errors'

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  orgId: string
  adminId: string
  onSuccess: () => void
}

interface UploadResult {
  successCount: number
  failedCount: number
  failedRows: Array<{
    row: number
    data: Record<string, unknown>
    error: string
  }>
}

export function BulkUploadModal({ isOpen, onClose, orgId, adminId, onSuccess }: BulkUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [parsedData, setParsedData] = useState<Record<string, unknown>[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = useCallback(() => {
    const csvContent = ALUMNI_CSV_HEADERS.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'alumni_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }, [])

  const downloadFailedRows = useCallback(() => {
    if (!result?.failedRows.length) return

    const headers = ALUMNI_CSV_HEADERS
    const csvRows = result.failedRows.map(({ data }) => 
      headers.map((h: string) => data[h] || '').join(',')
    )
    const csvContent = [headers.join(','), ...csvRows].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'failed_alumni_uploads.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }, [result])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setResult(null)
    setParsedData(null)

    try {
      let data: Record<string, unknown>[] = []

      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const parseResult = await new Promise<Papa.ParseResult<Record<string, unknown>>>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: resolve,
            error: reject,
          })
        })
        data = parseResult.data
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Parse Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        data = XLSX.utils.sheet_to_json(worksheet)
      } else {
        setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
        return
      }

      if (data.length === 0) {
        setError('The file appears to be empty')
        return
      }

      // Validate headers
      const headers = Object.keys(data[0])
      const validationResult: ActionResponse<{ valid: boolean; missingHeaders: string[] }> = await validateCSVHeaders(headers)

      if (!validationResult.success) {
        setError('Failed to validate file headers')
        return
      }

      if (!validationResult.data.valid) {
        setError(`Missing required columns: ${validationResult.data.missingHeaders.join(', ')}. Please download the template.`)
        return
      }

      setParsedData(data)
    } catch (err) {
      setError('Failed to parse file. Please check the format and try again.')
      console.error('File parse error:', err)
    }
  }, [])

  const handleUpload = useCallback(async () => {
    if (!parsedData || parsedData.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const result = await bulkUploadAlumni(parsedData as never[], orgId, adminId)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!result.success) {
        if (result.error.type === 'NETWORK') {
          setError('Upload paused due to poor connection. Please move to a stable network and try again.')
        } else {
          setError(result.error.message)
        }
        return
      }

      setResult(result.data)

      if (result.data.failedCount === 0) {
        // All succeeded
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      }
    } catch (err) {
      setError('An unexpected error occurred during upload')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }, [parsedData, orgId, adminId, onSuccess, onClose])

  const handleClose = useCallback(() => {
    setError(null)
    setResult(null)
    setParsedData(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Bulk Upload Alumni</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-2 hover:bg-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!result ? (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-2 font-medium">Instructions</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Upload a CSV or Excel file with alumni data</li>
                <li>Required columns: {REQUIRED_CSV_HEADERS.join(', ')}</li>
                <li>Optional columns: phone_momo, year_group, house_hall, meta_id</li>
                <li>Download the template below for the correct format</li>
              </ul>
              <Button
                variant="link"
                className="mt-2 h-auto p-0"
                onClick={downloadTemplate}
              >
                Download Template
              </Button>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isUploading}
              />

              {parsedData && (
                <div className="rounded-md bg-primary/10 p-3 text-sm">
                  Found {parsedData.length} rows ready to upload
                </div>
              )}

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                isLoading={isUploading}
                disabled={!parsedData || parsedData.length === 0}
              >
                Upload {parsedData ? `(${parsedData.length} rows)` : ''}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results */}
            <div className={`rounded-lg p-4 ${result.failedCount > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
              <h3 className="mb-2 font-medium">
                {result.failedCount > 0 ? 'Upload Partially Successful' : 'Upload Successful!'}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-600">{result.successCount}</span> rows added successfully
                </div>
                <div>
                  <span className="font-medium text-red-600">{result.failedCount}</span> rows failed
                </div>
              </div>
            </div>

            {result.failedCount > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Failed Rows:</h4>
                <div className="max-h-48 overflow-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Row</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.failedRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">{row.row}</td>
                          <td className="px-3 py-2">{String(row.data.full_name || '-')}</td>
                          <td className="px-3 py-2 text-destructive">{row.error}</td>
                        </tr>
                      ))}
                      {result.failedRows.length > 10 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-center text-muted-foreground">
                            ... and {result.failedRows.length - 10} more
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadFailedRows}
                >
                  Download Failed Rows CSV
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
              {result.failedCount > 0 && (
                <Button
                  onClick={() => {
                    setResult(null)
                    setParsedData(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  Upload Another File
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}