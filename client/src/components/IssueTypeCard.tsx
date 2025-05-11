import { cn } from '@/lib/utils';
import { 
  AlertTriangle,
  Bolt,
  Box,
  Building,
  Brush,
  Circle,
  Droplets,
  Footprints,
  Gauge,
  Grid,
  Hammer,
  LightbulbIcon,
  Mountain,
  PaintBucket,
  Palmtree,
  Route,
  Scissors,
  Skull,
  Trash,
  TrafficCone,
  Umbrella,
  WrenchIcon,
  Zap,
  Bath,
  Waves,
  Wind
} from 'lucide-react';
import { getIssueTypeById } from '@/data/issueTypes';

interface IssueTypeCardProps {
  type: string;
  name: string;
  selected: boolean;
  onClick: (type: string) => void;
  color?: string;
}

export default function IssueTypeCard({ type, name, selected, onClick, color }: IssueTypeCardProps) {
  // Get issue type details
  const issueType = getIssueTypeById(type);
  
  // Get icon based on issue type
  const getIcon = () => {
    const iconName = issueType?.icon || type;
    const iconColor = color || issueType?.color || '#666';
    
    switch (iconName) {
      // Road & Traffic
      case 'pothole':
      case 'trafficCone':
        return <TrafficCone className="text-xl" style={{ color: iconColor }} />;
      case 'road':
        return <Route className="text-xl" style={{ color: iconColor }} />;
      case 'paintBucket':
        return <PaintBucket className="text-xl" style={{ color: iconColor }} />;
      case 'signpost':
        return <AlertTriangle className="text-xl" style={{ color: iconColor }} />;
      case 'trafficLight':
        return <AlertTriangle className="text-xl" style={{ color: iconColor }} />;
      case 'footprints':
        return <Footprints className="text-xl" style={{ color: iconColor }} />;
        
      // Street Lighting
      case 'lightbulb':
        return <LightbulbIcon className="text-xl" style={{ color: iconColor }} />;
      case 'lightbulbOff':
        return <LightbulbIcon className="text-xl" style={{ color: iconColor }} />;
        
      // Water & Sanitation
      case 'droplets':
        return <Droplets className="text-xl" style={{ color: iconColor }} />;
      case 'pipe':
        return <Bolt className="text-xl" style={{ color: iconColor }} />;
      case 'gauge':
        return <Gauge className="text-xl" style={{ color: iconColor }} />;
      case 'toilet':
        return <Bath className="text-xl" style={{ color: iconColor }} />;
        
      // Electricity  
      case 'zap':
      case 'bolt':
        return <Bolt className="text-xl" style={{ color: iconColor }} />;
      case 'box':
        return <Box className="text-xl" style={{ color: iconColor }} />;
        
      // Waste Management
      case 'trash':
      case 'trashFull':
      case 'wasteBasket':
        return <Trash className="text-xl" style={{ color: iconColor }} />;
        
      // Public Facilities  
      case 'building':
        return <Building className="text-xl" style={{ color: iconColor }} />;
      case 'playground':
        return <Palmtree className="text-xl" style={{ color: iconColor }} />;
      case 'shower':
        return <Bath className="text-xl" style={{ color: iconColor }} />;
      case 'brush':
        return <Brush className="text-xl" style={{ color: iconColor }} />;
        
      // Parks & Recreation  
      case 'palmtree':
        return <Palmtree className="text-xl" style={{ color: iconColor }} />;
      case 'scissors':
        return <Scissors className="text-xl" style={{ color: iconColor }} />;
      case 'fence':
        return <Grid className="text-xl" style={{ color: iconColor }} />;
      case 'route':
        return <Route className="text-xl" style={{ color: iconColor }} />;
        
      // Environmental
      case 'mountain':
        return <Mountain className="text-xl" style={{ color: iconColor }} />;
        
      // Animal Control  
      case 'paw':
        return <WrenchIcon className="text-xl" style={{ color: iconColor }} />;
      case 'skull':
        return <Skull className="text-xl" style={{ color: iconColor }} />;
        
      // Urban Infrastructure
      case 'circle':
        return <Circle className="text-xl" style={{ color: iconColor }} />;
      case 'grid':
        return <Grid className="text-xl" style={{ color: iconColor }} />;
      case 'hammer':
        return <Hammer className="text-xl" style={{ color: iconColor }} />;
      
      case 'wave':
        return <Waves className="text-xl" style={{ color: iconColor }} />;
      case 'wind':
        return <Wind className="text-xl" style={{ color: iconColor }} />;
        
      // Default  
      default:
        return <WrenchIcon className="text-xl" style={{ color: iconColor }} />;
    }
  };

  return (
    <div 
      className={cn(
        "issue-type-card p-4 border rounded-xl cursor-pointer transition-all",
        selected && "selected"
      )}
      onClick={() => onClick(type)}
    >
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-2">
          {getIcon()}
        </div>
        <span className="font-medium">{name}</span>
      </div>
    </div>
  );
}
