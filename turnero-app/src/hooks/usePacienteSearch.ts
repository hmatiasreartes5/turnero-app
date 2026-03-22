import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/repositories/database'

export function usePacienteSearch() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const allPacientes = useLiveQuery(
    () => db.pacientes.orderBy('[apellido+nombre]').toArray(),
    [],
  )

  const pacientes = useMemo(() => {
    if (!allPacientes) return undefined
    if (!debouncedQuery.trim()) return allPacientes

    const q = debouncedQuery.toLowerCase().trim()
    return allPacientes.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.apellido.toLowerCase().includes(q) ||
        p.dni.includes(q),
    )
  }, [allPacientes, debouncedQuery])

  return { query, setQuery, pacientes }
}
