import { useState } from 'react';
import { PlannedBlock, TimeSession, Category } from '../types';
import { formatTime, getCategoryColor } from '../lib/utils';
import { updatePlannedBlock, addSession, addPlannedBlock, deletePlannedBlock } from '../lib/storage';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@efficio/ui';
import { Play, Check, Calendar, Plus, Trash2, Square } from 'lucide-react';

const CATEGORIES: Category[] = ['Work', 'Learning', 'Admin', 'Health', 'Personal', 'Rest'];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours

interface PlannedTimeBlocksProps {
  blocks: PlannedBlock[];
  onUpdate: () => void;
}

export function PlannedTimeBlocks({ blocks, onUpdate }: PlannedTimeBlocksProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [newBlock, setNewBlock] = useState({
    title: '',
    startTime: '',
    endTime: '',
  });

  const handleSlotClick = (hour: number) => {
    const startHours = String(hour).padStart(2, '0');
    const endHours = String(hour + 1).padStart(2, '0');

    setSelectedHour(hour);
    setNewBlock({
      title: '',
      startTime: `${startHours}:00`,
      endTime: `${endHours}:00`,
    });
    setIsDialogOpen(true);
  };

  const handleSaveBlock = () => {
    if (!newBlock.title || !newBlock.startTime || !newBlock.endTime) return;

    // Create dates for today with the specified times
    const today = new Date();
    const [startHours, startMinutes] = newBlock.startTime.split(':').map(Number);
    const [endHours, endMinutes] = newBlock.endTime.split(':').map(Number);

    const start = new Date(today);
    start.setHours(startHours, startMinutes, 0, 0);

    const end = new Date(today);
    end.setHours(endHours, endMinutes, 0, 0);

    if (end <= start) {
      alert('End time must be after start time');
      return;
    }

    const plannedBlock: PlannedBlock = {
      id: Date.now().toString(),
      title: newBlock.title,
      category: 'Work',
      startTime: start,
      endTime: end,
      status: 'scheduled',
    };

    addPlannedBlock(plannedBlock);
    setIsDialogOpen(false);
    setNewBlock({ title: '', startTime: '', endTime: '' });
    onUpdate();
  };

  const handleStartNow = (block: PlannedBlock) => {
    const newSession: TimeSession = {
      id: Date.now().toString(),
      taskTitle: block.title,
      category: block.category,
      startTime: new Date(),
    };
    
    addSession(newSession);
    updatePlannedBlock(block.id, { status: 'in-progress' });
    onUpdate();
  };

  const handleMarkDone = (block: PlannedBlock) => {
    const duration = (block.endTime.getTime() - block.startTime.getTime()) / 1000 / 60;
    
    const completedSession: TimeSession = {
      id: Date.now().toString(),
      taskTitle: block.title,
      category: block.category,
      startTime: block.startTime,
      endTime: block.endTime,
      duration: Math.round(duration),
    };
    
    addSession(completedSession);
    updatePlannedBlock(block.id, { status: 'done' });
    onUpdate();
  };

  const handleDeleteBlock = (block: PlannedBlock) => {
    deletePlannedBlock(block.id);
    onUpdate();
  };

  // Calculate position and height for a block
  const getBlockStyle = (block: PlannedBlock) => {
    const startHour = block.startTime.getHours();
    const startMinute = block.startTime.getMinutes();
    const endHour = block.endTime.getHours();
    const endMinute = block.endTime.getMinutes();

    const PIXELS_PER_HOUR = 80; // Increased from 60px to 80px per hour
    const top = (startHour + startMinute / 60) * PIXELS_PER_HOUR;
    const duration = (endHour - startHour) + (endMinute - startMinute) / 60;
    const height = duration * PIXELS_PER_HOUR;

    // Calculate overlaps
    const { width, left, zIndex } = calculateOverlapPosition(block, blocks);

    return { 
      top: `${top}px`, 
      height: `${height}px`,
      width: `${width}%`,
      left: `${left}%`,
      zIndex 
    };
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        <h2 className="text-neutral-900 dark:text-neutral-100 font-semibold">Planned Time Blocks</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent dark:scrollbar-track-neutral-900">
        <div className="relative pl-16">
          {/* Time slots - visual grid with clickable time labels */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[80px] border-t border-neutral-200 dark:border-neutral-800 relative"
            >
              <div 
                onClick={() => handleSlotClick(hour)}
                className="absolute -left-16 top-0 w-14 h-full cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/30 transition-colors flex items-start justify-end"
              >
                <span className="text-xs text-neutral-600 dark:text-neutral-400 -translate-y-1/2 bg-white dark:bg-neutral-900 px-1">
                  {formatHour(hour)}
                </span>
              </div>
            </div>
          ))}

          {/* Clickable grid area */}
          <div className="absolute inset-0 left-16 z-10">
            {HOURS.map((hour) => (
              <div
                key={`grid-${hour}`}
                onClick={() => handleSlotClick(hour)}
                className="h-[80px] cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/20 transition-colors"
              />
            ))}
        </div>

          {/* Planned blocks overlay */}
          <div className="absolute top-0 right-0 bottom-0 left-16 pointer-events-none z-20">
            {blocks.map((block) => (
              <PlannedBlockOverlay
              key={block.id} 
              block={block} 
                style={getBlockStyle(block)}
              onStartNow={() => handleStartNow(block)}
              onMarkDone={() => handleMarkDone(block)}
                onDeleteBlock={() => handleDeleteBlock(block)}
            />
          ))}
          </div>
        </div>
      </div>

      {/* Add Block Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Create Planned Block</DialogTitle>
            <DialogDescription className="text-neutral-600 dark:text-neutral-400">Add a new time block to your schedule.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-neutral-900 dark:text-neutral-100">Title</Label>
              <Input
                type="text"
                placeholder="What will you work on?"
                value={newBlock.title}
                onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-neutral-900 dark:text-neutral-100">Start Time</Label>
                <div className="relative">
                  <Input
                    type="time"
                    value={newBlock.startTime}
                    onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                    className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-900 dark:text-neutral-100">End Time</Label>
                <div className="relative">
                  <Input
                    type="time"
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                    className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSaveBlock}
              disabled={!newBlock.title || !newBlock.startTime || !newBlock.endTime}
              className="w-full bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Block
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PlannedBlockOverlayProps {
  block: PlannedBlock;
  style: { top: string; height: string; width: string; left: string; zIndex: number };
  onStartNow: () => void;
  onMarkDone: () => void;
  onDeleteBlock: () => void;
}

function PlannedBlockOverlay({ block, style, onStartNow, onMarkDone, onDeleteBlock }: PlannedBlockOverlayProps) {
  const getCategoryColorClass = (category: Category) => {
    const colors = {
      Work: 'bg-blue-500/20 dark:bg-blue-500/20 border-blue-500/50 dark:border-blue-500/50 text-blue-700 dark:text-blue-300',
      Learning: 'bg-purple-500/20 dark:bg-purple-500/20 border-purple-500/50 dark:border-purple-500/50 text-purple-700 dark:text-purple-300',
      Admin: 'bg-gray-500/20 dark:bg-gray-500/20 border-gray-500/50 dark:border-gray-500/50 text-gray-700 dark:text-gray-300',
      Health: 'bg-green-500/20 dark:bg-green-500/20 border-green-500/50 dark:border-green-500/50 text-green-700 dark:text-green-300',
      Personal: 'bg-pink-500/20 dark:bg-pink-500/20 border-pink-500/50 dark:border-pink-500/50 text-pink-700 dark:text-pink-300',
      Rest: 'bg-amber-500/20 dark:bg-amber-500/20 border-amber-500/50 dark:border-amber-500/50 text-amber-700 dark:text-amber-300',
    };
    return colors[category];
  };

  const getStatusBorder = () => {
    if (block.status === 'done') return 'border-l-4 border-l-green-500';
    if (block.status === 'in-progress') return 'border-l-4 border-l-blue-500';
    return '';
  };

  return (
    <div
      className={`absolute rounded-lg border-2 p-2 pointer-events-auto group ${getCategoryColorClass(block.category)} ${getStatusBorder()}`}
      style={style}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate">{block.title}</div>
          <div className="text-xs opacity-75 mt-0.5">
            {formatTime(block.startTime)} - {formatTime(block.endTime)}
          </div>
        </div>
        
        {/* Action icons - always visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {block.status === 'scheduled' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartNow();
              }}
              className="p-1.5 rounded hover:bg-blue-600/30 transition-colors"
              title="Start timer"
            >
              <Play className="w-5 h-5 text-blue-400" />
            </button>
          )}
          
          {block.status === 'in-progress' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkDone();
              }}
              className="p-1.5 rounded hover:bg-green-600/30 transition-colors"
              title="Stop and mark done"
            >
              <Square className="w-5 h-5 text-green-400" />
            </button>
          )}

      {block.status === 'scheduled' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkDone();
              }}
              className="p-1.5 rounded hover:bg-green-600/30 transition-colors"
              title="Mark as done"
          >
              <Check className="w-5 h-5 text-green-400" />
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteBlock();
            }}
            className="p-1.5 rounded hover:bg-red-600/30 transition-colors"
            title="Delete block"
          >
            <Trash2 className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function calculateOverlapPosition(block: PlannedBlock, blocks: PlannedBlock[]) {
  // Find all blocks that overlap with this block
  const overlappingBlocks = blocks.filter(b => {
    if (b.id === block.id) return true; // Include self
    const start = block.startTime.getTime();
    const end = block.endTime.getTime();
    const bStart = b.startTime.getTime();
    const bEnd = b.endTime.getTime();
    return bStart < end && bEnd > start;
  });

  // Sort overlapping blocks by start time, then by end time
  const sortedBlocks = overlappingBlocks.sort((a, b) => {
    const diff = a.startTime.getTime() - b.startTime.getTime();
    if (diff !== 0) return diff;
    return a.endTime.getTime() - b.endTime.getTime();
  });

  // Assign columns to blocks
  const columns: PlannedBlock[][] = [];
  
  sortedBlocks.forEach(b => {
    let placed = false;
    
    // Try to place in an existing column
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const lastInColumn = column[column.length - 1];
      
      // Check if this block can be placed in this column
      if (lastInColumn.endTime.getTime() <= b.startTime.getTime()) {
        column.push(b);
        placed = true;
        break;
      }
    }
    
    // If not placed, create a new column
    if (!placed) {
      columns.push([b]);
    }
  });

  // Find which column this block is in
  let columnIndex = 0;
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].some(b => b.id === block.id)) {
      columnIndex = i;
      break;
    }
  }

  // Calculate width and position
  const totalColumns = columns.length;
  const width = 100 / totalColumns;
  const left = columnIndex * width;
  const zIndex = columnIndex + 1;

  return { width, left, zIndex };
}