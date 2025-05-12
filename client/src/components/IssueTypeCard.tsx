import { cn } from '@/lib/utils';
import Icon from './Icon';
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
    
    return (
      <Icon 
        name={iconName} 
        className="w-6 h-6" 
        // Apply color through the parent container instead
      />
    );
  };

  return (
    <div 
      className={cn(
        "issue-type-card p-3 border rounded-xl cursor-pointer transition-all duration-200",
        selected 
          ? "border-primary bg-primary/5 shadow-sm" 
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      )}
      onClick={() => onClick(type)}
    >
      <div className="flex flex-col items-center">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
          style={{ 
            backgroundColor: `${color || issueType?.color || '#666'}15`,
            color: color || issueType?.color || '#666'
          }}
        >
          {getIcon()}
        </div>
        <span className="font-medium text-center text-sm">{name}</span>
      </div>
    </div>
  );
}
