export const PDF_STORAGE_PATH = process.env.PDF_STORAGE_PATH || './storage';

export const PDF_TYPES = {
  SYLLABUS: 'sylabus',
  PASTPAPERS: 'pastpapers',
} as const;

export type PdfType = typeof PDF_TYPES[keyof typeof PDF_TYPES];

export const VALID_NUMERIC_GRADES = Array.from({ length: 13 }, (_, i) => i + 1);

export const GRADE_MAPPING: Record<string, string> = {
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  '11': '11',
  '12': '12',
  '13': '13',
  'grade-01': 'grade-01',
  'grade-1': 'grade-01',
  'grade-02': 'grade-02',
  'grade-2': 'grade-02',
  'grade-03': 'grade-03',
  'grade-3': 'grade-03',
  'grade-04': 'grade-04',
  'grade-4': 'grade-04',
  'grade-05': 'grade-05',
  'grade-5': 'grade-05',
  'grade-06': 'grade-06',
  'grade-6': 'grade-06',
  'grade-07': 'grade-07',
  'grade-7': 'grade-07',
  'grade-08': 'grade-08',
  'grade-8': 'grade-08',
  'grade-09': 'grade-09',
  'grade-9': 'grade-09',
  'grade-10': 'grade-10',
  'grade-11': 'grade-11',
  'grade-11-ol': 'grade-11-ol',
  'grade-11-o-l': 'grade-11-ol',
  'grade-12': 'grade-12',
  'grade-12-al': 'grade-12-al',
  'grade-12-a-l': 'grade-12-al',
  'grade-13': 'grade-13',
  'grade-13-al': 'grade-13-al',
  'grade-13-a-l': 'grade-13-al',
  
  'advance-level': 'advance-level',
  'advanced-level': 'advance-level',
  'a-level': 'advance-level',
  'al': 'advance-level',
  
  'ordinary-level': 'ordinary-level',
  'o-level': 'ordinary-level',
  'ol': 'ordinary-level',
};

export const SUBJECT_MAPPING: Record<string, string> = {
  'mathematics': 'mathematics',
  'maths': 'mathematics',
  'math': 'mathematics',
  
  'science': 'science',
  
  'english': 'english',
  'english-language': 'english',
  'english-language-arts': 'english',
  
  'sinhala': 'sinhala',
  'tamil': 'tamil',
  'history': 'history',
  'geography': 'geography',
  'civics': 'civics',
  'citizenship-education': 'civics',
  
  'information-technology': 'information-technology',
  'it': 'information-technology',
  'ict': 'information-technology',
  'computer-science': 'information-technology',
  
  'art': 'art',
  'arts': 'art',
  'art-and-design': 'art',
  
  'music': 'music',
  'physical-education': 'physical-education',
  'pe': 'physical-education',
  'health': 'health',
  'health-and-physical-education': 'physical-education',
  
  'religion': 'religion',
  'buddhism': 'religion',
  'christianity': 'religion',
  'islam': 'religion',
  'hinduism': 'religion',
  
  'commerce': 'commerce',
  'accounting': 'commerce',
  'business-studies': 'commerce',
  
  'agriculture': 'agriculture',
  'agri': 'agriculture',
  
  'drama': 'drama',
  'theatre': 'drama',
  
  'dance': 'dance',
  
  'western-music': 'western-music',
  'eastern-music': 'eastern-music',
};

export function normalizeSubject(subject: string): string {
  const normalized = subject.toLowerCase().trim().replace(/\s+/g, '-');
  return SUBJECT_MAPPING[normalized] || normalized;
}

export function getValidSubjects(): string[] {
  return Array.from(new Set(Object.values(SUBJECT_MAPPING)));
}

export function normalizeGrade(grade: string | number): string {
  const gradeStr = String(grade).trim();
  const numGrade = parseInt(gradeStr, 10);
  if (!isNaN(numGrade) && numGrade >= 1 && numGrade <= 13) {
    return String(numGrade);
  }
  
  let normalized = gradeStr
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .replace(/[\/\\]/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  if (GRADE_MAPPING[normalized]) {
    return GRADE_MAPPING[normalized];
  }
  
  return normalized;
}

export function isValidGrade(grade: string | number): boolean {
  const gradeStr = String(grade).trim();
  const numGrade = parseInt(gradeStr, 10);
  if (!isNaN(numGrade) && VALID_NUMERIC_GRADES.includes(numGrade)) {
    return true;
  }
  const normalized = gradeStr.toLowerCase().replace(/\s+/g, '-');
  return normalized.length > 0 && normalized.length < 50;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '')
    .trim();
}

