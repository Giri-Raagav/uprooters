import React from 'react'

interface PlaceholderPageProps {
  title: string
  specReference: string
  description: string
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  specReference,
  description,
}) => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <span className="text-xs font-medium px-2.5 py-1 rounded bg-brand-wine-soft text-brand-wine border border-brand-wine/10">
            {specReference}
          </span>
        </div>
        <p className="mt-4 text-slate-600 leading-relaxed">{description}</p>
        <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Milestone 01 Status: </span>
          Technical foundation active. Business logic and verified data connections will be implemented in subsequent milestones per development rules.
        </div>
      </div>
    </div>
  )
}
