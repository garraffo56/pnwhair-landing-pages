  'use client'
  import { useEffect } from 'react'
  import { useSearchParams } from 'next/navigation'

  export function useGclid() {
    const params = useSearchParams()

    useEffect(() => {
      const gclid = params.get('gclid')
      if (gclid) {
        sessionStorage.setItem('gclid', gclid)
      }
    }, [params])

    return typeof window !== 'undefined' ? sessionStorage.getItem('gclid') ?? '' : ''
  }
