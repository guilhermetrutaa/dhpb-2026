'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MARCADOR_SRC } from './config'

export default function TravelMap({ markerPosition, setMarker, readOnly = false, layoutTick = false }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const setMarkerRef = useRef(setMarker)
  const readOnlyRef = useRef(readOnly)

  setMarkerRef.current = setMarker
  readOnlyRef.current = readOnly

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [-7.23996, -36.78195],
      zoom: 7,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    L.DomEvent.disableScrollPropagation(containerRef.current)

    map.on('click', (event) => {
      if (readOnlyRef.current) return
      setMarkerRef.current({ lat: event.latlng.lat, lng: event.latlng.lng })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!markerPosition) {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      return
    }

    const customIcon = L.icon({
      iconUrl: MARCADOR_SRC,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    })

    if (markerRef.current) {
      markerRef.current.setLatLng(markerPosition)
    } else {
      markerRef.current = L.marker(markerPosition, { icon: customIcon }).addTo(map)
    }

    map.setView(markerPosition, map.getZoom() || 10)
  }, [markerPosition])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const frame = requestAnimationFrame(() => map.invalidateSize())
    const timer = setTimeout(() => map.invalidateSize(), 80)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [layoutTick])

  return <div ref={containerRef} className="z-0 h-full w-full" />
}
