const variants = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  trial:    'bg-blue-100 text-blue-700',
  free:     'bg-gray-100 text-gray-600',
  basic:    'bg-indigo-100 text-indigo-700',
  premium:  'bg-brand-100 text-brand-700',
  default:  'bg-gray-100 text-gray-600',
}

export default function Badge({ label, type = 'default' }) {
  const cls = variants[type] ?? variants.default
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
