import React from 'react';
import { 
  MapPin, Lightbulb, Droplets, Zap, Trash, Building, Trees, Mountain, 
  Circle, BellOff, Paintbrush, Landmark, StopCircle, Footprints, Wind,
  Gauge, Package, Scissors, Construction, Waves, Skull, Grid, Home, Info
} from 'lucide-react';

type IconName = 
  | 'road' | 'lightbulb' | 'droplets' | 'zap' | 'trash' | 'building' 
  | 'palmtree' | 'mountain' | 'paw' | 'circle' | 'lightbulbOff' | 'paintBucket'
  | 'signpost' | 'trafficLight' | 'footprints' | 'pipe' | 'gauge' | 'wind'
  | 'toilet' | 'bolt' | 'box' | 'trashFull' | 'wasteBasket' | 'playground'
  | 'shower' | 'brush' | 'scissors' | 'fence' | 'route' | 'wave' 
  | 'skull' | 'grid' | 'hammer' | 'home' | 'info';

interface IconProps {
  name: IconName | string;
  className?: string;
}

export default function Icon({ name, className = '' }: IconProps) {
  const iconProps = { className };

  switch (name) {
    case 'road':
      return <MapPin {...iconProps} />;
    case 'lightbulb':
      return <Lightbulb {...iconProps} />;
    case 'droplets':
      return <Droplets {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'trash':
      return <Trash {...iconProps} />;
    case 'building':
      return <Building {...iconProps} />;
    case 'palmtree':
      return <Trees {...iconProps} />;
    case 'mountain':
      return <Mountain {...iconProps} />;
    case 'paw':
      return <Landmark {...iconProps} />;
    case 'circle':
      return <Circle {...iconProps} />;
    case 'lightbulbOff':
      return <BellOff {...iconProps} />;
    case 'paintBucket':
      return <Paintbrush {...iconProps} />;
    case 'signpost':
      return <Landmark {...iconProps} />;
    case 'trafficLight':
      return <StopCircle {...iconProps} />;
    case 'footprints':
      return <Footprints {...iconProps} />;
    case 'wind':
      return <Wind {...iconProps} />;
    case 'gauge':
      return <Gauge {...iconProps} />;
    case 'box':
      return <Package {...iconProps} />;
    case 'shower':
      return <Droplets {...iconProps} />;
    case 'scissors':
      return <Scissors {...iconProps} />;
    case 'hammer':
      return <Construction {...iconProps} />;
    case 'wave':
      return <Waves {...iconProps} />;
    case 'skull':
      return <Skull {...iconProps} />;
    case 'grid':
      return <Grid {...iconProps} />;
    case 'home':
      return <Home {...iconProps} />;
    case 'info':
      return <Info {...iconProps} />;
    default:
      return <Circle {...iconProps} />;
  }
}