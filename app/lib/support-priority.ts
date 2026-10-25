export type SupportPriorityLabel = 'P0' | 'P1' | 'P2' | 'P3';

export type SupportPriority = {
  label: SupportPriorityLabel;
  rank: 0 | 1 | 2 | 3;
};

export function classifySupportPriority(subject = '', latestBody = ''): SupportPriority {
  const text = `${subject} ${latestBody}`.toLowerCase();

  if (/safety|unsafe|accident|emergency|harass|threat|assault|danger/.test(text)) {
    return { label: 'P0', rank: 0 };
  }

  if (/payment|refund|charged|debited|duplicate|provider dispute|lost parcel|missing parcel|damaged parcel/.test(text)) {
    return { label: 'P1', rank: 1 };
  }

  if (/ride|courier|cargo|car share|travel|recharge|bill|marketplace|seller|pharmacy|delivery/.test(text)) {
    return { label: 'P2', rank: 2 };
  }

  return { label: 'P3', rank: 3 };
}
