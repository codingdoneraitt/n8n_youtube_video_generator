import { readFile } from 'node:fs/promises';

const inputPath = process.argv[2] || 'questions.json';
const raw = JSON.parse(await readFile(inputPath, 'utf-8'));
const list = Array.isArray(raw) ? raw : raw.questions;
if (!Array.isArray(list) || list.length === 0) throw new Error('Expected questions array');

const questions = list.slice(0, 40);
const examTitle = process.env.EXAM_TITLE || 'Practice Exam';
const title = `${examTitle} Practice Exam Walkthrough - ${questions.length} Questions`;
const topics = [...new Set(questions.map((q) => q.topic).filter(Boolean))].slice(0, 8);

const chapters = questions.map((q, index) => {
  const seconds = 8 + index * 32 + (index >= 20 ? 6 : 0);
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return {
    timestamp: `${mins}:${secs}`,
    title: `Question ${index + 1}${q.topic ? ` - ${q.topic}` : ''}`,
  };
});

console.log(JSON.stringify({
  title,
  description: [
    `${title}.`,
    '',
    'Pause before each answer reveal, then review the explanation.',
    '',
    'Chapters:',
    ...chapters.map((chapter) => `${chapter.timestamp} ${chapter.title}`),
  ].join('\n'),
  tags: [examTitle, 'practice exam', 'exam walkthrough', 'certification', ...topics],
  chapters,
}, null, 2));
