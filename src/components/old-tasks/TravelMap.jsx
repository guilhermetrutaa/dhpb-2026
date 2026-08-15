'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

export default function TravelMap({ markerPosition, setMarker }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

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

    map.on('click', (event) => {
      setMarker({ lat: event.latlng.lat, lng: event.latlng.lng })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [setMarker])

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
      iconUrl: '/viagem-tempo/marcador.svg',
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

  return <div ref={containerRef} className="w-full h-full z-0" />
}
