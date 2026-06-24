import api from './api'

export const loanService = {
  async getLoans(params?: {
    status?: string; riskLevel?: string; search?: string;
    page?: number; limit?: number; sortBy?: string; sortOrder?: string
  }) {
    const res = await api.get('/loans', { params })
    return res.data
  },

  async getLoanById(id: string) {
    const res = await api.get(`/loans/${id}`)
    return res.data.loan
  },

  async createLoan(data: Record<string, unknown>) {
    const res = await api.post('/loans', data)
    return res.data
  },

  async updateStatus(id: string, status: string, reviewNotes?: string) {
    const res = await api.patch(`/loans/${id}/status`, { status, reviewNotes })
    return res.data
  },

  async deleteLoan(id: string) {
    const res = await api.delete(`/loans/${id}`)
    return res.data
  },
}

export const analyticsService = {
  async getOverview() {
    const res = await api.get('/analytics/overview')
    return res.data
  },
  async getRiskDistribution() {
    const res = await api.get('/analytics/risk-distribution')
    return res.data
  },
  async getTrends() {
    const res = await api.get('/analytics/trends')
    return res.data
  },
  async getRecent() {
    const res = await api.get('/analytics/recent')
    return res.data.loans
  },
  async exportData() {
    const res = await api.get('/analytics/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'loan_applications_export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}

export const uploadService = {
  async uploadCSV(file: File, onProgress?: (pct: number) => void) {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post('/upload/csv', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      },
    })
    return res.data
  },

  downloadTemplate() {
    const headers = [
      'fullName', 'email', 'phone', 'employmentStatus',
      'annual_inc', 'emp_length', 'credit_history', 'existingDebts',
      'loan_amnt', 'int_rate', 'loanPurpose', 'loanTerm',
    ]
    const example = [
      'Jane Smith', 'jane@example.com', '555-1234', 'employed',
      '75000', '5', '8', '5000',
      '150000', '7.5', 'home_purchase', '360',
    ]
    const csv = [headers.join(','), example.join(',')].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'loan_applicants_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}