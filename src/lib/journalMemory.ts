export enum JournalCategory {
  Note = "note",
  Reminder = "reminder",
  Shopping = "shopping",
}

export type JournalEntry = {
  id: number;
  categories: JournalCategory[];
  content: string;
};

export const journal: JournalEntry[] = [];
let idCounter = 0;

export function addEntry(
  content: string,
  categories: JournalCategory[] = [JournalCategory.Note]
) {
  const uniqueCategories = Array.from(new Set(categories));
  journal.push({ id: ++idCounter, content, categories: uniqueCategories });
}

export function queryEntries(keyword: string) {
  console.log("queryEntries", keyword);
  console.log("journal", JSON.stringify(journal, null, 2));
  const contentEntry = journal.filter((entry) =>
    entry.content.toLowerCase().includes(keyword.toLowerCase())
  );
  const categoryEntry = journal.filter((entry) =>
    entry.categories.some((category) => category.toLowerCase().includes(keyword.toLowerCase()))
  );
  if (contentEntry.length > 0) {
    return contentEntry;
  }
  if (categoryEntry.length > 0) {
    return categoryEntry;
  }
  return [];
}
