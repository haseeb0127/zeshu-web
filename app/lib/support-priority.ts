export type SupportPriorityLabel = 'URGENT' | 'HIGH' | 'SERVICE' | 'NORMAL';

export type SupportPriority = {
  label: SupportPriorityLabel;
  rank: 0 | 1 | 2 | 3;
};

export function classifySupportPriority(subject = '', latestBody = ''): SupportPriority {
  const text = `${subject} ${latestBody}`.toLowerCase();

  if (/safety|unsafe|accident|emergency|harass|threat|assault|danger/.test(text)) {
    return { label: 'URGENT', rank: 0 };
  }

  if (/payment|refund|charged|debited|duplicate|provider dispute|lost parcel|missing parcel|damaged parcel/.test(text)) {
    return { label: 'HIGH', rank: 1 };
  }

  if (/ride|courier|cargo|car share|travel|recharge|bill|marketplace|seller|pharmacy|delivery/.test(text)) {
    return { label: 'SERVICE', rank: 2 };
  }

  return { label: 'NORMAL', rank: 3 };
}
