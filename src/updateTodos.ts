import GitFile from 'helpers/gitFile';
import TodoParser from 'helpers/todoParser';

type FileLine = {
  text: string;
  index: number;
};

type Todo = {
  name: string;
  file: {
    path: string;
    line: FileLine;
    prefix: string;
    suffix?: string;
  };
};

type UpdateTodosParams = {
  filePath: string;
  repoPath?: string;
  onCreateTask: (name: string) => Promise<{name: string; index: number} | null>;
};

let todosInFlight: Array<Todo> = [];

const isTodoEqual = (task1: Todo, task2: Todo): boolean => {
  return task1.name === task2.name || (task1.file.path === task2.file.path && task1.file.line.index === task2.file.line.index);
};

const updateTodos = async ({filePath, repoPath, onCreateTask}: UpdateTodosParams) => {
  if (!TodoParser.isFileSupported(filePath)) {
    // File not supported
    return;
  }

  // Find all lines that changed
  const parser = new TodoParser({filePath});
  const file = new GitFile({filePath, repoPath});
  const todos: Array<Todo> = [];
  await file.changedLines((line) => {
    const todo = parser.parse(line.text);
    if (todo) {
      todos.push({
        name: todo.name,
        file: {
          path: filePath,
          line,
          prefix: todo.prefix,
          suffix: todo.suffix,
        },
      });
    }
  });

  // Filter out todos for which we are already creating a task
  const newTodos = todos.filter((todo) => {
    return !todosInFlight.find((todoInFlight) => {
      return isTodoEqual(todoInFlight, todo);
    });
  });

  if (!newTodos.length) {
    return;
  }

  // Create task for each todo
  todosInFlight.push(...newTodos);
  newTodos.forEach(async (todo) => {
    // Create task
    let newTask: {index: number; name: string} | null = null;
    try {
      newTask = await onCreateTask(todo.name);
    } catch (e) {
      // Ignore errors
    }

    // Update line of file with task index and todo description
    if (newTask) {
      await file.updateLine({
        lineIndex: todo.file.line.index,
        previousContent: todo.file.line.text,
        newContent: `${todo.file.prefix}T-${newTask.index} ${newTask.name}${todo.file.suffix ? ` ${todo.file.suffix}` : ''}`,
      });
    }

    // Clear todo from in-flight list
    todosInFlight = todosInFlight.filter((todoInFlight) => {
      return !isTodoEqual(todoInFlight, todo);
    });
  });
};

export default updateTodos;
