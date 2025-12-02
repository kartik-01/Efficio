import { Category } from '../types';
import { plansApi } from '../services/timeApi';

/**
 * Centralized classification utility
 * Classifies a title and returns the Category type
 */
export async function classifyTitle(title: string): Promise<Category> {
  try {
    const result = await plansApi.classifyTitle(title);
    const categoryId = result.categoryId || 'work';
    
    // Map backend category to frontend Category type
    const categoryMap: Record<string, Category> = {
      'work': 'Work',
      'learning': 'Learning',
      'admin': 'Admin',
      'health': 'Health',
      'personal': 'Personal',
      'rest': 'Rest',
    };
    
    return categoryMap[categoryId] || 'Work';
  } catch (error) {
    console.error('Failed to classify title:', error);
    return 'Work'; // Default to Work on error
  }
}

/**
 * Classify title and return categoryId (lowercase string)
 */
export async function classifyTitleToCategoryId(title: string): Promise<string> {
  try {
    const result = await plansApi.classifyTitle(title);
    return result.categoryId || 'work';
  } catch (error) {
    console.error('Failed to classify title:', error);
    return 'work'; // Default to work on error
  }
}

