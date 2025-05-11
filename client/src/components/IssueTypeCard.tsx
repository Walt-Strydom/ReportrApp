import { cn } from '@/lib/utils';
import { 
  TrafficCone, 
  LightbulbIcon, 
  TrafficConeIcon, 
  WrenchIcon 
} from 'lucide-react';

interface IssueTypeCardProps {
  type: string;
  name: string;
  selected: boolean;
  onClick: (type: string) => void;
}

export default function IssueTypeCard({ type, name, selected, onClick }: IssueTypeCardProps) {
  // Get icon based on issue type
  const getIcon = () => {
    switch (type) {
      case 'pothole':
        return <TrafficCone className="text-xl text-destructive" />;
      case 'streetlight':
        return <LightbulbIcon className="text-xl text-accent" />;
      case 'trafficlight':
        return <TrafficConeIcon className="text-xl text-secondary" />;
      default:
        return <WrenchIcon className="text-xl text-neutral-800" />;
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
