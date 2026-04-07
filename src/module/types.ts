/** Shape of the upstream city-of-doors map.json */
export interface MapDataset {
  mapwidth: string;
  mapheight: string;
  categories: MapCategory[];
  levels: MapLevel[];
}

export interface MapCategory {
  id: string;
  color: string;
  title: string;
  show: string;
}

export interface MapLevel {
  id: string;
  title: string;
  map: string;
  minimap: string;
  locations: MapLocation[];
}

export interface MapLocation {
  id: string;
  pin: string;
  fill: string;
  x: string;
  y: string;
  category: string;
  title: string;
  about: string;
  description: string;
}
