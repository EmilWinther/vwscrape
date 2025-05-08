'use client';

import { useEffect, useRef, useState } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Sketch from '@arcgis/core/widgets/Sketch';
import Point from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import Popup from '@arcgis/core/widgets/Popup';

interface PointData {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}



export default function MapComponent() {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [mouseCoords, setMouseCoords] = useState({ lat: 0, lon: 0 });

  const searchLocations = async (coordinates: number[][]) => {
    console.log('Searching??');
    try {
      const response = await fetch('http://localhost:8080/locations/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "Polygon",
          coordinates: [coordinates]
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Search results:', data);
      return data;
    } catch (error) {
      console.error('Error searching locations:', error);
    }
  };

  useEffect(() => {
    if (!mapDiv.current) return;

    const graphicsLayer = new GraphicsLayer();

    const map = new Map({
      basemap: "topo-vector",
      layers: [graphicsLayer]
    });

    const popup = new Popup({
      dockEnabled: true,
      dockOptions: {
        position: "top-right",
        breakpoint: false
      },
      defaultPopupTemplateEnabled: true
    });

    const view = new MapView({
      container: mapDiv.current,
      map: map,
      center: [-100, 40],
      zoom: 4,
      popup: popup
    });

    const sketch = new Sketch({
      layer: graphicsLayer,
      view: view,
      availableCreateTools: ["rectangle"],
      creationMode: "update"
    });

    view.ui.add(sketch, "top-right");

    sketch.on("create", async (event) => {
      console.log('Sketch create event triggered');
      if (event.state === "complete" && event.graphic?.geometry) {
        console.log('Drawing complete, processing coordinates');
        const geom = event.graphic.geometry;
        if (geom.type === "polygon" && geom.extent) {
          console.log('Valid polygon drawn, preparing coordinates');
          const extent = geom.extent;

          // Create coordinates in proper rectangular order (counter-clockwise)
          const coordinates: number[][] = [
            // Top left
            [extent.xmin, extent.ymax],
            // Top right
            [extent.xmax, extent.ymax],
            // Bottom right
            [extent.xmax, extent.ymin],
            // Bottom left
            [extent.xmin, extent.ymin],
            // Close the polygon by returning to start
            [extent.xmin, extent.ymin]
          ].map(([x, y]) => {
            const point = webMercatorUtils.webMercatorToGeographic(new Point({ x, y })) as Point;
            if (point.longitude === null || point.latitude === null) {
              throw new Error('Invalid coordinates');
            }
            return [point.longitude, point.latitude] as [number, number];
          });

          console.log('Making API call with coordinates:', coordinates);
          // Make the API call
          const searchResults = await searchLocations(coordinates);
          console.log('Received search results:', searchResults);
          
          // Draw the points on the map if we have results
          if (searchResults && searchResults.length > 0) {
            console.log('Drawing points for search results');
            drawPointsFromData(searchResults);
          }

          const cornerLabels = [
            { point: webMercatorUtils.webMercatorToGeographic(new Point({ x: extent.xmin, y: extent.ymin }) as Point), label: "Bottom Left" },
            { point: webMercatorUtils.webMercatorToGeographic(new Point({ x: extent.xmax, y: extent.ymin }) as Point), label: "Bottom Right" },
            { point: webMercatorUtils.webMercatorToGeographic(new Point({ x: extent.xmax, y: extent.ymax }) as Point), label: "Top Right" },
            { point: webMercatorUtils.webMercatorToGeographic(new Point({ x: extent.xmin, y: extent.ymax }) as Point), label: "Top Left" }
          ].map(({ point, label }) => {
            const pt = point as Point;
            return `${label}: Lat: ${pt.y.toFixed(5)}, Lon: ${pt.x.toFixed(5)}`;
          }).join("<br>");

          const center = new Point({
            x: (extent.xmin + extent.xmax) / 2,
            y: (extent.ymin + extent.ymax) / 2,
            spatialReference: extent.spatialReference
          });

          const geoCenter = webMercatorUtils.webMercatorToGeographic(center) as Point;

          let popupContent = `Center: Lat ${geoCenter.y.toFixed(5)}, Lon ${geoCenter.x.toFixed(5)}<br><br>${cornerLabels}`;
          
          // Add search results to popup if available
          if (searchResults) {
            popupContent += `<br><br>Found ${searchResults.length} locations in this area`;
          }

          popup.open({
            location: center,
            title: "Rectangle Info",
            content: popupContent
          });
        }
      }
    });

    const drawPointsFromData = (data: PointData[]) => {
      console.log('Drawing points with data:', data);
      data.forEach(item => {
        console.log('Processing point:', item);
        // Create point with spatial reference
        const point = new Point({
          x: item.longitude,
          y: item.latitude,
          spatialReference: { wkid: 4326 }  // WGS84 coordinate system
        });

        console.log('Created point:', point);

        const symbol = {
          type: "simple-marker",
          style: "circle",
          color: "red",
          size: "8px"
        } as const;

        const graphic = new Graphic({
          geometry: point,
          symbol: symbol,
          attributes: {
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude
          }
        });

        console.log('Adding graphic to layer:', graphic);
        graphicsLayer.add(graphic);
      });
    };

    // Add click handler for graphics
    view.on("click", (event) => {
      view.hitTest(event).then((response) => {
        const result = response.results[0];
        if (result && 'graphic' in result) {
          const graphic = result.graphic;
          const attributes = graphic.attributes;
          if (view.popup && graphic.geometry) {
            view.popup.open({
              title: attributes.name,
              content: `Latitude: ${attributes.latitude.toFixed(5)}<br>Longitude: ${attributes.longitude.toFixed(5)}`,
              location: graphic.geometry as Point
            });
          }
        }
      });
    });

    // Add mouse move handler
    view.on("pointer-move", (event) => {
      const point = view.toMap(event);
      const geoPoint = webMercatorUtils.webMercatorToGeographic(point) as Point;
      setMouseCoords({
        lat: geoPoint.y,
        lon: geoPoint.x
      });
    });

    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={mapDiv} className="h-full w-full" />
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded shadow-md text-sm">
        Lat: {mouseCoords.lat.toFixed(5)}, Lon: {mouseCoords.lon.toFixed(5)}
      </div>
    </div>
  );
} 