import { useState } from 'react';
import { FaTimes, FaMagic, FaBuilding, FaBriefcase, FaMapMarkerAlt, FaMoneyBillWave, FaLaptopCode, FaCheckCircle, FaShieldAlt, FaExclamationTriangle, FaUser } from 'react-icons/fa';
import { JobApplicationCreate, WORK_TYPE_OPTIONS } from '../types';

interface ParsedFields {
  company_name: string;
  job_title: string;
  location: string;
  work_type: string;
  salary_min?: number;
  salary_max?: number;
  job_description: string;
  contact_person: string;
}

interface JDParserModalProps {
  onCancel: () => void;
  onParsed: (data: Partial<JobApplicationCreate>) => void;
}

// ─── Utility parsers ─────────────────────────────────────────────────────────

// Lines to skip when scanning for title / company
const LINKEDIN_SKIP = [
  /^company\s+logo/i,
  /^\d+\s+(days?|hours?|weeks?)\s+ago/i,
  /people\s+(clicked|applied)/i,
  /^(promoted|sponsored)\b/i,
  /^(apply|saved|hybrid|remote|on-?site|full[- ]time|part[- ]time|contract)$/i,
  /^use\s+ai\s+to/i,
  /^(tailor|create\s+cover|help\s+me|show\s+(all|match)|school\s+alumni)/i,
  /^about\s+the\s+job$/i,
  /^(responses\s+managed|flexible\s+first|working\s+pattern)/i,
];

function extractCompany(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // LinkedIn format: "Company logo for, CompanyName." on line 0, "CompanyName" on line 1
  if (lines[0] && /company\s+logo/i.test(lines[0]) && lines[1]) {
    const raw = lines[1].replace(/\.$/, '').trim();
    if (raw.length > 0 && raw.length < 80 && !raw.includes(',')) return raw;
  }

  // "Company: Foo" / "Employer: Foo" explicit label (but NOT "Company logo for,…")
  const labelMatch = text.match(/^(?:company|employer|organisation|organization)\s*[:\-–]\s*([^\n,|·]+)/im);
  if (labelMatch) return labelMatch[1].trim();

  // "at CompanyName ·" pattern — must be followed by · | ,
  const head = text.slice(0, 600);
  const atMatch = head.match(/\bat\s+([A-Z][A-Za-z0-9&']{1,30}(?:\s[A-Z][A-Za-z0-9&']{1,20}){0,3})(?=\s*[·|,–\n])/m);
  if (atMatch) return atMatch[1].trim();

  // "About SSE" / "About the company" standalone heading line
  const aboutMatch = text.match(/^About\s+([A-Z][A-Za-z0-9&'\s]{1,40}?)$/m);
  if (aboutMatch) return aboutMatch[1].trim();

  return '';
}

function extractTitle(text: string): string {
  // Explicit label always wins
  const labelMatch = text.match(/(?:^|\n)\s*(?:job\s+title|position|role|job\s+opening)\s*[:\-–]\s*([^\n]+)/i);
  if (labelMatch) return labelMatch[1].trim();

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const companyName = extractCompany(text).toLowerCase();

  for (const line of lines.slice(0, 20)) {
    // Skip short/long lines
    if (line.length < 3 || line.length > 90) continue;
    // Skip sentences (has a period and is long enough)
    if (line.endsWith('.') && line.length > 40) continue;
    // Skip boilerplate LinkedIn lines
    if (LINKEDIN_SKIP.some(p => p.test(line))) continue;
    // Skip if the line IS the company name (or contains its first word)
    const firstWord = companyName.split(/\s+/)[0];
    if (firstWord && line.toLowerCase().includes(firstWord)) continue;
    // Skip lines with · (LinkedIn metadata: location, date)
    if (line.includes('·')) continue;
    // Must start with a capital letter and have ≤ 8 words
    if (/^[A-Z]/.test(line) && line.split(/\s+/).length <= 8) {
      return line;
    }
  }

  return '';
}

function extractLocation(text: string): string {
  // 1. LinkedIn: "City, Region, Country ·"  (three-part with middle dot)
  //    Use [ \t] instead of \s so we never cross a newline boundary
  const head = text.slice(0, 800);
  const ln3 = head.match(/([A-Z][A-Za-z \t\-]+,[ \t]*[A-Z][A-Za-z \t\-]+,[ \t]*[A-Z][A-Za-z \t\-]+)[ \t]*·/);
  if (ln3) return ln3[1].trim();

  // 2. LinkedIn: "City, Region ·" (two-part)
  const ln2 = head.match(/([A-Z][A-Za-z \t\-]+,[ \t]*[A-Z][A-Za-z \t\-]+)[ \t]*·/);
  if (ln2) return ln2[1].trim();

  // 3. Explicit "Location: City" label
  const labelMatch = text.match(/(?:^|\n)[ \t]*(?:base[ \t]+)?location[ \t]*[:\-–][ \t]*([^\n,;]+)/i);
  if (labelMatch) {
    const raw = labelMatch[1].trim();
    const isSentence = /\b(you'?ll|will|expected|spend|working|office)\b/i.test(raw) || raw.length > 50;
    if (!isSentence) return raw;
    const cityInSentence = raw.match(/\b([A-Z][a-z]+(?: [A-Z][a-z]+)?(?:,\s*[A-Z][a-z]+(?: [A-Z][a-z]+)?)?)\b/);
    if (cityInSentence) return cityInSentence[1].trim();
  }

  // 4. Generic "City, Country" pattern in the first 600 chars — single line only
  const cityMatch = head.match(/\b([A-Z][a-z]+(?:[ \t][A-Z][a-z]+)?,[ \t]*(?:[A-Z]{2}|[A-Z][a-z]+(?:[ \t][A-Z][a-z]+)?))\b/);
  if (cityMatch) return cityMatch[1].trim();

  return '';
}

function extractWorkType(text: string): string {
  const lower = text.toLowerCase();
  for (const wt of WORK_TYPE_OPTIONS) {
    if (lower.includes(wt.toLowerCase())) return wt;
  }
  return '';
}

function parseSalaryNumber(raw: string): number | undefined {
  const cleaned = raw.replace(/[,\s]/g, '').replace(/[£$€]/g, '');
  const kMatch = cleaned.match(/^(\d+(?:\.\d+)?)k$/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);
  const n = parseFloat(cleaned);
  return isNaN(n) ? undefined : Math.round(n);
}

function extractSalary(text: string): { salary_min?: number; salary_max?: number } {
  // Range: £40,000 - £55,000 / $60k–$80k / €45000 to €60000
  const rangeRe = /[£$€]\s*([\d,]+(?:\.\d+)?k?)\s*(?:[-–—]|to)\s*[£$€]?\s*([\d,]+(?:\.\d+)?k?)/i;
  const rangeMatch = text.match(rangeRe);
  if (rangeMatch) {
    return {
      salary_min: parseSalaryNumber(rangeMatch[1]),
      salary_max: parseSalaryNumber(rangeMatch[2]),
    };
  }
  // Single with label
  const singleRe = /(?:salary|pay|compensation|package)[^\n£$€]{0,30}[£$€]\s*([\d,]+(?:\.\d+)?k?)/i;
  const singleMatch = text.match(singleRe);
  if (singleMatch) {
    const val = parseSalaryNumber(singleMatch[1]);
    return { salary_min: val, salary_max: val };
  }
  // Plain first currency amount
  const plainMatch = text.match(/[£$€]\s*([\d,]+(?:\.\d+)?k?)/i);
  if (plainMatch) {
    const val = parseSalaryNumber(plainMatch[1]);
    return { salary_min: val, salary_max: val };
  }
  return {};
}

// Lines/blocks to strip from the saved JD text (LinkedIn boilerplate)
const JUNK_LINE_PATTERNS = [
  /^company\s+logo/i,
  /^\d+\s+(days?|hours?|weeks?)\s+ago\b/i,
  /\bpeople\s+(clicked|applied)\b/i,
  /^(promoted\s+by|responses\s+managed)/i,
  /^(apply|saved|save|easy\s+apply)$/i,
  /^use\s+ai\s+to\s+assess/i,
  /^(show\s+match\s+details|tailor\s+(my\s+)?resume|create\s+cover\s+letter|help\s+me\s+stand\s+out)/i,
  /^people\s+you\s+can\s+reach\s+out\s+to/i,  // drop heading, keep content below
  /^school\s+alumni\s+from/i,
  /^show\s+all$/i,
  /^message$/i,                               // LinkedIn "Message" button
  /^\s*(premium|sponsored)\s*$/i,
  /^(about\s+the\s+job)$/i,
];

// Block-level sections to drop entirely (start → next heading)
// NOTE: "People you can reach out to" is intentionally NOT here — we want
// "Meet the hiring team" and the person's name below it to be preserved.
const JUNK_SECTION_STARTS = [
  /^use\s+ai\s+to\s+assess/i,
];

function cleanJD(text: string): string {
  const lines = text.split('\n');
  const cleaned: string[] = [];
  let skipSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Check if this line starts a junk section
    if (JUNK_SECTION_STARTS.some(p => p.test(line))) {
      skipSection = true;
      continue;
    }

    // A new non-empty, non-junk, capitalised short line ends a skipped section
    // (heuristic: "About the job" body, salary line, etc.)
    if (skipSection) {
      const isNewSection = line.length > 0 &&
        /^[A-Z£$€]/.test(line) &&
        !JUNK_LINE_PATTERNS.some(p => p.test(line)) &&
        !JUNK_SECTION_STARTS.some(p => p.test(line));
      if (isNewSection) skipSection = false;
      else continue;
    }

    // Drop individual junk lines
    if (JUNK_LINE_PATTERNS.some(p => p.test(line))) continue;

    // Drop lines that are purely LinkedIn metadata embedded in location line
    // e.g. "· 6 days ago · 45 people clicked apply"
    const withoutMeta = rawLine
      .replace(/·\s*\d+\s+(days?|hours?|weeks?)\s+ago/gi, '')
      .replace(/·\s*\d+\s+people\s+(clicked|applied)\s+apply/gi, '')
      // Strip LinkedIn badges from name lines: "Anthony Speed ✓ • 2nd" → "Anthony Speed"
      .replace(/[✓✔☑]\s*/g, '')
      .replace(/[·•]\s*(1st|2nd|3rd)\b/gi, '')
      .trimEnd();

    cleaned.push(withoutMeta);
  }

  // Collapse 3+ consecutive blank lines into 2
  return cleaned
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Security clearance detection ────────────────────────────────────────────

interface ClearanceDetection {
  found: boolean;
  requirements: string[];
}

function detectSecurityClearance(text: string): ClearanceDetection {
  const requirements: string[] = [];

  if (/\bedv\b|enhanced\s+dv\b|enhanced\s+developed\s+vetting/i.test(text)) requirements.push('eDV Clearance');
  else if (/\bdv\s+clear(ed|ance)?\b|\bdeveloped\s+vetting\b/i.test(text)) requirements.push('DV Clearance');

  if (!requirements.some(r => r.includes('DV'))) {
    if (/\bsc\s+clear(ed|ance)?\b|\bsecurity\s+clear(ed|ance)\b|\bclearance\s+required\b/i.test(text))
      requirements.push('SC Clearance');
  }

  if (/\bbritish\s+national\b/i.test(text)) requirements.push('British National');
  else if (/\buk\s+national\b/i.test(text)) requirements.push('UK National');

  if (/\bbritish\s+citiz/i.test(text)) requirements.push('British Citizen');
  else if (/\buk\s+citiz/i.test(text)) requirements.push('UK Citizen');

  return { found: requirements.length > 0, requirements };
}

function extractContactPerson(text: string): string {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    if (/meet\s+the\s+hiring\s+team/i.test(lines[i].trim())) {
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const candidate = lines[j].trim();
        if (!candidate || candidate.length < 2) continue;
        // Skip lines that look like job titles / boilerplate
        if (/job\s+poster|recruiter|hiring\s+manager|show\s+all/i.test(candidate)) continue;
        // Strip LinkedIn badges: ✓ ✔ • 2nd 1st 3rd and similar
        const cleaned = candidate
          .replace(/[✓✔☑]/g, '')
          .replace(/[·•]\s*(1st|2nd|3rd)\b/gi, '')
          .replace(/\s+(1st|2nd|3rd)\b/gi, '')
          .trim();
        // Must look like a real name (2+ words or at least one capitalised word)
        if (cleaned.length > 1 && /^[A-Z]/.test(cleaned)) return cleaned;
      }
    }
  }
  return '';
}

function parseJD(text: string): ParsedFields {
  const cleanedText = cleanJD(text);
  return {
    company_name: extractCompany(text),
    job_title: extractTitle(text),
    location: extractLocation(text),
    work_type: extractWorkType(text),
    ...extractSalary(text),
    job_description: cleanedText,
    contact_person: extractContactPerson(text),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

type Step = 'paste' | 'security-warning' | 'review';

export const JDParserModal = ({ onCancel, onParsed }: JDParserModalProps) => {
  const [step, setStep] = useState<Step>('paste');
  const [jdText, setJdText] = useState('');
  const [parsed, setParsed] = useState<ParsedFields | null>(null);
  const [clearanceInfo, setClearanceInfo] = useState<ClearanceDetection | null>(null);
  const [fields, setFields] = useState<ParsedFields>({
    company_name: '',
    job_title: '',
    location: '',
    work_type: '',
    job_description: '',
    contact_person: '',
  });

  const handleParse = () => {
    if (!jdText.trim()) return;
    const result = parseJD(jdText);
    const clearance = detectSecurityClearance(jdText);
    setParsed(result);
    setFields(result);
    setClearanceInfo(clearance);
    setStep(clearance.found ? 'security-warning' : 'review');
  };

  // User acknowledged warning and chose to proceed
  const handleProceedAnyway = () => {
    setStep('review');
  };

  const handleFieldChange = (key: keyof ParsedFields, value: string | number | undefined) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleContinue = () => {
    const clearanceTags = clearanceInfo?.found ? clearanceInfo.requirements : [];
    const data: Partial<JobApplicationCreate> = {
      company_name: fields.company_name,
      job_title: fields.job_title,
      location: fields.location || undefined,
      work_type: fields.work_type || undefined,
      salary_min: fields.salary_min,
      salary_max: fields.salary_max,
      job_description: fields.job_description,
      contact_person: fields.contact_person || undefined,
      ...(clearanceTags.length > 0 ? { tags: clearanceTags } : {}),
    };
    onParsed(data);
  };

  const detectedCount = parsed
    ? [parsed.company_name, parsed.job_title, parsed.location, parsed.work_type,
       parsed.salary_min != null || parsed.salary_max != null ? 'salary' : '',
       parsed.contact_person].filter(Boolean).length
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-md">
              <FaMagic className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add Using Job Description</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {step === 'paste' && 'Paste a JD and we\'ll extract the details automatically'}
                {step === 'security-warning' && '⚠️ This role has eligibility requirements'}
                {step === 'review' && 'Review and edit the extracted details'}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${step === 'paste' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>
              {step !== 'paste' ? <FaCheckCircle className="text-xs" /> : '1'}
            </div>
            <span className={`text-sm font-medium ${step === 'paste' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>Paste JD</span>
          </div>
          <div className="flex-1 mx-2 h-px bg-gray-300 dark:bg-gray-600" />
          {/* Security warning step — only visible when triggered */}
          {clearanceInfo?.found && (
            <>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                  ${step === 'security-warning' ? 'bg-amber-500 text-white' : step === 'review' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  {step === 'review' ? <FaCheckCircle className="text-xs" /> : <FaShieldAlt className="text-xs" />}
                </div>
                <span className={`text-sm font-medium ${step === 'security-warning' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>Security</span>
              </div>
              <div className="flex-1 mx-2 h-px bg-gray-300 dark:bg-gray-600" />
            </>
          )}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${step === 'review' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
              {clearanceInfo?.found ? '3' : '2'}
            </div>
            <span className={`text-sm font-medium ${step === 'review' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>Review & Edit</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Description Text
                </label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={16}
                  placeholder={`Paste the full job description here...

For example:

Software Engineer – Backend
at TechCorp · London, UK · Hybrid

Salary: £55,000 - £75,000

About the role
We are looking for a Backend Engineer to join our growing team...`}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm resize-none font-mono leading-relaxed"
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Copy & paste the full JD text. The more text you provide, the better the extraction.
                </p>
              </div>
            </div>
          )}

          {/* Security warning step */}
          {step === 'security-warning' && clearanceInfo && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <FaExclamationTriangle className="text-3xl text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Security / Eligibility Requirements Detected</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This job description mentions requirements that may affect your eligibility.</p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 space-y-2">
                {clearanceInfo.requirements.map(req => (
                  <div key={req} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                      <FaShieldAlt className="text-amber-600 dark:text-amber-400 text-xs" />
                    </div>
                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">{req}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                If you proceed, the role will be automatically tagged with the above requirement(s).
              </p>
            </div>
          )}

          {step === 'review' && fields && (
            <div className="space-y-5">
              {/* Detection summary badge */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl">
                <FaMagic className="text-indigo-500 text-sm flex-shrink-0" />
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  <strong>{detectedCount} field{detectedCount !== 1 ? 's' : ''}</strong> auto-detected.
                  {detectedCount < 3 && ' You may need to fill in missing details manually.'}
                  {' '}Edit any field before opening the form.
                </p>
              </div>

              {/* Company */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <FaBuilding className="text-gray-400" /> Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fields.company_name}
                  onChange={e => handleFieldChange('company_name', e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>

              {/* Job Title */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <FaBriefcase className="text-gray-400" /> Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fields.job_title}
                  onChange={e => handleFieldChange('job_title', e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <FaUser className="text-gray-400" /> Contact Person
                  {fields.contact_person && <span className="ml-1 text-xs text-emerald-500 font-normal">auto-detected from hiring team</span>}
                </label>
                <input
                  type="text"
                  value={fields.contact_person}
                  onChange={e => handleFieldChange('contact_person', e.target.value)}
                  placeholder="e.g. Jane Smith (hiring manager)"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>

              {/* Location + Work Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <FaMapMarkerAlt className="text-gray-400" /> Location
                  </label>
                  <input
                    type="text"
                    value={fields.location}
                    onChange={e => handleFieldChange('location', e.target.value)}
                    placeholder="e.g. London, UK"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <FaLaptopCode className="text-gray-400" /> Work Type
                  </label>
                  <select
                    value={fields.work_type}
                    onChange={e => handleFieldChange('work_type', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="">Select...</option>
                    {WORK_TYPE_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              {/* Salary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <FaMoneyBillWave className="text-gray-400" /> Salary Min
                  </label>
                  <input
                    type="number"
                    value={fields.salary_min ?? ''}
                    onChange={e => handleFieldChange('salary_min', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    placeholder="e.g. 40000"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <FaMoneyBillWave className="text-gray-400" /> Salary Max
                  </label>
                  <input
                    type="number"
                    value={fields.salary_max ?? ''}
                    onChange={e => handleFieldChange('salary_max', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    placeholder="e.g. 60000"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* JD preview (collapsible-ish) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Job Description <span className="text-xs font-normal text-gray-400">(saved to record)</span>
                </label>
                <textarea
                  value={fields.job_description}
                  onChange={e => handleFieldChange('job_description', e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-mono resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4 flex items-center justify-between gap-3">
          {step === 'paste' ? (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={!jdText.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <FaMagic />
                Parse & Continue
              </button>
            </>
          ) : step === 'security-warning' ? (
            <>
              <button
                onClick={() => setStep('paste')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
              >
                ← Go Back
              </button>
              <button
                onClick={handleProceedAnyway}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02] transition-all"
              >
                <FaShieldAlt />
                Proceed Anyway
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(clearanceInfo?.found ? 'security-warning' : 'paste')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleContinue}
                disabled={!fields.company_name || !fields.job_title}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <FaBriefcase />
                Open Full Form →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
