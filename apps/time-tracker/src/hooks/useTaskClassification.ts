import { useState, useEffect } from 'react';
import { Category, Task } from '../types';
import { classifyTitle } from '../lib/classification';

const CUSTOM_TASK_VALUE = '__custom__';

/**
 * Custom hook to handle task classification when a task is selected
 * @param selectedTask - The ID of the selected task, or CUSTOM_TASK_VALUE for custom tasks
 * @param inProgressTasks - Array of in-progress tasks to search for the selected task
 * @returns The category of the selected task, or null if no task is selected or it's a custom task
 */
export function useTaskClassification(
  selectedTask: string,
  inProgressTasks: Task[]
): Category | null {
  const [selectedTaskCategory, setSelectedTaskCategory] = useState<Category | null>(null);

  useEffect(() => {
    const classifySelectedTask = async () => {
      if (selectedTask && selectedTask !== CUSTOM_TASK_VALUE) {
        const task = inProgressTasks.find(t => t.id === selectedTask);
        if (task) {
          try {
            // Pass task to classification - it will use task.category if available
            const category = await classifyTitle(task.title, task);
            setSelectedTaskCategory(category);
          } catch (error) {
            console.error('Failed to classify task:', error);
            setSelectedTaskCategory('Work'); // Default fallback
          }
        } else {
          setSelectedTaskCategory(null);
        }
      } else {
        setSelectedTaskCategory(null);
      }
    };

    if (inProgressTasks.length > 0 && selectedTask && selectedTask !== CUSTOM_TASK_VALUE) {
      classifySelectedTask();
    } else {
      setSelectedTaskCategory(null);
    }
  }, [selectedTask, inProgressTasks]);

  return selectedTaskCategory;
}

