import React from 'react';
import { 
  MapPin, Lightbulb, Droplets, Zap, Trash, Building, Trees, Mountain, 
  Circle, BellOff, Paintbrush, Landmark, StopCircle, Footprints, Wind,
  Gauge, Package, Scissors, Construction, Waves, Skull, Grid, Home, Info
} from 'lucide-react';
import { getIssueTypeById, getCategoryById } from '@/data/issueTypes';

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
  
  // Check if this is an issue type ID (like 'pothole', 'burst-pipe', etc.)
  const issueType = getIssueTypeById(name);
  
  // If it's an issue type, first try to get its specific icon, or fallback to category icon
  if (issueType) {
    // Try to get the icon via its icon name directly
    const iconName = issueType.icon;
    if (iconName) {
      // Return the specific icon for this issue type if we have a mapping
      switch (iconName) {
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
        default:
          // If no specific mapping, try to get the parent category's icon
          const category = getCategoryById(issueType.categoryId);
          if (category) {
            // Return category icon
            switch (category.icon) {
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
              default:
                return <Circle {...iconProps} />;
            }
          }
      }
    }
  }

  // If not an issue type, or if no icon found above, use the direct mapping
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