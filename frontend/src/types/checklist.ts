export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface Category {
  id: string;
  category: string;
  tasks: Task[];
}

export interface ChecklistData {
  categories: Category[];
  rawInput: string;
  createdAt: number;
}
