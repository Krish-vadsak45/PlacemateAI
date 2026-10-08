"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import { Placement } from "@/types/placement"
import {
  FileText,
  ExternalLink,
  Trash2,
  Plus,
  Download,
  Eye,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  RotateCw,
  X,
  File
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AttachmentsCardProps {
  placement: Placement
  onAttachmentAdded?: (newAttachment: any) => void
  onAttachmentDeleted?: (attachmentId: string) => void
}

export function AttachmentsCard({
  placement,
  onAttachmentAdded,
  onAttachmentDeleted,
}: AttachmentsCardProps) {
  const [attachments, setAttachments] = useState(placement.attachments || [])
  const [isUploading, setIsUploading] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<{
    id: string
    name: string
    url: string
    type: string
  } | null>(null)

  // Sync state if placement prop updates
  React.useEffect(() => {
    setAttachments(placement.attachments || [])
  }, [placement.attachments])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const formData = new FormData()
    formData.append("file", file)

    setIsUploading(true)
    try {
      const res = await fetch(`/api/placements/${placement._id}/attachments`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to upload file")
      }

      const data = await res.json()
      const updated = [...attachments, data.attachment]
      setAttachments(updated)

      if (onAttachmentAdded) {
        onAttachmentAdded(data.attachment)
      }

      toast.success(
        data.summary
          ? `Uploaded & analyzed ${file.name} with Groq AI!`
          : `Uploaded ${file.name} successfully!`
      )
    } catch (err: any) {
      console.error("Upload error:", err)
      toast.error(err.message || "Failed to upload attachment")
    } finally {
      setIsUploading(false)
      // Reset input value so same file can be uploaded again if needed
      e.target.value = ""
    }
  }

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to remove this attachment?")) return

    try {
      const res = await fetch(
        `/api/placements/${placement._id}/attachments?attachmentId=${attachmentId}`,
        { method: "DELETE" }
      )

      if (!res.ok) {
        throw new Error("Failed to delete attachment")
      }

      const updated = attachments.filter((a) => a.id !== attachmentId)
      setAttachments(updated)

      if (onAttachmentDeleted) {
        onAttachmentDeleted(attachmentId)
      }

      toast.success("Attachment deleted")
    } catch (err) {
      console.error("Delete error:", err)
      toast.error("Failed to delete attachment")
    }
  }

  const getFileBadge = (name: string, type: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || ""

    if (type.includes("pdf") || ext === "pdf") {
      return {
        icon: <FileText className="h-4 w-4 text-red-500" />,
        label: "PDF",
        badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      }
    }
    if (
      type.includes("word") ||
      ext === "docx" ||
      ext === "doc"
    ) {
      return {
        icon: <FileCode className="h-4 w-4 text-blue-500" />,
        label: "DOCX",
        badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      }
    }
    if (
      type.includes("spreadsheet") ||
      type.includes("excel") ||
      ext === "xlsx" ||
      ext === "xls" ||
      ext === "csv"
    ) {
      return {
        icon: <FileSpreadsheet className="h-4 w-4 text-emerald-500" />,
        label: "SHEET",
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      }
    }
    if (type.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(ext)) {
      return {
        icon: <ImageIcon className="h-4 w-4 text-purple-500" />,
        label: "IMG",
        badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      }
    }
    return {
      icon: <File className="h-4 w-4 text-muted-foreground" />,
      label: ext.toUpperCase() || "FILE",
      badgeClass: "bg-muted text-muted-foreground border-border",
    }
  }

  return (
    <>
      <div className="glass-panel rounded-2xl p-6 border border-border shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground">Attachments & JDs</h3>
                {attachments.length > 0 && (
                  <span className="text-[10px] font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {attachments.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Official documents, JD PDFs & shortlisted student sheets
              </p>
            </div>
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <span className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium gap-1.5 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-foreground shadow-sm">
              {isUploading ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Upload File
                </>
              )}
            </span>
          </label>
        </div>

        {/* List of Attachments */}
        {attachments.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-border rounded-xl p-4 bg-muted/20">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground font-medium">
              No attachments detected or uploaded yet
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-sm mx-auto">
              Any PDFs or JDs attached to incoming placement emails will be automatically extracted, stored in GridFS, and analyzed.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((att) => {
              const badge = getFileBadge(att.name, att.type)
              const previewUrl = att.url || `/api/placements/attachments/${att.id}`
              const downloadUrl = `${previewUrl}?download=true`

              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badge.badgeClass}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span className="text-xs font-medium text-foreground truncate" title={att.name}>
                      {att.name}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Preview Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                      title="Preview Attachment"
                      onClick={() => setPreviewAttachment(att)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>

                    {/* Download Button */}
                    <a href={downloadUrl} download title="Download file">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </a>

                    {/* Open in New Tab */}
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in new tab"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(att.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                      title="Delete attachment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* PREVIEW MODAL */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-sm truncate">
                  {previewAttachment.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`${previewAttachment.url || `/api/placements/attachments/${previewAttachment.id}`}?download=true`}
                  download
                >
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => setPreviewAttachment(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 bg-zinc-950 p-1 flex items-center justify-center overflow-hidden">
              <iframe
                src={previewAttachment.url || `/api/placements/attachments/${previewAttachment.id}`}
                className="w-full h-full border-0 rounded-lg bg-white"
                title={previewAttachment.name}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
export default AttachmentsCard
