import type { ToastMsg } from '../App'

export default function Toast({ toast }: { toast: ToastMsg }) {
  return (
    <div className="toast-enter flex items-center px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-lg max-w-sm">
      <span className="text-sm font-medium text-black">{toast.message}</span>
    </div>
  )
}