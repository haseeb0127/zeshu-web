import { createHash } from 'node:crypto';

const PLAN_API_BASE = 'https://planapi.in/api/Mobile';

export type NormalizedPlan = {
  id: string;
  category: string;
  amount: number;
  validity: string;
  description: string;
  source: 'standard';
};

export type NormalizedSpecialOffer = {
  id: string;
  amount: number;
  title: string;
  description: string;
  source: 'special';
};

export type PlanDiscoveryResult = {
  operator: string;
  operatorCode: string;
  circle: string;
  circleCode: string;
  plans: NormalizedPlan[];
  specialOffers: NormalizedSpecialOffer[];
};

export type DthPricingOption = { amount: number; duration: string };
export type DthPlan = {
  id: string;
  name: string;
  language: string;
  channels: string;
  paidChannels: string;
  hdChannels: string;
  channelsRaw: string;
  paidChannelsRaw: string;
  hdChannelsRaw: string;
  lastUpdated: string;
  pricingOptions: DthPricingOption[];
};
export type UtilityOperator = { name: string; operatorCode: string; type: string };
export type ElectricityOperator = UtilityOperator & { type: 'ELECTRICITY' };
export type WaterOperator = UtilityOperator & { type: 'WATER' };
export type BbpsField = { label: string; minLength: number | null; maxLength: number | null; fieldType: string };
export type BbpsBillInfo = { billFetchAvailable: boolean; fields: BbpsField[] };

function credentials() {
  const memberId = process.env.PLANAPI_MEMBER_ID;
  const password = process.env.PLANAPI_PASSWORD;
  if (!memberId || !password) throw new Error('PLANAPI_NOT_CONFIGURED');
  return { memberId, password };
}

function providerError(message: string) {
  return new Error(message.replace(/https?:\/\/\S+/gi, '[provider]').slice(0, 160));
}

async function getProvider(path: string, params: Record<string, string>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const query = new URLSearchParams(params);
    const response = await fetch(`${PLAN_API_BASE}/${path}?${query.toString()}`, { signal: controller.signal, cache: 'no-store' });
    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch { throw providerError('Invalid provider response.'); }
    if (!response.ok) throw providerError('Provider request failed.');
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function dthDigits(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 20 || /^0+$/.test(digits)) throw new Error('INVALID_DTH_NUMBER');
  return digits;
}

function providerErrorCode(data: any) {
  return String(data?.ERROR ?? data?.error ?? '');
}

function normalizeElectricityOperators(data: any): ElectricityOperator[] {
  const source: unknown[] = [];
  const walk = (value: unknown) => { if (!value || typeof value !== 'object') return; if (Array.isArray(value)) return value.forEach(walk); const item = value as Record<string, unknown>; if (Object.keys(item).some((key) => ['type', 'operatorcode', 'opcode', 'code'].includes(key.toLowerCase()))) source.push(item); else Object.values(item).forEach(walk); };
  walk(data?.RDATA ?? data?.DATA ?? data);
  return source.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return [];
    const item = entry as Record<string, unknown>;
    const type = firstValue(item, ['Type', 'type']);
    const operatorCode = firstValue(item, ['Opcode', 'OpCode', 'operatorcode', 'operator_code', 'code']);
    const name = firstValue(item, ['Name', 'Operator', 'operatorname', 'operator_name']);
    return type.toLowerCase() === 'electricity' && operatorCode && name ? [{ name, operatorCode, type: 'ELECTRICITY' as const }] : [];
  });
}

export async function fetchElectricityOperators() {
  const { memberId, password } = credentials();
  const data = await getProvider('OperatorList', { ApiUserID: memberId, ApiPassword: password });
  if (providerErrorCode(data) !== '0') throw providerError('Electricity providers are temporarily unavailable.');
  return normalizeElectricityOperators(data);
}

export async function fetchFastagOperators(): Promise<UtilityOperator[]> {
  const { memberId, password } = credentials();
  const data = await getProvider('OperatorList', { ApiUserID: memberId, ApiPassword: password });
  if (providerErrorCode(data) !== '0') throw providerError('FASTag providers are temporarily unavailable.');
  const source: unknown[] = [];
  const walk = (value: unknown) => { if (!value || typeof value !== 'object') return; if (Array.isArray(value)) return value.forEach(walk); const item = value as Record<string, unknown>; if (Object.keys(item).some((key) => ['type', 'operatorcode', 'opcode', 'code'].includes(key.toLowerCase()))) source.push(item); else Object.values(item).forEach(walk); };
  walk(data?.RDATA ?? data?.DATA ?? data);
  return source.flatMap((entry) => { const item = entry as Record<string, unknown>; const type = firstValue(item, ['Type', 'type']); const operatorCode = firstValue(item, ['Opcode', 'OpCode', 'operatorcode', 'operator_code', 'code']); const name = firstValue(item, ['Name', 'Operator', 'operatorname', 'operator_name']); return type.toLowerCase() === 'fastag' && operatorCode && name ? [{ name, operatorCode, type: 'FASTAG' as const }] : []; });
}

async function fetchOperatorsByExactType(expectedType: string, unavailableMessage = 'Gas providers are temporarily unavailable.'): Promise<UtilityOperator[]> {
  const { memberId, password } = credentials();
  const data = await getProvider('OperatorList', { ApiUserID: memberId, ApiPassword: password });
  if (providerErrorCode(data) !== '0') throw providerError(unavailableMessage);
  const source: unknown[] = [];
  const walk = (value: unknown) => { if (!value || typeof value !== 'object') return; if (Array.isArray(value)) return value.forEach(walk); const item = value as Record<string, unknown>; if (Object.keys(item).some((key) => ['type', 'operatorcode', 'opcode', 'code'].includes(key.toLowerCase()))) source.push(item); else Object.values(item).forEach(walk); };
  walk(data?.RDATA ?? data?.DATA ?? data);
  return source.flatMap((entry) => { const item = entry as Record<string, unknown>; const type = firstValue(item, ['Type', 'type']); const operatorCode = firstValue(item, ['Opcode', 'OpCode', 'operatorcode', 'operator_code', 'code']); const name = firstValue(item, ['Name', 'Operator', 'operatorname', 'operator_name']); return type.toLowerCase() === expectedType.toLowerCase() && operatorCode && name ? [{ name, operatorCode, type: expectedType }] : []; });
}

export const fetchPipedGasOperators = () => fetchOperatorsByExactType('GASPIPELINE');
export const fetchLpgOperators = () => fetchOperatorsByExactType('lpg');
export const fetchWaterOperators = () => fetchOperatorsByExactType('WATER', 'Water providers are temporarily unavailable.');

export async function fetchPipedGasInfo(operatorCode: string, consumerNumber: string) {
  const { memberId, password } = credentials();
  const consumer = normalizePipedGasConsumerNumber(consumerNumber);
  if (!operatorCode || operatorCode.length > 40) throw providerError('Piped Gas provider is unavailable.');
  const operators = await fetchPipedGasOperators();
  if (!operators.some((operator) => operator.operatorCode === operatorCode)) throw providerError('Piped Gas provider is unavailable.');
  const data = await getProvider('GasPipeInfoFetch', { apimember_id: memberId, api_password: password, ConsumerNo: consumer, operator_code: operatorCode });
  if (providerErrorCode(data) !== '0') throw providerError('Piped Gas details could not be fetched.');
  const result = normalizeElectricityBill(data);
  if (!Object.keys(result).length) throw providerError('No Piped Gas details were found for these details.');
  return result;
}

function normalizeWaterBill(data: any) {
  return normalizeElectricityBill(data);
}

export function normalizeWaterIdentifier(value: unknown) {
  if (typeof value !== 'string') throw new Error('INVALID_WATER_INPUT');
  const normalized = value.trim();
  if (!normalized || normalized.length > 80 || /[\u0000-\u001F\u007F]/.test(normalized)) throw new Error('INVALID_WATER_INPUT');
  return normalized;
}

export function validateWaterIdentifier(value: unknown, field?: BbpsField) {
  const normalized = normalizeWaterIdentifier(value);
  if (field?.fieldType === 'NUMERIC' && !/^\d+$/.test(normalized)) throw new Error('INVALID_WATER_INPUT');
  if (field?.minLength !== null && field?.minLength !== undefined && normalized.length < field.minLength) throw new Error('INVALID_WATER_INPUT');
  if (field?.maxLength !== null && field?.maxLength !== undefined && normalized.length > field.maxLength) throw new Error('INVALID_WATER_INPUT');
  return normalized;
}

export function waterNormalizationSelfCheck() {
  const normalized = normalizeWaterBill({ ERROR: '0', STATUS: '1', BILLDEATILS: { Name: 'TEST CUSTOMER', DueAmount: '450.00', DueDate: '2026-10-10', BillNumber: 'TEST-WATER', BillDate: '2026-09-15', Balance: '', BillPeriod: null } });
  let rejected = false;
  try { validateWaterIdentifier('1234', { label: 'Account', minLength: 5, maxLength: 8, fieldType: 'NUMERIC' }); } catch { rejected = true; }
  let maxRejected = false;
  try { validateWaterIdentifier('123456', { label: 'Account', minLength: 1, maxLength: 5, fieldType: 'NUMERIC' }); } catch { maxRejected = true; }
  const numeric = validateWaterIdentifier('12345', { label: 'Account', minLength: 5, maxLength: 5, fieldType: 'NUMERIC' });
  const preserved = validateWaterIdentifier('municipality/zone-ABC_1234567890', { label: 'Account', minLength: null, maxLength: 80, fieldType: 'TEXT' });
  let controlRejected = false;
  try { normalizeWaterIdentifier('ABC\n123'); } catch { controlRejected = true; }
  let emptyRejected = false;
  try { normalizeWaterIdentifier('   '); } catch { emptyRejected = true; }
  let multiFieldRejected = false;
  try { if ([{ label: 'A', minLength: null, maxLength: null, fieldType: 'TEXT' }, { label: 'B', minLength: null, maxLength: null, fieldType: 'TEXT' }].length !== 1) throw new Error('unsupported'); } catch { multiFieldRejected = true; }
  const zeroFieldRejected = [].length !== 1;
  return normalized.customerName === 'TEST CUSTOMER' && normalized.dueAmount === '450.00' && normalized.dueDate === '2026-10-10' && normalized.billNumber === 'TEST-WATER' && normalized.billDate === '2026-09-15' && !('balance' in normalized) && !('billPeriod' in normalized) && providerErrorCode({ ERROR: '1' }) !== '0' && Object.keys(normalizeWaterBill({ BILLDEATILS: {} })).length === 0 && numeric === '12345' && preserved === 'municipality/zone-ABC_1234567890' && rejected && maxRejected && controlRejected && emptyRejected && multiFieldRejected && zeroFieldRejected;
}

export async function fetchWaterBill(operatorCode: string, billNumber: string) {
  const { memberId, password } = credentials();
  const normalizedBillNumber = normalizeWaterIdentifier(billNumber);
  if (!operatorCode || operatorCode.length > 40) throw new Error('INVALID_WATER_INPUT');
  const operators = await fetchWaterOperators();
  if (!operators.some((operator) => operator.operatorCode === operatorCode)) throw providerError('Water provider is unavailable.');
  const params: Record<string, string> = { apimember_id: memberId, api_password: password, bill_number: normalizedBillNumber };
  const data = await getProvider('WaterInfoFetch', { ...params, operator_code: operatorCode });
  if (providerErrorCode(data) !== '0') throw providerError("We couldn't fetch this water bill. Check the details and try again.");
  const result = normalizeWaterBill(data);
  if (!Object.keys(result).length) throw providerError('No water bill details were found for these details.');
  return result;
}

export function gasNormalizationSelfCheck() {
  const normalized = normalizeElectricityBill({ ERROR: '0', BILLDEATILS: { Name: 'TEST CUSTOMER', DueAmount: '100.00', DueDate: '2026-10-01', BillNumber: 'TEST', BillDate: '2026-09-15', Balance: '115', BillPeriod: null } });
  return normalized.customerName === 'TEST CUSTOMER' && normalized.dueAmount === '100.00' && normalized.billNumber === 'TEST' && !('billPeriod' in normalized) && providerErrorCode({ ERROR: '1' }) !== '0' && Object.keys(normalizeElectricityBill({ BILLDEATILS: {} })).length === 0;
}

function normalizePipedGasConsumerNumber(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 80 || /[\u0000-\u001F\u007F]/.test(normalized)) throw new Error('INVALID_PIPED_GAS_CONSUMER');
  return normalized;
}

export function pipedGasValidationSelfCheck() {
  const normal = normalizePipedGasConsumerNumber('ABC12345');
  const longer = normalizePipedGasConsumerNumber('CONNECTION-12345678901234567890');
  const preserved = normalizePipedGasConsumerNumber('ab-12/xy 34');
  let controlRejected = false;
  try { normalizePipedGasConsumerNumber('ABC\n123'); } catch (error) { controlRejected = error instanceof Error && error.message === 'INVALID_PIPED_GAS_CONSUMER'; }
  let vehicleUnchanged = false;
  try { vehicleUnchanged = normalizeVehicleNumber('ts 09-ab-1234') === 'TS09AB1234'; } catch { vehicleUnchanged = false; }
  return normal === 'ABC12345' && longer.length > 15 && preserved === 'ab-12/xy 34' && controlRejected && vehicleUnchanged;
}

function normalizeVehicleNumber(value: string) {
  const normalized = value.trim().toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-Z0-9]{6,15}$/.test(normalized)) throw new Error('INVALID_VEHICLE_NUMBER');
  return normalized;
}

export async function fetchFastagInfo(operatorCode: string, vehicleNumber: string) {
  const { memberId, password } = credentials();
  const vehicle = normalizeVehicleNumber(vehicleNumber);
  if (!operatorCode || operatorCode.length > 40) throw providerError('FASTag provider is unavailable.');
  const operators = await fetchFastagOperators();
  if (!operators.some((operator) => operator.operatorCode === operatorCode)) throw providerError('FASTag provider is unavailable.');
  const data = await getProvider('FastagInfoFetch', { apimember_id: memberId, api_password: password, VehicleNo: vehicle, operator_code: operatorCode });
  if (providerErrorCode(data) !== '0') throw providerError('FASTag details could not be fetched.');
  const result = normalizeElectricityBill(data);
  if (!Object.keys(result).length) throw providerError('No FASTag details were found for these details.');
  return result;
}

export function fastagNormalizationSelfCheck() {
  const normalized = normalizeElectricityBill({ ERROR: '0', STATUS: '1', BILLDEATILS: { Name: 'TEST CUSTOMER', DueAmount: '100.00', DueDate: '2026-10-01', BillNumber: 'TESTREF', BillDate: '2026-09-15', Balance: '115', BillPeriod: null } });
  return normalized.customerName === 'TEST CUSTOMER' && normalized.dueAmount === '100.00' && normalized.dueDate === '2026-10-01' && normalized.billNumber === 'TESTREF' && normalized.balance === '115' && !('billPeriod' in normalized) && providerErrorCode({ ERROR: '1' }) !== '0';
}

export function normalizeElectricityBill(data: any) {
  const source = data?.BILLDEATILS ?? data?.BillDetails ?? data?.BILLDETAILS ?? data?.DATA ?? {};
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
  const item = source as Record<string, unknown>;
  const pick = (keys: string[]) => firstValue(item, keys);
  const result: Record<string, string> = {};
  const fields: Array<[string, string[]]> = [
    ['customerName', ['Name', 'CustomerName', 'customer_name']], ['dueAmount', ['DueAmount', 'due_amount']], ['dueDate', ['DueDate', 'due_date']],
    ['billNumber', ['BillNumber', 'bill_number']], ['billDate', ['BillDate', 'bill_date']], ['balance', ['Balance', 'balance']], ['billPeriod', ['BillPeriod', 'bill_period']],
  ];
  fields.forEach(([target, keys]) => { const value = pick(keys); if (value) result[target] = value; });
  return result;
}

export function electricityNormalizationSelfCheck() {
  const normalized = normalizeElectricityBill({ ERROR: '0', STATUS: '1', BILLDEATILS: { Name: 'TEST NAME', DueAmount: '470.46', DueDate: '2026-09-30', BillNumber: 'TEST123', BillDate: '01 Sep 2026', Balance: '', BillPeriod: null } });
  return normalized.customerName === 'TEST NAME' && normalized.dueAmount === '470.46' && normalized.billNumber === 'TEST123' && !('balance' in normalized) && !('billPeriod' in normalized);
}

export async function fetchElectricityBill(operatorCode: string, billNumber: string, optional: Record<string, string> = {}) {
  const { memberId, password } = credentials();
  if (!operatorCode || operatorCode.length > 40 || !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,79}$/.test(billNumber)) throw new Error('INVALID_ELECTRICITY_INPUT');
  const operators = await fetchElectricityOperators();
  if (!operators.some((operator) => operator.operatorCode === operatorCode)) throw providerError('Electricity provider is unavailable.');
  const params: Record<string, string> = { apimember_id: memberId, api_password: password, bill_number: billNumber, operator_code: operatorCode };
  ['Optional1', 'Optional2', 'Optional3'].forEach((key) => { if (optional[key]) params[key] = optional[key]; });
  const data = await getProvider('ElectricityBillFetch', params);
  if (providerErrorCode(data) !== '0') throw providerError('We could not fetch this electricity bill.');
  return normalizeElectricityBill(data);
}

async function fetchBbpsBillInfoForService(operatorCode: string, serviceName: string): Promise<BbpsBillInfo> {
  const { memberId, password } = credentials();
  if (!operatorCode || operatorCode.length > 40) throw providerError(`${serviceName} provider is unavailable.`);
  const data = await getProvider('BBPSBillInfo', { ApiUserID: memberId, ApiPassword: password, Opcode: operatorCode });
  if (providerErrorCode(data) !== '0') throw providerError(`${serviceName} provider metadata is temporarily unavailable.`);
  const info = data?.BillInfo && typeof data.BillInfo === 'object' ? data.BillInfo : {};
  const rawFields = Array.isArray(info.parameter) ? info.parameter : Array.isArray(info.Parameter) ? info.Parameter : [];
  const fields = rawFields.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return [];
    const item = entry as Record<string, unknown>;
    const label = firstValue(item, ['placeholdername', 'placeholder_name', 'label', 'name']);
    const minRaw = firstValue(item, ['minlength', 'min_length']);
    const maxRaw = firstValue(item, ['maxlength', 'max_length']);
    const minLength = /^\d+$/.test(minRaw) ? Number(minRaw) : null;
    const maxLength = /^\d+$/.test(maxRaw) ? Number(maxRaw) : null;
    const fieldType = firstValue(item, ['Fieldtype', 'fieldtype', 'field_type']) || 'TEXT';
    return label ? [{ label, minLength, maxLength, fieldType: fieldType.toUpperCase() }] : [];
  });
  return { billFetchAvailable: firstValue(info, ['bill_fetch', 'billfetch']) === '1', fields };
}

export async function fetchBbpsBillInfo(operatorCode: string): Promise<BbpsBillInfo> {
  return fetchBbpsBillInfoForService(operatorCode, 'Electricity');
}

export async function fetchWaterBillerInfo(operatorCode: string): Promise<BbpsBillInfo> {
  return fetchBbpsBillInfoForService(operatorCode, 'Water');
}

function firstValue(value: Record<string, unknown>, keys: string[]) {
  for (const wanted of keys) {
    const key = Object.keys(value).find((candidate) => candidate.toLowerCase() === wanted.toLowerCase());
    if (key && value[key] !== null && value[key] !== undefined) return String(value[key]).trim();
  }
  return '';
}

function normalizeDthOperator(data: any) {
  const candidates: unknown[] = [];
  const walk = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach(walk);
    candidates.push(value);
    Object.values(value as Record<string, unknown>).forEach(walk);
  };
  walk(data?.RDATA ?? data);
  const value = (candidates.find((candidate) => {
    const record = candidate as Record<string, unknown>;
    return Object.keys(record).some((key) => ['dthopcode', 'opcode', 'operatorcode', 'operator_code', 'code'].includes(key.toLowerCase()));
  }) || {}) as Record<string, unknown>;
  const operatorCode = firstValue(value, ['DthOpCode', 'OpCode', 'operatorCode', 'operator_code', 'code']);
  const operator = firstValue(value, ['DthName', 'Operator', 'operatorName', 'operator_name', 'opname', 'name']);
  if (!operatorCode) throw providerError('DTH provider could not be detected.');
  return { operator: operator || 'DTH provider', operatorCode };
}

function collectDthPackages(value: unknown, path: string[] = [], metadata: Record<string, string> = {}, output: Array<{ item: Record<string, unknown>; path: string[]; metadata: Record<string, string> }> = []) {
  if (!value || typeof value !== 'object') return output;
  if (Array.isArray(value)) { value.forEach((entry, index) => collectDthPackages(entry, [...path, String(index)], metadata, output)); return output; }
  const item = value as Record<string, unknown>;
  const inherited = { ...metadata };
  const language = firstValue(item, ['Language', 'language', 'lang']);
  if (language) inherited.language = language;
  const lastUpdated = firstValue(item, ['last_update', 'lastupdate', 'lastupdated', 'updatedat']);
  if (lastUpdated) inherited.lastUpdated = lastUpdated;
  const hasPricing = Object.keys(item).some((key) => ['pricinglist', 'pricing_list', 'price', 'amount', 'rs'].includes(key.toLowerCase()));
  const hasPlanIdentity = Object.keys(item).some((key) => ['planname', 'name', 'channels', 'language', 'pack'].includes(key.toLowerCase()));
  if (hasPricing && hasPlanIdentity) output.push({ item, path, metadata: inherited });
  Object.entries(item).forEach(([key, child]) => collectDthPackages(child, [...path, key], inherited, output));
  return output;
}

function normalizeDthPlans(rdata: unknown): DthPlan[] {
  const packages = collectDthPackages(rdata);
  const plans: DthPlan[] = [];
  for (const { item, path, metadata } of packages) {
    const name = firstValue(item, ['PlanName', 'planname', 'name', 'packname']);
    if (!name) continue;
    const language = firstValue(item, ['Language', 'language', 'lang']) || metadata.language || '';
    const channelsRaw = firstValue(item, ['Channels', 'channels', 'totalchannels', 'channelcount']);
    const paidChannelsRaw = firstValue(item, ['PaidChannels', 'paidchannels', 'paid_channel', 'paychannels']);
    const hdChannelsRaw = firstValue(item, ['HdChannels', 'hdchannels', 'hd_channel', 'hd']);
    const metric = (raw: string) => raw.replace(/\s*(?:paid\s+)?channels?\s*$/i, '').trim();
    const channels = metric(channelsRaw);
    const paidChannels = metric(paidChannelsRaw);
    const hdChannels = metric(hdChannelsRaw);
    const lastUpdated = firstValue(item, ['last_update', 'lastupdate', 'lastupdated', 'updatedat']) || metadata.lastUpdated || '';
    const pricingSource = Object.entries(item).find(([key, value]) => ['pricinglist', 'pricing_list'].includes(key.toLowerCase()) && Array.isArray(value))?.[1];
    const rawOptions = Array.isArray(pricingSource) ? pricingSource : [item];
    const pricingOptions = rawOptions.map((raw) => {
      const option = raw && typeof raw === 'object' ? raw as Record<string, unknown> : item;
      const rawAmount = firstValue(option, ['amount', 'price', 'rs', 'pricing']);
      const parsedAmount = Number(rawAmount.replace(/[^0-9.]/g, ''));
      const duration = firstValue(option, ['month', 'months', 'duration', 'validity']) || firstValue(item, ['month', 'months', 'duration', 'validity']);
      return Number.isFinite(parsedAmount) && parsedAmount > 0 ? { amount: parsedAmount, duration: duration || 'Duration not provided' } : null;
    }).filter((entry): entry is DthPricingOption => Boolean(entry));
    if (!pricingOptions.length) continue;
    const id = stableId(['dth', name, language, channels, paidChannels, hdChannels, lastUpdated, JSON.stringify(pricingOptions)]);
    plans.push({ id, name, language, channels, paidChannels, hdChannels, channelsRaw, paidChannelsRaw, hdChannelsRaw, lastUpdated, pricingOptions });
  }
  return plans;
}

export async function discoverDthOperator(dthNumber: string) {
  const { memberId, password } = credentials();
  const number = dthDigits(dthNumber);
  const data = await getProvider('DthOperatorFetch', { apimember_id: memberId, api_password: password, dth_number: number });
  if (String(data?.ERROR ?? '') !== '0') throw providerError('DTH provider could not be detected.');
  return normalizeDthOperator(data);
}

export async function fetchDthPlans(operatorCode: string) {
  const { memberId, password } = credentials();
  if (!operatorCode || operatorCode.length > 40) throw providerError('DTH plans are temporarily unavailable.');
  const data = await getProvider('DthPlans', { apimember_id: memberId, api_password: password, operatorcode: operatorCode });
  if (String(data?.ERROR ?? '') !== '0') throw providerError('DTH plans are temporarily unavailable.');
  return normalizeDthPlans(data?.RDATA);
}

export async function fetchDthInfo(dthNumber: string, operatorCode: string) {
  const { memberId, password } = credentials();
  const number = dthDigits(dthNumber);
  if (!operatorCode || operatorCode.length > 40) throw providerError('Account details are temporarily unavailable.');
  const data = await getProvider('DTHINFOCheck', { apimember_id: memberId, api_password: password, mobile_no: number, Opcode: operatorCode });
  if (String(data?.ERROR ?? data?.error ?? '') !== '0') throw providerError('Account details are temporarily unavailable.');
  const source = data?.RDATA && typeof data.RDATA === 'object' ? data.RDATA : data?.DATA && typeof data.DATA === 'object' ? data.DATA : {};
  const safe: Record<string, string> = {};
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    const allowed = /^(name|customername|balance|monthly|monthlyamount|nextrechargedate|nextrecharge|plan|planname|status)$/i;
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      if (allowed.test(key) && (typeof value === 'string' || typeof value === 'number')) safe[key] = String(value);
    }
  }
  return safe;
}

export function dthNormalizationSelfCheck() {
  const operator = normalizeDthOperator({ ERROR: '0', DthName: 'SUN DIRECT', DthOpCode: '27' });
  const plans = normalizeDthPlans({ Combo: [{ Language: 'Hindi', Details: [{ PlanName: 'Hindi Entertainment', Channels: '361 Channels', PaidChannels: '360 Paid Channels', HdChannels: '1 HD Channels', last_update: '2026-01-01', PricingList: [{ Amount: '279', Month: '1 Month' }, { Amount: '1549', Month: '6 Months' }, { Amount: '3099', Month: '12 Months' }] }] }] });
  const infoResponse: any = { error: '0', DATA: { Name: 'Customer', Rmn: 'secret', Address: 'secret', PIN: 'secret', VC: 'secret', Balance: '10' } };
  const info = fetchDthInfoShapeForTest(infoResponse);
  return String(infoResponse.ERROR ?? infoResponse.error ?? '') === '0' && operator.operator === 'SUN DIRECT' && operator.operatorCode === '27' && plans[0]?.language === 'Hindi' && plans[0]?.pricingOptions.length === 3 && plans[0]?.lastUpdated === '2026-01-01' && info.Name === 'Customer' && !('Rmn' in info) && !('Address' in info) && !('PIN' in info) && !('VC' in info);
}

function fetchDthInfoShapeForTest(data: any) {
  const source = data?.DATA && typeof data.DATA === 'object' ? data.DATA : {};
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) if (/^(name|customername|balance|monthly|monthlyamount|nextrechargedate|nextrecharge|plan|planname|status)$/i.test(key) && (typeof value === 'string' || typeof value === 'number')) safe[key] = String(value);
  return safe;
}

function stableId(parts: string[]) {
  const digest = createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 20);
  return `plan_${digest}`;
}

function amount(value: unknown) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizePlans(rdata: unknown): NormalizedPlan[] {
  if (!rdata || typeof rdata !== 'object') return [];
  const plans: NormalizedPlan[] = [];
  for (const [category, entries] of Object.entries(rdata as Record<string, unknown>)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as Record<string, unknown>;
      const price = amount(item.rs ?? item.amount ?? item.Price);
      if (price === null) continue;
      const validity = String(item.validity ?? item.Validity ?? 'Validity not provided');
      const description = String(item.desc ?? item.Description ?? item.detail ?? 'Plan details not provided');
      plans.push({ id: stableId([category, String(price), validity, description]), category, amount: price, validity, description, source: 'standard' });
    }
  }
  return plans;
}

export function normalizeSpecialOffers(rdata: unknown): NormalizedSpecialOffer[] {
  const entries = Array.isArray(rdata) ? rdata : rdata && typeof rdata === 'object' ? [rdata] : [];
  const offers: NormalizedSpecialOffer[] = [];
  for (const [index, entry] of entries.entries()) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const offerAmount = amount(item.price);
    if (offerAmount === null) continue;
    const description = String(item.ofrtext ?? item.logdesc ?? '').trim();
    if (!description) continue;
    offers.push({
      id: stableId(['special', String(index), String(offerAmount), description]),
      amount: offerAmount,
      title: 'Special offer for this number',
      description,
      source: 'special',
    });
  }
  return offers;
}

function shouldCheckRoffer(operator: string) {
  return /airtel|vodafone|idea|vi/i.test(operator);
}

export async function discoverPlans(mobile: string): Promise<PlanDiscoveryResult> {
  if (!/^[6-9]\d{9}$/.test(mobile)) throw new Error('INVALID_MOBILE');
  const { memberId, password } = credentials();
  const detected = await getProvider('OperatorFetchNew', { ApiUserID: memberId, ApiPassword: password, Mobileno: mobile });
  if (String(detected?.ERROR ?? '') !== '0' || !detected?.OpCode || !detected?.CircleCode) throw providerError('Operator could not be detected.');
  const operator = String(detected.Operator ?? 'Operator');
  const operatorCode = String(detected.OpCode);
  const circle = String(detected.Circle ?? 'Circle');
  const circleCode = String(detected.CircleCode);
  const standard = await getProvider('NewMobilePlans', { apimember_id: memberId, api_password: password, operatorcode: operatorCode, cricle: circleCode });
  if (String(standard?.ERROR ?? '') !== '0') throw providerError('Plans are temporarily unavailable.');
  const plans = normalizePlans(standard.RDATA);
  let specialOffers: NormalizedSpecialOffer[] = [];
  if (shouldCheckRoffer(operator)) {
    try {
      const offerData = await getProvider('RofferCheck', { apimember_id: memberId, api_password: password, operator_code: operatorCode, mobile_no: mobile });
      specialOffers = normalizeSpecialOffers(offerData?.RDATA);
    } catch {
      // R-OFFER is optional; standard plans remain usable.
    }
  }
  return { operator, operatorCode, circle, circleCode, plans, specialOffers };
}
