import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Popover, PopoverContent, PopoverTrigger, Calendar } from '@efficio/ui';
import { formatDate, isSameDay } from '../lib/utils';

interface DateNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigation({ selectedDate, onDateChange }: DateNavigationProps) {
  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousDay}
          className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 min-w-[280px]"
            >
              {formatDate(selectedDate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNextDay}
          className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {!isToday && (
        <Button
          variant="outline"
          onClick={goToToday}
          className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          Today
        </Button>
      )}
    </div>
  );
}
