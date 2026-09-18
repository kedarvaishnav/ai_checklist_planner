/**
 * Parses raw ChatGPT-style plan text into structured Category/Task data.
 *
 * Rules:
 * - Lines starting with "#" are treated as category headers (the "#" prefix
 *   is stripped if present).
 * - Lines starting with "-" or "*" are treated as tasks.
 * - Any other non-empty line that appears before a task line and is not
 *   prefixed is treated as a category name (to support plain "Category Name"
 *   headers as shown in the example format).
 * - Empty lines are ignored.
 */
export function parseChecklist(input) {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const categories = [];
  let currentCategory = null;
  let categoryIndex = 0;
  let taskIndex = 0;

  for (const line of lines) {
    const isTask = /^[-*]\s*/.test(line);

    if (isTask) {
      const title = line.replace(/^[-*]\s*/, '').trim();
      if (!title) continue;

      if (!currentCategory) {
        // No category declared yet; create a default one.
        currentCategory = {
          id: `category-${categoryIndex++}`,
          category: 'General',
          tasks: [],
        };
        categories.push(currentCategory);
      }

      const task = {
        id: `task-${taskIndex++}`,
        title,
        completed: false,
      };
      currentCategory.tasks.push(task);
    } else {
      // Treat as a category header. Strip leading "#" characters if present.
      const name = line.replace(/^#+\s*/, '').trim();
      if (!name) continue;

      currentCategory = {
        id: `category-${categoryIndex++}`,
        category: name,
        tasks: [],
      };
      categories.push(currentCategory);
    }
  }

  return categories;
}

export function calculateProgress(categories) {
  let completed = 0;
  let total = 0;

  for (const cat of categories) {
    for (const task of cat.tasks) {
      total++;
      if (task.completed) completed++;
    }
  }

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, total, percentage };
}
