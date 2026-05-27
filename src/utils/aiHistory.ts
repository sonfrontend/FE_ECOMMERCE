export const getAIHistory = (): string[] => {
  try {
    const data = localStorage.getItem('ai_history');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing ai_history', e);
  }
  return [];
};

export const addAIHistory = (articleId: string) => {
  let history = getAIHistory();
  // Remove if exists to move it to the end (most recent)
  history = history.filter(id => id !== articleId);
  history.push(articleId);
  // Keep only the last 10 items
  if (history.length > 10) {
    history = history.slice(history.length - 10);
  }
  localStorage.setItem('ai_history', JSON.stringify(history));
};
