import { Category, Task } from '../types';
import { plansApi } from '../services/timeApi';

/**
 * Map task category string to Category type
 * Returns null if category is not a valid time-tracker category
 */
export function mapTaskCategoryToCategory(taskCategory?: string): Category | null {
  if (!taskCategory) return null;
  
  // Direct match (case-insensitive)
  const normalized = taskCategory.trim();
  // All SYSTEM_CATEGORIES are now valid time-tracker categories
  const validCategories: Category[] = ['Work', 'Personal', 'Errands', 'Design', 'Engineering', 'Marketing', 'Finance', 'Rest', 'Health', 'Learning', 'Admin', 'Other'];
  
  // Check for exact match (case-insensitive)
  const match = validCategories.find(cat => cat.toLowerCase() === normalized.toLowerCase());
  if (match) return match;
  
  // If category doesn't match any valid category, return null (should classify)
  return null;
}

/**
 * Centralized classification utility
 * Classifies a title and returns the Category type
 * 
 * @param title - The title to classify
 * @param task - Optional task object. If provided and has a valid category, uses that instead of classifying
 */
export async function classifyTitle(title: string, task?: Task): Promise<Category> {
  // If task has a category, use it (don't auto-categorize)
  if (task?.category) {
    const mappedCategory = mapTaskCategoryToCategory(task.category);
    if (mappedCategory) {
      return mappedCategory;
    }
    // If task.category exists but doesn't map to a time-tracker category, fall through to classification
  }
  
  // Only classify if task doesn't have a category or category doesn't map to time-tracker category
  try {
    const result = await plansApi.classifyTitle(title);
    const categoryId = result.categoryId || 'work';
    
    // Map backend category to frontend Category type
    // Note: Backend may only return a subset, map to closest match
    const categoryMap: Record<string, Category> = {
      'work': 'Work',
      'learning': 'Learning',
      'admin': 'Admin',
      'health': 'Health',
      'personal': 'Personal',
      'rest': 'Rest',
      // Map other backend categories if they exist
      'finance': 'Finance',
      'design': 'Design',
      'engineering': 'Engineering',
      'marketing': 'Marketing',
      'errands': 'Errands',
      'other': 'Other',
    };
    
    return categoryMap[categoryId] || 'Work';
  } catch (error) {
    console.error('Failed to classify title:', error);
    return 'Work'; // Default to Work on error
  }
}

/**
 * Classify title and return categoryId (lowercase string)
 * 
 * @param title - The title to classify
 * @param task - Optional task object. If provided and has a valid category, uses that instead of classifying
 */
export async function classifyTitleToCategoryId(title: string, task?: Task): Promise<string> {
  // If task has a category, use it (don't auto-categorize)
  if (task?.category) {
    const mappedCategory = mapTaskCategoryToCategory(task.category);
    if (mappedCategory) {
      // Convert Category to categoryId (lowercase)
      const categoryIdMap: Record<Category, string> = {
        'Work': 'work',
        'Personal': 'personal',
        'Errands': 'errands',
        'Design': 'design',
        'Engineering': 'engineering',
        'Marketing': 'marketing',
        'Finance': 'finance',
        'Rest': 'rest',
        'Health': 'health',
        'Learning': 'learning',
        'Admin': 'admin',
        'Other': 'other',
      };
      return categoryIdMap[mappedCategory] || 'work';
    }
    // If task.category exists but doesn't map to a time-tracker category, fall through to classification
  }
  
  // Only classify if task doesn't have a category or category doesn't map to time-tracker category
  try {
    const result = await plansApi.classifyTitle(title);
    return result.categoryId || 'work';
  } catch (error) {
    console.error('Failed to classify title:', error);
    return 'work'; // Default to work on error
  }
}

