import api from './config'

export interface PersonalDocument {
  id: number
  title: string
  description?: string
  category: PersonalDocumentCategory
  tags?: string
  tagList?: string[]
  originalName?: string
  fileName?: string
  filePath?: string
  fileSize: number
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export enum PersonalDocumentCategory {
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  TEMPLATE = 'template',
  OTHER = 'other',
}

export interface PersonalDocumentSummary {
  total: number
  totalSize: number
  categories: Record<string, number>
}

export const fetchPersonalDocuments = (): Promise<PersonalDocument[]> => {
  return api.get('/personal-docs')
}

export const fetchPersonalDocumentSummary = (): Promise<PersonalDocumentSummary> => {
  return api.get('/personal-docs/summary')
}

export const createPersonalDocument = (formData: FormData): Promise<PersonalDocument> => {
  return api.post('/personal-docs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const updatePersonalDocument = (id: number, formData: FormData): Promise<PersonalDocument> => {
  return api.put(`/personal-docs/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const deletePersonalDocument = (id: number): Promise<void> => {
  return api.delete(`/personal-docs/${id}`)
}

export const togglePinPersonalDocument = (id: number, pinned: boolean): Promise<PersonalDocument> => {
  return api.post(`/personal-docs/${id}/pin`, { pinned })
}

export const downloadPersonalDocument = (id: number): Promise<Blob> => {
  return api.get(`/personal-docs/${id}/download`, {
    responseType: 'blob',
  })
}


