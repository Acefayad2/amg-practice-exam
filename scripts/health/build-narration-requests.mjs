import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HEALTH_DIR = path.join(ROOT, 'docs/course/health');
const ZOE_VOICE_ID = 'd0374db1-44b9-4f05-939e-0a9ae9dbbe6a';
const BALANCE = 7012.3;

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const SCALE = [
  [1_000_000_000, 'billion'],
  [1_000_000, 'million'],
  [1_000, 'thousand'],
];
const IRREGULAR_ORDINALS = new Map([
  ['one', 'first'], ['two', 'second'], ['three', 'third'], ['five', 'fifth'],
  ['eight', 'eighth'], ['nine', 'ninth'], ['twelve', 'twelfth'],
]);
const SPOKEN_TERMS = new Map([
  ['AD&D', 'A D and D'], ['ACA', 'A C A'], ['ADL', 'A D L'], ['ALS', 'A L S'],
  ['AMB', 'A M B'], ['AMG', 'A M G'], ['APS', 'A P S'], ['BOE', 'B O E'],
  ['COB', 'C O B'], ['COLA', 'C O L A'], ['EPO', 'E P O'], ['EPOs', 'E P O plans'],
  ['FSA', 'F S A'], ['HDHP', 'H D H P'], ['HIV', 'H I V'], ['HMO', 'H M O'],
  ['HMOs', 'H M O plans'], ['HRA', 'H R A'], ['HSA', 'H S A'], ['IRS', 'I R S'],
  ['LTD', 'L T D'], ['MIA', 'M I A'], ['MIB', 'M I B'], ['NAIC', 'N A I C'],
  ['NIH', 'N I H'], ['PCP', 'P C P'], ['POS', 'P O S'], ['PPO', 'P P O'],
  ['PPOs', 'P P O plans'], ['QSEHRA', 'Q S E H R A'], ['SELECT', 'Select'],
  ['SHOP', 'S H O P'], ['SIS', 'S I S'], ['STD', 'S T D'], ['UCR', 'U C R'],
  ['USC', 'U S C'],
]);

function underThousand(value) {
  if (value < 20) return ONES[value];
  if (value < 100) {
    const rest = value % 10;
    return `${TENS[Math.floor(value / 10)]}${rest ? `-${ONES[rest]}` : ''}`;
  }
  const rest = value % 100;
  return `${ONES[Math.floor(value / 100)]} hundred${rest ? ` ${underThousand(rest)}` : ''}`;
}

export function integerToWords(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value >= 1_000_000_000_000) {
    throw new Error(`Unsupported narration number: ${value}`);
  }
  if (value < 1_000) return underThousand(value);
  for (const [size, name] of SCALE) {
    if (value >= size) {
      const leading = Math.floor(value / size);
      const rest = value % size;
      return `${integerToWords(leading)} ${name}${rest ? ` ${integerToWords(rest)}` : ''}`;
    }
  }
  throw new Error(`Unable to prepare narration number: ${value}`);
}

function ordinalToWords(value) {
  const cardinal = integerToWords(value);
  const parts = cardinal.split(/([ -])/);
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    if (!/[a-z]/.test(parts[index])) continue;
    const word = parts[index];
    if (IRREGULAR_ORDINALS.has(word)) parts[index] = IRREGULAR_ORDINALS.get(word);
    else if (word.endsWith('y')) parts[index] = `${word.slice(0, -1)}ieth`;
    else parts[index] = `${word}th`;
    break;
  }
  return parts.join('');
}

function spokenDecimal(value) {
  const [whole, fraction] = value.split('.');
  return `${integerToWords(Number(whole.replaceAll(',', '')))} point ${[...fraction].map((digit) => ONES[Number(digit)]).join(' ')}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function prepareNarration(source) {
  let text = source.normalize('NFKC');

  for (const [written, spoken] of [...SPOKEN_TERMS].sort((a, b) => b[0].length - a[0].length)) {
    text = text.replace(new RegExp(`(?<![A-Za-z])${escapeRegExp(written)}(?![A-Za-z])`, 'g'), spoken);
  }

  text = text
    .replace(/\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/g, (_, amount) => {
      const words = amount.includes('.') ? spokenDecimal(amount) : integerToWords(Number(amount.replaceAll(',', '')));
      return `${words} dollars`;
    })
    .replace(/([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)\s*%/g, (_, value) => {
      const words = value.includes('.') ? spokenDecimal(value) : integerToWords(Number(value.replaceAll(',', '')));
      return `${words} percent`;
    })
    .replace(/([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)\s*[–—]\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/g, (_, from, to) => {
      const first = from.includes('.') ? spokenDecimal(from) : integerToWords(Number(from.replaceAll(',', '')));
      const second = to.includes('.') ? spokenDecimal(to) : integerToWords(Number(to.replaceAll(',', '')));
      return `${first} to ${second}`;
    })
    .replace(/\b([0-9]+(?:,[0-9]{3})*)(st|nd|rd|th)\b/gi, (_, value) => ordinalToWords(Number(value.replaceAll(',', ''))))
    .replace(/\b([0-9]+(?:,[0-9]{3})*)\.([0-9]+)\b/g, (_, whole, fraction) => spokenDecimal(`${whole}.${fraction}`))
    .replace(/\b[0-9]+(?:,[0-9]{3})*\b/g, (value) => integerToWords(Number(value.replaceAll(',', ''))))
    .replaceAll('&', ' and ')
    .replaceAll('/', ' or ')
    .replace(/\bdollars-a-day\b/gi, 'dollars a day')
    .replace(/\s+/g, ' ')
    .trim();

  const leftovers = text.match(/[0-9$%&/+=]/g);
  if (leftovers) throw new Error(`Speech preparation left unsupported symbols in: ${text}`);
  return text;
}

export function projectedCredits(characters) {
  return Math.ceil((characters / 150) * 10) / 10;
}

async function loadLessons() {
  const files = (await readdir(HEALTH_DIR))
    .filter((name) => /^lessons-\d{2}-\d{2}\.mjs$/.test(name))
    .sort();
  const lessons = [];
  for (const file of files) {
    const module = await import(`${pathToFileURL(path.join(HEALTH_DIR, file)).href}?build=${Date.now()}`);
    lessons.push(...module.default);
  }
  return lessons.sort((a, b) => a.number - b.number);
}

function batchName(first, last) {
  return `audio-${String(first).padStart(2, '0')}-${String(last).padStart(2, '0')}.json`;
}

function preflightMarkdown(batches, totals) {
  const rows = batches.map((batch) => `| ${String(batch.first).padStart(2, '0')}–${String(batch.last).padStart(2, '0')} | ${batch.characters.toLocaleString('en-US')} | ${batch.credits.toFixed(1)} |`).join('\n');
  const repairProjection = Math.ceil(totals.credits * 1.25 * 10) / 10;
  const balanceAfter = Math.round((BALANCE - repairProjection) * 10) / 10;
  const status = totals.submittedBatches
    ? `pilot completed for Lessons 01–02; remaining ${batches.length - totals.submittedBatches} batches not submitted`
    : 'not submitted';
  const spend = totals.submittedBatches
    ? `The completed pilot used **${totals.actualCredits.toFixed(1)} credits**; the recorded balance after it is **${totals.balanceAfterActual.toFixed(1)} credits**.`
    : 'This document and the request files spend no Higgsfield credits.';
  return `# Health narration preflight\n\nGenerated November 10, 2026. Status: **${status}**. ${spend}\n\n## Exact prepared first pass\n\n- 60 lessons, 360 narration blocks, 30 two-lesson batches.\n- Prepared prompt characters: **${totals.characters.toLocaleString('en-US')}**.\n- Seed Audio estimate at one credit per 150 characters, rounded up to one decimal per request: **${totals.credits.toFixed(1)} credits**.\n- Planning allowance with the Life course's approximate 25% repair rate: **${repairProjection.toFixed(1)} credits** before any optional photographs.\n- Recorded balance before the pilot: **${BALANCE.toFixed(1)} credits**.\n- Projected balance after the full repair allowance: **${balanceAfter.toFixed(1)} credits**.\n\nThe preparation changes only the audio prompts. It spells out numbers and symbols and expands ambiguous abbreviations; the on-page lesson text remains unchanged.\n\n## Batch estimates\n\n| Lessons | Prepared characters | First-pass credits |\n|---|---:|---:|\n${rows}\n\n## Voice pilot and submission gate\n\nLessons 01–02 completed with Seed Audio and the Zoe preset for the exact quoted **46.1 credits**. Review the resulting speech before submitting any later batch. If the pilot needs a repair, update only the affected blocks and record the additional receipt rather than regenerating an accepted block.\n\nFor every submitted request, save the provider job, output URL and actual \`credits_exact\` receipt into the matching \`audio-NN-NN.json\` file. A lesson remains a text edition until reviewed media, captions and a \`media-NN.json\` receipt mark it ready.\n`;
}

export async function buildNarrationRequests() {
  const lessons = await loadLessons();
  if (lessons.length !== 60) throw new Error(`Expected 60 Health lessons, found ${lessons.length}`);
  await mkdir(HEALTH_DIR, { recursive: true });

  const batches = [];
  for (let offset = 0; offset < lessons.length; offset += 2) {
    const selected = lessons.slice(offset, offset + 2);
    const params = [];
    const projected = [];
    for (const lesson of selected) {
      if (lesson.blocks.length !== 6) throw new Error(`Lesson ${lesson.id} must have six narration blocks`);
      lesson.blocks.forEach((block, blockIndex) => {
        const prompt = prepareNarration(block.narration);
        const index = lesson.number * 100 + blockIndex;
        const characters = prompt.length;
        params.push({
          index,
          params: {
            model: 'seed_audio',
            voice_type: 'preset',
            voice_id: ZOE_VOICE_ID,
            format: 'mp3',
            speech_rate: 5,
            prompt,
          },
        });
        projected.push({ index, characters, credits: projectedCredits(characters) });
      });
    }
    const first = selected[0].number;
    const last = selected.at(-1).number;
    const characters = projected.reduce((sum, item) => sum + item.characters, 0);
    const credits = projected.reduce((sum, item) => sum + item.credits, 0);
    const receipt = {
      created: null,
      status: 'not_submitted',
      lessons: [first, last],
      params,
      projected,
      estimates: [],
      jobs: [],
    };
    const receiptPath = path.join(HEALTH_DIR, batchName(first, last));
    let existing = null;
    try { existing = JSON.parse(await readFile(receiptPath, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const submitted = existing && existing.status !== 'not_submitted';
    if (submitted) {
      if (JSON.stringify(existing.params) !== JSON.stringify(params)) throw new Error(`Submitted narration no longer matches ${batchName(first, last)}`);
    } else {
      await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    }
    batches.push({
      first, last, characters, credits, submitted,
      actualCredits: existing?.credits?.credits_exact || 0,
      balanceAfterActual: existing?.credits?.balance_after || BALANCE,
    });
  }

  const totals = {
    characters: batches.reduce((sum, batch) => sum + batch.characters, 0),
    credits: batches.reduce((sum, batch) => sum + batch.credits, 0),
    submittedBatches: batches.filter(batch => batch.submitted).length,
    actualCredits: batches.reduce((sum, batch) => sum + batch.actualCredits, 0),
    balanceAfterActual: Math.min(...batches.filter(batch => batch.submitted).map(batch => batch.balanceAfterActual), BALANCE),
  };
  await writeFile(path.join(HEALTH_DIR, 'NARRATION-PREFLIGHT.md'), preflightMarkdown(batches, totals));
  return { lessons: lessons.length, blocks: lessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0), batches: batches.length, ...totals };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildNarrationRequests();
  console.log(JSON.stringify(result));
}
